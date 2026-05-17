const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json()); // Supaya server bisa membaca data format JSON

// 1. Hubungkan ke MySQL XAMPP (Pastikan Apache & MySQL di XAMPP sudah START)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'toko_transaksi' // Sesuaikan dengan nama databasemu di phpMyAdmin
});

db.connect((err) => {
    if (err) {
        console.error('Gagal terhubung ke MySQL XAMPP:', err.message);
        return;
    }
    console.log('Mantap! Berhasil terhubung ke database MySQL XAMPP.');
});

// ==========================================
// A. CRUD DATA MASTER (Contoh: Pelanggan)
// ==========================================

// 1. GET ALL (Melihat semua pelanggan)
app.get('/api/pelanggan', (req, res) => {
    db.query('SELECT * FROM pelanggan', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Berhasil mengambil data pelanggan", data: results });
    });
});

// 2. CREATE (Tambah pelanggan baru)
app.post('/api/pelanggan', (req, res) => {
    const { nama_pelanggan, email } = req.body;
    db.query('INSERT INTO pelanggan (nama_pelanggan, email) VALUES (?, ?)', [nama_pelanggan, email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Pelanggan berhasil ditambahkan", id: results.insertId });
    });
});

// 3. UPDATE (Mengubah data pelanggan)
app.put('/api/pelanggan/:id', (req, res) => {
    const { nama_pelanggan, email } = req.body;
    db.query('UPDATE pelanggan SET nama_pelanggan = ?, email = ? WHERE id_pelanggan = ?', [nama_pelanggan, email, req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Data pelanggan berhasil diperbarui" });
    });
});

// 4. DELETE (Menghapus pelanggan)
app.delete('/api/pelanggan/:id', (req, res) => {
    db.query('DELETE FROM pelanggan WHERE id_pelanggan = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Pelanggan berhasil dihapus" });
    });
});


// ==========================================
// B. CRUD DATA TRANSAKSIONAL (Transaksi)
// ==========================================

// 1. GET ALL TRANSAKSI (Melihat laporan penjualan ter-JOIN)
app.get('/api/transaksi', (req, res) => {
    const query = `
        SELECT t.id_transaksi, t.tgl_transaksi, p.nama_pelanggan, pr.nama_produk, dt.jumlah, dt.subtotal 
        FROM transaksi t
        JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
        JOIN detail_transaksi dt ON t.id_transaksi = dt.id_transaksi
        JOIN produk pr ON dt.id_produk = pr.id_produk`;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Berhasil mengambil data transaksi", data: results });
    });
});

// 2. CREATE TRANSAKSI (Proses Belanja Otomatis Masuk ke 2 Tabel)
app.post('/api/transaksi', (req, res) => {
    const { id_pelanggan, id_produk, jumlah, subtotal } = req.body;
    
    // Insert ke tabel utama (transaksi)
    db.query('INSERT INTO transaksi (id_pelanggan, total_bayar) VALUES (?, ?)', [id_pelanggan, subtotal], (err, resultTx) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const id_transaksi_baru = resultTx.insertId;
        
        // Insert ke tabel relasi (detail_transaksi)
        db.query('INSERT INTO detail_transaksi (id_transaksi, id_produk, jumlah, subtotal) VALUES (?, ?, ?, ?)', 
        [id_transaksi_baru, id_produk, jumlah, subtotal], (err, resultDetail) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Transaksi baru berhasil dicatat!", id_transaksi: id_transaksi_baru });
        });
    });
});


// ==========================================
// C. STATISTIC DATA TRANSAKSIONAL
// ==========================================
app.get('/api/statistik', (req, res) => {
    const query = `
        SELECT 
            COUNT(id_transaksi) as total_transaksi,
            SUM(total_bayar) as total_pendapatan,
            AVG(total_bayar) as rata_rata_per_transaksi
        FROM transaksi`;
        
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Statistik toko berhasil dimuat", statistik: results[0] });
    });
});

// Menentukan Port Server API
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server API kamu sudah jalan di http://localhost:${PORT}`);
});