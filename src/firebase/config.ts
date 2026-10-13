import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);

// Standard Google Auth provider for authentication (basic profile & email only)
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Dedicated Google Drive provider requested ONLY for question paper drive uploads
export const googleDriveProvider = new GoogleAuthProvider();
googleDriveProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleDriveProvider.addScope('https://www.googleapis.com/auth/drive');
googleDriveProvider.setCustomParameters({
  prompt: 'consent',
});

// Backwards-compatible alias for standard authentication
export const googleProvider = googleAuthProvider;

// In-memory access token cache (never stored in localStorage/sessionStorage)
let inMemoryAccessToken: string | null = null;

export function setCachedAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getCachedAccessToken(): string | null {
  return inMemoryAccessToken;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

type QuotaListener = (isExceeded: boolean, upgradeUrl: string) => void;
const quotaListeners = new Set<QuotaListener>();
let isQuotaExceeded = false;

export const FIREBASE_CONSOLE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${databaseId || 'ai-studio-a07074d7-7887-4c85-81ef-bba22c8a516c'}/data?openUpgradeDialog=true`;

export function notifyQuotaExceeded() {
  if (!isQuotaExceeded) {
    isQuotaExceeded = true;
    quotaListeners.forEach(listener => listener(true, FIREBASE_CONSOLE_UPGRADE_URL));
  }
}

export function subscribeToQuotaExceeded(listener: QuotaListener) {
  quotaListeners.add(listener);
  if (isQuotaExceeded) {
    listener(true, FIREBASE_CONSOLE_UPGRADE_URL);
  }
  return () => {
    quotaListeners.delete(listener);
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));

  if (errMsg.includes('Quota limit exceeded') || errMsg.includes('Free daily read units per project')) {
    notifyQuotaExceeded();
  }

  // Do not throw for GET/LIST operations so snapshot error callbacks continue executing fallbacks gracefully
  if (operationType === OperationType.GET || operationType === OperationType.LIST) {
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'department_settings', 'general'));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('Quota limit exceeded') || errMsg.includes('Free daily read units per project')) {
      notifyQuotaExceeded();
    } else if (errMsg.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}
