import { useEffect, useState } from 'react';
import { useGitHubStore, Release } from '@/stores/github';
import {
  Package,
  RefreshCw,
  Plus,
  Tag,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
  FileText,
  X,
} from 'lucide-react';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ReleaseCard({ release, onDelete }: { release: Release; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-start gap-3 p-4 hover:bg-white/5 cursor-pointer transition-colors"
      >
        <Tag className="w-5 h-5 text-accent mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary">
              {release.name || release.tag_name}
            </span>
            <span className="px-2 py-0.5 text-xs rounded bg-surface-lighter text-text-muted">
              {release.tag_name}
            </span>
            {release.draft && (
              <span className="px-2 py-0.5 text-xs rounded bg-warning/10 text-warning border border-warning/20">
                Draft
              </span>
            )}
            {release.prerelease && (
              <span className="px-2 py-0.5 text-xs rounded bg-info/10 text-info border border-info/20">
                Pre-release
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-text-muted">
            {release.author && (
              <div className="flex items-center gap-1">
                <img
                  src={release.author.avatar_url}
                  alt={release.author.login}
                  className="w-4 h-4 rounded-full"
                />
                <span>{release.author.login}</span>
              </div>
            )}
            <span>{release.published_at ? formatDate(release.published_at) : 'Not published'}</span>
            {release.assets.length > 0 && (
              <span>{release.assets.length} asset{release.assets.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
            title="Delete release"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <a
            href={release.html_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text-secondary transition-colors"
            title="View on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-lighter bg-deep p-4 space-y-4">
          {/* Release body */}
          {release.body && (
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-text-secondary bg-surface p-3 rounded">
                {release.body}
              </pre>
            </div>
          )}

          {/* Assets */}
          {release.assets.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2">Assets</h4>
              <div className="space-y-1">
                {release.assets.map((asset) => (
                  <a
                    key={asset.id}
                    href={asset.browser_download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded bg-surface hover:bg-surface-hover transition-colors"
                  >
                    <Download className="w-4 h-4 text-text-muted" />
                    <span className="flex-1 text-sm text-text-primary">{asset.name}</span>
                    <span className="text-xs text-text-muted">
                      {formatSize(asset.size)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {asset.download_count} downloads
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Source downloads */}
          <div className="flex gap-2">
            {release.zipball_url && (
              <a
                href={release.zipball_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-surface hover:bg-surface-lighter rounded transition-colors"
              >
                Source code (zip)
              </a>
            )}
            {release.tarball_url && (
              <a
                href={release.tarball_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-surface hover:bg-surface-lighter rounded transition-colors"
              >
                Source code (tar.gz)
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateReleaseModal({ onClose }: { onClose: () => void }) {
  const { createRelease, tags, fetchTags } = useGitHubStore();
  const [tagName, setTagName] = useState('');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [draft, setDraft] = useState(false);
  const [prerelease, setPrerelease] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createRelease(tagName, name || tagName, body, draft, prerelease);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50">
      <div className="modal-card w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-lg font-semibold text-text-primary">Create Release</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded text-danger text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tag
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="v1.0.0"
                className="flex-1 px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                list="existing-tags"
              />
              <datalist id="existing-tags">
                {tags.map((tag) => (
                  <option key={tag.name} value={tag.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Release name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Release name (optional)"
              className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe this release..."
              rows={5}
              className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={draft}
                onChange={(e) => setDraft(e.target.checked)}
                className="rounded border-surface-lighter"
              />
              Save as draft
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={prerelease}
                onChange={(e) => setPrerelease(e.target.checked)}
                className="rounded border-surface-lighter"
              />
              Pre-release
            </label>
          </div>

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
              className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReleasesTab() {
  const {
    releases,
    releasesLoading,
    releasesError,
    fetchReleases,
    deleteRelease,
  } = useGitHubStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleDelete = async (releaseId: number) => {
    if (confirm('Are you sure you want to delete this release?')) {
      try {
        await deleteRelease(releaseId);
      } catch (error) {
        console.error('Failed to delete release:', error);
      }
    }
  };

  if (releasesError) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-status-deleted" />
          <p className="text-lg font-medium">Failed to load Releases</p>
          <p className="text-sm mt-2">{releasesError}</p>
          <button
            onClick={fetchReleases}
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
            <Package className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Releases</h2>
            {releasesLoading && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchReleases}
              disabled={releasesLoading}
              className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${releasesLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Release
            </button>
          </div>
        </div>
      </div>

      {/* Releases list */}
      {releases.length === 0 && !releasesLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          <div className="glass-card p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No releases yet</p>
            <p className="text-sm mt-2">Create your first release to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all"
            >
              Create Release
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {releases.map((release) => (
            <ReleaseCard
              key={release.id}
              release={release}
              onDelete={() => handleDelete(release.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateReleaseModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
