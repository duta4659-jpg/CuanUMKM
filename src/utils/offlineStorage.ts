import type { Transaction, UserProfile } from '../types';
import { DEFAULT_PROFILE } from './initialData';

export const LOCAL_STORAGE_TX_KEY = 'cuanumkm_transactions_v1';
export const LOCAL_STORAGE_PROFILE_KEY = 'cuanumkm_profile_v1';
export const LOCAL_STORAGE_PENDING_UPSERTS_KEY = 'cuanumkm_pending_upserts_v1';
export const LOCAL_STORAGE_PENDING_DELETES_KEY = 'cuanumkm_pending_deletes_v1';
export const LOCAL_STORAGE_PENDING_PROFILE_KEY = 'cuanumkm_pending_profile_v1';
const LEGACY_PENDING_SYNC_KEY = 'cuanumkm_pending_sync_v1';

export function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key: string, value: unknown): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`Gagal menulis penyimpanan lokal (${key}):`, err);
    return false;
  }
}

export function removeStorageKey(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore storage removal errors
  }
}

export function sortTransactionsNewestFirst(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    const dateDiff = (b.date || '').localeCompare(a.date || '');
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = (b.time || '').localeCompare(a.time || '');
    if (timeDiff !== 0) return timeDiff;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

function isValidStoredTransaction(item: unknown): item is Transaction {
  if (!item || typeof item !== 'object') return false;
  const tx = item as Partial<Transaction>;
  return (
    typeof tx.id === 'string' &&
    tx.id.length > 0 &&
    !tx.id.startsWith('tx_init_') &&
    (tx.type === 'income' || tx.type === 'expense') &&
    typeof tx.amount === 'number' &&
    Number.isFinite(tx.amount) &&
    typeof tx.date === 'string' &&
    tx.date.length === 10
  );
}

export function loadLocalTransactions(): Transaction[] {
  const parsed = readJsonStorage<unknown[]>(LOCAL_STORAGE_TX_KEY, []);
  if (!Array.isArray(parsed)) return [];
  const cleaned = parsed.filter(isValidStoredTransaction);
  if (cleaned.length !== parsed.length) {
    writeJsonStorage(LOCAL_STORAGE_TX_KEY, cleaned);
  }
  return sortTransactionsNewestFirst(cleaned);
}

export function saveLocalTransactions(list: Transaction[]): boolean {
  return writeJsonStorage(LOCAL_STORAGE_TX_KEY, sortTransactionsNewestFirst(list));
}

export function loadLocalProfile(): UserProfile {
  const parsed = readJsonStorage<UserProfile | null>(LOCAL_STORAGE_PROFILE_KEY, null);
  if (!parsed || typeof parsed !== 'object') return DEFAULT_PROFILE;

  const isLegacyDemoProfile =
    parsed.businessName === 'Warung Berkah UMKM' &&
    parsed.ownerName === 'Bu Siti Rahayu' &&
    parsed.phone === '0812-3456-7890' &&
    parsed.initialCash === 500000;

  if (isLegacyDemoProfile) {
    removeStorageKey(LOCAL_STORAGE_PROFILE_KEY);
    return DEFAULT_PROFILE;
  }

  return {
    ...DEFAULT_PROFILE,
    ...parsed,
    initialCash: Number(parsed.initialCash) || 0,
  };
}

export function saveLocalProfile(profile: UserProfile): boolean {
  return writeJsonStorage(LOCAL_STORAGE_PROFILE_KEY, profile);
}

export function getPendingUpsertIds(): string[] {
  const ids = readJsonStorage<unknown>(LOCAL_STORAGE_PENDING_UPSERTS_KEY, []);
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

export function getPendingDeleteIds(): string[] {
  const ids = readJsonStorage<unknown>(LOCAL_STORAGE_PENDING_DELETES_KEY, []);
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

export function markTransactionPendingUpsert(txId: string): void {
  const upserts = getPendingUpsertIds();
  if (!upserts.includes(txId)) {
    writeJsonStorage(LOCAL_STORAGE_PENDING_UPSERTS_KEY, [...upserts, txId]);
  }
  const deletes = getPendingDeleteIds().filter((id) => id !== txId);
  if (deletes.length > 0) {
    writeJsonStorage(LOCAL_STORAGE_PENDING_DELETES_KEY, deletes);
  } else {
    removeStorageKey(LOCAL_STORAGE_PENDING_DELETES_KEY);
  }
}

export function markTransactionSynced(txId: string): void {
  const upserts = getPendingUpsertIds().filter((id) => id !== txId);
  if (upserts.length > 0) {
    writeJsonStorage(LOCAL_STORAGE_PENDING_UPSERTS_KEY, upserts);
  } else {
    removeStorageKey(LOCAL_STORAGE_PENDING_UPSERTS_KEY);
  }
}

export function markTransactionPendingDelete(txId: string): void {
  markTransactionSynced(txId);
  const deletes = getPendingDeleteIds();
  if (!deletes.includes(txId)) {
    writeJsonStorage(LOCAL_STORAGE_PENDING_DELETES_KEY, [...deletes, txId]);
  }
}

export function clearPendingDelete(txId: string): void {
  const deletes = getPendingDeleteIds().filter((id) => id !== txId);
  if (deletes.length > 0) {
    writeJsonStorage(LOCAL_STORAGE_PENDING_DELETES_KEY, deletes);
  } else {
    removeStorageKey(LOCAL_STORAGE_PENDING_DELETES_KEY);
  }
}

export function setPendingProfileSync(pending: boolean): void {
  if (pending) {
    writeJsonStorage(LOCAL_STORAGE_PENDING_PROFILE_KEY, true);
  } else {
    removeStorageKey(LOCAL_STORAGE_PENDING_PROFILE_KEY);
    removeStorageKey(LEGACY_PENDING_SYNC_KEY);
  }
}

export function hasPendingProfileSync(): boolean {
  const v1 = readJsonStorage<boolean>(LOCAL_STORAGE_PENDING_PROFILE_KEY, false);
  let legacy = false;
  try {
    legacy =
      typeof window !== 'undefined' &&
      window.localStorage?.getItem(LEGACY_PENDING_SYNC_KEY) === 'true';
  } catch {
    legacy = false;
  }
  return Boolean(v1 || legacy);
}

/**
 * Merges incoming Firestore transactions with locally cached transactions safely:
 * - Never resurrects items pending deletion while offline
 * - Never overwrites items that have pending offline edits/creations
 */
export function mergeCloudAndLocalTransactions(
  cloudList: Transaction[],
  localList: Transaction[]
): Transaction[] {
  const pendingDeletes = new Set(getPendingDeleteIds());
  const pendingUpserts = new Set(getPendingUpsertIds());

  const mergedMap = new Map<string, Transaction>();
  const localById = new Map(localList.map((tx) => [tx.id, tx]));

  for (const cloudTx of cloudList) {
    if (pendingDeletes.has(cloudTx.id)) continue;
    const localTx = localById.get(cloudTx.id);
    if (localTx && pendingUpserts.has(cloudTx.id)) {
      mergedMap.set(cloudTx.id, localTx);
    } else {
      mergedMap.set(cloudTx.id, {
        ...cloudTx,
        time: cloudTx.time || localTx?.time || '',
      });
    }
  }

  // Keep any newly created offline transactions not yet in cloud snapshot
  for (const localTx of localList) {
    if (pendingDeletes.has(localTx.id)) continue;
    if (!mergedMap.has(localTx.id) && pendingUpserts.has(localTx.id)) {
      mergedMap.set(localTx.id, localTx);
    }
  }

  return sortTransactionsNewestFirst(Array.from(mergedMap.values()));
}
