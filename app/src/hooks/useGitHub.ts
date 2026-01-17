import { invoke } from '@tauri-apps/api/core';
import { useState, useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper to safely extract error message
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

// Types matching the Rust backend
export interface GitHubAuthStatus {
  authenticated: boolean;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

// Zustand store for GitHub auth state
interface GitHubStore {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  setAuthenticated: (authenticated: boolean, user: GitHubUser | null) => void;
  logout: () => void;
}

export const useGitHubStore = create<GitHubStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setAuthenticated: (authenticated, user) => set({ isAuthenticated: authenticated, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'github-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

// Hook for GitHub authentication operations
export function useGitHubAuth() {
  const { setAuthenticated, logout: storeLogout } = useGitHubStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth status on mount
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await invoke<GitHubAuthStatus>('github_auth_status');
      if (status.authenticated && status.username) {
        // Fetch full user info
        try {
          const user = await invoke<GitHubUser>('github_get_user');
          setAuthenticated(true, user);
        } catch {
          // Token might be valid but we couldn't get user info
          setAuthenticated(true, null);
        }
      } else {
        setAuthenticated(false, null);
      }
      return status;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      setAuthenticated(false, null);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setAuthenticated]);

  // Login with GitHub
  const login = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await invoke<GitHubAuthStatus>('github_login');
      if (status.authenticated) {
        // Fetch full user info
        const user = await invoke<GitHubUser>('github_get_user');
        setAuthenticated(true, user);
      }
      return status;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setAuthenticated]);

  // Logout from GitHub
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await invoke('github_logout');
      storeLogout();
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [storeLogout]);

  // Get GitHub access token (for git operations)
  const getToken = useCallback(async () => {
    try {
      return await invoke<string>('github_get_token');
    } catch (e) {
      return null;
    }
  }, []);

  return {
    login,
    logout,
    checkAuthStatus,
    getToken,
    loading,
    error,
  };
}

// Hook for GitHub API operations
export function useGitHubAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's repositories
  const getRepos = useCallback(async (page = 1, perPage = 30) => {
    setLoading(true);
    setError(null);
    try {
      const repos = await invoke<GitHubRepo[]>('github_get_repos', { page, perPage });
      return repos;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current user profile
  const getUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await invoke<GitHubUser>('github_get_user');
      return user;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getRepos,
    getUser,
    loading,
    error,
  };
}

// Combined hook that checks auth on mount
export function useGitHub() {
  const auth = useGitHubAuth();
  const api = useGitHubAPI();
  const { isAuthenticated, user } = useGitHubStore();

  // Check auth status on mount
  useEffect(() => {
    auth.checkAuthStatus().catch(() => {
      // Silently fail - user is not authenticated
    });
  }, []);

  return {
    // Auth state
    isAuthenticated,
    user,
    // Auth operations
    login: auth.login,
    logout: auth.logout,
    checkAuthStatus: auth.checkAuthStatus,
    getToken: auth.getToken,
    // API operations
    getRepos: api.getRepos,
    getUser: api.getUser,
    // Loading states
    authLoading: auth.loading,
    apiLoading: api.loading,
    // Errors
    authError: auth.error,
    apiError: api.error,
  };
}
