import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useGitHubStore, parseGitHubUrl, GitHubTab } from '@/stores/github';
import { useRepoStore, RemoteInfo } from '@/stores/repo';
import { PullRequestsTab } from '@/components/github/PullRequestsTab';
import { IssuesTab } from '@/components/github/IssuesTab';
import { ActionsTab } from '@/components/github/ActionsTab';
import { ReleasesTab } from '@/components/github/ReleasesTab';
import { PagesTab } from '@/components/github/PagesTab';
import { NotificationsTab } from '@/components/github/NotificationsTab';
import { InsightsTab } from '@/components/github/InsightsTab';
import { DevOpsTab } from '@/components/github/DevOpsTab';
import {
  GitPullRequest,
  CircleDot,
  Play,
  Package,
  Globe,
  Bell,
  BarChart3,
  Github,
  AlertCircle,
  Rocket,
} from 'lucide-react';

const tabs: { id: GitHubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'pull-requests', label: 'Pull Requests', icon: <GitPullRequest size={16} /> },
  { id: 'issues', label: 'Issues', icon: <CircleDot size={16} /> },
  { id: 'actions', label: 'Actions', icon: <Play size={16} /> },
  { id: 'devops', label: 'DevOps', icon: <Rocket size={16} /> },
  { id: 'releases', label: 'Releases', icon: <Package size={16} /> },
  { id: 'pages', label: 'Pages', icon: <Globe size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'insights', label: 'Insights', icon: <BarChart3 size={16} /> },
];

export function GitHubView() {
  const { repo, remotes, setRemotes } = useRepoStore();
  const {
    activeTab,
    setActiveTab,
    owner,
    repoName,
    setRepoContext,
    unreadCount,
    fetchUnreadCount,
  } = useGitHubStore();

  // Fetch remotes when repo is open
  useEffect(() => {
    if (repo) {
      invoke<RemoteInfo[]>('get_remotes')
        .then((fetchedRemotes) => {
          setRemotes(fetchedRemotes);
        })
        .catch((err) => {
          console.error('Failed to fetch remotes:', err);
        });
    }
  }, [repo, setRemotes]);

  // Extract owner/repo from remotes
  useEffect(() => {
    if (remotes && remotes.length > 0) {
      // Try to find origin or first remote with github.com
      const githubRemote = remotes.find(
        (r) => r.url.includes('github.com') && r.name === 'origin'
      ) || remotes.find((r) => r.url.includes('github.com'));

      if (githubRemote) {
        const parsed = parseGitHubUrl(githubRemote.url);
        if (parsed) {
          setRepoContext(parsed.owner, parsed.repo);
        }
      }
    }
  }, [remotes, setRepoContext]);

  // Fetch unread notification count periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Every minute
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  if (!repo) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <Github className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No repository open</p>
          <p className="text-sm mt-2">Open a repository to access GitHub features</p>
        </div>
      </div>
    );
  }

  if (!owner || !repoName) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Not a GitHub repository</p>
          <p className="text-sm mt-2">
            This repository doesn't have a GitHub remote configured
          </p>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'pull-requests':
        return <PullRequestsTab />;
      case 'issues':
        return <IssuesTab />;
      case 'actions':
        return <ActionsTab />;
      case 'devops':
        return <DevOpsTab />;
      case 'releases':
        return <ReleasesTab />;
      case 'pages':
        return <PagesTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'insights':
        return <InsightsTab />;
      default:
        return <PullRequestsTab />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with repo info */}
      <div className="p-3 border-b border-white/5">
        <div className="glass-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-accent-primary" />
            <span className="font-medium text-text-primary">{owner}</span>
            <span className="text-text-muted">/</span>
            <span className="font-semibold text-text-primary">{repoName}</span>
          </div>
          <a
            href={`https://github.com/${owner}/${repoName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-3 pb-3">
        <div className="glass-card p-1 flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center
                ${
                  activeTab === tab.id
                    ? 'bg-accent-primary text-void'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-status-deleted text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">{renderTab()}</div>
    </div>
  );
}
