const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

// Middleware agar Express bisa membaca input format JSON di Body Postman
app.use(express.json());

// Konfigurasi koneksi ke MySQL XAMPP (Sudah pas dengan database toko_transaksi)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'toko_transaksi'
});

// Cek koneksi ke database MySQL
db.connect((err) => {
    if (err) {
        console.error('Waduh, gagal konek ke MySQL:', err.message);
        return;
    }
    console.log('Mantap! Berhasil terhubung ke database MySQL XAMPP.');
});

// =========================================================
// [1] RUTE DATA MASTER - PELANGGAN (TANPA TELEPON)
// =========================================================

// 1. GET ALL PELANGGAN
app.get('/api/pelanggan', (req, res) => {
    const query = "SELECT id_pelanggan, nama_pelanggan, email FROM pelanggan";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. CREATE PELANGGAN (INSERT)
app.post('/api/pelanggan', (req, res) => {
    const { nama_pelanggan, email } = req.body;
    const query = "INSERT INTO pelanggan (nama_pelanggan, email) VALUES (?, ?)";
    db.query(query, [nama_pelanggan, email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, nama_pelanggan, email });
    });
});

// 3. UPDATE PELANGGAN
app.put('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    const { nama_pelanggan, email } = req.body;
    const query = "UPDATE pelanggan SET nama_pelanggan = ?, email = ? WHERE id_pelanggan = ?";
    db.query(query, [nama_pelanggan, email, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Data pelanggan berhasil diperbarui" });
    });
});

// 4. DELETE PELANGGAN
app.delete('/api/pelanggan/:id', (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM pelanggan WHERE id_pelanggan = ?";
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Pelanggan berhasil dihapus" });
    });
});


// =========================================================
// [2] RUTE DATA TRANSAKSIONAL - TRANSAKSI (CRUD LENGKAP)
// =========================================================

// 1. GET ALL TRANSAKSI (JOIN)
app.get('/api/transaksi', (req, res) => {
    const query = `
        SELECT 
            t.id_transaksi, 
            t.tgl_transaksi, 
            p.nama_pelanggan, 
            pr.nama_produk, 
            dt.jumlah, 
            dt.subtotal
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

// 2. CREATE TRANSAKSI (INSERT BARU)
app.post('/api/transaksi', (req, res) => {
    const { id_pelanggan, tgl_transaksi } = req.body;
    const query = "INSERT INTO transaksi (id_pelanggan, tgl_transaksi) VALUES (?, ?)";
    db.query(query, [id_pelanggan, tgl_transaksi], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id_transaksi: result.insertId, message: "Transaksi induk sukses dibuat." });
    });
});

// 3. UPDATE TRANSAKSI 
app.put('/api/transaksi/:id', (req, res) => {
    const { id } = req.params;
    const { id_pelanggan, tgl_transaksi } = req.body;

    const query = "UPDATE transaksi SET id_pelanggan = ?, tgl_transaksi = ? WHERE id_transaksi = ?";
    db.query(query, [id_pelanggan, tgl_transaksi, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ID Transaksi tidak ditemukan" });
        }
        res.json({ message: `Mantap! Data transaksi dengan ID ${id} berhasil diperbarui.` });
    });
});

// 4. DELETE TRANSAKSI (Cascade Manual)
app.delete('/api/transaksi/:id', (req, res) => {
    const { id } = req.params;

    const queryDetail = "DELETE FROM detail_transaksi WHERE id_transaksi = ?";
    db.query(queryDetail, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const queryInduk = "DELETE FROM transaksi WHERE id_transaksi = ?";
        db.query(queryInduk, [id], (err, transaksiResult) => {
            if (err) return res.status(500).json({ error: err.message });

            if (transaksiResult.affectedRows === 0) {
                return res.status(404).json({ message: "ID Transaksi tidak ditemukan" });
            }
            res.json({ message: `Mantap! Transaksi dengan ID ${id} beserta detailnya sukses dihapus total.` });
        });
    });
});


// =========================================================
// [3] RUTE STATISTIK / RINGKASAN DATA
// =========================================================
app.get('/api/statistik', (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM pelanggan) AS total_pelanggan,
            (SELECT COUNT(*) FROM transaksi) AS total_transaksi,
            (SELECT IFNULL(SUM(subtotal), 0) FROM detail_transaksi) AS total_pendapatan
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});


// Jalankan Server Express pada Port 3000
app.listen(port, () => {
    console.log(`Server jalan di http://localhost:${port}`);
});