import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  X,
  Send,
  Loader2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  HelpCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { aiGuidanceService } from '../../services/careerServices';
import { AIChatMessage, AIChatResponse, UserRole } from '../../types';
import { AIMarkdownRenderer } from './AIMarkdownRenderer';
import { getScopedItem } from '../../utils/userStorage';

interface AICounselorChatDrawerProps {
  userId?: string;
  majorCode?: string;
  majorName?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToRoadmap?: (majorCode: string) => void;
}

const INITIAL_WELCOME_MESSAGE = (majorName?: string | null) => {
  if (majorName) {
    return `Xin chào! Tôi là **Cố vấn AI CareerGuide**. Tôi đã nạp bối cảnh ngành **${majorName}** cùng kết quả trắc nghiệm sở thích RIASEC và điểm học bạ THPT của bạn. 

Bạn muốn tìm hiểu thêm về:
- Độ tương thích thực tế giữa tính cách của bạn và ngành này?
- Những môn học hoặc kỹ năng bạn cần tập trung cải thiện?
- Lộ trình phát triển 4 năm đại học và cơ hội nghề nghiệp tương lai?`;
  }
  return `Xin chào! Tôi là **Cố vấn AI CareerGuide** (v1.8 Tuân thủ Luật 91/2025/QH15). 

Tôi được kết nối trực tiếp với ma trận 435 ngành đào tạo cấp IV và hồ sơ học tập của bạn. Hãy đặt bất kỳ câu hỏi nào về:
- Đánh giá năng lực và sở thích của bạn phù hợp với nhóm ngành nào nhất.
- Phân tích điểm số các khối thi (A00, A01, D01...).
- Lộ trình tự học và khắc phục lỗ hổng kiến thức trước khi bước vào giảng đường đại học!`;
};

const DEFAULT_PROMPTS_GENERAL = [
  'Dựa vào điểm sở thích và học bạ của em, ngành nào phù hợp nhất?',
  'Bài kiểm tra chẩn đoán kỹ năng đầu vào có vai trò gì?',
  'Làm thế nào để xây dựng lộ trình tự học hiệu quả?',
  'Ngành STEM và ngành Kinh tế - Xã hội có điểm khác biệt gì?',
];

const DEFAULT_PROMPTS_WITH_MAJOR = (majorName: string) => [
  `Ngành ${majorName} đòi hỏi những phẩm chất và kỹ năng gì nhất?`,
  `Điểm học bạ của em vào ngành ${majorName} có điểm mạnh gì?`,
  `Lộ trình 4 năm của ngành ${majorName} nên học thêm chứng chỉ gì?`,
  `Cơ hội việc làm và thu nhập thực tế của ngành ${majorName} ra sao?`,
];

