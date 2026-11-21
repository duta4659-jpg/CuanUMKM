import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { Transaction, UserProfile, AuthUser } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const MANUAL_ACCOUNTS_KEY = 'cuanumkm_manual_accounts_v1';
const MANUAL_SESSION_KEY = 'cuanumkm_manual_session_v1';

interface StoredManualAccount {
  uid: string;
  businessName: string;
  identifier: string; // normalized lowercase email or cleaned phone
  passwordHash: string; // simple local obfuscation for prototype
  createdAt: string;
}

function normalizeIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return trimmed.replace(/[\s\-()]/g, '');
}

function isEmail(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
}

function encodeLocalSecret(secret: string): string {
  try {
    return btoa(unescape(encodeURIComponent(secret)));
  } catch {
    return secret;
  }
}

function loadManualAccounts(): StoredManualAccount[] {
  try {
    const raw = localStorage.getItem(MANUAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveManualAccounts(accounts: StoredManualAccount[]): void {
  localStorage.setItem(MANUAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getSavedManualSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(MANUAL_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setSavedManualSession(user: AuthUser): void {
  localStorage.setItem(MANUAL_SESSION_KEY, JSON.stringify(user));
}

export function clearManualSession(): void {
  localStorage.removeItem(MANUAL_SESSION_KEY);
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isOfflineOrNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code).toLowerCase()
      : '';
  return (
    code.includes('unavailable') ||
    code.includes('network-request-failed') ||
    msg.includes('client is offline') ||
    msg.includes('failed to get document because the client is offline') ||
    msg.includes('network error') ||
    msg.includes('failed to fetch') ||
    msg.includes('unavailable')
  );
}

// Connection test on boot as required by Firebase skill
export async function testConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection tested successfully');
  } catch (error) {
    if (!isOfflineOrNetworkError(error)) {
      console.warn('Firebase connection check notice:', error);
    }
  }
}
testConnection();

// Auth helper functions
export async function loginWithGoogle(): Promise<User> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Tidak ada koneksi internet. Masuk dengan Google membutuhkan koneksi internet.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    clearManualSession();
    return result.user;
  } catch (err) {
    console.error('Google Sign In failed:', err);
    throw err;
  }
}

export async function registerManualAccount(
  businessName: string,
  identifierRaw: string,
  password: string
): Promise<{ user: AuthUser; usedFirebaseAuth: boolean }> {
  const cleanName = businessName.trim();
  const identifier = normalizeIdentifier(identifierRaw);

  if (!cleanName) {
    throw new Error('Mohon isi Nama Usaha Anda.');
  }
  if (!identifier) {
    throw new Error('Mohon isi Email atau Nomor Telepon.');
  }
  if (password.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter agar aman.');
  }

  // Try Firebase Auth first if identifier is an email
  if (isEmail(identifier)) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, identifier, password);
      await updateProfile(cred.user, { displayName: cleanName });
      clearManualSession();
      return {
        user: {
          uid: cred.user.uid,
          displayName: cleanName,
          emailOrPhone: identifier,
          photoURL: cred.user.photoURL,
          provider: 'manual',
        },
        usedFirebaseAuth: true,
      };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        throw new Error('Email ini sudah terdaftar. Silakan langsung masuk ke akun Anda.');
      }
      if (code === 'auth/weak-password') {
        throw new Error('Kata sandi terlalu lemah. Gunakan minimal 6 karakter.');
      }
      if (
        code !== 'auth/operation-not-allowed' &&
        code !== 'auth/configuration-not-found' &&
        code !== 'auth/internal-error'
      ) {
        throw new Error(err?.message || 'Gagal mendaftarkan akun.');
      }
      // Fallback gracefully to local account when Email/Password provider is not enabled in Firebase Console
    }
  }

  // Local / Phone-based registration
  const accounts = loadManualAccounts();
  if (accounts.some((acc) => acc.identifier === identifier)) {
    throw new Error('Email atau nomor telepon ini sudah terdaftar. Silakan langsung masuk.');
  }

  const newAccount: StoredManualAccount = {
    uid: `umkm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    businessName: cleanName,
    identifier,
    passwordHash: encodeLocalSecret(password),
    createdAt: new Date().toISOString(),
  };

  saveManualAccounts([...accounts, newAccount]);

  const sessionUser: AuthUser = {
    uid: newAccount.uid,
    displayName: newAccount.businessName,
    emailOrPhone: identifierRaw.trim(),
    provider: 'manual',
  };
  setSavedManualSession(sessionUser);

  return { user: sessionUser, usedFirebaseAuth: false };
}

export async function loginManualAccount(
  identifierRaw: string,
  password: string
): Promise<{ user: AuthUser; usedFirebaseAuth: boolean }> {
  const identifier = normalizeIdentifier(identifierRaw);
  if (!identifier || !password) {
    throw new Error('Mohon isi Email/Nomor Telepon dan Kata Sandi.');
  }

  // Check local accounts first or try Firebase if email
  const localAccounts = loadManualAccounts();
  const matchedLocal = localAccounts.find((acc) => acc.identifier === identifier);

  if (isEmail(identifier) && !matchedLocal) {
    try {
      const cred = await signInWithEmailAndPassword(auth, identifier, password);
      clearManualSession();
      return {
        user: {
          uid: cred.user.uid,
          displayName: cred.user.displayName || 'Usaha UMKM',
          emailOrPhone: cred.user.email || identifier,
          photoURL: cred.user.photoURL,
          provider: 'manual',
        },
        usedFirebaseAuth: true,
      };
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found'
      ) {
        throw new Error('Email atau kata sandi salah. Silakan periksa kembali atau gunakan Lupa Kata Sandi.');
      }
      if (
        code !== 'auth/operation-not-allowed' &&
        code !== 'auth/configuration-not-found' &&
        code !== 'auth/internal-error'
      ) {
        throw new Error(err?.message || 'Gagal masuk ke akun.');
      }
    }
  }

  if (!matchedLocal) {
    throw new Error('Akun belum ditemukan. Silakan daftar terlebih dahulu.');
  }

  if (matchedLocal.passwordHash !== encodeLocalSecret(password)) {
    throw new Error('Kata sandi salah. Silakan coba lagi atau klik "Lupa Kata Sandi?".');
  }

  const sessionUser: AuthUser = {
    uid: matchedLocal.uid,
    displayName: matchedLocal.businessName,
    emailOrPhone: identifierRaw.trim(),
    provider: 'manual',
  };
  setSavedManualSession(sessionUser);

  return { user: sessionUser, usedFirebaseAuth: false };
}

export async function requestPasswordReset(
  identifierRaw: string
): Promise<{ sentViaFirebase: boolean; target: string }> {
  const identifier = normalizeIdentifier(identifierRaw);
  if (!identifier) {
    throw new Error('Mohon masukkan email atau nomor telepon yang terdaftar.');
  }

  if (isEmail(identifier)) {
    try {
      await sendPasswordResetEmail(auth, identifier);
      return { sentViaFirebase: true, target: identifierRaw.trim() };
    } catch {
      // Fallback cleanly to simulation mode if Firebase Email/Password is not enabled or user is local
    }
  }

  return { sentViaFirebase: false, target: identifierRaw.trim() };
}

export async function logoutUser(): Promise<void> {
  try {
    clearManualSession();
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (err) {
    console.error('Sign out error:', err);
    throw err;
  }
}

// Realtime transactions listener for a given userId
export function subscribeToTransactions(
  userId: string,
  onData: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = 'transactions';
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return () => {};
  }
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            userId: data.userId,
            type: data.type,
            category: data.category,
            amount: Number(data.amount) || 0,
            notes: data.notes || '',
            date: data.date,
            time: data.time || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        onData(list);
      },
      (error) => {
        if (onError) {
          onError(error);
        }
        if (isOfflineOrNetworkError(error)) {
          return;
        }
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      return () => {};
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Save transaction to Firestore
export async function saveTransaction(
  transaction: Omit<Transaction, 'id'> & { id?: string }
): Promise<string> {
  const path = 'transactions';
  const txId = transaction.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return txId;
  }

  const safeCategory = (transaction.category || 'Lainnya').trim().slice(0, 200) || 'Lainnya';
  const safeNotes = (transaction.notes || '').trim().slice(0, 500);
  const safeDate =
    typeof transaction.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
      ? transaction.date
      : new Date().toISOString().slice(0, 10);
  const safeAmount = Math.max(1, Number(transaction.amount) || 0);

  const payload: Record<string, unknown> = {
    userId: transaction.userId,
    type: transaction.type === 'expense' ? 'expense' : 'income',
    category: safeCategory,
    amount: safeAmount,
    date: safeDate,
    notes: safeNotes,
    updatedAt: nowIso,
  };

  if (!transaction.id) {
    payload.createdAt = nowIso;
  }

  try {
    const docRef = doc(db, path, txId);
    await setDoc(docRef, payload, { merge: true });
    return txId;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      return txId;
    }
    handleFirestoreError(error, OperationType.WRITE, `${path}/${txId}`);
  }
}

// Delete transaction from Firestore
export async function removeTransaction(transactionId: string): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }
  const path = `transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'transactions', transactionId));
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// User Profile helpers
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }
  const path = `users/${profile.userId}`;
  const nowIso = new Date().toISOString();
  const payload = {
    userId: profile.userId,
    businessName: (profile.businessName || 'Usaha UMKM').trim().slice(0, 100) || 'Usaha UMKM',
    ownerName: (profile.ownerName || 'Pemilik Usaha').trim().slice(0, 100) || 'Pemilik Usaha',
    phone: (profile.phone || '').trim().slice(0, 20),
    address: (profile.address || '').trim().slice(0, 255),
    initialCash: Number(profile.initialCash) || 0,
    updatedAt: nowIso,
  };
  try {
    await setDoc(doc(db, 'users', profile.userId), payload, { merge: true });
  } catch (error) {
    if (isOfflineOrNetworkError(error)) {
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export { onAuthStateChanged };
