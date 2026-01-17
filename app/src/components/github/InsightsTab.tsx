import { useEffect } from 'react';
import { useGitHubStore } from '@/stores/github';
import {
  BarChart3,
  RefreshCw,
  Users,
  Eye,
  Download,
  Loader2,
  TrendingUp,
  Code,
  ExternalLink,
} from 'lucide-react';

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function LanguageBar({ languages }: { languages: Record<string, number> }) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const colors: Record<string, string> = {
    TypeScript: 'bg-blue-500',
    JavaScript: 'bg-yellow-400',
    Rust: 'bg-orange-500',
    Python: 'bg-green-500',
    Go: 'bg-cyan-400',
    Java: 'bg-red-500',
    'C++': 'bg-pink-500',
    C: 'bg-gray-500',
    Ruby: 'bg-red-400',
    PHP: 'bg-purple-500',
    Swift: 'bg-orange-400',
    Kotlin: 'bg-purple-400',
    Scala: 'bg-red-600',
    Shell: 'bg-green-600',
    HTML: 'bg-orange-600',
    CSS: 'bg-blue-400',
  };

  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a);

  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-2 mb-3">
        {sorted.map(([lang, bytes]) => (
          <div
            key={lang}
            className={colors[lang] || 'bg-gray-400'}
            style={{ width: `${(bytes / total) * 100}%` }}
            title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {sorted.slice(0, 6).map(([lang, bytes]) => (
          <div key={lang} className="flex items-center gap-2 text-sm">
            <span
              className={`w-3 h-3 rounded-full ${colors[lang] || 'bg-gray-400'}`}
            />
            <span className="text-text-secondary">{lang}</span>
            <span className="text-text-muted">
              {((bytes / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContributorsList() {
  const { contributors, insightsLoading, insightsError } = useGitHubStore();
  const isComputing = insightsError?.includes('being computed');

  if ((insightsLoading || isComputing) && contributors.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
        <span className="text-sm text-text-muted">
          {isComputing ? 'GitHub is computing statistics... will auto-refresh' : 'Loading...'}
        </span>
      </div>
    );
  }

  if (contributors.length === 0) {
    return <p className="text-text-muted text-sm">No contributors data available</p>;
  }

  const sortedContributors = [...contributors]
    .filter((c) => c.author)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const maxCommits = Math.max(...sortedContributors.map((c) => c.total));

  return (
    <div className="space-y-3">
      {sortedContributors.map((contributor) => (
        <div key={contributor.author?.id} className="flex items-center gap-3">
          <a
            href={contributor.author?.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <img
              src={contributor.author?.avatar_url}
              alt={contributor.author?.login}
              className="w-8 h-8 rounded-full"
            />
          </a>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <a
                href={contributor.author?.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-text-primary hover:text-accent truncate"
              >
                {contributor.author?.login}
              </a>
              <span className="text-xs text-text-muted shrink-0 ml-2">
                {contributor.total} commits
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-lighter overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${(contributor.total / maxCommits) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommitActivityChart() {
  const { commitActivity, insightsLoading, insightsError } = useGitHubStore();
  const isComputing = insightsError?.includes('being computed');

  if (commitActivity.length === 0) {
    if (insightsLoading || isComputing) {
      return (
        <div className="flex items-center justify-center py-8 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
          <span className="text-sm text-text-muted">Loading activity data...</span>
        </div>
      );
    }
    return <p className="text-text-muted text-sm">No activity data available</p>;
  }

  const maxTotal = Math.max(...commitActivity.map((w) => w.total));
  const recentWeeks = commitActivity.slice(-12);

  return (
    <div className="h-32 flex items-end gap-1">
      {recentWeeks.map((week, index) => (
        <div
          key={index}
          className="flex-1 bg-accent/20 rounded-t hover:bg-accent/40 transition-colors cursor-pointer"
          style={{
            height: maxTotal > 0 ? `${(week.total / maxTotal) * 100}%` : '0%',
            minHeight: week.total > 0 ? '4px' : '0',
          }}
          title={`Week of ${new Date(week.week * 1000).toLocaleDateString()}: ${week.total} commits`}
        />
      ))}
    </div>
  );
}

function TrafficStats() {
  const { trafficViews, trafficClones } = useGitHubStore();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-accent-primary" />
          <span className="text-sm text-text-muted">Views (14 days)</span>
        </div>
        <div className="text-2xl font-semibold text-text-primary">
          {trafficViews ? formatNumber(trafficViews.count) : '-'}
        </div>
        <div className="text-xs text-text-muted">
          {trafficViews ? `${trafficViews.uniques} unique visitors` : 'Loading...'}
        </div>
      </div>
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-accent-secondary" />
          <span className="text-sm text-text-muted">Clones (14 days)</span>
        </div>
        <div className="text-2xl font-semibold text-text-primary">
          {trafficClones ? formatNumber(trafficClones.count) : '-'}
        </div>
        <div className="text-xs text-text-muted">
          {trafficClones ? `${trafficClones.uniques} unique cloners` : 'Loading...'}
        </div>
      </div>
    </div>
  );
}

export function InsightsTab() {
  const {
    languages,
    insightsLoading,
    insightsError,
    fetchContributors,
    fetchCommitActivity,
    fetchTrafficViews,
    fetchTrafficClones,
    fetchLanguages,
    owner,
    repoName,
  } = useGitHubStore();

  useEffect(() => {
    fetchContributors();
    fetchCommitActivity();
    fetchTrafficViews();
    fetchTrafficClones();
    fetchLanguages();
  }, [
    fetchContributors,
    fetchCommitActivity,
    fetchTrafficViews,
    fetchTrafficClones,
    fetchLanguages,
  ]);

  const handleRefresh = () => {
    fetchContributors();
    fetchCommitActivity();
    fetchTrafficViews();
    fetchTrafficClones();
    fetchLanguages();
  };

  // Check if error is about stats being computed (GitHub 202 response)
  const isComputing = insightsError?.includes('being computed');

  if (insightsError && !isComputing) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-status-deleted" />
          <p className="text-lg font-medium">Failed to load Insights</p>
          <p className="text-sm mt-2">{insightsError}</p>
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
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Repository Insights</h2>
            {(insightsLoading || isComputing) && (
              <div className="flex items-center gap-2 px-2 py-1 bg-accent-primary/10 rounded-lg">
                <Loader2 className="w-3 h-3 animate-spin text-accent-primary" />
                <span className="text-xs text-accent-primary">
                  {isComputing ? 'Computing stats...' : 'Loading...'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://github.com/${owner}/${repoName}/pulse`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              View on GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={handleRefresh}
              disabled={insightsLoading}
              className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${insightsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Traffic */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-primary" />
          <h3 className="font-medium text-text-primary">Traffic</h3>
        </div>
        <TrafficStats />
      </div>

      {/* Languages */}
      {Object.keys(languages).length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-accent-primary" />
            <h3 className="font-medium text-text-primary">Languages</h3>
          </div>
          <LanguageBar languages={languages} />
        </div>
      )}

      {/* Commit Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-accent-primary" />
          <h3 className="font-medium text-text-primary">Commit Activity</h3>
          <span className="text-xs text-text-muted">(Last 12 weeks)</span>
        </div>
        <CommitActivityChart />
      </div>

      {/* Contributors */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-accent-primary" />
          <h3 className="font-medium text-text-primary">Top Contributors</h3>
        </div>
        <ContributorsList />
      </div>
    </div>
  );
}
