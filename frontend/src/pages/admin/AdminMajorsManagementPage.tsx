import { getActiveCircular } from '../../constants/regulations';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Download,
  Database,
} from 'lucide-react';
import { taxonomyService } from '../../services/careerServices';
import { MajorItem } from '../../data/defaultTaxonomy';

export const AdminMajorsManagementPage: React.FC = () => {
  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [displayLimit, setDisplayLimit] = useState<number>(50);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadMajors();
    const handleUpdate = () => loadMajors();
    window.addEventListener('careerguide_taxonomy_updated', handleUpdate);
    return () => window.removeEventListener('careerguide_taxonomy_updated', handleUpdate);
  }, []);

  const loadMajors = async () => {
    const list = await taxonomyService.fetchMajors(true);
    setMajors(list);
  };

  const handleSyncFromDatabase = async () => {
    setActionNotice('Đang đồng bộ dữ liệu trực tiếp từ CSDL...');
    const all = await taxonomyService.syncFromDatabase();
    setMajors(all);
    setActionNotice(`Đã đồng bộ toàn bộ ${all.length} ngành cấp IV theo ${getActiveCircular()}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(majors, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `danh_muc_nganh_${getActiveCircular().replace(/[\/\s]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const categories = ['ALL', ...Array.from(new Set(majors.map((m) => m.category)))];

  const filtered = majors.filter((m) => {
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    const term = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.major_code.includes(term) ||
      (m.blocks && m.blocks.some((b) => b.toLowerCase().includes(term)));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>Quản Lý Danh Mục Ngành Cấp IV</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {majors.length} Ngành
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Danh mục giáo dục đào tạo cấp IV {getActiveCircular()} lưu trữ vĩnh viễn trong CSDL phục vụ bộ máy gợi ý XAI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncFromDatabase}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đồng bộ CSDL</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Xuất JSON</span>
          </button>

          <Link
            to="/admin/ingest"
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quản lý nạp CSDL</span>
          </Link>

          <Link
            to="/taxonomy"
            target="_blank"
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Xem trang công khai</span>
          </Link>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã ngành (7480107...), tên ngành, tổ hợp môn..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'ALL' ? 'Tất cả lĩnh vực đào tạo' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="px-3 py-3 font-semibold text-center w-14">STT</th>
                <th className="px-4 py-3 font-semibold">Mã Cấp IV</th>
                <th className="px-4 py-3 font-semibold">Tên Ngành Đào Tạo</th>
                <th className="px-4 py-3 font-semibold">Lĩnh Vực</th>
                <th className="px-4 py-3 font-semibold">Tổ Hợp Xét Tuyển</th>
                <th className="px-4 py-3 font-semibold">Vector RIASEC</th>
                <th className="px-4 py-3 font-semibold text-right">Lộ Trình</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Không tìm thấy ngành đào tạo nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, displayLimit).map((m, idx) => (
                  <tr key={m.major_code} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-3 py-3 text-center font-mono font-semibold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-400">
                      {m.major_code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        <span>{m.name}</span>
                        {['7480107', '7440180', '7480208', '7460108', '7340205', '7520217', '7620101', '7310313', '7140103', '7720102'].includes(m.major_code) && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                            Mới TT 74/2026
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {m.category}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.blocks.map((b) => (
                          <span
                            key={b}
                            className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      R:{m.riasec.R} I:{m.riasec.I} A:{m.riasec.A} S:{m.riasec.S} E:{m.riasec.E} C:{m.riasec.C}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/roadmap/${m.major_code}`}
                        target="_blank"
                        className="text-blue-400 hover:text-blue-300 font-medium hover:underline inline-flex items-center space-x-1"
                      >
                        <span>Chi tiết</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination / Limit Selector */}
        <div className="p-2.5 bg-slate-950 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 gap-2">
          <span>
            Đang hiển thị {Math.min(displayLimit, filtered.length)} / {filtered.length} ngành.
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-400">Xem:</span>
            {[50, 100, 200, 500].map((lim) => (
              <button
                key={lim}
                type="button"
                onClick={() => setDisplayLimit(lim)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  displayLimit === lim
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lim === 500 ? `Tất cả (${filtered.length})` : lim}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
