import { useEffect, useState } from 'react';
import { useGitHubStore } from '@/stores/github';
import {
  Globe,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Rocket,
  Settings,
  Trash2,
  AlertCircle,
} from 'lucide-react';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBuildStatusIcon(status: string) {
  switch (status) {
    case 'built':
      return <CheckCircle className="w-4 h-4 text-success" />;
    case 'building':
      return <Loader2 className="w-4 h-4 text-warning animate-spin" />;
    case 'queued':
      return <Clock className="w-4 h-4 text-text-muted" />;
    case 'errored':
      return <XCircle className="w-4 h-4 text-danger" />;
    default:
      return <Clock className="w-4 h-4 text-text-muted" />;
  }
}

function EnablePagesWizard() {
  const { enablePages, pagesLoading, pagesError } = useGitHubStore();
  const [branch, setBranch] = useState('main');
  const [path, setPath] = useState('/');

  const handleEnable = async () => {
    await enablePages(branch, path);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="glass-card p-8 text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-primary/20 flex items-center justify-center">
          <Globe className="w-8 h-8 text-accent-primary" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Enable GitHub Pages
        </h2>
        <p className="text-text-muted">
          Host your website directly from your GitHub repository.
          Just select the source and you're ready to go.
        </p>
      </div>

      {pagesError && (
        <div className="mb-6 p-3 glass-card border-status-deleted/30 text-status-deleted text-sm">
          {pagesError}
        </div>
      )}

      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Source Branch
          </label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="main">main</option>
            <option value="master">master</option>
            <option value="gh-pages">gh-pages</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Source Path
          </label>
          <select
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="w-full px-3 py-2 bg-deep border border-surface-lighter rounded text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="/">/ (root)</option>
            <option value="/docs">/docs</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            onClick={handleEnable}
            disabled={pagesLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all disabled:opacity-50"
          >
            {pagesLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Enable GitHub Pages
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 glass-card p-4 text-center text-sm text-text-muted">
        <p>
          Your site will be published at:
          <span className="text-accent-primary ml-1">
            https://[username].github.io/[repo]/
          </span>
        </p>
      </div>
    </div>
  );
}

function PagesStatus() {
  const {
    pagesInfo,
    pagesBuilds,
    pagesLoading,
    fetchPagesInfo: _fetchPagesInfo,
    fetchPagesBuilds,
    disablePages,
    requestPagesBuild,
  } = useGitHubStore();

  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    fetchPagesBuilds();
  }, [fetchPagesBuilds]);

  const handleDisable = async () => {
    await disablePages();
    setShowDisableConfirm(false);
  };

  if (!pagesInfo) return null;

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                pagesInfo.status === 'built' ? 'bg-status-added' : 'bg-status-modified animate-pulse'
              }`} />
              <h3 className="text-lg font-semibold text-text-primary">
                {pagesInfo.status === 'built' ? 'Your site is live!' : 'Building...'}
              </h3>
            </div>
            {pagesInfo.html_url && (
              <a
                href={pagesInfo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-primary/80 flex items-center gap-1"
              >
                {pagesInfo.html_url}
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={requestPagesBuild}
              disabled={pagesLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${pagesLoading ? 'animate-spin' : ''}`} />
              Rebuild
            </button>
            <button
              onClick={() => setShowDisableConfirm(true)}
              className="p-1.5 rounded-lg hover:bg-status-deleted/10 text-text-muted hover:text-status-deleted transition-colors"
              title="Disable Pages"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </h4>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-text-muted">Source</dt>
              <dd className="text-text-primary font-medium">
                {pagesInfo.source?.branch || 'N/A'} / {pagesInfo.source?.path || '/'}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Build Type</dt>
              <dd className="text-text-primary font-medium">
                {pagesInfo.build_type || 'legacy'}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">HTTPS</dt>
              <dd className="text-text-primary font-medium">
                {pagesInfo.https_enforced ? 'Enforced' : 'Optional'}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Custom Domain</dt>
              <dd className="text-text-primary font-medium">
                {pagesInfo.cname || 'None'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Build history */}
      {pagesBuilds.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="text-sm font-medium text-text-secondary mb-4">
            Recent Builds
          </h4>
          <div className="space-y-2">
            {pagesBuilds.slice(0, 10).map((build, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-deep rounded"
              >
                {getBuildStatusIcon(build.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary capitalize">
                      {build.status}
                    </span>
                    <span className="text-xs text-text-muted">
                      {build.commit.substring(0, 7)}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatDate(build.created_at)}
                    {build.duration > 0 && ` - ${build.duration}s`}
                  </div>
                </div>
                {build.pusher && (
                  <div className="flex items-center gap-1">
                    <img
                      src={build.pusher.avatar_url}
                      alt={build.pusher.login}
                      className="w-5 h-5 rounded-full"
                    />
                  </div>
                )}
                {build.error?.message && (
                  <span className="text-xs text-danger">{build.error.message}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disable confirmation modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50">
          <div className="modal-card p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-status-deleted" />
              <h3 className="text-lg font-semibold text-text-primary">
                Disable GitHub Pages?
              </h3>
            </div>
            <p className="text-sm text-text-muted mb-6">
              Your site will be unpublished and the URL will no longer work.
              You can enable it again at any time.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDisableConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable}
                className="px-4 py-2 text-sm bg-status-deleted text-white rounded-lg hover:bg-status-deleted/80 transition-colors"
              >
                Disable Pages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PagesTab() {
  const { pagesInfo, pagesLoading, pagesError: _pagesError, fetchPagesInfo } = useGitHubStore();

  useEffect(() => {
    fetchPagesInfo();
  }, [fetchPagesInfo]);

  if (pagesLoading && !pagesInfo) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      {pagesInfo ? <PagesStatus /> : <EnablePagesWizard />}
    </div>
  );
}
