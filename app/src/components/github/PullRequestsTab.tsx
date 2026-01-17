import { useEffect, useState } from 'react';
import { useGitHubStore, PullRequest } from '@/stores/github';
import {
  GitPullRequest,
  RefreshCw,
  Plus,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  GitMerge,
  GitBranch,
  ChevronRight,
  X,
  Users,
  FileCode,
  AlertCircle,
} from 'lucide-react';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getReviewIcon(state: string) {
  switch (state) {
    case 'APPROVED':
      return <CheckCircle className="w-4 h-4 text-status-added" />;
    case 'CHANGES_REQUESTED':
      return <XCircle className="w-4 h-4 text-status-deleted" />;
    case 'COMMENTED':
      return <MessageSquare className="w-4 h-4 text-text-muted" />;
    default:
      return <Clock className="w-4 h-4 text-text-muted" />;
  }
}

function PRStatusBadge({ pr }: { pr: PullRequest }) {
  if (pr.merged) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-accent-secondary/20 text-accent-secondary">
        <GitMerge className="w-3 h-3" />
        Merged
      </span>
    );
  }
  if (pr.state === 'closed') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-status-deleted/20 text-status-deleted">
        <XCircle className="w-3 h-3" />
        Closed
      </span>
    );
  }
  if (pr.draft) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-text-muted/20 text-text-muted">
        <GitPullRequest className="w-3 h-3" />
        Draft
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-status-added/20 text-status-added">
      <GitPullRequest className="w-3 h-3" />
      Open
    </span>
  );
}

