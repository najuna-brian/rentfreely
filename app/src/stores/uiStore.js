import { create } from 'zustand';

const useUiStore = create((set) => ({
  // Bottom sheet
  bottomSheetOpen: false,
  bottomSheetContent: null,
  openBottomSheet: (content) => set({ bottomSheetOpen: true, bottomSheetContent: content }),
  closeBottomSheet: () => set({ bottomSheetOpen: false, bottomSheetContent: null }),

  // Offline status
  isOffline: !navigator.onLine,
  setOffline: (offline) => set({ isOffline: offline }),

  // Loading overlay
  globalLoading: false,
  loadingMessage: '',
  showLoading: (msg = 'Loading...') => set({ globalLoading: true, loadingMessage: msg }),
  hideLoading: () => set({ globalLoading: false, loadingMessage: '' }),

  // Toast notifications
  toast: null,
  showToast: (message, type = 'info', duration = 3000) => {
    set({ toast: { message, type, id: Date.now() } });
    setTimeout(() => set({ toast: null }), duration);
  },
}));

export default useUiStore;
