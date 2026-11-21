/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
  auth,
  onAuthStateChanged,
  logoutUser,
  getSavedManualSession,
  subscribeToTransactions,
  saveTransaction,
  removeTransaction,
  fetchUserProfile,
  saveUserProfile,
} from './firebase';
import type { Transaction, UserProfile, AuthUser } from './types';
import type { Recipe, RecipeOrder } from './types/recipe';
import { getTodayDateString } from './utils/formatters';
import {
  loadLocalTransactions,
  saveLocalTransactions,
  loadLocalProfile,
  saveLocalProfile,
  sortTransactionsNewestFirst,
  getPendingUpsertIds,
  getPendingDeleteIds,
  markTransactionPendingUpsert,
  markTransactionSynced,
  markTransactionPendingDelete,
  clearPendingDelete,
  setPendingProfileSync,
  hasPendingProfileSync,
  mergeCloudAndLocalTransactions,
} from './utils/offlineStorage';
import {
  loadRecipesFromStorage,
  saveRecipesToStorage,
  loadRecipeOrdersFromStorage,
  saveRecipeOrdersToStorage,
} from './utils/recipeStore';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TodayTransactionsList } from './components/TodayTransactionsList';
import { TransactionModal } from './components/TransactionModal';
import { AuthModal } from './components/AuthModal';
import { ReportPage } from './components/ReportPage';
import { ProfilePage } from './components/ProfilePage';
import { BottomNav, type TabType } from './components/BottomNav';
import { RecipeFeatureCard } from './components/recipes/RecipeFeatureCard';
import { RecipeMainPage } from './components/recipes/RecipeMainPage';
import { AdminPasswordModal } from './components/admin/AdminPasswordModal';
import { AdminPanelPage } from './components/admin/AdminPanelPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [manualUser, setManualUser] = useState<AuthUser | null>(() => getSavedManualSession());
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLocalTransactions());
  const [profile, setProfile] = useState<UserProfile>(() => loadLocalProfile());
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isRecipePageActive, setIsRecipePageActive] = useState<boolean>(false);

  const transactionsRef = useRef<Transaction[]>(transactions);
  const profileRef = useRef<UserProfile>(profile);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Auth modal & gate state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authGateMessage, setAuthGateMessage] = useState<string | null>(null);
  const pendingAuthActionRef = useRef<(() => void) | null>(null);

  // Hidden Admin Panel state (Double Security: 5 taps on logo + owner password)
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadRecipesFromStorage());
  const [recipeOrders, setRecipeOrders] = useState<RecipeOrder[]>(() =>
    loadRecipeOrdersFromStorage()
  );

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

  const authUser: AuthUser | null = useMemo(() => {
    if (currentUser) {
      return {
        uid: currentUser.uid,
        displayName: currentUser.displayName || profile.ownerName || profile.businessName,
        emailOrPhone: currentUser.email || '',
        photoURL: currentUser.photoURL,
        provider: 'google',
      };
    }
    return manualUser;
  }, [currentUser, manualUser, profile.ownerName, profile.businessName]);

  const showToast = useCallback((msg: string, variant: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastVariant(variant);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  // 1. Listen to Firebase Auth state & sync safely when online
  useEffect(() => {
    let unsubscribeTx: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeTx) {
        unsubscribeTx();
        unsubscribeTx = null;
      }

      if (user) {
        setCurrentUser(user);
        const onlineNow = typeof navigator === 'undefined' ? true : navigator.onLine;
        setIsFirebaseConnected(onlineNow);

        if (onlineNow) {
          // Sync user profile safely without clobbering pending offline edits
          try {
            if (hasPendingProfileSync()) {
              const localProf = { ...profileRef.current, userId: user.uid };
              await saveUserProfile(localProf);
              setPendingProfileSync(false);
            } else {
              const cloudProfile = await fetchUserProfile(user.uid);
              if (cloudProfile) {
                setProfile(cloudProfile);
                saveLocalProfile(cloudProfile);
              } else {
                const newProfile: UserProfile = {
                  ...profileRef.current,
                  userId: user.uid,
                  ownerName: user.displayName || profileRef.current.ownerName,
                };
                await saveUserProfile(newProfile);
                setProfile(newProfile);
                saveLocalProfile(newProfile);
              }
            }
          } catch (err) {
            console.warn('Offline or profile sync skipped, using local storage:', err);
          }

          // Subscribe to user transactions in Firestore & merge safely with offline queue
          unsubscribeTx = subscribeToTransactions(
            user.uid,
            (cloudTransactions) => {
              const localCurrent = transactionsRef.current;
              if (cloudTransactions && cloudTransactions.length > 0) {
                const merged = mergeCloudAndLocalTransactions(cloudTransactions, localCurrent);
                transactionsRef.current = merged;
                setTransactions(merged);
                saveLocalTransactions(merged);
              } else if (localCurrent.length > 0) {
                const pendingDeletes = new Set(getPendingDeleteIds());
                localCurrent
                  .filter((tx) => !pendingDeletes.has(tx.id))
                  .forEach((tx) => {
                    saveTransaction({
                      ...tx,
                      userId: user.uid,
                    })
                      .then(() => markTransactionSynced(tx.id))
                      .catch(() => markTransactionPendingUpsert(tx.id));
                  });
              }
            },
            (err) => {
              console.warn('Realtime listener offline/error, using local data:', err);
            }
          );
        }
      } else {
        setCurrentUser(null);
        setIsFirebaseConnected(false);
      }
    });

    return () => {
      if (unsubscribeTx) {
        unsubscribeTx();
      }
      unsubscribeAuth();
    };
  }, []);

  // 2. Re-sync queued offline changes automatically when connection returns
  useEffect(() => {
    const syncPendingData = async () => {
      const online = typeof navigator === 'undefined' ? true : navigator.onLine;
      setIsFirebaseConnected(Boolean(currentUser) && online);
      if (!currentUser || !online) return;

      let syncedAny = false;

      try {
        const pendingDeletes = getPendingDeleteIds();
        for (const id of pendingDeletes) {
          await removeTransaction(id);
          clearPendingDelete(id);
          syncedAny = true;
        }

        const pendingUpserts = getPendingUpsertIds();
        if (pendingUpserts.length > 0) {
          const localById = new Map(transactionsRef.current.map((tx) => [tx.id, tx]));
          for (const id of pendingUpserts) {
            const tx = localById.get(id);
            if (tx) {
              await saveTransaction({ ...tx, userId: currentUser.uid });
            }
            markTransactionSynced(id);
            syncedAny = true;
          }
        }

        if (hasPendingProfileSync()) {
          await saveUserProfile({ ...profileRef.current, userId: currentUser.uid });
          setPendingProfileSync(false);
          syncedAny = true;
        }

        if (syncedAny) {
          showToast('Koneksi kembali! Catatan offline berhasil disinkronkan.');
        }
      } catch (err) {
        console.warn('Pending offline sync postponed:', err);
      }
    };

    const handleOffline = () => {
      setIsFirebaseConnected(false);
    };

    window.addEventListener('online', syncPendingData);
    window.addEventListener('offline', handleOffline);
    if (typeof navigator !== 'undefined' && navigator.onLine && currentUser) {
      syncPendingData();
    }

    return () => {
      window.removeEventListener('online', syncPendingData);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, showToast]);

  // Auth modal helpers & access gates
  const openAuthModal = useCallback((gateMsg?: string, onSuccess?: () => void) => {
    pendingAuthActionRef.current = onSuccess || null;
    setAuthGateMessage(gateMsg || null);
    setIsAuthModalOpen(true);
  }, []);

  const requireAuth = useCallback(
    (onSuccess?: () => void) => {
      if (authUser) {
        onSuccess?.();
        return;
      }
      openAuthModal(
        'Silakan masuk atau daftar terlebih dahulu untuk menggunakan fitur ini.',
        onSuccess
      );
    },
    [authUser, openAuthModal]
  );

  const handleAuthSuccess = useCallback(
    (user: AuthUser, registeredBusinessName?: string) => {
      if (user.provider === 'manual' && !auth.currentUser) {
        setManualUser(user);
      }

      if (registeredBusinessName) {
        const trimmedName = registeredBusinessName.trim();
        const looksLikePhone = !user.emailOrPhone.includes('@') && /\d{6,}/.test(user.emailOrPhone);
        const updatedProfile: UserProfile = {
          ...profile,
          userId: user.uid,
          businessName: trimmedName,
          ownerName: trimmedName,
          phone: looksLikePhone ? user.emailOrPhone : profile.phone,
        };
        setProfile(updatedProfile);
        profileRef.current = updatedProfile;
        saveLocalProfile(updatedProfile);
        if (auth.currentUser) {
          if (typeof navigator === 'undefined' || navigator.onLine) {
            saveUserProfile(updatedProfile).catch(() => setPendingProfileSync(true));
          } else {
            setPendingProfileSync(true);
          }
        }
      }

      showToast(
        `Selamat datang, ${registeredBusinessName || user.displayName || 'Juragan'}!`
      );

      const pending = pendingAuthActionRef.current;
      pendingAuthActionRef.current = null;
      if (pending) {
        setTimeout(() => {
          pending();
        }, 50);
      }
    },
    [profile, showToast]
  );

  const handleLogout = async () => {
    try {
      await logoutUser();
      setManualUser(null);
      setIsRecipePageActive(false);
      showToast('Berhasil keluar. Anda kembali ke Mode Tamu.');
    } catch (err) {
      console.error(err);
    }
  };

  // Hidden Admin Panel handlers
  const handleSecretLogoTap = useCallback(() => {
    setIsAdminPasswordModalOpen(true);
  }, []);

  const handleAdminVerified = useCallback(() => {
    setIsAdminPasswordModalOpen(false);
    setIsAdminPanelOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Akses Pemilik Terverifikasi. Panel Moderasi Admin dibuka.');
  }, [showToast]);

  const handleAdminDenied = useCallback(() => {
    setIsAdminPasswordModalOpen(false);
    setIsAdminPanelOpen(false);
    setCurrentTab('home');
    setIsRecipePageActive(false);
    showToast('Akses ditolak! Kata sandi pemilik salah.', 'error');
  }, [showToast]);

  const handleCreateRecipe = useCallback((newRecipe: Recipe) => {
    setRecipes((prev) => {
      const updated = [newRecipe, ...prev];
      saveRecipesToStorage(updated);
      return updated;
    });
  }, []);

  const handleCreateRecipeOrder = useCallback((newOrder: RecipeOrder) => {
    setRecipeOrders((prev) => {
      const updated = [newOrder, ...prev];
      saveRecipeOrdersToStorage(updated);
      return updated;
    });
  }, []);

  const handleAdminOrderDecision = useCallback(
    (orderId: string, decision: 'approved' | 'rejected') => {
      setRecipeOrders((prev) => {
        const updated = prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          return {
            ...ord,
            status: decision,
            rejectionReason:
              decision === 'rejected'
                ? ord.distanceKm < 15
                  ? 'Ditolak Admin: Jarak lokasi < 15 KM dari warung penjual asli.'
                  : 'Ditolak oleh Admin CuanUMKM.'
                : undefined,
          };
        });
        saveRecipeOrdersToStorage(updated);
        return updated;
      });
      showToast(
        decision === 'approved'
          ? 'Permintaan resep berhasil di-ACC!'
          : 'Permintaan resep ditolak.',
        decision === 'approved' ? 'success' : 'error'
      );
    },
    [showToast]
  );

  const handleAdminRecipeDecision = useCallback(
    (recipeId: string, decision: 'approved' | 'rejected') => {
      setRecipes((prev) => {
        const updated = prev.map((rcp) =>
          rcp.id === recipeId ? { ...rcp, status: decision } : rcp
        );
        saveRecipesToStorage(updated);
        return updated;
      });
      showToast(
        decision === 'approved'
          ? 'Resep penjual di-ACC untuk tayang!'
          : 'Pengajuan resep penjual ditolak.',
        decision === 'approved' ? 'success' : 'error'
      );
    },
    [showToast]
  );

  // Add or Update Transaction
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'userId'> & { id?: string }
  ) => {
    const userId = authUser ? authUser.uid : 'guest';
    const txId = txData.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const existingTx = txData.id
      ? transactionsRef.current.find((t) => t.id === txData.id)
      : undefined;

    const newTx: Transaction = {
      ...txData,
      id: txId,
      userId,
      createdAt: existingTx?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist atomically to localStorage & React state for offline-first reliability
    const currentList = transactionsRef.current;
    const exists = currentList.some((t) => t.id === txId);
    const updatedList = sortTransactionsNewestFirst(
      exists ? currentList.map((t) => (t.id === txId ? newTx : t)) : [newTx, ...currentList]
    );
    transactionsRef.current = updatedList;
    setTransactions(updatedList);
    saveLocalTransactions(updatedList);

    const isOnlineNow = typeof navigator === 'undefined' ? true : navigator.onLine;

    if (currentUser) {
      if (isOnlineNow) {
        try {
          await saveTransaction({
            ...newTx,
            userId: currentUser.uid,
          });
          markTransactionSynced(txId);
        } catch (err) {
          console.warn('Cloud sync deferred, saved locally:', err);
          markTransactionPendingUpsert(txId);
        }
      } else {
        markTransactionPendingUpsert(txId);
      }
    }

    showToast(
      !isOnlineNow
        ? `${txData.id ? 'Perubahan' : txData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} tersimpan di perangkat (Offline)`
        : txData.id
        ? 'Transaksi berhasil diperbarui!'
        : `${txData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil dicatat!`
    );
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    const updatedList = transactionsRef.current.filter((t) => t.id !== id);
    transactionsRef.current = updatedList;
    setTransactions(updatedList);
    saveLocalTransactions(updatedList);

    const isOnlineNow = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (currentUser) {
      if (isOnlineNow) {
        try {
          await removeTransaction(id);
          clearPendingDelete(id);
          markTransactionSynced(id);
        } catch (err) {
          console.warn('Cloud delete deferred, removed locally:', err);
          markTransactionPendingDelete(id);
        }
      } else {
        markTransactionPendingDelete(id);
      }
    }

    showToast(
      !isOnlineNow
        ? 'Catatan dihapus dari perangkat (Offline)'
        : 'Catatan transaksi telah dihapus'
    );
  };

  // Save User Profile
  const handleSaveProfile = async (updated: UserProfile) => {
    profileRef.current = updated;
    setProfile(updated);
    saveLocalProfile(updated);

    const isOnlineNow = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (currentUser) {
      if (isOnlineNow) {
        try {
          await saveUserProfile({
            ...updated,
            userId: currentUser.uid,
          });
          setPendingProfileSync(false);
        } catch (err) {
          console.warn('Profile cloud sync deferred, saved locally:', err);
          setPendingProfileSync(true);
        }
      } else {
        setPendingProfileSync(true);
      }
    }
    showToast(
      !isOnlineNow
        ? 'Profil usaha tersimpan di perangkat (Offline)'
        : 'Profil usaha berhasil disimpan'
    );
  };

  // Restore Transactions
  const handleRestoreTransactions = (imported: Transaction[]) => {
    const sorted = sortTransactionsNewestFirst(imported);
    transactionsRef.current = sorted;
    setTransactions(sorted);
    saveLocalTransactions(sorted);

    if (currentUser) {
      const isOnlineNow = typeof navigator === 'undefined' ? true : navigator.onLine;
      if (isOnlineNow) {
        sorted.forEach((tx) => {
          saveTransaction({
            ...tx,
            userId: currentUser.uid,
          })
            .then(() => markTransactionSynced(tx.id))
            .catch(() => markTransactionPendingUpsert(tx.id));
        });
      } else {
        sorted.forEach((tx) => markTransactionPendingUpsert(tx.id));
      }
    }
  };

  // Today calculations
  const todayStr = getTodayDateString();
  const todayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === todayStr);
  }, [transactions, todayStr]);

  const { incomeToday, expenseToday, incomeCount, expenseCount } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let incC = 0;
    let expC = 0;

    todayTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        inc += tx.amount;
        incC += 1;
      } else {
        exp += tx.amount;
        expC += 1;
      }
    });

    return {
      incomeToday: inc,
      expenseToday: exp,
      incomeCount: incC,
      expenseCount: expC,
    };
  }, [todayTransactions]);

  // Modal triggers
  const openAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Header with branding & sync status */}
      <Header
        businessName={profile.businessName}
        user={authUser}
        onLogin={() => openAuthModal()}
        onLogout={handleLogout}
        isFirebaseConnected={isFirebaseConnected}
        onSecretLogoTap={handleSecretLogoTap}
      />

      {/* Offline status notice when network is unavailable */}
      <OfflineIndicator />

      {/* Main Container (generous bottom clearance for floating dock & future banner space) */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-4 pb-40 sm:pb-44 flex-1">
        {isAdminPanelOpen ? (
          <AdminPanelPage
            orders={recipeOrders}
            recipes={recipes}
            onOrderDecision={handleAdminOrderDecision}
            onRecipeDecision={handleAdminRecipeDecision}
            onExit={() => {
              setIsAdminPanelOpen(false);
              setCurrentTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <>
            {/* Tab 1: Beranda / Home */}
            {currentTab === 'home' && (
              isRecipePageActive ? (
                <div className="animate-in fade-in duration-150">
                  <RecipeMainPage
                    onBackToHome={() => {
                      setIsRecipePageActive(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    sellerWarungName={profile.businessName}
                    sellerOwnerName={profile.ownerName}
                    sellerPhone={profile.phone || ''}
                    sellerAddress={profile.address || ''}
                    isAuthenticated={Boolean(authUser)}
                    onRequireAuth={requireAuth}
                    recipes={recipes}
                    onCreateRecipe={handleCreateRecipe}
                    orders={recipeOrders}
                    onCreateOrder={handleCreateRecipeOrder}
                    onOrderDecision={handleAdminOrderDecision}
                  />
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* 3 Summary Cards */}
                  <SummaryCards
                    incomeToday={incomeToday}
                    expenseToday={expenseToday}
                    incomeCount={incomeCount}
                    expenseCount={expenseCount}
                    initialCash={profile.initialCash}
                  />

                  {/* 1 Kartu Tipis Berbagi Resep di bawah Pengeluaran Hari Ini */}
                  <RecipeFeatureCard
                    onClick={() =>
                      requireAuth(() => {
                        setIsRecipePageActive(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      })
                    }
                  />

                  {/* Tombol Besar (+) Tambah Transaksi */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white font-black text-base sm:text-lg shadow-lg shadow-teal-700/25 border border-teal-500/30 flex items-center justify-center gap-3 transition-all transform active:scale-98 cursor-pointer group"
                      aria-label="Tambah Transaksi Baru"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </div>
                      <span>(+) Tambah Transaksi Baru</span>
                    </button>
                  </div>

                  {/* Daftar Transaksi Hari Ini */}
                  <TodayTransactionsList
                    transactions={todayTransactions}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTransaction}
                    onAddNew={openAddModal}
                  />
                </div>
              )
            )}

            {/* Tab 2: Laporan / Laba Rugi Otomatis */}
            {currentTab === 'report' && (
              <div className="animate-in fade-in duration-150">
                <ReportPage
                  transactions={transactions}
                  businessName={profile.businessName}
                  ownerName={profile.ownerName}
                  isAuthenticated={Boolean(authUser)}
                  onRequireAuth={requireAuth}
                />
              </div>
            )}

            {/* Tab 3: Profil Warung & Pengaturan */}
            {currentTab === 'profile' && (
              <div className="animate-in fade-in duration-150">
                <ProfilePage
                  profile={profile}
                  onSaveProfile={handleSaveProfile}
                  user={authUser}
                  onLogin={() => openAuthModal()}
                  onLogout={handleLogout}
                  transactions={transactions}
                  onRestoreTransactions={handleRestoreTransactions}
                  isFirebaseConnected={isFirebaseConnected}
                  recipeOrders={recipeOrders}
                  onOrderDecision={handleAdminOrderDecision}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation (isolated from hidden admin panel) */}
      {!isAdminPanelOpen && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsRecipePageActive(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAddModal={openAddModal}
        />
      )}

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        initialData={editingTransaction}
      />

      {/* Auth Modal (Login, Daftar, Lupa Kata Sandi) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthGateMessage(null);
          pendingAuthActionRef.current = null;
        }}
        gateMessage={authGateMessage}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Hidden Admin Owner Password Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onVerified={handleAdminVerified}
        onDenied={handleAdminDenied}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold border animate-in slide-in-from-bottom-3 duration-200 ${
            toastVariant === 'error'
              ? 'bg-rose-900/95 border-rose-700'
              : 'bg-slate-900/90 border-slate-700'
          }`}
        >
          {toastVariant === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
