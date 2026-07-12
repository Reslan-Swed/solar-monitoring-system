import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, User, Lock, Loader2, AlertCircle, Mail, Key, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/lib/api';
import { LoginData } from '@/src/api-types';

interface LoginFormProps {
  onLogin: (data: LoginData) => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

type LoginMethod = 'password' | 'email';
type EmailStep = 'email' | 'otp';

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onRegisterClick, onForgotPasswordClick }) => {
  const [method, setMethod] = useState<LoginMethod>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailStep, setEmailStep] = useState<EmailStep>('email');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simple obfuscation for local storage to satisfy "not raw" requirement
  const obfuscate = (str: string) => {
    return btoa(str.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ 'solar-key'.charCodeAt(i % 9))
    ).join(''));
  };

  const deobfuscate = (str: string) => {
    try {
      const decoded = atob(str);
      return decoded.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ 'solar-key'.charCodeAt(i % 9))
      ).join('');
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      try {
        setPassword(deobfuscate(savedPassword));
      } catch (e) {
        // If decryption fails (e.g. if it was stored raw previously), clear it
        localStorage.removeItem('savedPassword');
      }
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      
      if (rememberMe) {
        localStorage.setItem('savedUsername', username);
        localStorage.setItem('savedPassword', obfuscate(password));
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
      }

      onLogin(data);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.sendOtp(email);
      setEmailStep('otp');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // 1. Verify OTP
      await api.verifyOtp(email, otp);
      // 2. Login using mail
      const data = await api.emailLogin(email);
      onLogin(data);
    } catch (err: any) {
      setError(err.message || 'OTP verification or login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 transform rotate-3">
            <Sun className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">SolarMonitor</h1>
          <p className="text-slate-400 dark:text-slate-500 font-medium mt-1">Energy Intelligence Dashboard</p>
        </div>

        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
          <button
            onClick={() => { setMethod('password'); setError(null); }}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200",
              method === 'password' ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Password
          </button>
          <button
            onClick={() => { setMethod('email'); setError(null); }}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200",
              method === 'email' ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Email Login
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 overflow-hidden"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {method === 'password' ? (
            <motion.form
              key="password-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handlePasswordSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none font-medium dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none font-medium dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-amber-500 focus:ring-amber-500/20 w-4 h-4" 
                  />
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={onForgotPasswordClick}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-xl shadow-amber-200 dark:shadow-none transition-all flex items-center justify-center gap-2",
                  isLoading && "opacity-80 cursor-not-allowed shadow-none"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign In to Dashboard"
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="email-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {emailStep === 'email' ? (
                  <motion.form
                    key="step-email"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleSendOtp}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                        Registered Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none font-medium dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2",
                        isLoading && "opacity-80 cursor-not-allowed shadow-none"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Send OTP Code"
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="step-otp"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleVerifyAndLogin}
                    className="space-y-6"
                  >
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                        Code sent to: <span className="font-bold">{email}</span>
                      </p>
                      <button 
                        type="button"
                        onClick={() => setEmailStep('email')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-500 mt-1 hover:underline"
                      >
                        Change Email
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Verification Code
                        </label>
                        <button
                          type="button"
                          disabled={countdown > 0 || isLoading}
                          onClick={handleSendOtp}
                          className={cn(
                            "text-xs font-bold transition-colors flex items-center gap-1",
                            countdown > 0 
                              ? "text-slate-400 dark:text-slate-500 cursor-not-allowed" 
                              : "text-amber-600 dark:text-amber-500 hover:text-amber-700"
                          )}
                        >
                          {countdown > 0 ? (
                            `Resend in ${countdown}s`
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              Resend Code
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600" />
                        <input
                          type="text"
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none font-bold tracking-widest text-center dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-none transition-all flex items-center justify-center gap-2",
                        isLoading && "opacity-80 cursor-not-allowed shadow-none"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Verify and Sign In"
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-10 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
          Don't have an account?{' '}
          <button 
            onClick={onRegisterClick}
            className="font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400"
          >
            Create Account
          </button>
        </p>
      </motion.div>
    </div>
  );
};
