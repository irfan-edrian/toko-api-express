-- Hapus tabel lama jika ada (urutan dari anak ke induk)
DROP TABLE IF EXISTS detail_transaksi CASCADE;
DROP TABLE IF EXISTS transaksi CASCADE;
DROP TABLE IF EXISTS pelanggan CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Tabel User
CREATE TABLE "user" (
    id_user SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Tabel Pelanggan
CREATE TABLE pelanggan (
    id_pelanggan SERIAL PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL
);

-- Tabel Transaksi
CREATE TABLE transaksi (
    id_transaksi SERIAL PRIMARY KEY,
    id_pelanggan INT REFERENCES pelanggan(id_pelanggan) ON DELETE SET NULL,
    tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Detail Transaksi
CREATE TABLE detail_transaksi (
    id_detail SERIAL PRIMARY KEY,
    id_transaksi INT REFERENCES transaksi(id_transaksi) ON DELETE CASCADE,
    nama_produk VARCHAR(100),
    harga INT,
    jumlah INT,
    subtotal INT
);

-- Seed data admin awal (username: irfan, password: 123)
INSERT INTO "user" (username, password) VALUES ('irfan', '123') ON CONFLICT DO NOTHING;
