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
import { DEFAULT_PROFILE } from './utils/initialData';
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
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_TX_KEY = 'cuanumkm_transactions_v1';
const LOCAL_STORAGE_PROFILE_KEY = 'cuanumkm_profile_v1';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [manualUser, setManualUser] = useState<AuthUser | null>(() => getSavedManualSession());
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isRecipePageActive, setIsRecipePageActive] = useState<boolean>(false);

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
    setToastVariant(variant);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // 1. Initial Load: Load profile & transactions from LocalStorage (clean start for new users)
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile) as UserProfile;
        const isLegacyDemoProfile =
          parsedProfile.businessName === 'Warung Berkah UMKM' &&
          parsedProfile.ownerName === 'Bu Siti Rahayu' &&
          parsedProfile.phone === '0812-3456-7890' &&
          parsedProfile.initialCash === 500000;
        if (isLegacyDemoProfile) {
          localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
          setProfile(DEFAULT_PROFILE);
        } else {
          setProfile(parsedProfile);
        }
      }

      const savedTx = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
      if (savedTx) {
        const parsedTx = JSON.parse(savedTx);
        if (Array.isArray(parsedTx)) {
          const cleanedTx = parsedTx.filter(
            (tx: Transaction) => tx && typeof tx.id === 'string' && !tx.id.startsWith('tx_init_')
          );
          if (cleanedTx.length !== parsedTx.length) {
            localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(cleanedTx));
          }
          setTransactions(cleanedTx);
        } else {
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.error('Failed to load local data', e);
    }
  }, []);

  // 2. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsFirebaseConnected(true);

        // Fetch cloud user profile if exists
        try {
          const cloudProfile = await fetchUserProfile(user.uid);
          if (cloudProfile) {
            setProfile(cloudProfile);
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(cloudProfile));
          } else {
            // First time login: initialize user profile in Firestore
            const newProfile: UserProfile = {
              ...profile,
              userId: user.uid,
              ownerName: user.displayName || profile.ownerName,
            };
            await saveUserProfile(newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('Error syncing profile with Firestore:', err);
        }

        // Subscribe to user transactions in Firestore
        const unsubscribeTx = subscribeToTransactions(
          user.uid,
          (cloudTransactions) => {
            if (cloudTransactions && cloudTransactions.length > 0) {
              setTransactions(cloudTransactions);
              localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(cloudTransactions));
            } else if (transactions.length > 0) {
              // Upload any real local transactions created before sign-in
              transactions.forEach((tx) => {
                saveTransaction({
                  ...tx,
                  userId: user.uid,
                }).catch(console.error);
              });
            }
          },
          (err) => {
            console.warn('Realtime listener error, fallback to local', err);
          }
        );

        return () => {
          unsubscribeTx();
        };
      } else {
        setCurrentUser(null);
        setIsFirebaseConnected(false);
      }
    });

    return () => unsubscribeAuth();
  }, [profile.businessName, profile.ownerName]);

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
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
        if (auth.currentUser) {
          saveUserProfile(updatedProfile).catch(console.error);
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

    const newTx: Transaction = {
      ...txData,
      id: txId,
      userId,
      createdAt: txData.id
        ? transactions.find((t) => t.id === txData.id)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local state immediately for snappy UX
    setTransactions((prev) => {
      const exists = prev.some((t) => t.id === txId);
      const updated = exists ? prev.map((t) => (t.id === txId ? newTx : t)) : [newTx, ...prev];
      localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(updated));
      return updated;
    });

    // If Firebase user is connected, persist to Firestore
    if (currentUser) {
      await saveTransaction({
        ...newTx,
        userId: currentUser.uid,
      });
    }

    showToast(
      txData.id
        ? 'Transaksi berhasil diperbarui!'
        : `${txData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil dicatat!`
    );
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(updated));
      return updated;
    });

    if (currentUser) {
      await removeTransaction(id);
    }

    showToast('Catatan transaksi telah dihapus');
  };

  // Save User Profile
  const handleSaveProfile = async (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));

    if (currentUser) {
      await saveUserProfile({
        ...updated,
        userId: currentUser.uid,
      });
    }
    showToast('Profil usaha berhasil disimpan');
  };

  // Restore Transactions
  const handleRestoreTransactions = (imported: Transaction[]) => {
    setTransactions(imported);
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(imported));
    if (currentUser) {
      imported.forEach((tx) => {
        saveTransaction({
          ...tx,
          userId: currentUser.uid,
        }).catch(console.error);
      });
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
