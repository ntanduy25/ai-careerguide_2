import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback, googleLogin } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const isCalledRef = useRef(false);

  useEffect(() => {
    if (isCalledRef.current) return;
    isCalledRef.current = true;

    // 1. Check URL fragment hash for Implicit Token response (#access_token=... or #id_token=...)
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);

    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const idToken = hashParams.get('id_token') || searchParams.get('id_token');
    const code = searchParams.get('code') || hashParams.get('code');
    const error = searchParams.get('error') || hashParams.get('error');

    if (error) {
      setErrorMsg(`Google từ chối đăng nhập hoặc người dùng đã hủy: ${error}`);
      return;
    }

    // Direct User-Agent flow: fetch Google UserInfo directly using access_token
    if (accessToken) {
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(async (resp) => {
          if (!resp.ok) {
            throw new Error(`Google UserInfo trả về lỗi HTTP ${resp.status}`);
          }
          return await resp.json();
        })
        .then(async (profile) => {
          const res = await googleLogin({
            email: profile.email,
            full_name: profile.name || profile.email?.split('@')[0],
            avatar_url: profile.picture,
            google_id: profile.sub,
            credential: idToken || undefined,
          });

          setIsSuccess(true);
          const destination = res?.user?.role === 'ADMIN' ? '/admin/dashboard' : '/guidance';
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 1000);
        })
        .catch((err: any) => {
          console.error('Google profile fetch/login error:', err);
          setErrorMsg(err.message || 'Xác thực tài khoản Google thất bại. Vui lòng thử lại.');
        });
      return;
    }

    // Backend Authorization Code flow
    if (code) {
      const redirectUri = `${window.location.origin}/login/callback`;

      handleGoogleCallback(code, redirectUri)
        .then((res) => {
          setIsSuccess(true);
          const destination = res?.user?.role === 'ADMIN' ? '/admin/dashboard' : '/guidance';
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 1000);
        })
        .catch((err: any) => {
          console.error('Google OAuth callback error:', err);
          setErrorMsg(err.message || 'Xác thực Google OAuth 2.0 thất bại. Vui lòng thử lại.');
        });
      return;
    }

    setErrorMsg('Không tìm thấy mã hoặc token xác thực từ Google Callback.');
  }, [searchParams, handleGoogleCallback, googleLogin, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
        {errorMsg ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Đăng Nhập Thất Bại</h2>
            <p className="text-xs text-rose-600 leading-relaxed font-medium bg-rose-50/60 p-3 rounded-xl border border-rose-100">
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Quay lại trang Đăng Nhập
            </button>
          </div>
        ) : isSuccess ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Đăng Nhập Thành Công!</h2>
            <p className="text-xs text-slate-500">Đang chuyển hướng bạn tới trang học tập...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Đang xác thực với Google...</h2>
            <p className="text-xs text-slate-500">Vui lòng đợi trong giây lát khi hệ thống đồng bộ hóa tài khoản.</p>
          </div>
        )}
      </div>
    </div>
  );
};
