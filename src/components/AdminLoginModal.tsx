import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  X,
  LogIn,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_ADMIN_ID, MASTER_ADMIN_KEY } from '../services/db';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'change_password';
  onLoginSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const { loginAsAdmin, changeAdminPassword, signInWithGoogle, user, isAdmin } = useAuth();

  const [mode, setMode] = useState<'login' | 'change_password'>(initialMode);
  
  // Login form states
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Change password form states
  const [masterKey, setMasterKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage('');
      setSuccessMessage('');
      setAdminId('');
      setAdminPassword('');
      setMasterKey('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!adminId.trim()) {
      setErrorMessage('Please enter Administrator ID.');
      return;
    }
    if (!adminPassword.trim()) {
      setErrorMessage('Please enter Administrator Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginAsAdmin(adminId.trim(), adminPassword.trim());
      if (result.success) {
        setSuccessMessage('Administrator verified successfully. Access granted.');
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) onLoginSuccess();
        }, 600);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check ID and Password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!masterKey.trim()) {
      setErrorMessage('Master Permission Key is required.');
      return;
    }

    if (masterKey.trim() !== MASTER_ADMIN_KEY) {
      setErrorMessage(
        'Invalid Master Permission Key. The key "MATHEMATICS" is required to change administrator password.'
      );
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage('Please enter the new administrator password.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changeAdminPassword(masterKey.trim(), newPassword.trim());
      if (result.success) {
        setSuccessMessage(
          'Administrator password successfully updated! You can now log in with your new password.'
        );
        // Pre-fill fields for immediate convenience
        setAdminId(DEFAULT_ADMIN_ID);
        setAdminPassword(newPassword.trim());
        setMasterKey('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setMode('login');
        }, 1500);
      } else {
        setErrorMessage(result.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update administrator password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="h-2 bg-linear-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {mode === 'login' ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <KeyRound className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Department of Mathematics
              </span>
              <h2 className="text-lg font-bold text-white font-serif-academic">
                {mode === 'login'
                  ? 'Administrator Authentication'
                  : 'Change Administrator Password'}
              </h2>
              <p className="text-xs text-slate-400">
                Panchayat College, Baragada (Autonomous)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{successMessage}</div>
            </div>
          )}

          {mode === 'login' ? (
            /* ================= MODE: LOGIN ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-amber-300 block mb-1">
                  Protected Administrative Portal
                </span>
                Access is restricted to authorized faculty and administrators. Enter your designated Admin ID and Password to manage department records.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="Enter Admin ID"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Admin Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('change_password');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline transition cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Change Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Authenticating...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Enter Admin Console</span>
                  </>
                )}
              </button>

              {/* Password change hint bar */}
              <div className="pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('change_password');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-slate-400 hover:text-amber-300 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Need to change or reset password?{' '}
                    <strong className="text-amber-400 underline underline-offset-2">
                      Use Key: MATHEMATICS
                    </strong>
                  </span>
                </button>
              </div>

              {/* Google sign-in fallback for designated owner */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                      onClose();
                    } catch {
                      // Handled
                    }
                  }}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= MODE: CHANGE PASSWORD ================= */
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Master Key Authorization Required</span>
                </div>
                To change or reset the administrator password, enter the Master Permission Key:
                <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded ml-1 border border-amber-600/50">
                  MATHEMATICS
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Master Permission Key *
                </label>
                <input
                  type="text"
                  required
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Enter Master Key: MATHEMATICS"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono tracking-wider transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  New Admin Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Confirm New Password *
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel / Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Updating...</span>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/60 px-6 py-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Department of Mathematics</span>
          <span>Protected Administrator Portal</span>
        </div>
      </div>
    </div>
  );
};
