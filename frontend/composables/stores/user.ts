import { defineStore } from 'pinia';
import { WebStorageKeys } from '~/lib/values/general.values';

export const useUserStore = defineStore('user', {
  state: () => ({
    jwt: '',
    voters: [] as VoterInterface[],
  }),

  getters: {
    loggedIn(state) {
      return !!state.jwt;
    },
  },

  actions: {
    logout() {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(WebStorageKeys.USER);
      }

      $api.clearToken();
      this.$reset();
    },
  },

  persist: {
    key: WebStorageKeys.USER,
    storage: persistedState.localStorage,
    paths: ['jwt'],
  },
});
