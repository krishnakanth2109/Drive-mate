import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Mail, 
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { communityApi } from '../../api/communityApi';

export function SecuritySettingsView({ userProfile, theme = 'dark' }) {
  const isDark = theme === 'dark';

  // Change Password State
  const [changePwData, setChangePwData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwSuccess, setChangePwSuccess] = useState('');
  const [changePwError, setChangePwError] = useState('');

  // Forgot / Reset Password State
  const [forgotEmail, setForgotEmail] = useState(userProfile?.email || '');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetActionUrl, setResetActionUrl] = useState('');
  const [devResetOtp, setDevResetOtp] = useState('');

  // OTP Reset Form State
  const [otpResetData, setOtpResetData] = useState({
    otp: '',
    newPassword: '',
  });
  const [otpResetLoading, setOtpResetLoading] = useState(false);
  const [otpResetSuccess, setOtpResetSuccess] = useState('');
  const [otpResetError, setOtpResetError] = useState('');

  // 1. Handle Change Password
  const handleChangePassword = async (e) => {
    e?.preventDefault();
    setChangePwError('');
    setChangePwSuccess('');

    if (!changePwData.newPassword || changePwData.newPassword.length < 6) {
      setChangePwError('New password must be at least 6 characters long.');
      return;
    }

    if (changePwData.newPassword !== changePwData.confirmPassword) {
      setChangePwError('New password and confirmation password do not match.');
      return;
    }

    setChangePwLoading(true);

    try {
      await communityApi.changePassword({
        currentPassword: changePwData.currentPassword,
        newPassword: changePwData.newPassword,
      });

      setChangePwSuccess('Account password updated successfully!');
      setChangePwData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setChangePwSuccess(''), 5000);
    } catch (err) {
      console.error('Change password error:', err);
      setChangePwError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setChangePwLoading(false);
    }
  };

  // 2. Handle Forgot Password Request (Firebase Auth API)
  const handleForgotPassword = async (e) => {
    e?.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setResetActionUrl('');
    setDevResetOtp('');

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid account email address.');
      return;
    }

    setForgotLoading(true);

    try {
      const data = await communityApi.forgotPassword(forgotEmail.trim());

      setForgotSuccess('Password reset instructions dispatched.');
      if (data?.actionUrl) {
        setResetActionUrl(data.actionUrl);
      }
      if (data?.devResetOtp) {
        setDevResetOtp(data.devResetOtp);
        setOtpResetData((prev) => ({ ...prev, otp: data.devResetOtp }));
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotError(err.message || 'Failed to trigger password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  // 3. Handle Reset Password with OTP
  const handleResetWithOtp = async (e) => {
    e?.preventDefault();
    setOtpResetError('');
    setOtpResetSuccess('');

    if (!otpResetData.otp.trim()) {
      setOtpResetError('Please enter the 6-digit verification code.');
      return;
    }
    if (!otpResetData.newPassword || otpResetData.newPassword.length < 6) {
      setOtpResetError('New password must be at least 6 characters long.');
      return;
    }

    setOtpResetLoading(true);

    try {
      await communityApi.resetPassword({
        email: forgotEmail.trim(),
        otp: otpResetData.otp.trim(),
        newPassword: otpResetData.newPassword,
      });

      setOtpResetSuccess('Password has been reset successfully! You can now use your new password.');
      setOtpResetData({ otp: '', newPassword: '' });
      setTimeout(() => setOtpResetSuccess(''), 5000);
    } catch (err) {
      console.error('Reset password error:', err);
      setOtpResetError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setOtpResetLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38c6ec]/15 border border-[#38c6ec]/30 text-[#0284c7] dark:text-[#38c6ec] text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Security & Password Management
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Security & Credentials<span className="text-[#38c6ec]">.</span>
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Update your commuter password securely or request a Firebase Authentication password reset link to your verified email.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OPTION 1: CHANGE PASSWORD */}
        <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6 ${
          isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#38c6ec]/15 border border-[#38c6ec]/30 flex items-center justify-center text-[#38c6ec]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Change Account Password</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Update your current password securely</p>
              </div>
            </div>

            {/* Success Banner */}
            {changePwSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{changePwSuccess}</span>
              </motion.div>
            )}

            {/* Error Banner */}
            {changePwError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{changePwError}</span>
              </motion.div>
            )}

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={changePwData.currentPassword}
                    onChange={(e) => setChangePwData({ ...changePwData, currentPassword: e.target.value })}
                    placeholder="Enter current password (e.g. Password@123)"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={changePwData.newPassword}
                    onChange={(e) => setChangePwData({ ...changePwData, newPassword: e.target.value })}
                    placeholder="Enter strong new password"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={changePwData.confirmPassword}
                    onChange={(e) => setChangePwData({ ...changePwData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:border-[#38c6ec]' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changePwLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#38c6ec] hover:bg-[#2bb4d8] text-black font-extrabold text-xs transition-all shadow-[0_0_20px_rgba(56,198,236,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {changePwLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Account Password</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className={`p-3.5 rounded-2xl border text-[11px] flex items-center gap-2 ${
            isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <ShieldCheck className="w-4 h-4 text-[#38c6ec] shrink-0" />
            <span>Passwords are hashed with bcrypt (salt rounds: 10) and synchronized to Firebase Auth.</span>
          </div>
        </div>

        {/* OPTION 2: FORGOT PASSWORD (FIREBASE AUTH) */}
        <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6 ${
          isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-500">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Forgot Password / Reset Link</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dispatched directly via Firebase Authentication</p>
              </div>
            </div>

            {/* Success Banner */}
            {forgotSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{forgotSuccess}</span>
              </motion.div>
            )}

            {/* Error Banner */}
            {forgotError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{forgotError}</span>
              </motion.div>
            )}

            {/* Email Trigger Form */}
            <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Registered Commuter Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. testuser@drivemate.com"
                    className={`w-full rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/30 ${
                      isDark 
                        ? 'bg-black/40 border border-white/10 text-white focus:border-purple-400' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-purple-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching via Firebase Auth...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Firebase Password Reset Email</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated Reset Link / OTP Box */}
            {(resetActionUrl || devResetOtp) && (
              <div className={`mt-5 p-4 rounded-2xl border space-y-2.5 text-xs ${
                isDark ? 'bg-black/50 border-purple-500/30' : 'bg-purple-50/60 border-purple-200'
              }`}>
                {devResetOtp && (
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>6-Digit Reset Verification Code:</span>
                    <span className="font-mono text-sm font-bold text-[#0284c7] dark:text-[#38c6ec] bg-white/10 px-2 py-0.5 rounded-lg border border-[#38c6ec]/30">
                      {devResetOtp}
                    </span>
                  </div>
                )}
                {resetActionUrl && (
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                    <a
                      href={resetActionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-purple-600 dark:text-purple-300 hover:underline font-semibold flex items-center gap-1.5"
                    >
                      <span>Open Firebase Official Password Reset Action Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Reset With OTP Form */}
            {devResetOtp && (
              <form onSubmit={handleResetWithOtp} className={`mt-5 pt-5 border-t space-y-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Complete Reset with Verification Code:
                </span>

                {otpResetSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
                    {otpResetSuccess}
                  </div>
                )}

                {otpResetError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
                    {otpResetError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="6-digit OTP code"
                      value={otpResetData.otp}
                      onChange={(e) => setOtpResetData({ ...otpResetData, otp: e.target.value })}
                      className={`w-full rounded-xl px-3 py-2 text-xs ${
                        isDark ? 'bg-black/40 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      value={otpResetData.newPassword}
                      onChange={(e) => setOtpResetData({ ...otpResetData, newPassword: e.target.value })}
                      className={`w-full rounded-xl px-3 py-2 text-xs ${
                        isDark ? 'bg-black/40 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpResetLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {otpResetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save New Password & Reset Account</span>
                </button>
              </form>
            )}
          </div>

          <div className={`p-3.5 rounded-2xl border text-[11px] flex items-center gap-2 ${
            isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Dispatched via Firebase Auth API keys (<code className="text-[#38c6ec]">cms-vgs</code>) directly to your verified inbox.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
