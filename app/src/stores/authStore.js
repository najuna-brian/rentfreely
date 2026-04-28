import { create } from 'zustand';
import { APP_ROLES, FORM_TYPES } from '../config/constants';
import * as formulusService from '../services/formulusService';

const useAuthStore = create((set, get) => ({
  // State
  user: null,           // { username, role } from Formulus/Synkronus
  profile: null,        // user_profile observation data
  isAuthenticated: false,
  isLoading: true,
  activeRole: APP_ROLES.TENANT, // which role view is active

  // Actions
  initialize: async () => {
    try {
      const user = await formulusService.getCurrentUser();
      if (user && user.username) {
        const profile = await formulusService.getUserProfile(user.username);
        set({
          user,
          profile: profile?.data || null,
          isAuthenticated: true,
          isLoading: false,
          activeRole: profile?.data?.app_roles?.[0] || APP_ROLES.TENANT,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Auth init error:', err);
      set({ isLoading: false });
    }
  },

  setActiveRole: (role) => set({ activeRole: role }),

  updateProfile: async (profileData) => {
    const { user, profile } = get();
    if (!user) return;

    const data = {
      ...profileData,
      synkronus_username: user.username,
    };

    if (profile) {
      // Find existing profile observation to update
      const profiles = await formulusService.getObservations(FORM_TYPES.USER_PROFILE);
      const existing = profiles.find((p) => p.data?.synkronus_username === user.username);
      if (existing) {
        await formulusService.updateObservation(
          existing.observation_id,
          FORM_TYPES.USER_PROFILE,
          data
        );
      }
    } else {
      await formulusService.submitObservation(FORM_TYPES.USER_PROFILE, data);
    }

    set({ profile: data });
  },

  logout: () => {
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      activeRole: APP_ROLES.TENANT,
    });
  },
}));

export default useAuthStore;
