import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  ShieldCheck,
  Lock,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Download,
  Trash2,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfileDetails } from '../../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'privacy';
  initialTab?: 'profile' | 'privacy';
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab,
  initialTab,
}) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>(initialTab || defaultTab || 'profile');

  // Profile form state initialized from current user
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [dob, setDob] = useState(user?.profile?.date_of_birth || '');
  const [gender, setGender] = useState(user?.profile?.gender || 'Nam');
  const [schoolName, setSchoolName] = useState(user?.profile?.school_name || 'THPT Chuyên Lê Hồng Phong');
  const [cityProvince, setCityProvince] = useState(user?.profile?.city_province || 'TP. Hồ Chí Minh');
  const [gradeLevel, setGradeLevel] = useState(user?.profile?.grade_level || 'Lớp 12');
  const [targetBlock, setTargetBlock] = useState(user?.profile?.target_admission_block || 'A00 (Toán, Lý, Hóa)');
  const [careerGoal, setCareerGoal] = useState(user?.profile?.career_goal || 'Kỹ sư Trí tuệ Nhân tạo & Khoa học Dữ liệu');

  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDetails: UserProfileDetails = {
      phone,
      date_of_birth: dob,
      gender,
      school_name: schoolName,
      city_province: cityProvince,
      grade_level: gradeLevel,
      target_admission_block: targetBlock,
      career_goal: careerGoal,
      privacy_ai_shield_enabled: true,
    };

    updateProfile({
      full_name: fullName,
      profile: updatedDetails,
    });

    setSavedNotice('Đã cập nhật hồ sơ cá nhân thành công.');
    setTimeout(() => {
      setSavedNotice(null);
    }, 2500);
  };

  const handleExportData = () => {
    const dataToExport = {
      account: {
        id: user?.id,
        email: user?.email,
        full_name: fullName,
        role: user?.role,
      },
      profile: {
        school: schoolName,
        city: cityProvince,
        grade: gradeLevel,
        target_block: targetBlock,
        career_goal: careerGoal,
      },
      privacy_compliance: {
        pii_protection: 'ENABLED_AES_256',
        law_compliance: 'Decree 13/2023/ND-CP & Law 91/2025/QH15',
        sent_to_ai_models: false,
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerguide_profile_${user?.id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Hồ Sơ Học Sinh & Quyền Riêng Tư
              </h2>
              <p className="text-xs text-slate-500">
                Quản lý thông tin học tập và thiết lập bảo vệ dữ liệu theo Luật 91/2025/QH15
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex border-b border-slate-200 px-4 sm:px-6 bg-white">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin Học sinh</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Bảo vệ Dữ liệu & Khử khuẩn PII</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          {/* TAB 1: PROFILE FORM */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Họ và Tên</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Tài Khoản</span>
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Số Điện Thoại Liên Hệ</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* Date of Birth & Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ngày Sinh</span>
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Giới Tính</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white transition-colors"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                {/* High School Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Trường THPT Đang Học</span>
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="THPT Chuyên Lê Hồng Phong"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* City / Province */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tỉnh / Thành Phố</span>
                  </label>
                  <input
                    type="text"
                    value={cityProvince}
                    onChange={(e) => setCityProvince(e.target.value)}
                    placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* Grade Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Khối Lớp</span>
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white transition-colors"
                  >
                    <option value="Lớp 10">Lớp 10 (Chuẩn bị chọn tổ hợp môn)</option>
                    <option value="Lớp 11">Lớp 11 (Tập trung năng lực học thuật)</option>
                    <option value="Lớp 12">Lớp 12 (Xét tuyển đại học & hướng nghiệp)</option>
                    <option value="Khác">Đã tốt nghiệp THPT</option>
                  </select>
                </div>

                {/* Target Admission Block */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tổ Hợp Thi Mục Tiêu</label>
                  <select
                    value={targetBlock}
                    onChange={(e) => setTargetBlock(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white transition-colors"
                  >
                    <option value="A00 (Toán, Lý, Hóa)">A00 (Toán, Lý, Hóa)</option>
                    <option value="A01 (Toán, Lý, Tiếng Anh)">A01 (Toán, Lý, Tiếng Anh)</option>
                    <option value="D01 (Toán, Văn, Tiếng Anh)">D01 (Toán, Văn, Tiếng Anh)</option>
                    <option value="B00 (Toán, Hóa, Sinh)">B00 (Toán, Hóa, Sinh)</option>
                    <option value="C00 (Văn, Sử, Địa)">C00 (Văn, Sử, Địa)</option>
                    <option value="Khác">Khối thi khác</option>
                  </select>
                </div>
              </div>

              {/* Career Goal */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nguyện vọng nghề nghiệp quan tâm</span>
                </label>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="Ví dụ: Kỹ sư Phần mềm, Bác sĩ Đa khoa, Chuyên viên Phân tích Dữ liệu..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dữ liệu được lưu trữ mã hóa nội bộ</span>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PRIVACY & ZERO PII TO AI */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Nguyên tắc Bảo vệ Dữ liệu Học sinh
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hệ thống tuân thủ nghiêm ngặt Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định 13/2023/NĐ-CP.
                  Thông tin định danh cá nhân (PII) được tách biệt hoàn toàn khỏi các vector số học dùng trong thuật toán đề xuất.
                </p>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                    <EyeOff className="w-4 h-4 text-slate-500" />
                    <span>Dữ liệu Định danh (Bảo vệ tuyệt đối)</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>Họ và tên học sinh</li>
                    <li>Số điện thoại liên lạc</li>
                    <li>Địa chỉ email tài khoản</li>
                    <li>Trường THPT & địa phương</li>
                  </ul>
                  <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    Mã hóa chuẩn AES-256, không gửi cho bên thứ ba.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Dữ liệu Xử lý Thuật toán (Ẩn danh 100%)</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>Vector RIASEC (R, I, A, S, E, C)</li>
                    <li>Điểm chuẩn hóa Z-score môn học</li>
                    <li>Mã phong cách nhận thức (A/B/C/D)</li>
                    <li>Hoàn toàn không chứa danh tính</li>
                  </ul>
                  <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    Được tính toán tất định theo trọng số công khai.
                  </p>
                </div>
              </div>

              {/* Data Export Action */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Xuất bản sao dữ liệu (JSON)</span>
                </button>

                <span className="text-[11px] text-slate-500 text-center sm:text-right">
                  Quyền tự quyết dữ liệu theo Điều 9 Luật 91/2025/QH15
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
export default StudentProfileModal;
