import {
  BarChart3,
  BrainCircuit,
  ChevronRight,
  ClipboardCheck,
  Compass,
  Filter,
  LogIn,
  LogOut,
  Map,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { type ReactNode, useEffect, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router"
import { useAuth } from "../../context/AuthContext"
import { readStorage } from "../../services/storage"
import { Badge } from "../common/Badge"

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onMobileClose: () => void
  onMobileOpen: () => void
  onOpenChat: () => void
}

interface SavedRoadmapItem {
  code: string
  label: string
  status: "TARGET" | "REACH"
}

const mainLinks = [
  {
    label: "Tổng quan Dashboard",
    short: "Tổng quan",
    href: "/",
    icon: BarChart3,
  },
  {
    label: "Làm trắc nghiệm RIASEC & Z-Score",
    short: "Trắc nghiệm",
    href: "/assessment",
    icon: ClipboardCheck,
  },
  {
    label: "Khám phá 108 ngành MOET",
    short: "Khám phá ngành",
    href: "/dashboard",
    icon: Compass,
  },
  {
    label: "Lộ trình tự học 4 tuần",
    short: "Lộ trình",
    href: "/roadmap",
    icon: Map,
  },
]

const defaultSavedRoadmaps: SavedRoadmapItem[] = [
  { code: "7480101", label: "Khoa học máy tính", status: "TARGET" },
  { code: "7460108", label: "Khoa học dữ liệu", status: "REACH" },
]

const recentHistory = [
  {
    label: "So sánh CS và Data Science",
    prompt: "Hãy so sánh ngành Khoa học máy tính (7480101) và Khoa học dữ liệu (7460108) dựa trên hồ sơ của mình.",
    pinned: true,
    unread: false,
  },
  {
    label: "Phân tích điểm khối A00",
    prompt: "Giải thích vì sao ngành Kỹ thuật phần mềm đạt mức TARGET với điểm A00 của mình?",
    pinned: false,
    unread: true,
  },
  {
    label: "Kỹ năng cần bù tuần 1",
    prompt: "Các kỹ năng còn thiếu (Competency Gaps) cần bổ sung trong Tuần 1?",
    pinned: false,
    unread: false,
  },
]

function SidebarLabel({
  children,
  collapsed,
}: {
  children: ReactNode
  collapsed: boolean
}) {
  return (
    <AnimatePresence initial={false}>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.16 }}
          className="whitespace-nowrap"
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

function SidebarBody({
  collapsed,
  onToggle,
  onNavigate,
  onOpenChat,
  mobile,
}: {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  onOpenChat: () => void
  mobile?: boolean
}) {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmapItem[]>(() =>
    readStorage("career-guide:saved-roadmaps", defaultSavedRoadmaps),
  )
  const [onlyPinned, setOnlyPinned] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

  useEffect(() => {
    const syncSaved = () => {
      setSavedRoadmaps(
        readStorage("career-guide:saved-roadmaps", defaultSavedRoadmaps),
      )
    }
    window.addEventListener("saved-roadmaps-updated", syncSaved)
    return () => window.removeEventListener("saved-roadmaps-updated", syncSaved)
  }, [])

  const visibleHistory = onlyPinned
    ? recentHistory.filter((item) => item.pinned)
    : recentHistory

  const handleQuickSearch = () => {
    onNavigate?.()
    navigate("/dashboard?search=1")
  }

  const handleOpenSavedRoadmap = (item: SavedRoadmapItem) => {
    onNavigate?.()
    navigate(
      `/roadmap?major=${item.code}&name=${encodeURIComponent(item.label)}`,
    )
  }

  const handleOpenRecentPrompt = (prompt: string) => {
    onOpenChat()
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("open-ai-advisor-prompt", { detail: { prompt } }),
      )
    }, 120)
  }

  const handleSwitchRole = async () => {
    if (!user) return
    const nextRole = user.role === "admin" ? "student" : "admin"
    await login(nextRole)
    setShowSettingsMenu(false)
    if (nextRole === "admin") {
      navigate("/admin")
    } else {
      navigate("/dashboard")
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`flex shrink-0 items-center ${
          collapsed ? "h-24 flex-col justify-start gap-2" : "h-14 gap-2"
        }`}
      >
        <Link
          to="/"
          onClick={onNavigate}
          className={`flex min-w-0 items-center gap-2.5 ${
            collapsed ? "" : "flex-1"
          }`}
          title={collapsed ? "AI CareerGuide" : undefined}
        >
          <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-200">
            <BrainCircuit size={21} />
            <Sparkles size={10} className="absolute -right-0.5 -top-0.5" />
          </span>
          <SidebarLabel collapsed={collapsed}>
            <span className="block text-sm font-black leading-tight text-slate-900">
              AI Career<span className="text-sky-600">Guide</span>
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Guidance OS
            </span>
          </SidebarLabel>
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={handleQuickSearch}
            className="sidebar-icon-button"
            title="Tra cứu nhanh 108 ngành Bộ GD&ĐT"
            aria-label="Tìm kiếm nhanh"
          >
            <Search size={17} />
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={
            collapsed
              ? "grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100/80 text-sky-700 transition-all hover:bg-sky-200"
              : "sidebar-icon-button"
          }
          title={
            collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"
          }
          aria-label={
            collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"
          }
        >
          {mobile ? (
            <X size={18} />
          ) : collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      </div>

      <div className="mt-4 shrink-0">
        <button
          type="button"
          onClick={onOpenChat}
          title={collapsed ? "Phiên tư vấn mới" : undefined}
          className={`group flex h-11 items-center rounded-full bg-gradient-to-r from-sky-100 via-sky-100 to-cyan-100 font-extrabold text-sky-800 ring-1 ring-white/80 transition hover:shadow-lg hover:shadow-sky-200/60 ${
            collapsed
              ? "w-full justify-center px-0"
              : "w-full gap-3 px-4 text-xs"
          }`}
        >
          <Plus
            size={18}
            className="shrink-0 transition-transform group-hover:rotate-90"
          />
          <SidebarLabel collapsed={collapsed}>
            Phiên tư vấn / Đánh giá mới
          </SidebarLabel>
        </button>
      </div>

      <div className="sidebar-scroll mt-5 flex-1 overflow-x-hidden overflow-y-auto pr-1">
        <nav>
          {!collapsed && <p className="sidebar-section-label">Điều hướng</p>}
          <motion.div
            className="space-y-1"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {mainLinks.map(({ label, short, href, icon: Icon }) => (
              <motion.div
                key={href}
                variants={{
                  hidden: { opacity: 0, x: -6 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <NavLink
                  to={href}
                  end={href === "/"}
                  onClick={onNavigate}
                  title={collapsed ? label : undefined}
                  className={`relative flex h-10 items-center rounded-xl text-xs font-bold transition-colors ${
                    collapsed ? "justify-center px-0" : "gap-3 px-3"
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="activeSidebarItem"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-100/90 via-sky-100/90 to-cyan-100/90 ring-1 ring-white/90"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                      <Icon
                        size={17}
                        className={`relative z-10 shrink-0 ${
                          isActive ? "text-sky-700" : "text-slate-500"
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <span
                            className={`relative z-10 min-w-0 flex-1 truncate ${
                              isActive ? "text-sky-900" : "text-slate-600"
                            }`}
                          >
                            {short}
                          </span>
                          <ChevronRight
                            size={13}
                            className={`relative z-10 ${
                              isActive ? "text-sky-500" : "text-slate-300"
                            }`}
                          />
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                onClick={onNavigate}
                title={collapsed ? "Quản trị viên HITL" : undefined}
                className={`relative flex h-10 items-center rounded-xl text-xs font-bold ${
                  collapsed ? "justify-center" : "gap-3 px-3"
                }`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="activeSidebarItem"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-100 via-sky-100 to-cyan-100"
                      />
                    )}
                    <ShieldCheck
                      size={17}
                      className="relative z-10 text-sky-600"
                    />
                    {!collapsed && (
                      <span className="relative z-10 text-slate-700">
                        Quản trị viên HITL
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )}
          </motion.div>
        </nav>

        {!collapsed && (
          <>
            <div className="my-5 h-px bg-gradient-to-r from-transparent via-sky-100 to-transparent" />
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="sidebar-section-label !mb-0">Lộ trình đã lưu</p>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.()
                    navigate("/roadmap")
                  }}
                  className="sidebar-mini-button"
                  title="Mở bản đồ lộ trình 4 tuần"
                >
                  <Plus size={13} />
                </button>
              </div>
              <div className="space-y-1">
                {savedRoadmaps.map((item) => (
                  <button
                    key={item.code || item.label}
                    type="button"
                    onClick={() => handleOpenSavedRoadmap(item)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/70"
                  >
                    <span className="size-1.5 rounded-full bg-sky-400" />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-600">
                      {item.label}
                    </span>
                    <Badge
                      tone={item.status === "TARGET" ? "emerald" : "amber"}
                    >
                      {item.status}
                    </Badge>
                  </button>
                ))}
              </div>
            </section>

            <div className="my-5 h-px bg-gradient-to-r from-transparent via-sky-100 to-transparent" />
            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="sidebar-section-label !mb-0">Gần đây</p>
                <button
                  type="button"
                  onClick={() => setOnlyPinned((v) => !v)}
                  className={`sidebar-mini-button ${
                    onlyPinned ? "bg-sky-100 text-sky-700" : ""
                  }`}
                  title={
                    onlyPinned ? "Đang lọc mục đã ghim" : "Lọc mục đã ghim"
                  }
                >
                  <Filter size={13} />
                </button>
              </div>
              <div className="space-y-0.5">
                {visibleHistory.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleOpenRecentPrompt(item.prompt)}
                    className="group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/70"
                  >
                    <MessageSquareText
                      size={14}
                      className="shrink-0 text-slate-400"
                    />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-600">
                      {item.label}
                    </span>
                    {item.pinned && (
                      <Pin size={11} className="rotate-45 text-sky-400" />
                    )}
                    {item.unread && (
                      <i className="size-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="mx-1 mb-1 flex items-center justify-between rounded-xl border border-sky-200/70 bg-sky-50/90 px-2.5 py-1.5 text-[10px] font-bold text-sky-900 shadow-xs">
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            CSDL Trực Tuyến
          </span>
          <span className="rounded bg-sky-200/70 px-1.5 py-0.5 text-[9px] font-extrabold text-sky-950">
            108 ngành · v1.8
          </span>
        </div>
      )}

      <div className="relative mt-2 shrink-0 border-t border-white/70 pt-2.5">
        {user ? (
          <>
            {showSettingsMenu && !collapsed && (
              <div className="mb-2 rounded-2xl border border-sky-100 bg-white/95 p-2 shadow-lg backdrop-blur-md text-xs space-y-1">
                <button
                  type="button"
                  onClick={handleSwitchRole}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[11px] font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                >
                  <UserCheck size={14} className="text-sky-600" />
                  <span>
                    Chuyển sang{" "}
                    {user.role === "admin"
                      ? "Học sinh (Student)"
                      : "Quản trị HITL (Admin)"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsMenu(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={14} />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            )}

            <div
              className={`flex items-center rounded-2xl bg-white/55 p-2 ring-1 ring-white/80 ${
                collapsed ? "justify-center" : "gap-2.5"
              }`}
            >
              <button
                type="button"
                onClick={logout}
                title={collapsed ? `${user.name} · Đăng xuất` : "Đăng xuất"}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-[10px] font-black text-white"
              >
                {user.name.slice(0, 2).toUpperCase()}
              </button>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-extrabold text-slate-800">
                      {user.name}
                    </p>
                    <p className="truncate text-[9px] font-semibold text-slate-400">
                      {user.role === "admin"
                        ? "Admin Governance"
                        : "Học sinh Lớp 12"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSettingsMenu((v) => !v)}
                    title="Tùy chọn vai trò & tài khoản"
                    className="group grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-white hover:text-sky-600"
                  >
                    <Settings
                      size={15}
                      className="transition-transform group-hover:rotate-45"
                    />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <Link
            to="/login"
            title={collapsed ? "Đăng nhập" : undefined}
            className={`flex h-11 items-center rounded-xl bg-white/60 text-xs font-bold text-slate-700 ${
              collapsed ? "justify-center" : "gap-3 px-3"
            }`}
          >
            <LogIn size={17} className="text-sky-600" />
            <SidebarLabel collapsed={collapsed}>
              Đăng nhập tài khoản
            </SidebarLabel>
          </Link>
        )}
      </div>
    </div>
  )
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
  onMobileOpen,
  onOpenChat,
}: SidebarProps) {
  return (
    <>
      <header className="glass-panel fixed inset-x-3 top-3 z-50 flex h-14 items-center justify-between rounded-2xl px-3 lg:hidden">
        <button
          onClick={onMobileOpen}
          className="sidebar-icon-button"
          aria-label="Mở thanh điều hướng"
        >
          <Menu size={19} />
        </button>
        <Link to="/" className="flex items-center gap-2 text-sm font-black">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white">
            <BrainCircuit size={17} />
          </span>
          AI Career<span className="-ml-2 text-sky-600">Guide</span>
        </Link>
        <button
          onClick={onOpenChat}
          className="sidebar-icon-button"
          aria-label="Mở cố vấn AI"
        >
          <Sparkles size={18} className="text-sky-600" />
        </button>
      </header>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 288 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="glass-sidebar fixed bottom-3 left-3 top-3 z-50 hidden overflow-hidden rounded-[26px] p-2.5 lg:block"
      >
        <SidebarBody
          collapsed={collapsed}
          onToggle={onToggle}
          onOpenChat={onOpenChat}
        />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-[70] bg-slate-950/25 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              aria-label="Đóng menu"
            />
            <motion.aside
              className="glass-sidebar fixed bottom-3 left-3 top-3 z-[80] w-[min(288px,calc(100vw-24px))] rounded-[26px] p-3 lg:hidden"
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarBody
                collapsed={false}
                mobile
                onToggle={onMobileClose}
                onNavigate={onMobileClose}
                onOpenChat={() => {
                  onMobileClose()
                  onOpenChat()
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
