require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// MIDDLEWARE
app.use(cors());
app.use(express.json());
// Melayani file frontend statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// KONEKSI DATABASE POSTGRESQL (NEON)
if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL tidak terdeteksi di Environment Variables!");
} else {
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':******@');
    console.log("ℹ️ DATABASE_URL terdeteksi:", maskedUrl);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Wajib untuk koneksi SSL Neon
    }
});

// Test koneksi database saat start
pool.connect((err, client, release) => {
    if (err) {
        console.error('Gagal terhubung ke database Neon PostgreSQL:', err.stack);
    } else {
        console.log('Mantap! Berhasil terhubung ke database Neon PostgreSQL.');
        release();
    }
});

// Penyimpanan token login admin sementara di memori server
const activeTokens = new Map();

// ==========================================
// 1. ENDPOINT AUTENTIKASI: LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    console.log("=== ADA INPUTAN LOGIN MASUK ===");
    console.log("Username:", username);

    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Username dan password wajib diisi!' });
    }

    try {
        // user adalah keyword khusus di PostgreSQL, jadi harus diberi tanda kutip ganda "user"
        const query = 'SELECT * FROM "user" WHERE username = $1 AND password = $2';
        const result = await pool.query(query, [username, password]);

        if (result.rows.length === 0) {
            console.log("Hasil: Login Gagal, data tidak cocok.");
            return res.status(401).json({
                status: 'error',
                message: 'Autentikasi gagal! Username atau password salah.'
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        activeTokens.set(token, result.rows[0].username);

        console.log(`Hasil: Login Sukses! Token dibuat untuk user: ${result.rows[0].username}`);

        res.json({
            status: 'success',
            message: 'Login berhasil!',
            token: token
        });
    } catch (err) {
        console.error("Error PostgreSQL saat login:", err);
        res.status(500).json({ error: err.message || err.toString() });
    }
});

// ==========================================
// 2. MIDDLEWARE VALIDASI TOKEN (SATPAM API)
// ==========================================
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Akses ditolak! Anda harus menyertakan token autentikasi.'
        });
    }

    if (!activeTokens.has(token)) {
        return res.status(403).json({
            status: 'error',
            message: 'Token salah atau sudah kadaluarsa!'
        });
    }

    req.currentUser = activeTokens.get(token);
    next();
};

