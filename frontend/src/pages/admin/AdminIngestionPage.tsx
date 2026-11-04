import { getActiveCircular, setActiveCircular, useActiveCircular, DEFAULT_MOET_CIRCULAR } from '../../constants/regulations';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Database,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Check,
  RefreshCw,
  Eye,
  Filter,
  ExternalLink,
  Download,
  Upload,
  BookOpen,
} from 'lucide-react';
import { taxonomyService, adminService } from '../../services/careerServices';
import { MajorItem } from '../../data/defaultTaxonomy';

export const AdminIngestionPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'STREAM_A' | 'STREAM_B'>('STREAM_A');

  // Stream A states - Direct Database & Taxonomy Management
  const [majorsList, setMajorsList] = useState<MajorItem[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [displayLimit, setDisplayLimit] = useState<number>(50);
  const activeCircular = useActiveCircular();
  const [circularInput, setCircularInput] = useState('');

  // Stream B states
  const [majorCode, setMajorCode] = useState('7480201');
  const [customQuery, setCustomQuery] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverySuccess, setDiscoverySuccess] = useState<string | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  const sampleMajors = [
    { code: '7480201', name: 'Công nghệ thông tin' },
    { code: '7480101', name: 'Khoa học máy tính' },
    { code: '7480107', name: 'Trí tuệ nhân tạo' },
    { code: '7440180', name: 'Thiết kế vi mạch bán dẫn' },
    { code: '7340101', name: 'Quản trị kinh doanh' },
    { code: '7340205', name: 'Công nghệ tài chính (Fintech)' },
    { code: '7520216', name: 'Kỹ thuật điều khiển & tự động hóa' },
  ];

  // Load published/active majors directly from database/seed on mount
  useEffect(() => {
    loadTaxonomy();
  }, [activeCircular]);

  const loadTaxonomy = async () => {
    const list = await taxonomyService.fetchMajors(true);
    setMajorsList(list);
    setDocumentTitle(`${activeCircular} (Quy định Danh mục ngành đào tạo giáo dục đại học cấp IV)`);
  };

  const handlePublishAllToTaxonomy = async () => {
    if (majorsList.length === 0) return;
    setIsPublishing(true);
    try {
      const res = await taxonomyService.publishExtractedMajors(majorsList, activeCircular);
      setPublishSuccess(
        `Đã lưu vĩnh viễn thành công toàn bộ ${majorsList.length} ngành học từ ${activeCircular} vào Cơ sở dữ liệu hệ thống (PostgreSQL). Toàn bộ hệ thống tự động nạp từ CSDL!`
      );
      setTimeout(() => setPublishSuccess(null), 8000);
    } catch (err: any) {
      alert('Lỗi khi xuất bản: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Direct file import (JSON format) without needing AI Vision
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const rawItems: MajorItem[] = Array.isArray(parsed)
            ? parsed
            : parsed.majors || [];
          if (rawItems.length > 0) {
            setMajorsList(rawItems);
            setActionNotice(`Đã nạp thành công ${rawItems.length} ngành từ tệp ${file.name}! Nhấn 'Lưu & Đồng Bộ' để ghi vào CSDL.`);
            setTimeout(() => setActionNotice(null), 6000);
          } else {
            alert('Tệp JSON không chứa danh sách ngành hợp lệ.');
          }
        } catch (err: any) {
          alert('Không thể đọc tệp JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  // Direct export to JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(majorsList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `danh_muc_nganh_${activeCircular.replace(/[\/\s]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleTriggerDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiscovering(true);
    setDiscoveryError(null);
    setDiscoverySuccess(null);

    try {
      await adminService.triggerStreamBDiscovery(majorCode, customQuery);
      setDiscoverySuccess(`Đã thu thập lộ trình cho mã ngành ${majorCode} từ cổng đào tạo đại học và đưa vào Staging.`);
    } catch (err: any) {
      setDiscoveryError(err.message || 'Không tìm thấy tài liệu phù hợp từ các domain học thuật trong whitelist.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Filter scanned results
  const filteredMajors = majorsList.filter((m) => {
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    const term = searchFilter.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.major_code.includes(term) ||
      (m.blocks && m.blocks.some((b) => b.toLowerCase().includes(term)));
    return matchesCategory && matchesSearch;
  });

  const uniqueCategories = ['ALL', ...Array.from(new Set(majorsList.map((m) => m.category)))];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              Quản Trị Danh Mục Ngành Cấp IV & Nạp Tri Thức Lộ Trình
            </h1>
            <p className="text-xs text-slate-400">
              Stream A: Cơ sở dữ liệu 435 ngành Cấp IV ({activeCircular}) &bull; Stream B: Khám phá lộ trình đại học
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/staging')}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Kiểm Duyệt Staging HITL</span>
        </button>
      </div>

      {/* Stream Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('STREAM_A')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-semibold text-xs transition-colors ${
            activeTab === 'STREAM_A'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Luồng 1: Stream A – CSDL Danh Mục Ngành Cấp IV (TT 74/2026)</span>
        </button>

        <button
          onClick={() => setActiveTab('STREAM_B')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-semibold text-xs transition-colors ${
            activeTab === 'STREAM_B'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Luồng 2: Stream B – Khám Phá Lộ Trình Web</span>
        </button>
      </div>

      {/* STREAM A: Direct Database Taxonomy Management */}
      {activeTab === 'STREAM_A' && (
        <div className="space-y-4">
          {/* Active Circular Management Banner */}
          <div className="bg-slate-900 rounded-xl p-4 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">Thông tư Bộ GD&amp;ĐT đang kích hoạt toàn hệ thống:</span>
                <span className="text-sm font-bold text-blue-300 font-mono">
                  {activeCircular}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                value={circularInput}
                onChange={(e) => setCircularInput(e.target.value)}
                placeholder="VD: Thông tư 74/2026/TT-BGDĐT"
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 flex-1 sm:w-60"
              />
              <button
                type="button"
                onClick={() => {
                  if (circularInput.trim()) {
                    setActiveCircular(circularInput.trim());
                    setCircularInput('');
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Cập nhật
              </button>
            </div>
          </div>

          {/* CSDL Summary & Action Toolbar */}
          <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Cơ Sở Dữ Liệu Ngành Cấp IV – Lưu Trữ Vĩnh Viễn</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    PostgreSQL &bull; Zero Latency
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Dữ liệu đã trích xuất hoàn chỉnh trực tiếp từ Phụ lục I Thông tư 74/2026/TT-BGDĐT. Toàn bộ hệ thống tự nạp từ CSDL, không phụ thuộc vào đọc/quét file bằng AI.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishAllToTaxonomy}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPublishing ? 'Đang Lưu...' : `Lưu & Đồng Bộ CSDL (${majorsList.length} Ngành)`}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Xuất JSON</span>
                </button>

                <label className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nhập JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportJsonFile}
                  />
                </label>
              </div>
            </div>

            {/* 4 Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Tổng số ngành cấp IV</span>
                <span className="text-lg font-bold text-white font-mono">{majorsList.length}</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Đầy đủ 100% Phụ lục I</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Lĩnh vực đào tạo</span>
                <span className="text-lg font-bold text-blue-300 font-mono">{uniqueCategories.length - 1}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Khối ngành đại học</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Trạng thái lưu trữ</span>
                <span className="text-xs font-bold text-emerald-400 block mt-1">CSDL Sẵn Sàng</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">PostgreSQL & Cache</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Cơ chế tải dữ liệu</span>
                <span className="text-xs font-bold text-blue-300 block mt-1">Trực tiếp CSDL</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Không đọc file qua AI</span>
              </div>
            </div>

            {actionNotice && (
              <div className="p-3 rounded-md bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{actionNotice}</span>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {publishSuccess && (
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-2">
              <div className="flex items-start space-x-3 text-emerald-300 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-bold text-sm text-emerald-200">
                    Đồng Bộ Cơ Sở Dữ Liệu Thành Công
                  </p>
                  <p className="text-slate-300 leading-relaxed">{publishSuccess}</p>
                  <div className="pt-1 flex items-center space-x-2">
                    <Link
                      to="/admin/majors"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Xem Danh Mục Ngành Cấp IV</span>
                    </Link>
                    <Link
                      to="/taxonomy"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>Xem Trang Học Sinh</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Majors Catalog Table */}
          <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <h2 className="text-base font-bold text-white">
                    Bảng Tra Cứu Toàn Bộ {majorsList.length} Ngành Cấp IV
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Văn bản: <span className="text-blue-300 font-medium">{documentTitle}</span>
                </p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Tìm theo mã (7480107...), tên ngành, tổ hợp môn..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'Tất cả lĩnh vực đào tạo' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-800 rounded-md overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-14">STT</th>
                      <th className="py-2.5 px-3">Mã Cấp IV</th>
                      <th className="py-2.5 px-3">Tên Ngành</th>
                      <th className="py-2.5 px-3">Lĩnh Vực</th>
                      <th className="py-2.5 px-3">Tổ Hợp Môn</th>
                      <th className="py-2.5 px-3">Vector RIASEC</th>
                      <th className="py-2.5 px-3 text-right">Lộ Trình</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredMajors.slice(0, displayLimit).map((m, idx) => (
                      <tr key={m.major_code} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                          {m.major_code}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          <div className="flex items-center space-x-2">
                            <span>{m.name}</span>
                            {['7480107', '7440180', '7480208', '7460108', '7340205', '7520217', '7620101', '7310313', '7140103', '7720102'].includes(m.major_code) && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                Mới TT 74/2026
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{m.category}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {m.blocks.map((b) => (
                              <span
                                key={b}
                                className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-mono"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                          R:{m.riasec.R} I:{m.riasec.I} A:{m.riasec.A} S:{m.riasec.S} E:{m.riasec.E} C:{m.riasec.C}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            to={`/roadmap/${m.major_code}`}
                            target="_blank"
                            className="text-blue-400 hover:text-blue-300 text-[11px] font-medium hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Lộ trình</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination / Limit Selector */}
              <div className="p-2.5 bg-slate-950 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 gap-2">
                <span>
                  Đang hiển thị {Math.min(displayLimit, filteredMajors.length)} / {filteredMajors.length} ngành.
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
                      {lim === 500 ? `Tất cả (${filteredMajors.length})` : lim}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STREAM B: Roadmap Web Discovery */}
      {activeTab === 'STREAM_B' && (
        <div className="bg-slate-900 rounded-lg p-5 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Stream B: Khám Phá Lộ Trình Học Tập Web (Tavily Discovery RAG)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                Bảng 6 & DF06
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Thu thập chương trình đào tạo chính quy từ các cổng thông tin đại học trong whitelist (.edu.vn, hust.edu.vn, vnu.edu.vn). Dữ liệu sau khi trích xuất sẽ được đưa vào bàn kiểm duyệt Staging HITL.
            </p>
          </div>

          <form onSubmit={handleTriggerDiscovery} className="space-y-3 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mã Ngành Cấp IV Cần Thu Thập
              </label>
              <select
                value={majorCode}
                onChange={(e) => setMajorCode(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {sampleMajors.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Từ khóa truy vấn bổ sung (Tùy chọn)
              </label>
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="VD: khung chuong trinh dao tao cu nhan CNTT dai hoc quoc gia ha noi"
                className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isDiscovering}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDiscovering ? 'Đang Khám Phá Web...' : 'Khởi Chạy Luồng Khám Phá Stream B'}</span>
            </button>
          </form>

          {discoverySuccess && (
            <div className="p-3.5 rounded-md bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{discoverySuccess}</span>
              </div>
              <Link
                to="/admin/staging"
                className="px-3 py-1 rounded bg-blue-600 text-white font-medium text-xs shrink-0"
              >
                Xem Trong Staging
              </Link>
            </div>
          )}

          {discoveryError && (
            <div className="p-3.5 rounded-md bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{discoveryError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
