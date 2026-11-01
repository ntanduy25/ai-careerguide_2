import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  GraduationCap,
  BrainCircuit,
  MapPin,
  Shield,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentProfileModal } from '../profile/StudentProfileModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'privacy'>('profile');

  const navLinks = [
    {
      name: 'Tổng quan',
      path: '/',
      icon: BookOpen,
      public: true,
      color: 'text-blue-600',
      activeBg: 'bg-blue-50/90 text-blue-800 border-blue-200/90',
      iconActiveBg: 'bg-blue-600 text-white',
      iconIdleBg: 'bg-blue-50 text-blue-600',
    },
    {
      name: 'Định hướng & Đề xuất',
      path: '/guidance',
      icon: BrainCircuit,
      public: false,
      color: 'text-indigo-600',
      activeBg: 'bg-indigo-50/90 text-indigo-800 border-indigo-200/90',
      iconActiveBg: 'bg-indigo-600 text-white',
      iconIdleBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      name: 'Danh mục 108 ngành',
      path: '/taxonomy',
      icon: Compass,
      public: true,
      color: 'text-teal-600',
      activeBg: 'bg-teal-50/90 text-teal-800 border-teal-200/90',
      iconActiveBg: 'bg-teal-600 text-white',
      iconIdleBg: 'bg-teal-50 text-teal-600',
    },
    {
      name: 'Lộ trình phát triển',
      path: '/roadmaps',
      icon: MapPin,
      public: false,
      color: 'text-amber-600',
      activeBg: 'bg-amber-50/90 text-amber-800 border-amber-200/90',
      iconActiveBg: 'bg-amber-600 text-white',
      iconIdleBg: 'bg-amber-50 text-amber-600',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/guidance') {
      return (
        location.pathname.startsWith('/guidance') ||
        location.pathname === '/assessment' ||
        location.pathname === '/academic-transcript' ||
        location.pathname === '/recommendations'
      );
    }
    if (path === '/roadmaps') {
      return location.pathname.startsWith('/roadmaps') || location.pathname.startsWith('/roadmap/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Product Title */}
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                AI CareerGuide
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                THPT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              const targetPath =
                !isAuthenticated && !link.public
                  ? `/login?redirect=${encodeURIComponent(link.path)}`
                  : link.path;

              return (
                <Link
                  key={link.path}
                  to={targetPath}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                    active
                      ? `${link.activeBg} font-bold shadow-2xs`
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    active ? link.iconActiveBg : link.iconIdleBg
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors ml-2"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Quản trị HITL</span>
              </Link>
            )}
          </nav>

          {/* User Profile / Auth Action */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                  title={user?.full_name || user?.email}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {user?.full_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block pr-0.5">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                      {user?.full_name || 'Học sinh'}
                    </p>
                    <span className="inline-block text-[10px] text-slate-500 font-medium leading-none">
                      {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Học sinh THPT'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user?.full_name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileModalTab('profile');
                          setProfileModalOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-blue-500" />
                        <span>Thông tin học sinh & Trường</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileModalTab('privacy');
                          setProfileModalOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
                      >
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Bảo vệ dữ liệu cá nhân (Luật 91)</span>
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="border-t border-slate-100 py-1">
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-3.5 py-2 text-xs text-purple-700 hover:bg-purple-50 transition-colors font-semibold"
                        >
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span>Bảng điều khiển Quản trị</span>
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/login?mode=register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setProfileModalTab('profile');
                  setProfileModalOpen(true);
                }}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20 shadow-xs cursor-pointer active:scale-95 transition-transform"
                aria-label="Xem hồ sơ học sinh"
                title="Hồ sơ học sinh"
              >
                {user?.full_name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer active:scale-95 transition-transform"
              aria-label="Menu điều hướng"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              const targetPath =
                !isAuthenticated && !link.public
                  ? `/login?redirect=${encodeURIComponent(link.path)}`
                  : link.path;

              return (
                <Link
                  key={link.path}
                  to={targetPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    active
                      ? `${link.activeBg} font-bold shadow-xs`
                      : 'border-transparent text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? link.iconActiveBg : link.iconIdleBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-bold text-purple-700 bg-purple-50/80 border border-purple-200"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-700" />
                </div>
                <span>Bảng điều khiển Quản trị HITL</span>
              </Link>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 mt-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'Học sinh'}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {user?.role === 'ADMIN' ? 'Admin' : 'Học sinh'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalTab('profile');
                      setProfileModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hồ sơ học sinh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalTab('privacy');
                      setProfileModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Luật số 91</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center justify-center space-x-1.5 transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/login?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile & Privacy Modal */}
      <StudentProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </header>
  );
};
export default Navbar;
