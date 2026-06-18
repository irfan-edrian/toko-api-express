import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Keuangan = () => {
  const navigate = useNavigate();
  const [riwayat, setRiwayat] = useState([]);
  const [stats, setStats] = useState({ sisa_uang: 0, total_pengeluaran: 0, total_pendapatan: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : null;
      if (!token) {
        navigate('/login');
        return;
      }

      const API_URL = 'https://toko-api-express-41u1.vercel.app/api';

      // Fetch Statistik (untuk saldo)
      const resStat = await fetch(`${API_URL}/statistik`, {
        headers: { 'Authorization': token }
      });
      const dataStat = await resStat.json();
      if (resStat.ok) {
        setStats(dataStat);
      } else {
        throw new Error(dataStat.message || dataStat.error || 'Gagal mengambil statistik');
      }

      // Fetch Riwayat Arus Kas
      const resKas = await fetch(`${API_URL}/keuangan`, {
        headers: { 'Authorization': token }
      });
      const dataKas = await resKas.json();
      if (resKas.ok) {
        setRiwayat(dataKas);
      } else {
        throw new Error(dataKas.message || dataKas.error || 'Gagal mengambil riwayat keuangan');
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka || 0);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (loading) return <div className="text-center py-10 text-slate-400">Memuat data keuangan...</div>;
  if (error) return <div className="text-center py-10 text-red-400 bg-red-900/20 rounded-xl border border-red-900/50">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Laporan Keuangan & Arus Kas</h2>
        <p className="text-slate-400 text-sm mt-1">Pantau seluruh pergerakan uang masuk dan keluar di toko Anda.</p>
      </div>

      {/* Kartu Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
          <p className="text-slate-400 text-sm font-medium mb-1">Sisa Uang (Saldo Saat Ini)</p>
          <h3 className={`text-4xl font-black truncate ${stats.sisa_uang < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatRupiah(stats.sisa_uang)}
          </h3>
        </div>
        
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 shadow-lg flex flex-col justify-center">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Pemasukan (Penjualan)</p>
          <h3 className="text-2xl font-bold text-white truncate">{formatRupiah(stats.total_pendapatan)}</h3>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 shadow-lg flex flex-col justify-center">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Pengeluaran (Belanja Stok)</p>
          <h3 className="text-2xl font-bold text-white truncate">{formatRupiah(stats.total_pengeluaran)}</h3>
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-800/80">
          <h3 className="text-lg font-bold text-white">Riwayat Transaksi Keuangan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold w-1/4">Tanggal</th>
                <th className="p-4 font-semibold w-1/4">Tipe</th>
                <th className="p-4 font-semibold w-1/4">Keterangan</th>
                <th className="p-4 font-semibold w-1/4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {riwayat.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    Belum ada riwayat arus kas.
                  </td>
                </tr>
              ) : (
                riwayat.map((item) => (
                  <tr key={item.id_kas} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 text-slate-300">
                      {formatDate(item.tanggal)}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.tipe === 'Pemasukan' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {item.tipe}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {item.keterangan || '-'}
                    </td>
                    <td className={`p-4 text-right font-bold ${item.tipe === 'Pemasukan' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.tipe === 'Pemasukan' ? '+' : '-'}{formatRupiah(item.nominal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Keuangan;
