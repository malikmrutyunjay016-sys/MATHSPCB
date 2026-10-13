import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  auth,
  googleAuthProvider,
  googleDriveProvider,
  setCachedAccessToken,
  getCachedAccessToken,
} from '../firebase/config';
import {
  verifyAdminCredentials,
  updateAdminPasswordWithMasterKey,
  DEFAULT_ADMIN_ID,
  MASTER_ADMIN_KEY,
} from '../services/db';

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isAuthReady: boolean;
  signInWithGoogle: () => Promise<AuthActionResult>;
  connectGoogleDrive: () => Promise<string>;
  getDriveToken: () => string | null;
  signOut: () => Promise<void>;
  // Admin credentials login & password change
  loginAsAdmin: (idAttempt: string, passwordAttempt: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  changeAdminPassword: (masterKey: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // Admin login modal controls
  isAdminLoginModalOpen: boolean;
  openAdminLoginModal: (options?: { startMode?: 'login' | 'change_password'; authErrorMessage?: string }) => void;
  closeAdminLoginModal: () => void;
  adminModalMode: 'login' | 'change_password';
  setAdminModalMode: (mode: 'login' | 'change_password') => void;
  authBannerMessage: string;
  setAuthBannerMessage: (msg: string) => void;
  // Backward compatibility aliases
  enableDemoAdmin: () => void;
  disableDemoAdmin: () => void;
  isDemoAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isAuthReady: false,
  signInWithGoogle: async () => ({ success: false, error: 'Auth context not initialized' }),
  connectGoogleDrive: async () => '',
  getDriveToken: () => null,
  signOut: async () => {},
  loginAsAdmin: async () => ({ success: false, error: 'Auth context not initialized' }),
  logoutAdmin: async () => {},
  changeAdminPassword: async () => ({ success: false, error: 'Auth context not initialized' }),
  isAdminLoginModalOpen: false,
  openAdminLoginModal: () => {},
  closeAdminLoginModal: () => {},
  adminModalMode: 'login',
  setAdminModalMode: () => {},
  authBannerMessage: '',
  setAuthBannerMessage: () => {},
  enableDemoAdmin: () => {},
  disableDemoAdmin: () => {},
  isDemoAdmin: false,
});

const DEFAULT_ADMIN_EMAIL = 'malikmrutyunjay016@gmail.com';

/**
 * Translates Firebase Auth error codes into actionable advice for published domains & users
 */
function formatGoogleAuthError(err: any): string {
  const code = String(err?.code || '');
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'published URL';
  const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';

  if (code.includes('unauthorized-domain')) {
    return `Published Domain Not Authorized: "${currentHost}" is not listed under Authorized Domains in Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized Domains and add "${currentHost}". Meanwhile, sign in directly below using Admin ID ("Admin123") and Password!`;
  }
  if (code.includes('popup-blocked')) {
    return 'Browser Pop-up Blocked: Your browser blocked the Google Sign-In popup. Please allow popups for this site, or sign in using Admin ID & Password.';
  }
  if (code.includes('popup-closed-by-user')) {
    return 'Google Sign-In was cancelled (popup closed before authentication completed).';
  }
  if (code.includes('cancelled-popup-request')) {
    return 'Sign-in cancelled due to concurrent requests. Please click again.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'Google Sign-In provider is disabled in Firebase Console. In Firebase Console > Authentication > Sign-in method, enable Google.';
  }
  if (code.includes('network-request-failed')) {
    return 'Network connection error during Google sign-in. Please check your internet connection.';
  }
  return err?.message || 'Google Sign-In failed. Please try again or use Admin ID & Password.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [authBannerMessage, setAuthBannerMessage] = useState<string>('');

  // Authenticated Admin session state (requires Admin123 + active password)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    // Purge legacy unauthorized demo bypass
    try {
      localStorage.removeItem('demo_admin_active');
    } catch {}
    return (
      sessionStorage.getItem('dept_admin_auth_session') === 'true' ||
      localStorage.getItem('dept_admin_auth_session') === 'true'
    );
  });

  // Modal controls
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState<'login' | 'change_password'>('login');

  useEffect(() => {
    // Check if the user returned from a redirect sign-in flow (e.g., when popup was blocked)
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            setCachedAccessToken(credential.accessToken);
          }
        }
      })
      .catch((err) => {
        console.warn('Redirect sign-in notice:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setCachedAccessToken(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<AuthActionResult> => {
    try {
      let result;
      try {
        result = await signInWithPopup(auth, googleAuthProvider);
      } catch (popupErr: any) {
        const code = String(popupErr?.code || '');
        // If popup was blocked or unsupported, attempt redirect sign-in
        if (code.includes('popup-blocked') || code.includes('operation-not-supported-in-this-environment')) {
          await signInWithRedirect(auth, googleAuthProvider);
          return { success: true };
        }
        throw popupErr;
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
      return { success: true };
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const friendlyError = formatGoogleAuthError(err);
      return { success: false, error: friendlyError };
    }
  };

  const connectGoogleDrive = async (): Promise<string> => {
    const existingToken = getCachedAccessToken();
    if (existingToken) {
      return existingToken;
    }
    const result = await signInWithPopup(auth, googleDriveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve Google Drive access authorization.');
    }
    setCachedAccessToken(credential.accessToken);
    return credential.accessToken;
  };

  const getDriveToken = (): string | null => {
    return getCachedAccessToken();
  };

  const loginAsAdmin = async (idAttempt: string, passwordAttempt: string) => {
    const result = await verifyAdminCredentials(idAttempt, passwordAttempt);
    if (result.success) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('dept_admin_auth_session', 'true');
      localStorage.setItem('dept_admin_auth_session', 'true');
    }
    return result;
  };

  const logoutAdmin = async () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('dept_admin_auth_session');
    localStorage.removeItem('dept_admin_auth_session');
    localStorage.removeItem('demo_admin_active');
    setCachedAccessToken(null);
    if (user) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.error('Sign Out Error:', err);
      }
    }
  };

  const signOut = logoutAdmin;

  const changeAdminPassword = async (masterKey: string, newPassword: string) => {
    return await updateAdminPasswordWithMasterKey(masterKey, newPassword);
  };

  const openAdminLoginModal = (options?: { startMode?: 'login' | 'change_password'; authErrorMessage?: string }) => {
    if (options?.startMode) {
      setAdminModalMode(options.startMode);
    } else {
      setAdminModalMode('login');
    }
    if (options?.authErrorMessage) {
      setAuthBannerMessage(options.authErrorMessage);
    }
    setIsAdminLoginModalOpen(true);
  };

  const closeAdminLoginModal = () => {
    setIsAdminLoginModalOpen(false);
  };

  // Legacy stubs safely open the required login modal instead of unauthorized bypass
  const enableDemoAdmin = () => {
    openAdminLoginModal({ startMode: 'login' });
  };

  const disableDemoAdmin = () => {
    logoutAdmin();
  };

  // Only the owner email (malikmrutyunjay016@gmail.com) OR an authenticated admin using ID & Password
  const isUserAdminEmail = user?.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();
  const isAdmin = Boolean(isAdminAuthenticated || isUserAdminEmail);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isAuthReady,
        signInWithGoogle,
        connectGoogleDrive,
        getDriveToken,
        signOut,
        loginAsAdmin,
        logoutAdmin,
        changeAdminPassword,
        isAdminLoginModalOpen,
        openAdminLoginModal,
        closeAdminLoginModal,
        adminModalMode,
        setAdminModalMode,
        authBannerMessage,
        setAuthBannerMessage,
        enableDemoAdmin,
        disableDemoAdmin,
        isDemoAdmin: isAdminAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

