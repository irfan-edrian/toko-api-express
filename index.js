const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto'); // Bawaan Node.js untuk bikin token acak
const app = express();
const port = 3000;

app.use(express.json());

// 1. KONEKSI DATABASE XAMPP
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'toko_transaksi' // Sesuaikan dengan nama database kamu
});

db.connect((err) => {
    if (err) {
        console.error('Database mati wak, hidupin XAMPP dulu!:', err);
    } else {
        console.log('Mantap! Berhasil terhubung ke database MySQL XAMPP.');
    }
});

// Penyimpanan token sementara di memori server (Sesuai request: kode tertentu yang dikenali API itu sendiri)
const activeTokens = new Map(); 

// ==========================================
// ==========================================
// 2. ENDPOINT AUTENTIKASI: LOGIN (FIXED)
// ==========================================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body; // Ambil data dari body di baris tersendiri

    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Username dan password wajib diisi!' });
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Validasi: Jika username & password salah / tidak ditemukan
        if (results.length === 0) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Autentikasi gagal! Username atau password salah.' 
            });
        }

        // Jika benar, generate token acak unik
        const token = crypto.randomBytes(32).toString('hex');
        
        // Simpan token ke memori dengan info user
        activeTokens.set(token, results[0].username);

        // Response berupa token sesuai instruksi dosen
        res.json({
            status: 'success',
            message: 'Login berhasil!',
            token: token
        });
    });
});

// ==========================================
// 3. MIDDLEWARE VALIDASI TOKEN (SATPAM API)
// ==========================================
const verifyToken = (req, res, next) => {
    // Mengambil token dari header request bernama 'Authorization'
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Akses ditolak! Anda harus menyertakan token autentikasi.' 
            });
    }

    // Validasi apakah token terdaftar atau benar
    if (!activeTokens.has(token)) {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Token salah atau sudah kadaluarsa!' 
        });
    }

    // Jika token benar, lanjut ke rute yang dituju
    req.currentUser = activeTokens.get(token);
    next();
};

// PENTING: Semua rute di bawah ini otomatis dilindungi oleh verifyToken!

// ==========================================
// 4. CRUD DATA MASTER - PELANGGAN (SECURE)
// ==========================================
app.get('/api/pelanggan', verifyToken, (req, res) => {
    db.query('SELECT * FROM pelanggan', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/pelanggan', verifyToken, (req, { nama_pelanggan, email }, res) => {
    db.query('INSERT INTO pelanggan (nama_pelanggan, email) VALUES (?, ?)', [nama_pelanggan, email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Pelanggan berhasil ditambahkan!', id: results.insertId });
    });
});

app.put('/api/pelanggan/:id', verifyToken, (req, res) => {
    const { nama_pelanggan, email } = req.body;
    db.query('UPDATE pelanggan SET nama_pelanggan = ?, email = ? WHERE id_pelanggan = ?', [nama_pelanggan, email, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Data pelanggan berhasil diupdate!' });
    });
});

app.delete('/api/pelanggan/:id', verifyToken, (req, res) => {
    db.query('DELETE FROM pelanggan WHERE id_pelanggan = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Pelanggan berhasil dihapus!' });
    });
});

// ==========================================
// 5. CRUD DATA TRANSAKSIONAL (SECURE)
// ==========================================
app.get('/api/transaksi', verifyToken, (req, res) => {
    const query = `
        SELECT t.id_transaksi, p.nama_pelanggan, t.tgl_transaksi, pr.nama_produk, dt.jumlah, dt.subtotal 
        FROM transaksi t
        JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
        JOIN detail_transaksi dt ON t.id_transaksi = dt.id_transaksi
        JOIN produk pr ON dt.id_produk = pr.id_produk
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/transaksi', verifyToken, (req, { id_pelanggan, tgl_transaksi }, res) => {
    db.query('INSERT INTO transaksi (id_pelanggan, tgl_transaksi) VALUES (?, ?)', [id_pelanggan, tgl_transaksi], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Induk Transaksi sukses dibuat!', id_transaksi: results.insertId });
    });
});

app.put('/api/transaksi/:id', verifyToken, (req, res) => {
    const { id_pelanggan, tgl_transaksi } = req.body;
    db.query('UPDATE transaksi SET id_pelanggan = ?, tgl_transaksi = ? WHERE id_transaksi = ?', [id_pelanggan, tgl_transaksi, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Transaksi berhasil diupdate!' });
    });
});

app.delete('/api/transaksi/:id', verifyToken, (req, res) => {
    db.query('DELETE FROM transaksi WHERE id_transaksi = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Transaksi berhasil dihapus!' });
    });
});

// ==========================================
// 6. STATISTIK DATA TRANSAKSIONAL (SECURE)
// ==========================================
app.get('/api/statistik', verifyToken, (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM pelanggan) AS total_pelanggan,
            (SELECT COUNT(*) FROM transaksi) AS total_transaksi,
            (SELECT SUM(subtotal) FROM detail_transaksi) AS total_pendapatan
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

app.listen(port, () => {
    console.log(`Server jalan aman di http://localhost:${port}`);
});