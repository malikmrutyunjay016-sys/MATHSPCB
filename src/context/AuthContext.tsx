import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, setCachedAccessToken, getCachedAccessToken } from '../firebase/config';
import {
  verifyAdminCredentials,
  updateAdminPasswordWithMasterKey,
  DEFAULT_ADMIN_ID,
  MASTER_ADMIN_KEY,
} from '../services/db';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isAuthReady: boolean;
  signInWithGoogle: () => Promise<void>;
  connectGoogleDrive: () => Promise<string>;
  getDriveToken: () => string | null;
  signOut: () => Promise<void>;
  // Admin credentials login & password change
  loginAsAdmin: (idAttempt: string, passwordAttempt: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  changeAdminPassword: (masterKey: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // Admin login modal controls
  isAdminLoginModalOpen: boolean;
  openAdminLoginModal: (options?: { startMode?: 'login' | 'change_password' }) => void;
  closeAdminLoginModal: () => void;
  adminModalMode: 'login' | 'change_password';
  setAdminModalMode: (mode: 'login' | 'change_password') => void;
  // Backward compatibility aliases
  enableDemoAdmin: () => void;
  disableDemoAdmin: () => void;
  isDemoAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isAuthReady: false,
  signInWithGoogle: async () => {},
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
  enableDemoAdmin: () => {},
  disableDemoAdmin: () => {},
  isDemoAdmin: false,
});

const DEFAULT_ADMIN_EMAIL = 'malikmrutyunjay016@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setCachedAccessToken(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  };

  const connectGoogleDrive = async (): Promise<string> => {
    const existingToken = getCachedAccessToken();
    if (existingToken) {
      return existingToken;
    }
    const result = await signInWithPopup(auth, googleProvider);
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

  const openAdminLoginModal = (options?: { startMode?: 'login' | 'change_password' }) => {
    if (options?.startMode) {
      setAdminModalMode(options.startMode);
    } else {
      setAdminModalMode('login');
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