// ==========================================
// 3. CRUD DATA MASTER - PELANGGAN
// ==========================================
app.get('/api/pelanggan', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pelanggan ORDER BY id_pelanggan ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Gagal get pelanggan:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/pelanggan', verifyToken, async (req, res) => {
    const { nama_pelanggan, email } = req.body;

    console.log("=== ADA INPUT TAMBAH PELANGGAN MASUK ===");
    console.log("Nama:", nama_pelanggan, "| Email:", email);

    if (!nama_pelanggan || !email) {
        return res.status(400).json({ status: 'error', message: 'Data nama dan email wajib diisi!' });
    }

    try {
        const queryInsert = 'INSERT INTO pelanggan (nama_pelanggan, email) VALUES ($1, $2) RETURNING id_pelanggan';
        const result = await pool.query(queryInsert, [nama_pelanggan, email]);
        
        console.log(`Hasil: Sukses menambah pelanggan baru dengan ID ${result.rows[0].id_pelanggan}!`);
        res.status(201).json({ status: 'success', message: 'Pelanggan baru berhasil disimpan!' });
    } catch (err) {
        console.error("Gagal SQL Insert Pelanggan:", err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.delete('/api/pelanggan/:id', verifyToken, async (req, res) => {
    const idPelanggan = parseInt(req.params.id);
    console.log(`=== MENCOBA HAPUS PELANGGAN ID: ${idPelanggan} ===`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Cari tahu apakah pelanggan ini punya riwayat di tabel transaksi
        const resTrans = await client.query('SELECT id_transaksi FROM transaksi WHERE id_pelanggan = $1', [idPelanggan]);

        if (resTrans.rows.length > 0) {
            const daftarIdTransaksi = resTrans.rows.map(t => t.id_transaksi);

            // Hapus detail_transaksi terlebih dahulu demi memutus foreign key
            await client.query('DELETE FROM detail_transaksi WHERE id_transaksi = ANY($1::int[])', [daftarIdTransaksi]);

            // Hapus data induk di tabel transaksi
            await client.query('DELETE FROM transaksi WHERE id_pelanggan = $1', [idPelanggan]);
        }

        // Hapus data pelanggan utama
        await client.query('DELETE FROM pelanggan WHERE id_pelanggan = $1', [idPelanggan]);

        await client.query('COMMIT');
        console.log(`Hasil: Pelanggan ID ${idPelanggan} berhasil dihapus bersih dari database.`);
        res.json({ status: 'success', message: 'Data pelanggan berhasil dihapus total!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Gagal menghapus pelanggan:", err.message);
        res.status(500).json({ status: 'error', message: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/pelanggan/:id', verifyToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const { nama_pelanggan, email } = req.body;

    if (!nama_pelanggan || !email) {
        return res.status(400).json({ status: 'error', message: 'Data nama dan email wajib diisi!' });
    }

    try {
        const queryUpdate = 'UPDATE pelanggan SET nama_pelanggan = $1, email = $2 WHERE id_pelanggan = $3';
        await pool.query(queryUpdate, [nama_pelanggan, email, id]);
        res.json({ status: 'success', message: 'Data pelanggan berhasil diperbarui!' });
    } catch (err) {
        console.error("Gagal update pelanggan:", err);
        res.status(500).json({ status: 'error', message: err.message || err.toString() });
    }
});

app.put('/api/pelanggan', verifyToken, async (req, res) => {
    const { id_pelanggan, id, nama_pelanggan, email } = req.body;
    const targetId = parseInt(id_pelanggan || id);

    if (!targetId) {
        return res.status(400).json({ status: 'error', message: 'ID pelanggan (id_pelanggan atau id) wajib disertakan dalam body!' });
    }

    if (!nama_pelanggan || !email) {
        return res.status(400).json({ status: 'error', message: 'Data nama dan email wajib diisi!' });
    }

    try {
        const queryUpdate = 'UPDATE pelanggan SET nama_pelanggan = $1, email = $2 WHERE id_pelanggan = $3';
        await pool.query(queryUpdate, [nama_pelanggan, email, targetId]);
        res.json({ status: 'success', message: 'Data pelanggan berhasil diperbarui!' });
    } catch (err) {
        console.error("Gagal update pelanggan:", err);
        res.status(500).json({ status: 'error', message: err.message || err.toString() });
    }
});

// ==========================================
// 3.5. CRUD DATA MASTER - PRODUK
// ==========================================
app.get('/api/produk', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produk ORDER BY id_produk ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Gagal get produk:", err);
        res.status(500).json({ error: err.message || err.toString() });
    }
});

app.post('/api/produk', verifyToken, async (req, res) => {
    const { nama_produk, harga, stok } = req.body;

    if (!nama_produk || harga === undefined || stok === undefined) {
        return res.status(400).json({ status: 'error', message: 'Data nama, harga, dan stok wajib diisi!' });
    }

    try {
        const queryInsert = 'INSERT INTO produk (nama_produk, harga, stok) VALUES ($1, $2, $3) RETURNING id_produk';
        const result = await pool.query(queryInsert, [nama_produk, parseInt(harga), parseInt(stok)]);
        res.status(201).json({ status: 'success', message: 'Produk baru berhasil disimpan!', id_produk: result.rows[0].id_produk });
    } catch (err) {
        console.error("Gagal SQL Insert Produk:", err);
        res.status(500).json({ status: 'error', message: err.message || err.toString() });
    }
});

app.delete('/api/produk/:id', verifyToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await pool.query('DELETE FROM produk WHERE id_produk = $1', [id]);
        res.json({ status: 'success', message: 'Produk berhasil dihapus!' });
    } catch (err) {
        console.error("Gagal hapus produk:", err);
        res.status(500).json({ status: 'error', message: err.message || err.toString() });
    }
});

// ==========================================
// 4. CRUD DATA TRANSAKSIONAL
// ==========================================
app.get('/api/transaksi', async (req, res) => {
    const query = `
        SELECT 
            t.id_transaksi, 
            t.id_pelanggan, 
            p.nama_pelanggan, 
            t.tanggal_transaksi, 
            dt.nama_produk, 
            dt.harga, 
            dt.jumlah, 
            dt.subtotal
        FROM transaksi t
        LEFT JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
        LEFT JOIN detail_transaksi dt ON t.id_transaksi = dt.id_transaksi
        ORDER BY t.id_transaksi DESC
    `;
    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Gagal get transaksi:", err);
        res.status(500).json({ error: err.message || err.toString() });
    }
});

app.post('/api/transaksi', async (req, res) => {
    let { id_pelanggan, id_produk, tanggal_transaksi, nama_produk, harga, jumlah } = req.body;

    if (id_pelanggan === '' || id_pelanggan === null || id_pelanggan === undefined || id_pelanggan === 'null' || id_pelanggan === 'NULL') {
        id_pelanggan = null;
    } else {
        id_pelanggan = parseInt(id_pelanggan);
    }

    if (!tanggal_transaksi) {
        tanggal_transaksi = new Date();
    }

    const itemJumlah = parseInt(jumlah) || 0;
    let itemHarga = parseInt(harga) || 0;
    let itemNama = nama_produk;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (id_produk) {
            const productRes = await client.query('SELECT nama_produk, harga, stok FROM produk WHERE id_produk = $1', [id_produk]);
            if (productRes.rows.length === 0) {
                throw new Error('Produk tidak ditemukan!');
            }
            const product = productRes.rows[0];
            if (product.stok < itemJumlah) {
                throw new Error(`Stok tidak mencukupi! Stok saat ini: ${product.stok}`);
            }
            itemNama = product.nama_produk;
            itemHarga = product.harga;

            // Kurangi stok produk
            await client.query('UPDATE produk SET stok = stok - $1 WHERE id_produk = $2', [itemJumlah, id_produk]);
        }

        const insertTransQuery = 'INSERT INTO transaksi (id_pelanggan, tanggal_transaksi) VALUES ($1, $2) RETURNING id_transaksi';
        const resTrans = await client.query(insertTransQuery, [id_pelanggan, tanggal_transaksi]);
        const id_transaksi = resTrans.rows[0].id_transaksi;

        if (itemNama) {
            const subtotal = itemHarga * itemJumlah;
            const insertDetailQuery = 'INSERT INTO detail_transaksi (id_transaksi, nama_produk, harga, jumlah, subtotal) VALUES ($1, $2, $3, $4, $5)';
            await client.query(insertDetailQuery, [id_transaksi, itemNama, itemHarga, itemJumlah, subtotal]);
        }

        await client.query('COMMIT');
        res.status(201).json({
            status: 'success',
            message: 'Transaksi dan detail berhasil disimpan!',
            id_transaksi: id_transaksi
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Gagal insert transaksi:", err);
        res.status(500).json({ error: err.message || err.toString() });
    } finally {
        client.release();
    }
});

app.delete('/api/transaksi/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM detail_transaksi WHERE id_transaksi = $1', [id]);
        await client.query('DELETE FROM transaksi WHERE id_transaksi = $1', [id]);
        await client.query('COMMIT');
        res.json({ status: 'success', message: 'Transaksi berhasil dihapus!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Gagal hapus transaksi:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/transaksi/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let { id_pelanggan, id_produk, tanggal_transaksi, nama_produk, harga, jumlah } = req.body;

    if (id_pelanggan === '' || id_pelanggan === null || id_pelanggan === undefined || id_pelanggan === 'null' || id_pelanggan === 'NULL') {
        id_pelanggan = null;
    } else {
        id_pelanggan = parseInt(id_pelanggan);
    }

    const itemJumlah = parseInt(jumlah) || 0;
    let itemHarga = parseInt(harga) || 0;
    let itemNama = nama_produk;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update data induk transaksi
        if (tanggal_transaksi) {
            await client.query('UPDATE transaksi SET id_pelanggan = $1, tanggal_transaksi = $2 WHERE id_transaksi = $3', [id_pelanggan, tanggal_transaksi, id]);
        } else {
            await client.query('UPDATE transaksi SET id_pelanggan = $1 WHERE id_transaksi = $2', [id_pelanggan, id]);
        }

        // 2. Manage detail transaksi
        if (id_produk) {
            const productRes = await client.query('SELECT nama_produk, harga, stok FROM produk WHERE id_produk = $1', [id_produk]);
            if (productRes.rows.length === 0) {
                throw new Error('Produk tidak ditemukan!');
            }
            const product = productRes.rows[0];
            itemNama = product.nama_produk;
            itemHarga = product.harga;
        }

        if (itemNama) {
            const subtotal = itemHarga * itemJumlah;
            
            // Cek apakah detail_transaksi sudah ada
            const checkDetail = await client.query('SELECT id_detail FROM detail_transaksi WHERE id_transaksi = $1', [id]);
            if (checkDetail.rows.length > 0) {
                const updateDetailQuery = 'UPDATE detail_transaksi SET nama_produk = $1, harga = $2, jumlah = $3, subtotal = $4 WHERE id_transaksi = $5';
                await client.query(updateDetailQuery, [itemNama, itemHarga, itemJumlah, subtotal, id]);
            } else {
                const insertDetailQuery = 'INSERT INTO detail_transaksi (id_transaksi, nama_produk, harga, jumlah, subtotal) VALUES ($1, $2, $3, $4, $5)';
                await client.query(insertDetailQuery, [id, itemNama, itemHarga, itemJumlah, subtotal]);
            }
        }

        await client.query('COMMIT');
        res.json({ status: 'success', message: 'Transaksi berhasil diperbarui!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Gagal update transaksi:", err);
        res.status(500).json({ error: err.message || err.toString() });
    } finally {
        client.release();
    }
});

app.put('/api/transaksi', async (req, res) => {
    const { id_transaksi, id, id_pelanggan, id_produk, tanggal_transaksi, nama_produk, harga, jumlah } = req.body;
    const targetId = parseInt(id_transaksi || id);

    if (!targetId) {
        return res.status(400).json({ status: 'error', message: 'ID transaksi (id_transaksi atau id) wajib disertakan dalam body!' });
    }

    const itemJumlah = parseInt(jumlah) || 0;
    let itemHarga = parseInt(harga) || 0;
    let itemNama = nama_produk;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update data induk transaksi
        if (tanggal_transaksi) {
            await client.query('UPDATE transaksi SET id_pelanggan = $1, tanggal_transaksi = $2 WHERE id_transaksi = $3', [id_pelanggan, tanggal_transaksi, targetId]);
        } else {
            await client.query('UPDATE transaksi SET id_pelanggan = $1 WHERE id_transaksi = $2', [id_pelanggan, targetId]);
        }

        // 2. Manage detail transaksi
        if (id_produk) {
            const productRes = await client.query('SELECT nama_produk, harga, stok FROM produk WHERE id_produk = $1', [id_produk]);
            if (productRes.rows.length === 0) {
                throw new Error('Produk tidak ditemukan!');
            }
            const product = productRes.rows[0];
            itemNama = product.nama_produk;
            itemHarga = product.harga;
        }

        if (itemNama) {
            const subtotal = itemHarga * itemJumlah;
            
            // Cek apakah detail_transaksi sudah ada
            const checkDetail = await client.query('SELECT id_detail FROM detail_transaksi WHERE id_transaksi = $1', [targetId]);
            if (checkDetail.rows.length > 0) {
                const updateDetailQuery = 'UPDATE detail_transaksi SET nama_produk = $1, harga = $2, jumlah = $3, subtotal = $4 WHERE id_transaksi = $5';
                await client.query(updateDetailQuery, [itemNama, itemHarga, itemJumlah, subtotal, targetId]);
            } else {
                const insertDetailQuery = 'INSERT INTO detail_transaksi (id_transaksi, nama_produk, harga, jumlah, subtotal) VALUES ($1, $2, $3, $4, $5)';
                await client.query(insertDetailQuery, [targetId, itemNama, itemHarga, itemJumlah, subtotal]);
            }
        }

        await client.query('COMMIT');
        res.json({ status: 'success', message: 'Transaksi berhasil diperbarui!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Gagal update transaksi:", err);
        res.status(500).json({ error: err.message || err.toString() });
    } finally {
        client.release();
    }
});

// ==========================================
// 5. STATISTIK DATA TRANSAKSIONAL
// ==========================================
app.get('/api/statistik', verifyToken, async (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM pelanggan) AS total_pelanggan,
            (SELECT COUNT(*) FROM transaksi) AS total_transaksi,
            (SELECT COALESCE(SUM(subtotal), 0) FROM detail_transaksi) AS total_pendapatan
    `;
    try {
        const result = await pool.query(query);
        const row = result.rows[0];
        res.json({
            total_pelanggan: parseInt(row.total_pelanggan) || 0,
            total_transaksi: parseInt(row.total_transaksi) || 0,
            total_pendapatan: parseInt(row.total_pendapatan) || 0
        });
    } catch (err) {
        console.error("Gagal get statistik:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Route utama untuk load dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server jalan aman di port ${port}`);
});