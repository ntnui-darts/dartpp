import { acceptHMRUpdate, defineStore } from 'pinia';
import { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '@/supabase';
import { useUsersStore } from './users';

supabase.auth.onAuthStateChange(() => {
  useAuthStore().getSession();
});

export const useAuthStore = defineStore('user', {
  state: () => ({
    auth: undefined as AuthUser | undefined,
  }),

  actions: {
    async getSession() {
      const response = await supabase.auth.getSession();
      this.auth = response.data.session?.user;
    },
    async signUp(name: string, email: string, password: string) {
      await supabase.auth.signUp({ email, password });
      await this.setName(name);
      await useUsersStore().fetchUsers();
      await this.getSession();
    },
    async signIn(email: string, password: string) {
      await supabase.auth.signInWithPassword({ email, password });
      await useUsersStore().fetchUsers();
      await this.getSession();
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async setName(name: string) {
      if (!this.auth) throw Error();
      const prevName = await supabase
        .from('users')
        .select('name')
        .eq('id', this.auth.id);
      if (prevName.data?.length == 0) {
        await supabase.from('users').insert({ name });
      } else {
        await supabase.from('users').update({ name }).eq('id', this.auth.id);
        await useUsersStore().fetchUsers();
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
