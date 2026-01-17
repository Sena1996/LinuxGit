import { create } from 'zustand';
import type { Issue, IssueComment, Label, Milestone } from '@/domain/entities';
import { gitHubIssueApi } from '@/infrastructure/api';
import { useGitHubContextStore } from './context.store';

interface IssuesState {
  items: Issue[];
  selected: Issue | null;
  comments: IssueComment[];
  labels: Label[];
  milestones: Milestone[];
  loading: boolean;
  error: string | null;

  fetch: (state?: 'open' | 'closed' | 'all') => Promise<void>;
  fetchOne: (number: number) => Promise<void>;
  fetchComments: (number: number) => Promise<void>;
  fetchLabels: () => Promise<void>;
  fetchMilestones: () => Promise<void>;
  create: (title: string, body?: string, labels?: string[], assignees?: string[], milestone?: number) => Promise<Issue>;
  update: (number: number, updates: { title?: string; body?: string; state?: 'open' | 'closed'; labels?: string[] }) => Promise<void>;
  close: (number: number) => Promise<void>;
  addComment: (number: number, body: string) => Promise<void>;
  setSelected: (issue: Issue | null) => void;
}

export const useIssuesStore = create<IssuesState>()((set, get) => ({
  items: [],
  selected: null,
  comments: [],
  labels: [],
  milestones: [],
  loading: false,
  error: null,

  fetch: async (state = 'open') => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    set({ loading: true, error: null });
    try {
      const items = await gitHubIssueApi.list(owner, repoName, state);
      set({ items, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchOne: async (number) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const issue = await gitHubIssueApi.get(owner, repoName, number);
      set({ selected: issue });
    } catch (error) {
      console.error('Failed to fetch issue:', error);
    }
  },

  fetchComments: async (number) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const comments = await gitHubIssueApi.getComments(owner, repoName, number);
      set({ comments });
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  },

  fetchLabels: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const labels = await gitHubIssueApi.getLabels(owner, repoName);
      set({ labels });
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    }
  },

  fetchMilestones: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const milestones = await gitHubIssueApi.getMilestones(owner, repoName);
      set({ milestones });
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    }
  },

  create: async (title, body, labels, assignees, milestone) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) throw new Error('No repository context');

    const issue = await gitHubIssueApi.create(owner, repoName, {
      title,
      body,
      labels,
      assignees,
      milestone,
    });

    get().fetch();
    return issue;
  },

  update: async (number, updates) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubIssueApi.update(owner, repoName, number, updates);
    get().fetch();
    get().fetchOne(number);
  },

  close: async (number) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubIssueApi.update(owner, repoName, number, { state: 'closed' });
    get().fetch();
  },

  addComment: async (number, body) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubIssueApi.addComment(owner, repoName, number, body);
    get().fetchComments(number);
  },

  setSelected: (issue) =>
    set({ selected: issue, comments: [] }),
}));
