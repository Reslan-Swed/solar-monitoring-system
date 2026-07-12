import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, User, UserCircle, ArrowRight, Loader2, CheckCircle2, ShieldCheck, RefreshCw, ChevronLeft } from 'lucide-react';
import { api } from '../../lib/api';

interface RegisterFormProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

type Step = 'info' | 'otp' | 'success';

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin, onSuccess }) => {
  const [step, setStep] = useState<Step>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    confirmPassword: '',
    mail: '',
    nickName: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setIsLoading(true);
    
    try {
      // Step 2: verify user's mail by sending an OTP
      await api.sendOtp(formData.mail);
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setIsLoading(true);
    try {
      await api.sendOtp(formData.mail);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Step 3: verify the entered OTP code
      await api.verifyOtp(formData.mail, otp);
      
      // Step 4: registration API
      await api.register(formData);
      
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Verification or registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800 relative z-10"
      >
        <AnimatePresence mode="wait">
          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Join the solar management network</p>
              </div>

              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      required
                      type="text"
                      placeholder="Username"
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium dark:text-white"
                    />
                  </div>

                  <div className="relative group">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      required
                      type="text"
                      placeholder="Display Name / Nickname"
                      value={formData.nickName}
                      onChange={(e) => setFormData({ ...formData, nickName: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium dark:text-white"
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      required
                      type="email"
                      placeholder="Email Address"
                      value={formData.mail}
                      onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium dark:text-white"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100 dark:border-red-900/30"
                  >
                    <div className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full animate-pulse" />
                    {error}
                  </motion.div>
                )}

                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-amber-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-amber-600 transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify Email
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-4">
                  <button 
                    type="button"
                    onClick={onBackToLogin}
                    className="text-slate-500 dark:text-slate-400 font-bold hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setStep('info')}
                className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-bold text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Details
              </button>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Verify Email</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">We sent a 6-digit code to {formData.mail}</p>
              </div>

              <form onSubmit={handleOtpVerify} className="space-y-6">
                <div className="relative group">
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="Enter Code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-3xl tracking-[1rem] py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-black placeholder:tracking-normal placeholder:text-sm placeholder:font-medium dark:text-white"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold border border-red-100 dark:border-red-900/30">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full bg-slate-900 dark:bg-amber-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-amber-600 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Registration'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || isLoading}
                    className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {resendTimer > 0 ? (
                      `Resend Code in ${resendTimer}s`
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend Code
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Aboard!</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Your account has been created successfully.</p>
              </div>
              <button
                onClick={onSuccess}
                className="w-full bg-slate-900 dark:bg-amber-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-amber-600 transition-all shadow-xl shadow-emerald-100 dark:shadow-none"
              >
                Go to Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