export const AICounselorChatDrawer: React.FC<AICounselorChatDrawerProps> = ({
  userId: propUserId,
  majorCode: propMajorCode,
  majorName: propMajorName,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onNavigateToRoadmap,
}) => {
  const navigate = useNavigate();

  // Internal state for standalone / event-triggered mode
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentMajorCode, setCurrentMajorCode] = useState<string | null>(propMajorCode || null);
  const [currentMajorName, setCurrentMajorName] = useState<string | null>(propMajorName || null);

  const isDrawerOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content: INITIAL_WELCOME_MESSAGE(propMajorName),
      created_at: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>(
    propMajorName ? DEFAULT_PROMPTS_WITH_MAJOR(propMajorName) : DEFAULT_PROMPTS_GENERAL
  );
  const [showCounselorInfo, setShowCounselorInfo] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(480);
  const isResizingRef = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - moveEvent.clientX;
      const minW = 340;
      const maxW = Math.min(920, window.innerWidth - 20);
      if (newWidth >= minW && newWidth <= maxW) {
        setDrawerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync props when changed
  useEffect(() => {
    if (propMajorCode) setCurrentMajorCode(propMajorCode);
    if (propMajorName) {
      setCurrentMajorName(propMajorName);
      setSuggestedFollowups(DEFAULT_PROMPTS_WITH_MAJOR(propMajorName));
    }
  }, [propMajorCode, propMajorName]);

  // Listen for global custom events to open chat from anywhere
  useEffect(() => {
    const handleOpenChatEvent = (e: CustomEvent<{ majorCode?: string; majorName?: string }>) => {
      if (e.detail?.majorCode) {
        setCurrentMajorCode(e.detail.majorCode);
      }
      if (e.detail?.majorName) {
        setCurrentMajorName(e.detail.majorName);
        setSuggestedFollowups(DEFAULT_PROMPTS_WITH_MAJOR(e.detail.majorName));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Bạn vừa chuyển sang xem xét ngành **${e.detail.majorName}** [${e.detail.majorCode}]. Bạn muốn tôi giải thích khía cạnh nào về ngành này?`,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setInternalIsOpen(true);
    };

    window.addEventListener('open_ai_counselor_chat', handleOpenChatEvent as EventListener);
    return () => {
      window.removeEventListener('open_ai_counselor_chat', handleOpenChatEvent as EventListener);
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (isDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isDrawerOpen, isSending]);

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: INITIAL_WELCOME_MESSAGE(currentMajorName),
        created_at: new Date().toISOString(),
      },
    ]);
    setSuggestedFollowups(
      currentMajorName
        ? DEFAULT_PROMPTS_WITH_MAJOR(currentMajorName)
        : DEFAULT_PROMPTS_GENERAL
    );
  };

  // Helper to extract student inputs from storage for grounding
  const getResolvedInputs = () => {
    let grades: Record<string, number> | undefined;
    let diagnostics: string[] | undefined;
    let riasec: Record<string, number> | undefined;

    try {
      const storedGrades = getScopedItem('careerguide_academic_grades');
      if (storedGrades) grades = JSON.parse(storedGrades);
    } catch {}

    try {
      const storedDiag = getScopedItem('careerguide_diagnostic_results');
      if (storedDiag) {
        const diagObj = JSON.parse(storedDiag);
        diagnostics = Object.keys(diagObj).filter((k) => diagObj[k]?.passed);
      }
    } catch {}

    try {
      const storedVector = getScopedItem('careerguide_riasec_vector');
      if (storedVector) riasec = JSON.parse(storedVector);
    } catch {}

    return { grades, diagnostics, riasec };
  };

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputMessage).trim();
    if (!text || isSending) return;

    const userMsg: AIChatMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    const { grades, diagnostics, riasec } = getResolvedInputs();

    // Sanitize conversation history: filter out leading greeting assistant messages
    const rawSlice = messages.slice(-6);
    const cleanHistory: AIChatMessage[] = [];
    let foundFirstUser = false;
    for (const m of rawSlice) {
      if (!foundFirstUser) {
        if (m.role === 'user') {
          foundFirstUser = true;
          cleanHistory.push(m);
        }
      } else {
        cleanHistory.push(m);
      }
    }

    try {
      const response: AIChatResponse = await aiGuidanceService.chatWithCounselor({
        message: text,
        major_code: currentMajorCode || undefined,
        history: cleanHistory,
        riasec_scores: riasec,
        grades_by_subject: grades,
        diagnostic_skills_mastered: diagnostics,
        userId: propUserId,
      });

      const assistantMsg: AIChatMessage = {
        role: 'assistant',
        content: response.reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (response.suggested_followups && response.suggested_followups.length > 0) {
        setSuggestedFollowups(response.suggested_followups);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
      const fallbackMsg: AIChatMessage = {
        role: 'assistant',
        content:
          'Xin lỗi bạn, kết nối tới dịch vụ AI đang bận. Bạn có thể thử lại sau giây lát hoặc sử dụng các câu hỏi gợi ý bên dưới.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGoToRoadmap = () => {
    if (currentMajorCode) {
      if (onNavigateToRoadmap) {
        onNavigateToRoadmap(currentMajorCode);
      } else {
        navigate(`/roadmap/${currentMajorCode}`);
      }
      handleClose();
    }
  };

  return (
    <>
      {/* Floating Action Button (Only visible when drawer is closed) */}
      {!isDrawerOpen && (
        <button
          type="button"
          onClick={() => {
            if (controlledIsOpen !== undefined && controlledOnClose) {
              // Parent manages open state
            } else {
              setInternalIsOpen(true);
            }
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center space-x-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
          title="Trò chuyện với Cố vấn Hướng nghiệp AI"
          aria-label="Mở Cố vấn AI"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <BrainCircuit className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <span className="tracking-wide">Hỏi Cố vấn AI</span>
        </button>
      )}

      {/* Slide-over Chat Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            style={{
              width: typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : `${drawerWidth}px`,
            }}
            className="w-full sm:max-w-xl max-w-full relative bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
          >
            {/* Left Edge Resize Drag Handle (Visible on PC) */}
            <div
              onMouseDown={startResizing}
              className="hidden md:flex absolute top-0 bottom-0 -left-1.5 w-3 cursor-ew-resize items-center justify-center group z-30 select-none hover:bg-blue-500/20 transition-colors"
              title="Kéo sang trái/phải để thay đổi chiều rộng khung chat"
            >
              <div className="w-1 h-12 rounded-full bg-slate-300 group-hover:bg-blue-600 transition-colors" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Cố Vấn Hướng Nghiệp AI
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCounselorInfo(!showCounselorInfo)}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[11px] font-black transition-all cursor-pointer ${
                        showCounselorInfo
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                      title="Bấm để xem nguyên tắc cố vấn & bảo vệ dữ liệu cá nhân"
                    >
                      !
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Sẵn sàng hỗ trợ trực tuyến</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Xóa đoạn chat làm lại"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Đóng cửa sổ chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Merged Info Box (Triggered by the ! button) */}
            {showCounselorInfo && (
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-blue-50/80 border-b border-blue-200 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150 shrink-0">
                <div className="flex items-start space-x-2">
                  <BrainCircuit className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] leading-relaxed">
                    <strong>Giải thích khoa học:</strong> Tư vấn khách quan dựa trên đối sánh 3 trụ cột (Holland RIASEC, Điểm học bạ THPT &amp; Bài test chẩn đoán logic).
                  </p>
                </div>
                <div className="flex items-start space-x-2 pt-1 border-t border-blue-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11.5px] leading-relaxed space-y-1">
                    <p>
                      <strong>Bảo vệ riêng tư (Luật 91/2025/QH15):</strong> Chỉ gửi điểm số ẩn danh, không gửi họ tên, SĐT hay trường THPT.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Toàn bộ prompt gửi đến AI được lọc sạch hoàn toàn PII. Hệ thống chỉ phân tích các chỉ số học thuật phục vụ định hướng nghề nghiệp.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Context Banner: Active Major Context & Roadmap CTA */}
            {currentMajorName && (
              <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white shrink-0">
                    {currentMajorCode || 'NGÀNH'}
                  </span>
                  <span className="text-xs font-semibold text-indigo-900 truncate">
                    {currentMajorName}
                  </span>
                </div>

                {currentMajorCode && (
                  <button
                    type="button"
                    onClick={handleGoToRoadmap}
                    className="shrink-0 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center space-x-1 transition-colors shadow-2xs"
                  >
                    <span>Lộ trình</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {!isUser ? (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <BrainCircuit className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 text-xs font-bold">
                        Bạn
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-slate-50 text-slate-800 rounded-tl-xs border border-slate-200/90 shadow-2xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <AIMarkdownRenderer content={msg.content} />
                      )}

                      <div
                        className={`text-[10px] mt-1 text-right ${
                          isUser ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {new Date(msg.created_at || Date.now()).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isSending && (
                <div className="flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="bg-white text-slate-700 rounded-2xl rounded-tl-xs px-4 py-3 border border-blue-200/80 shadow-2xs flex items-center space-x-2 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span className="font-medium text-slate-700">Cố vấn AI đang phân tích dữ liệu và suy luận...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Followup Questions (Prompt Pills) - Gợi ý câu hỏi nhanh */}
            {!messages.some((m) => m.role === 'user') && suggestedFollowups.length > 0 && !isSending && (
              <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-50 border-t border-slate-200 shrink-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <span>Gợi ý câu hỏi nhanh:</span>
                </div>
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5">
                  {suggestedFollowups.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] whitespace-nowrap shrink-0 text-left px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-colors shadow-2xs font-medium cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end space-x-2"
              >
                <div className="flex-1 relative">
                  <textarea
                    rows={2}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi Cố vấn AI về ngành học, môn cần cải thiện..."
                    className="w-full text-sm sm:text-xs rounded-xl border border-slate-300 px-3.5 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-shadow"
                    disabled={isSending}
                  />
                  <span className="absolute bottom-1.5 right-2 text-[9px] text-slate-400 pointer-events-none hidden sm:inline">
                    Enter để gửi
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  title="Gửi câu hỏi"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default AICounselorChatDrawer;
