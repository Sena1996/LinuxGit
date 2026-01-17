import { create } from 'zustand';
import type { PullRequest, PullRequestReview, PullRequestComment } from '@/domain/entities';
import { gitHubPullRequestApi } from '@/infrastructure/api';
import { useGitHubContextStore } from './context.store';

interface PullRequestsState {
  items: PullRequest[];
  selected: PullRequest | null;
  reviews: PullRequestReview[];
  comments: PullRequestComment[];
  loading: boolean;
  error: string | null;

  fetch: (state?: 'open' | 'closed' | 'all') => Promise<void>;
  fetchOne: (number: number) => Promise<void>;
  fetchReviews: (number: number) => Promise<void>;
  fetchComments: (number: number) => Promise<void>;
  create: (title: string, body: string, head: string, base: string, draft?: boolean) => Promise<PullRequest>;
  merge: (number: number, method?: 'merge' | 'squash' | 'rebase') => Promise<void>;
  close: (number: number) => Promise<void>;
  setSelected: (pr: PullRequest | null) => void;
  requestReviewers: (number: number, reviewers: string[]) => Promise<void>;
}

export const usePullRequestsStore = create<PullRequestsState>()((set, get) => ({
  items: [],
  selected: null,
  reviews: [],
  comments: [],
  loading: false,
  error: null,

  fetch: async (state = 'open') => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    set({ loading: true, error: null });
    try {
      const items = await gitHubPullRequestApi.list(owner, repoName, state);
      set({ items, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchOne: async (number) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const pr = await gitHubPullRequestApi.get(owner, repoName, number);
      set({ selected: pr });
    } catch (error) {
      console.error('Failed to fetch PR:', error);
    }
  },

  fetchReviews: async (number) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const reviews = await gitHubPullRequestApi.getReviews(owner, repoName, number);
      set({ reviews });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  },

  fetchComments: async (number) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const comments = await gitHubPullRequestApi.getComments(owner, repoName, number);
      set({ comments });
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  },

  create: async (title, body, head, base, draft = false) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) throw new Error('No repository context');

    const pr = await gitHubPullRequestApi.create(owner, repoName, {
      title,
      body,
      head,
      base,
      draft,
    });

    get().fetch();
    return pr;
  },

  merge: async (number, method = 'merge') => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubPullRequestApi.merge(owner, repoName, number, method);
    get().fetch();
  },

  close: async (number) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubPullRequestApi.update(owner, repoName, number, { state: 'closed' });
    get().fetch();
  },

  setSelected: (pr) =>
    set({ selected: pr, reviews: [], comments: [] }),

  requestReviewers: async (number, reviewers) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubPullRequestApi.requestReviewers(owner, repoName, number, reviewers);
    get().fetchOne(number);
  },
}));
