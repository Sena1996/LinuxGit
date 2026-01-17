import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

export interface AsyncState {
  loading: boolean;
  error: string | null;
}

export const initialAsyncState: AsyncState = {
  loading: false,
  error: null,
};

export function createStore<T>(
  initializer: StateCreator<T>,
  persistName?: string
) {
  if (persistName) {
    return create<T>()(
      persist(initializer, {
        name: persistName,
        version: 1,
      } as PersistOptions<T>)
    );
  }
  return create<T>()(initializer);
}

export function createAsyncActions<T extends AsyncState>(
  set: (partial: Partial<T>) => void
) {
  return {
    setLoading: (loading: boolean) => set({ loading } as Partial<T>),
    setError: (error: string | null) => set({ error, loading: false } as Partial<T>),
    clearError: () => set({ error: null } as Partial<T>),
  };
}
