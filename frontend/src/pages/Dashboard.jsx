import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  
  // Data States
  const [statistik, setStatistik] = useState({ total_pelanggan: 0, total_transaksi: 0, total_pendapatan: 0 });
  const [pelanggan, setPelanggan] = useState([]);
  const [produk, setProduk] = useState([]);
  const [transaksi, setTransaksi] = useState([]);

  // Modal States
  const [showModalPelanggan, setShowModalPelanggan] = useState(false);
  const [showModalProduk, setShowModalProduk] = useState(false);
  const [showModalTransaksi, setShowModalTransaksi] = useState(false);

  // Form States
  const [formPelanggan, setFormPelanggan] = useState({ nama_pelanggan: '', email: '' });
  const [formProduk, setFormProduk] = useState({ nama_produk: '', harga: '', stok: '' });
  const [formTransaksi, setFormTransaksi] = useState({
    id_pelanggan: '', tanggal_transaksi: '', id_produk: '', harga: '', jumlah: ''
  });

  const getToken = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData).token : null;
  };

  const API_URL = 'https://toko-api-express-x72i.vercel.app/api';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadSemuaData();
    }
  }, []);

  const loadSemuaData = async () => {
    await Promise.all([fetchStatistik(), fetchPelanggan(), fetchProduk(), fetchTransaksi()]);
  };

  const fetchStatistik = async () => {
    try {
      const res = await fetch(`${API_URL}/statistik`, { headers: { 'Authorization': getToken() } });
      if (res.ok) setStatistik(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchPelanggan = async () => {
    try {
      const res = await fetch(`${API_URL}/pelanggan`, { headers: { 'Authorization': getToken() } });
      if (res.ok) setPelanggan(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchProduk = async () => {
    try {
      const res = await fetch(`${API_URL}/produk`, { headers: { 'Authorization': getToken() } });
      if (res.ok) setProduk(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchTransaksi = async () => {
    try {
      const res = await fetch(`${API_URL}/transaksi`);
      if (res.ok) setTransaksi(await res.json());
    } catch (e) { console.error(e); }
  };

  // --- CRUD PELANGGAN ---
  const handleSimpanPelanggan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/pelanggan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': getToken() },
        body: JSON.stringify(formPelanggan)
      });
      if (res.ok) {
        setShowModalPelanggan(false);
        setFormPelanggan({ nama_pelanggan: '', email: '' });
        fetchPelanggan(); fetchStatistik();
      }
    } catch (e) { console.error(e); }
  };

  const handleHapusPelanggan = async (id) => {
    if (!window.confirm('Yakin hapus?')) return;
    try {
      const res = await fetch(`${API_URL}/pelanggan/${id}`, { method: 'DELETE', headers: { 'Authorization': getToken() } });
      if (res.ok) { fetchPelanggan(); fetchStatistik(); }
    } catch (e) { console.error(e); }
  };

  // --- CRUD PRODUK ---
  const handleSimpanProduk = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/produk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': getToken() },
        body: JSON.stringify(formProduk)
      });
      if (res.ok) {
        setShowModalProduk(false);
        setFormProduk({ nama_produk: '', harga: '', stok: '' });
        fetchProduk();
      }
    } catch (e) { console.error(e); }
  };

  const handleHapusProduk = async (id) => {
    if (!window.confirm('Yakin hapus?')) return;
    try {
      const res = await fetch(`${API_URL}/produk/${id}`, { method: 'DELETE', headers: { 'Authorization': getToken() } });
      if (res.ok) fetchProduk();
    } catch (e) { console.error(e); }
  };

  // --- CRUD TRANSAKSI ---
  const handleProdukChangeTransaksi = (e) => {
    const id = e.target.value;
    const selectedProduk = produk.find(p => p.id_produk.toString() === id);
    setFormTransaksi({ ...formTransaksi, id_produk: id, harga: selectedProduk ? selectedProduk.harga : '' });
  };

  const handleSimpanTransaksi = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formTransaksi,
        id_pelanggan: formTransaksi.id_pelanggan || null,
        id_produk: formTransaksi.id_produk ? parseInt(formTransaksi.id_produk) : null,
      };
      const res = await fetch(`${API_URL}/transaksi`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModalTransaksi(false);
        setFormTransaksi({ id_pelanggan: '', tanggal_transaksi: '', id_produk: '', harga: '', jumlah: '' });
        loadSemuaData();
      }
    } catch (e) { console.error(e); }
  };

  const handleHapusTransaksi = async (id) => {
    if (!window.confirm('Yakin hapus?')) return;
    try {
      const res = await fetch(`${API_URL}/transaksi/${id}`, { method: 'DELETE' });
      if (res.ok) { fetchTransaksi(); fetchStatistik(); }
    } catch (e) { console.error(e); }
  };

  if (!user) {
    return (
      <div className="p-8 bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/50 text-center max-w-md mx-auto mt-20">
        <h2 className="text-3xl font-bold mb-4 text-slate-100">Akses Ditolak</h2>
        <p className="text-slate-400">Silakan login terlebih dahulu untuk mengakses dashboard eksekutif ini.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-50 tracking-tight">Executive Dashboard</h2>
        <p className="text-slate-400 mt-1">Overview of your store's performance and data management.</p>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Card 1 */}
        <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-700/60 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>
          </div>
          <div className="relative z-10">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Total Pelanggan</p>
            <p className="text-5xl font-black text-slate-50">{statistik.total_pelanggan}</p>
          </div>
          <div className="relative z-10 mt-6 flex items-center text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            Data Master Pelanggan
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-700/60 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path></svg>
          </div>
          <div className="relative z-10">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Total Transaksi</p>
            <p className="text-5xl font-black text-slate-50">{statistik.total_transaksi}</p>
          </div>
          <div className="relative z-10 mt-6 flex items-center text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            Data Induk Transaksi
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-700/60 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path></svg>
          </div>
          <div className="relative z-10">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">Total Pendapatan</p>
            <p className="text-4xl font-black text-slate-50 mt-1">Rp {statistik.total_pendapatan.toLocaleString('id-ID')}</p>
          </div>
          <div className="relative z-10 mt-6 flex items-center text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
            Akumulasi Detail Transaksi
          </div>
        </div>
      </div>

      {/* PELANGGAN */}
      <div className="bg-slate-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700/50 mt-8 relative overflow-hidden">
        <div className="flex justify-between items-end mb-6 border-b border-slate-700/50 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></span>
              Data Pelanggan
            </h3>
            <p className="text-sm text-slate-400 mt-1">Kelola direktori pelanggan toko Anda</p>
          </div>
          <button onClick={() => setShowModalPelanggan(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-900/50 transform hover:-translate-y-0.5">
            + Tambah
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 rounded-tl-xl">ID</th>
                <th className="p-4">Nama Pelanggan</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center rounded-tr-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-300 divide-y divide-slate-700/50">
              {pelanggan.map(p => (
                <tr key={p.id_pelanggan} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 font-mono text-slate-500">#{p.id_pelanggan}</td>
                  <td className="p-4 font-medium text-slate-200">{p.nama_pelanggan}</td>
                  <td className="p-4 text-slate-400">{p.email}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleHapusPelanggan(p.id_pelanggan)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-lg text-xs font-bold transition">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUK */}
      <div className="bg-slate-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700/50 mt-8 relative overflow-hidden">
        <div className="flex justify-between items-end mb-6 border-b border-slate-700/50 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></span>
              Katalog Produk
            </h3>
            <p className="text-sm text-slate-400 mt-1">Kelola inventory dan harga barang</p>
          </div>
          <button onClick={() => setShowModalProduk(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-900/50 transform hover:-translate-y-0.5">
            + Tambah
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 rounded-tl-xl">ID</th>
                <th className="p-4">Nama Produk</th>
                <th className="p-4">Harga</th>
                <th className="p-4">Stok</th>
                <th className="p-4 text-center rounded-tr-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-300 divide-y divide-slate-700/50">
              {produk.map(p => (
                <tr key={p.id_produk} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 font-mono text-slate-500">#{p.id_produk}</td>
                  <td className="p-4 font-medium text-slate-200">{p.nama_produk}</td>
                  <td className="p-4 font-bold text-emerald-400">Rp {p.harga.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-slate-400"><span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{p.stok} pcs</span></td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleHapusProduk(p.id_produk)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-lg text-xs font-bold transition">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSAKSI */}
      <div className="bg-slate-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700/50 mt-8 relative overflow-hidden">
        <div className="flex justify-between items-end mb-6 border-b border-slate-700/50 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg></span>
              Riwayat Transaksi
            </h3>
            <p className="text-sm text-slate-400 mt-1">Kelola data penjualan dan pesanan</p>
          </div>
          <button onClick={() => {
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            setFormTransaksi({...formTransaksi, tanggal_transaksi: (new Date(now - offset)).toISOString().slice(0, 16)});
            setShowModalTransaksi(true);
          }} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/50 transform hover:-translate-y-0.5">
            + Tambah
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/30">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 rounded-tl-xl">ID</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Produk</th>
                <th className="p-4">Harga</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4 text-center rounded-tr-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-300 divide-y divide-slate-700/50">
              {transaksi.map(t => (
                <tr key={t.id_transaksi} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 font-mono text-slate-500">#{t.id_transaksi}</td>
                  <td className="p-4 font-medium text-slate-200">{t.nama_pelanggan || 'Umum'}</td>
                  <td className="p-4 text-slate-400">{new Date(t.tanggal_transaksi).toLocaleString('id-ID')}</td>
                  <td className="p-4 text-slate-300">{t.nama_produk || '-'}</td>
                  <td className="p-4 text-slate-400">{t.harga ? `Rp ${t.harga.toLocaleString('id-ID')}` : '-'}</td>
                  <td className="p-4 text-center"><span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{t.jumlah || '-'}</span></td>
                  <td className="p-4 font-bold text-amber-400">{t.subtotal ? `Rp ${t.subtotal.toLocaleString('id-ID')}` : '-'}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleHapusTransaksi(t.id_transaksi)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-lg text-xs font-bold transition">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {showModalPelanggan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-100 mb-1">Tambah Pelanggan Baru</h3>
            <p className="text-sm text-slate-400 mb-6">Masukkan identitas pelanggan yang valid.</p>
            <form onSubmit={handleSimpanPelanggan} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Nama Pelanggan</label>
                <input required type="text" value={formPelanggan.nama_pelanggan} onChange={e => setFormPelanggan({...formPelanggan, nama_pelanggan: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition" placeholder="Cth: Budi Santoso" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Alamat Email</label>
                <input required type="email" value={formPelanggan.email} onChange={e => setFormPelanggan({...formPelanggan, email: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition" placeholder="budi@example.com" />
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setShowModalPelanggan(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium transition">Batal</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-900/20">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalProduk && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-100 mb-1">Tambah Produk Baru</h3>
            <p className="text-sm text-slate-400 mb-6">Tambahkan barang ke katalog inventory.</p>
            <form onSubmit={handleSimpanProduk} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Nama Produk</label>
                <input required type="text" value={formProduk.nama_produk} onChange={e => setFormProduk({...formProduk, nama_produk: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition" placeholder="Cth: Sabun Cuci" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Harga (Rp)</label>
                  <input required type="number" min="0" value={formProduk.harga} onChange={e => setFormProduk({...formProduk, harga: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Stok Awal</label>
                  <input required type="number" min="0" value={formProduk.stok} onChange={e => setFormProduk({...formProduk, stok: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setShowModalProduk(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium transition">Batal</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-900/20">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalTransaksi && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-100 mb-1">Catat Transaksi Baru</h3>
            <p className="text-sm text-slate-400 mb-6">Pilih pelanggan, produk, dan kuantitas pesanan.</p>
            <form onSubmit={handleSimpanTransaksi} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Pelanggan</label>
                <select value={formTransaksi.id_pelanggan} onChange={e => setFormTransaksi({...formTransaksi, id_pelanggan: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition appearance-none">
                  <option value="" className="bg-slate-800">-- Pelanggan Umum (Tanpa Nama) --</option>
                  {pelanggan.map(p => <option key={p.id_pelanggan} value={p.id_pelanggan} className="bg-slate-800">{p.nama_pelanggan}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Pilih Produk</label>
                <select required value={formTransaksi.id_produk} onChange={handleProdukChangeTransaksi} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition appearance-none">
                  <option value="" className="bg-slate-800">-- Pilih Produk --</option>
                  {produk.map(p => <option key={p.id_produk} value={p.id_produk} className="bg-slate-800">{p.nama_produk} (Rp {p.harga.toLocaleString()})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Harga Satuan</label>
                  <input readOnly value={formTransaksi.harga ? `Rp ${parseInt(formTransaksi.harga).toLocaleString('id-ID')}` : ''} type="text" className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-xl outline-none cursor-not-allowed" placeholder="Otomatis" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Kuantitas (Qty)</label>
                  <input required type="number" min="1" value={formTransaksi.jumlah} onChange={e => setFormTransaksi({...formTransaksi, jumlah: e.target.value})} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition" placeholder="1" />
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-2">Total Subtotal</label>
                <div className="w-full px-4 py-4 bg-slate-900/80 border border-slate-700 rounded-xl outline-none flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Total Bayar:</span>
                  <span className="font-bold text-lg text-emerald-400">
                    Rp {((parseInt(formTransaksi.harga)||0) * (parseInt(formTransaksi.jumlah)||0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4">
                <button type="button" onClick={() => setShowModalTransaksi(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium transition">Batal</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-900/20">Proses Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
