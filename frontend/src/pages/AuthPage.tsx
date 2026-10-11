import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, User, AlertTriangle, ArrowRight, Zap, UserCheck, ShieldCheck } from 'lucide-react';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({
  initialMode = 'login',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginDemo, loginGoogle, handleOAuthCallback } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || (location.state as any)?.from || '/map';

  const [mode, setMode] = useState<'login' | 'register'>(
    location.pathname === '/register' ? 'register' : initialMode
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for Cognito OAuth code or error in query params upon redirection
  React.useEffect(() => {
    const oauthError = searchParams.get('error_description') || searchParams.get('error');
    if (oauthError) {
      setError(`Amazon Cognito OAuth error: ${decodeURIComponent(oauthError)}`);
      return;
    }

    const code = searchParams.get('code');
    if (code) {
      setLoading(true);
      handleOAuthCallback(code)
        .then(() => {
          navigate(redirectUrl);
        })
        .catch((err: any) => {
          setError(`Google authentication failed: ${err.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials or use 1-Click Access.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In with instant redirect
  const handleGoogleClick = () => {
    try {
      const res = loginGoogle();
      if (!res.redirecting) {
        navigate(redirectUrl);
      }
    } catch (err: any) {
      setError(`Google Sign-In error: ${err.message}`);
    }
  };

  // Instant 1-Click Logins for frictionless evaluation & judging
  const handleInstantCitizen = () => {
    loginDemo('CITIZEN');
    navigate(redirectUrl);
  };

  const handleInstantAdmin = () => {
    loginDemo('ADMIN');
    navigate(redirectUrl);
  };

  // Demo credential autofills
  const fillCitizenDemo = () => {
    setEmail('citizen.volunteer@jalrakshak.org');
    setPassword('Monsoon2026!');
    setName('Priya Raman');
  };

  const fillAdminDemo = () => {
    setEmail('admin.moderator@jalrakshak.org');
    setPassword('Admin@2026');
    setName('Chief Disaster Warden');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Editorial Header */}
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-2xs">
          <Shield className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          {mode === 'login' ? 'Sign In to JalRakshak AI' : 'Create Civic Reporter Account'}
        </h1>
        <p className="text-xs text-slate-500 font-mono">
          Secured with Amazon Cognito User Pools (ap-south-1)
        </p>
      </div>

      {/* 1-Click Instant Evaluation Logins */}
      <div className="bg-sky-50/70 rounded-2xl border border-sky-100 p-4 space-y-3">
        <div className="flex items-center space-x-2 text-sky-800">
          <Zap className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            Instant 1-Click Evaluation Access
          </span>
        </div>
        <p className="text-[11px] text-slate-600">
          Frictionless test access for hackathon evaluators to test both user & admin roles:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleInstantCitizen}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-white border border-sky-200 hover:border-sky-400 text-sky-700 hover:bg-sky-50 transition text-xs font-mono font-medium shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Citizen Reporter</span>
          </button>
          <button
            type="button"
            onClick={handleInstantAdmin}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition text-xs font-mono font-medium shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Municipal Admin</span>
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Google OAuth with Amazon Cognito */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition shadow-2xs hover:border-sky-300"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center space-x-2 my-4">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-[11px] font-mono text-slate-400 uppercase">or continue with email</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-mono flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Raman"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen.volunteer@jalrakshak.org"
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-sky-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
              Minimum 8 characters with uppercase, lowercase, and numbers.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-mono font-medium transition shadow-xs flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Authenticating with Amazon Cognito...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In with Credentials' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          {mode === 'login' ? (
            <p>
              New civic contributor?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-sky-600 hover:underline font-semibold"
              >
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sky-600 hover:underline font-semibold"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Quick Autofill Buttons */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
          <span className="text-[10px] uppercase text-slate-400 font-bold block">
            Pre-registered AWS Cognito Test Credentials
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={fillCitizenDemo}
              className="px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] text-sky-700 text-left"
            >
              Autofill Citizen (Priya)
            </button>
            <button
              type="button"
              onClick={fillAdminDemo}
              className="px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] text-rose-700 text-left"
            >
              Autofill Admin (Chief)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
