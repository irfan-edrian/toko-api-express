# Dokumentasi Lengkap API Toko Anda

Saat ini, Anda memiliki total **18 endpoint** yang aktif dan terdefinisi di dalam file `index.js` Anda. Berikut adalah daftar lengkap beserta fungsinya:

## 🔐 1. Autentikasi
- **`POST /api/login`**
  **Fungsi:** Untuk melakukan login admin/user. Akan mengembalikan *Token* yang wajib digunakan (di bagian header `Authorization`) saat memanggil endpoint lain yang diproteksi.

## 👥 2. Pelanggan (Data Master)
- **`GET /api/pelanggan`**
  **Fungsi:** Mengambil (membaca) daftar seluruh data pelanggan dari database.
- **`POST /api/pelanggan`**
  **Fungsi:** Menambahkan data pelanggan baru (membutuhkan `nama_pelanggan` dan `email` di *body*).
- **`PUT /api/pelanggan/:id`** *(Direkomendasikan)*
  **Fungsi:** Mengubah data pelanggan tertentu berdasarkan ID yang ada di URL.
- **`PUT /api/pelanggan`** *(Alternatif)*
  **Fungsi:** Mengubah data pelanggan (ID dikirimkan di dalam *body*).
- **`DELETE /api/pelanggan/:id`** *(Direkomendasikan)*
  **Fungsi:** Menghapus data pelanggan tertentu berdasarkan ID yang ada di URL.
- **`DELETE /api/pelanggan`** *(Alternatif)*
  **Fungsi:** Menghapus data pelanggan (ID dikirimkan di dalam *body*).

## 📦 3. Produk (Data Master)
- **`GET /api/produk`**
  **Fungsi:** Mengambil (membaca) daftar seluruh data produk.
- **`POST /api/produk`**
  **Fungsi:** Menambahkan produk baru. **(Update Terbaru):** Jika nama produk sudah ada, sistem hanya akan menambahkan `stok` dan mengupdate `harga` tanpa membuat data ganda.
- **`PUT /api/produk/:id`**
  **Fungsi:** Mengubah data produk tertentu berdasarkan ID di URL.
- **`DELETE /api/produk/:id`**
  **Fungsi:** Menghapus data produk tertentu berdasarkan ID di URL.

## 🛒 4. Transaksi (Data Transaksional)
- **`GET /api/transaksi`**
  **Fungsi:** Mengambil (membaca) seluruh riwayat transaksi penjualan.
- **`POST /api/transaksi`**
  **Fungsi:** Mencatat transaksi penjualan baru.
- **`PUT /api/transaksi/:id`** *(Direkomendasikan)*
  **Fungsi:** Mengubah data transaksi tertentu berdasarkan ID di URL.
- **`PUT /api/transaksi`** *(Alternatif)*
  **Fungsi:** Mengubah data transaksi (ID dikirimkan di dalam *body*).
- **`DELETE /api/transaksi/:id`** *(Direkomendasikan)*
  **Fungsi:** Menghapus data transaksi tertentu berdasarkan ID di URL.
- **`DELETE /api/transaksi`** *(Alternatif)*
  **Fungsi:** Menghapus data transaksi (ID dikirimkan di dalam *body*).

## 💰 5. Data Keuangan (Arus Kas)
- **`GET /api/keuangan`**
  **Fungsi:** Mengambil riwayat lengkap transaksi arus kas (pengeluaran dan pemasukan).
  **Data yang dikembalikan:**
  Array objek berisi `id_kas`, `tipe` (Pemasukan/Pengeluaran), `nominal`, `keterangan`, dan `tanggal`.

## 📊 6. Statistik & Dashboard
- **`GET /api/statistik`**
  **Fungsi:** Mengambil ringkasan data untuk ditampilkan di halaman Dashboard frontend.
  **Data yang dikembalikan:**
  - `total_pelanggan`: Jumlah semua pelanggan
  - `total_transaksi`: Jumlah total transaksi yang pernah terjadi
  - `total_pendapatan`: Total uang masuk dari penjualan
  - `total_pengeluaran`: Total uang keluar dari pembelian stok (otomatis tercatat saat `POST /api/produk`)
  - `sisa_uang`: Saldo saat ini (`total_pendapatan` dikurangi `total_pengeluaran`)

## 🌐 6. Root (Pengecekan Server)
- **`GET /`**
  **Fungsi:** Halaman paling depan (root) untuk mengecek apakah server backend Anda berhasil berjalan (aktif) atau tidak.

---

**Tips Tambahan:**
Untuk melihat logika asli dan urutan yang pasti dari setiap endpoint, Anda selalu bisa mengecek file **`backend/index.js`** lalu mencari fungsi `app.get`, `app.post`, `app.put`, atau `app.delete`. Di situlah "jantung" API Anda sebenarnya berada.
