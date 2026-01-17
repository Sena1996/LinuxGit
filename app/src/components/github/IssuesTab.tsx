import { useEffect, useState } from 'react';
import { useGitHubStore, Issue } from '@/stores/github';
import {
  CircleDot,
  RefreshCw,
  Plus,
  ExternalLink,
  Loader2,
  XCircle,
  MessageSquare,
  ChevronRight,
  X,
  Tag,
  Calendar,
  AlertCircle,
  CircleCheck,
  CircleX,
  User,
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

function IssueStatusBadge({ issue }: { issue: Issue }) {
  if (issue.state === 'closed') {
    if (issue.state_reason === 'completed') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-accent-secondary/20 text-accent-secondary">
          <CircleCheck className="w-3 h-3" />
          Completed
        </span>
      );
    }
    if (issue.state_reason === 'not_planned') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-text-muted/20 text-text-muted">
          <CircleX className="w-3 h-3" />
          Not Planned
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-status-deleted/20 text-status-deleted">
        <XCircle className="w-3 h-3" />
        Closed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-status-added/20 text-status-added">
      <CircleDot className="w-3 h-3" />
      Open
    </span>
  );
}

function IssueCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="glass-card p-4 hover:bg-white/5 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {issue.state === 'closed' ? (
            issue.state_reason === 'completed' ? (
              <CircleCheck className="w-5 h-5 text-accent-secondary" />
            ) : (
              <CircleX className="w-5 h-5 text-text-muted" />
            )
          ) : (
            <CircleDot className="w-5 h-5 text-status-added" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-text-primary truncate">{issue.title}</h4>
            <IssueStatusBadge issue={issue} />
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
            <span>#{issue.number}</span>
            <span>by {issue.user.login}</span>
            <span>{formatTimeAgo(issue.updated_at)}</span>
            {issue.comments > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {issue.comments}
              </span>
            )}
          </div>
          {issue.milestone && (
            <div className="flex items-center gap-1 mt-2 text-xs text-accent-primary">
              <Calendar className="w-3 h-3" />
              {issue.milestone.title}
            </div>
          )}
          {issue.labels.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {issue.labels.map((label) => (
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
          {issue.assignees.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {issue.assignees.slice(0, 3).map((assignee) => (
                <img
                  key={assignee.login}
                  src={assignee.avatar_url}
                  alt={assignee.login}
                  title={assignee.login}
                  className="w-5 h-5 rounded-full"
                />
              ))}
              {issue.assignees.length > 3 && (
                <span className="text-xs text-text-muted">+{issue.assignees.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
      </div>
    </div>
  );
}

function IssueDetailPanel({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const {
    issueComments,
    fetchIssueComments,
    closeIssue,
    addIssueComment,
    owner: _owner,
    repoName: _repoName,
  } = useGitHubStore();

  const [closing, setClosing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchIssueComments(issue.number);
  }, [issue.number, fetchIssueComments]);

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this issue?')) return;
    setClosing(true);
    try {
      await closeIssue(issue.number);
      onClose();
    } catch (error) {
      console.error('Failed to close:', error);
    } finally {
      setClosing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      await addIssueComment(issue.number, newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50 p-4">
      <div className="modal-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-text-primary">{issue.title}</h3>
              <IssueStatusBadge issue={issue} />
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-text-muted">
              <span>#{issue.number}</span>
              <span>opened by {issue.user.login}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={issue.html_url}
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
          {/* Author */}
          <div className="glass-card-subtle p-4">
            <div className="flex items-center gap-3">
              <img
                src={issue.user.avatar_url}
                alt={issue.user.login}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <span className="text-sm font-medium text-text-primary">{issue.user.login}</span>
                <span className="text-xs text-text-muted ml-2">
                  opened {formatTimeAgo(issue.created_at)}
                </span>
              </div>
            </div>
            {issue.body && (
              <pre className="whitespace-pre-wrap text-sm text-text-secondary mt-4 bg-deep p-3 rounded max-h-48 overflow-auto">
                {issue.body}
              </pre>
            )}
          </div>

          {/* Assignees */}
          {issue.assignees.length > 0 && (
            <div className="glass-card-subtle p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Assignees
              </h4>
              <div className="flex flex-wrap gap-2">
                {issue.assignees.map((assignee) => (
                  <div
                    key={assignee.login}
                    className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded"
                  >
                    <img
                      src={assignee.avatar_url}
                      alt={assignee.login}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-xs text-text-secondary">{assignee.login}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="glass-card-subtle p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Labels
              </h4>
              <div className="flex flex-wrap gap-2">
                {issue.labels.map((label) => (
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

          {/* Milestone */}
          {issue.milestone && (
            <div className="glass-card-subtle p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Milestone
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-primary">{issue.milestone.title}</span>
                {issue.milestone.due_on && (
                  <span className="text-xs text-text-muted">
                    Due: {new Date(issue.milestone.due_on).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {issueComments.length > 0 && (
            <div className="glass-card-subtle p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({issueComments.length})
              </h4>
              <div className="space-y-3 max-h-64 overflow-auto">
                {issueComments.map((comment) => (
                  <div key={comment.id} className="bg-deep p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.user.login}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-xs font-medium text-text-primary">
                        {comment.user.login}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-text-secondary">
                      {comment.body}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Comment */}
          {issue.state === 'open' && (
            <div className="glass-card-subtle p-4">
              <h4 className="text-sm font-medium text-text-secondary mb-3">Add Comment</h4>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={addingComment || !newComment.trim()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all disabled:opacity-50"
                >
                  {addingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Comment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {issue.state === 'open' && (
          <div className="p-4 border-t border-white/5 flex justify-end gap-2">
            <button
              onClick={handleClose}
              disabled={closing}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg text-text-secondary transition-colors"
            >
              {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Close Issue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateIssueModal({ onClose }: { onClose: () => void }) {
  const { createIssue, labels, milestones, fetchLabels, fetchMilestones } = useGitHubStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLabels();
    fetchMilestones();
  }, [fetchLabels, fetchMilestones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createIssue(
        title,
        body || undefined,
        selectedLabels.length > 0 ? selectedLabels : undefined,
        undefined,
        selectedMilestone || undefined
      );
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (labelName: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelName) ? prev.filter((l) => l !== labelName) : [...prev, labelName]
    );
  };

  return (
    <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50 p-4">
      <div className="modal-card w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-lg font-semibold text-text-primary">Create Issue</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
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
              placeholder="Issue title"
              className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe the issue..."
              rows={5}
              className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary resize-none"
            />
          </div>

          {labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Labels</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.name)}
                    className={`px-2 py-1 text-xs rounded-full transition-all ${
                      selectedLabels.includes(label.name)
                        ? 'ring-2 ring-white/50'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `#${label.color}30`,
                      color: `#${label.color}`,
                      border: `1px solid #${label.color}60`,
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {milestones.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Milestone
              </label>
              <select
                value={selectedMilestone || ''}
                onChange={(e) =>
                  setSelectedMilestone(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="">No milestone</option>
                {milestones
                  .filter((m) => m.state === 'open')
                  .map((milestone) => (
                    <option key={milestone.id} value={milestone.number}>
                      {milestone.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleDot className="w-4 h-4" />}
              Create Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function IssuesTab() {
  const {
    issues,
    selectedIssue,
    issuesLoading,
    issuesError,
    labels,
    fetchIssues,
    fetchLabels,
    setSelectedIssue,
  } = useGitHubStore();

  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchIssues(filter);
    fetchLabels();
  }, [fetchIssues, fetchLabels, filter]);

  const handleRefresh = () => {
    fetchIssues(filter);
  };

  const filteredIssues = labelFilter
    ? issues.filter((i) => i.labels.some((l) => l.name === labelFilter))
    : issues;

  if (issuesError) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-status-deleted" />
          <p className="text-lg font-medium">Failed to load Issues</p>
          <p className="text-sm mt-2">{issuesError}</p>
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
            <CircleDot className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Issues</h2>
            {issuesLoading && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={issuesLoading}
              className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${issuesLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Issue
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-2 mb-4">
        <div className="flex gap-2 flex-wrap">
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
          {labels.length > 0 && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={() => setLabelFilter(null)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  !labelFilter
                    ? 'bg-white/10 text-text-primary'
                    : 'text-text-muted hover:bg-white/5 hover:text-text-secondary'
                }`}
              >
                All labels
              </button>
              {labels.slice(0, 5).map((label) => (
                <button
                  key={label.id}
                  onClick={() => setLabelFilter(labelFilter === label.name ? null : label.name)}
                  className={`px-2 py-1 text-xs rounded-full transition-all ${
                    labelFilter === label.name ? 'ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `#${label.color}30`,
                    color: `#${label.color}`,
                    border: `1px solid #${label.color}60`,
                  }}
                >
                  {label.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 && !issuesLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          <div className="glass-card p-8 text-center">
            <CircleDot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No issues</p>
            <p className="text-sm mt-2">
              {filter === 'open' ? 'No open issues' : `No ${filter} issues found`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={() => setSelectedIssue(issue)} />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedIssue && (
        <IssueDetailPanel issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}

      {/* Create Modal */}
      {showCreateModal && <CreateIssueModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