function PRCard({ pr, onClick }: { pr: PullRequest; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="glass-card p-4 hover:bg-white/5 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {pr.merged ? (
            <GitMerge className="w-5 h-5 text-accent-secondary" />
          ) : pr.state === 'closed' ? (
            <GitPullRequest className="w-5 h-5 text-status-deleted" />
          ) : (
            <GitPullRequest className="w-5 h-5 text-status-added" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-text-primary truncate">{pr.title}</h4>
            <PRStatusBadge pr={pr} />
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {pr.head.ref} &rarr; {pr.base.ref}
            </span>
            <span>#{pr.number}</span>
            <span>by {pr.user.login}</span>
            <span>{formatTimeAgo(pr.updated_at)}</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
            {pr.comments > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {pr.comments}
              </span>
            )}
            {pr.review_comments > 0 && (
              <span className="flex items-center gap-1">
                <FileCode className="w-3 h-3" />
                {pr.review_comments} review
              </span>
            )}
            {pr.requested_reviewers.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {pr.requested_reviewers.length} reviewers
              </span>
            )}
          </div>
          {pr.labels.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {pr.labels.map((label) => (
                <span
                  key={label.id}
                  className="px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: `#${label.color}20`,
                    color: `#${label.color}`,
                    border: `1px solid #${label.color}40`,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
      </div>
    </div>
  );
}

function PRDetailPanel({ pr, onClose }: { pr: PullRequest; onClose: () => void }) {
  const {
    prReviews,
    prComments: _prComments,
    fetchPRReviews,
    fetchPRComments,
    mergePullRequest,
    closePullRequest,
    owner: _owner,
    repoName: _repoName,
  } = useGitHubStore();

  const [merging, setMerging] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchPRReviews(pr.number);
    fetchPRComments(pr.number);
  }, [pr.number, fetchPRReviews, fetchPRComments]);

  const handleMerge = async () => {
    if (!confirm('Are you sure you want to merge this pull request?')) return;
    setMerging(true);
    try {
      await mergePullRequest(pr.number, 'merge');
      onClose();
    } catch (error) {
      console.error('Failed to merge:', error);
    } finally {
      setMerging(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this pull request?')) return;
    setClosing(true);
    try {
      await closePullRequest(pr.number);
      onClose();
    } catch (error) {
      console.error('Failed to close:', error);
    } finally {
      setClosing(false);
    }
  };

  // Review counts - computed on demand when needed
  // const approvedReviews = prReviews.filter((r) => r.state === 'APPROVED');
  // const changesRequested = prReviews.filter((r) => r.state === 'CHANGES_REQUESTED');

  return (
    <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50 p-4">
      <div className="modal-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-text-primary">{pr.title}</h3>
              <PRStatusBadge pr={pr} />
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                {pr.head.ref} &rarr; {pr.base.ref}
              </span>
              <span>#{pr.number}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pr.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/10 text-text-muted"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-status-added">+{pr.additions}</div>
              <div className="text-xs text-text-muted">Additions</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-status-deleted">-{pr.deletions}</div>
              <div className="text-xs text-text-muted">Deletions</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-text-primary">{pr.changed_files}</div>
              <div className="text-xs text-text-muted">Files</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-text-primary">{pr.commits}</div>
              <div className="text-xs text-text-muted">Commits</div>
            </div>
          </div>

          {/* Author & Reviewers */}
          <div className="glass-card-subtle p-4">
            <h4 className="text-sm font-medium text-text-secondary mb-3">Author</h4>
            <div className="flex items-center gap-2">
              <img
                src={pr.user.avatar_url}
                alt={pr.user.login}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-text-primary">{pr.user.login}</span>
              <span className="text-xs text-text-muted">{formatTimeAgo(pr.created_at)}</span>
            </div>

            {pr.requested_reviewers.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-text-secondary mt-4 mb-3">
                  Requested Reviewers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {pr.requested_reviewers.map((reviewer) => (
                    <div
                      key={reviewer.login}
                      className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded"
                    >
                      <img
                        src={reviewer.avatar_url}
                        alt={reviewer.login}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-xs text-text-secondary">{reviewer.login}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Reviews */}
          {prReviews.length > 0 && (
            <div className="glass-card-subtle p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3">Reviews</h4>
              <div className="space-y-2">
                {prReviews.map((review) => (
                  <div key={review.id} className="flex items-center gap-3 p-2 bg-white/5 rounded">
                    {getReviewIcon(review.state)}
                    <img
                      src={review.user.avatar_url}
                      alt={review.user.login}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-text-primary">{review.user.login}</span>
                    <span className="text-xs text-text-muted capitalize">
                      {review.state.toLowerCase().replace('_', ' ')}
                    </span>
                    <span className="text-xs text-text-muted ml-auto">
                      {formatTimeAgo(review.submitted_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          {pr.body && (
            <div className="glass-card-subtle p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3">Description</h4>
              <pre className="whitespace-pre-wrap text-sm text-text-secondary bg-deep p-3 rounded max-h-48 overflow-auto">
                {pr.body}
              </pre>
            </div>
          )}

          {/* Labels */}
          {pr.labels.length > 0 && (
            <div className="glass-card-subtle p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3">Labels</h4>
              <div className="flex flex-wrap gap-2">
                {pr.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-1 text-xs rounded-full"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      border: `1px solid #${label.color}40`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {pr.state === 'open' && !pr.merged && (
          <div className="p-4 border-t border-white/5 flex justify-end gap-2">
            <button
              onClick={handleClose}
              disabled={closing}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
            >
              {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Close PR
            </button>
            <button
              onClick={handleMerge}
              disabled={merging}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-status-added text-void rounded-lg hover:bg-status-added/90 transition-colors"
            >
              {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
              Merge PR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreatePRModal({ onClose }: { onClose: () => void }) {
  const { createPullRequest, owner: _owner, repoName: _repoName } = useGitHubStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [head, setHead] = useState('');
  const [base, setBase] = useState('main');
  const [draft, setDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !head.trim()) {
      setError('Title and head branch are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createPullRequest(title, body, head, base, draft);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50 p-4">
      <div className="modal-card w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-lg font-semibold text-text-primary">Create Pull Request</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-status-deleted/10 border border-status-deleted/20 rounded text-status-deleted text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pull request title"
              className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Head Branch
              </label>
              <input
                type="text"
                value={head}
                onChange={(e) => setHead(e.target.value)}
                placeholder="feature-branch"
                className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Base Branch
              </label>
              <input
                type="text"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your changes..."
              rows={5}
              className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
              className="rounded border-surface-lighter"
            />
            Create as draft
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitPullRequest className="w-4 h-4" />}
              Create PR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PullRequestsTab() {
  const {
    pullRequests,
    selectedPR,
    prLoading,
    prError,
    fetchPullRequests,
    setSelectedPR,
  } = useGitHubStore();

  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPullRequests(filter);
  }, [fetchPullRequests, filter]);

  const handleRefresh = () => {
    fetchPullRequests(filter);
  };

  if (prError) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-status-deleted" />
          <p className="text-lg font-medium">Failed to load Pull Requests</p>
          <p className="text-sm mt-2">{prError}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      {/* Header */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitPullRequest className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Pull Requests</h2>
            {prLoading && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={prLoading}
              className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${prLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New PR
            </button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-2 mb-4">
        <div className="flex gap-2">
          {(['open', 'closed', 'all'] as const).map((state) => (
            <button
              key={state}
              onClick={() => setFilter(state)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                filter === state
                  ? 'bg-accent-primary text-void'
                  : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* PR List */}
      {pullRequests.length === 0 && !prLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          <div className="glass-card p-8 text-center">
            <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No pull requests</p>
            <p className="text-sm mt-2">
              {filter === 'open' ? 'No open pull requests' : `No ${filter} pull requests found`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {pullRequests.map((pr) => (
            <PRCard key={pr.id} pr={pr} onClick={() => setSelectedPR(pr)} />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedPR && <PRDetailPanel pr={selectedPR} onClose={() => setSelectedPR(null)} />}

      {/* Create Modal */}
      {showCreateModal && <CreatePRModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
