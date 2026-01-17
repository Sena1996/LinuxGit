import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useGitHubStore } from '@/stores/github';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Bug,
  Key,
  ExternalLink,
  RefreshCw,
  Lock,
  ChevronRight,
  Info,
  XCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface DependabotAlert {
  number: number;
  state: 'open' | 'dismissed' | 'fixed';
  dependency: {
    package: {
      name: string;
      ecosystem: string;
    };
    manifest_path: string;
  };
  security_advisory: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    description: string;
    cve_id: string | null;
  };
  security_vulnerability: {
    vulnerable_version_range: string;
    first_patched_version: { identifier: string } | null;
  };
  created_at: string;
  html_url: string;
}

interface CodeScanningAlert {
  number: number;
  state: 'open' | 'dismissed' | 'fixed';
  rule: {
    id: string;
    severity: 'none' | 'note' | 'warning' | 'error';
    description: string;
    security_severity_level: 'low' | 'medium' | 'high' | 'critical' | null;
  };
  tool: {
    name: string;
    version: string | null;
  };
  most_recent_instance: {
    location: {
      path: string;
      start_line: number;
    };
    message: { text: string };
  };
  created_at: string;
  html_url: string;
}

interface SecretScanningAlert {
  number: number;
  state: 'open' | 'resolved';
  secret_type: string;
  secret_type_display_name: string;
  locations_url: string;
  created_at: string;
  html_url: string;
}

interface SecurityStats {
  dependabot: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  codeScanning: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  secretScanning: {
    total: number;
  };
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-500 bg-red-500/10',
  high: 'text-orange-500 bg-orange-500/10',
  medium: 'text-yellow-500 bg-yellow-500/10',
  low: 'text-blue-500 bg-blue-500/10',
  note: 'text-gray-500 bg-gray-500/10',
  warning: 'text-yellow-500 bg-yellow-500/10',
  error: 'text-red-500 bg-red-500/10',
};

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  critical: <XCircle size={14} className="text-red-500" />,
  high: <AlertTriangle size={14} className="text-orange-500" />,
  medium: <AlertCircle size={14} className="text-yellow-500" />,
  low: <Info size={14} className="text-blue-500" />,
};

export function SecurityCenter() {
  const { owner, repoName } = useGitHubStore();
  const [loading, setLoading] = useState(false);

  const [dependabotAlerts, setDependabotAlerts] = useState<DependabotAlert[]>([]);
  const [codeScanningAlerts, setCodeScanningAlerts] = useState<CodeScanningAlert[]>([]);
  const [secretScanningAlerts, setSecretScanningAlerts] = useState<SecretScanningAlert[]>([]);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'dependabot' | 'code' | 'secrets'>('overview');

  const fetchSecurityData = async () => {
    if (!owner || !repoName) return;

    setLoading(true);

    try {
      // Try to fetch all security data, but handle errors gracefully
      // These endpoints may require specific permissions or GitHub Advanced Security
      const [dependabotResult, codeScanningResult, secretScanningResult] = await Promise.allSettled([
        invoke<DependabotAlert[]>('github_list_dependabot_alerts', { owner, repo: repoName }),
        invoke<CodeScanningAlert[]>('github_list_code_scanning_alerts', { owner, repo: repoName }),
        invoke<SecretScanningAlert[]>('github_list_secret_scanning_alerts', { owner, repo: repoName }),
      ]);

      if (dependabotResult.status === 'fulfilled') {
        setDependabotAlerts(dependabotResult.value);
      }

      if (codeScanningResult.status === 'fulfilled') {
        setCodeScanningAlerts(codeScanningResult.value);
      }

      if (secretScanningResult.status === 'fulfilled') {
        setSecretScanningAlerts(secretScanningResult.value);
      }
    } catch (err) {
      // Silently handle - security features may not be enabled
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [owner, repoName]);

  // Calculate stats
  const stats: SecurityStats = {
    dependabot: {
      critical: dependabotAlerts.filter((a) => a.security_advisory.severity === 'critical' && a.state === 'open').length,
      high: dependabotAlerts.filter((a) => a.security_advisory.severity === 'high' && a.state === 'open').length,
      medium: dependabotAlerts.filter((a) => a.security_advisory.severity === 'medium' && a.state === 'open').length,
      low: dependabotAlerts.filter((a) => a.security_advisory.severity === 'low' && a.state === 'open').length,
      total: dependabotAlerts.filter((a) => a.state === 'open').length,
    },
    codeScanning: {
      critical: codeScanningAlerts.filter((a) => a.rule.security_severity_level === 'critical' && a.state === 'open').length,
      high: codeScanningAlerts.filter((a) => a.rule.security_severity_level === 'high' && a.state === 'open').length,
      medium: codeScanningAlerts.filter((a) => a.rule.security_severity_level === 'medium' && a.state === 'open').length,
      low: codeScanningAlerts.filter((a) => a.rule.security_severity_level === 'low' && a.state === 'open').length,
      total: codeScanningAlerts.filter((a) => a.state === 'open').length,
    },
    secretScanning: {
      total: secretScanningAlerts.filter((a) => a.state === 'open').length,
    },
  };

  const hasIssues = stats.dependabot.total > 0 || stats.codeScanning.total > 0 || stats.secretScanning.total > 0;

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Security Status Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Dependabot Card */}
        <button
          onClick={() => setSelectedTab('dependabot')}
          className="glass-card p-4 text-left hover:border-accent-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bug size={16} className="text-text-muted" />
              <span className="text-sm font-medium text-text-primary">Dependabot</span>
            </div>
            <ChevronRight size={14} className="text-text-ghost group-hover:text-accent-primary transition-colors" />
          </div>
          {stats.dependabot.total > 0 ? (
            <div className="space-y-1">
              {stats.dependabot.critical > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {SEVERITY_ICONS.critical}
                  <span className="text-text-muted">{stats.dependabot.critical} critical</span>
                </div>
              )}
              {stats.dependabot.high > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {SEVERITY_ICONS.high}
                  <span className="text-text-muted">{stats.dependabot.high} high</span>
                </div>
              )}
              {stats.dependabot.medium > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {SEVERITY_ICONS.medium}
                  <span className="text-text-muted">{stats.dependabot.medium} medium</span>
                </div>
              )}
              {stats.dependabot.low > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {SEVERITY_ICONS.low}
                  <span className="text-text-muted">{stats.dependabot.low} low</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-status-added">
              <CheckCircle size={14} />
              <span>No vulnerabilities</span>
            </div>
          )}
        </button>

        {/* Code Scanning Card */}
        <button
          onClick={() => setSelectedTab('code')}
          className="glass-card p-4 text-left hover:border-accent-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-text-muted" />
              <span className="text-sm font-medium text-text-primary">Code Scanning</span>
            </div>
            <ChevronRight size={14} className="text-text-ghost group-hover:text-accent-primary transition-colors" />
          </div>
          {stats.codeScanning.total > 0 ? (
            <div className="space-y-1">
              {stats.codeScanning.critical > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {SEVERITY_ICONS.critical}
                  <span className="text-text-muted">{stats.codeScanning.critical} critical</span>
                </div>
              )}
              {stats.codeScanning.high > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {SEVERITY_ICONS.high}
                  <span className="text-text-muted">{stats.codeScanning.high} high</span>
                </div>
              )}
              {stats.codeScanning.medium > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {SEVERITY_ICONS.medium}
                  <span className="text-text-muted">{stats.codeScanning.medium} medium</span>
                </div>
              )}
            </div>
          ) : codeScanningAlerts.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Lock size={14} />
              <span>Not enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-status-added">
              <CheckCircle size={14} />
              <span>No issues</span>
            </div>
          )}
        </button>

        {/* Secret Scanning Card */}
        <button
          onClick={() => setSelectedTab('secrets')}
          className="glass-card p-4 text-left hover:border-accent-primary/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-text-muted" />
              <span className="text-sm font-medium text-text-primary">Secret Scanning</span>
            </div>
            <ChevronRight size={14} className="text-text-ghost group-hover:text-accent-primary transition-colors" />
          </div>
          {stats.secretScanning.total > 0 ? (
            <div className="flex items-center gap-2 text-xs text-status-deleted">
              <AlertTriangle size={14} />
              <span>{stats.secretScanning.total} leaked secret{stats.secretScanning.total > 1 ? 's' : ''}</span>
            </div>
          ) : secretScanningAlerts.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Lock size={14} />
              <span>Not enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-status-added">
              <CheckCircle size={14} />
              <span>No leaks detected</span>
            </div>
          )}
        </button>
      </div>

      {/* Priority Actions */}
      {hasIssues && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-status-modified" />
            Priority Actions
          </h3>
          <div className="space-y-2">
            {/* Critical Dependabot alerts */}
            {dependabotAlerts
              .filter((a) => a.security_advisory.severity === 'critical' && a.state === 'open')
              .slice(0, 3)
              .map((alert) => (
                <a
                  key={alert.number}
                  href={alert.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg bg-status-deleted/5 hover:bg-status-deleted/10 transition-colors"
                >
                  {SEVERITY_ICONS.critical}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary truncate">
                      {alert.dependency.package.name}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">
                      {alert.security_advisory.summary}
                    </div>
                  </div>
                  {alert.security_vulnerability.first_patched_version && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-added/20 text-status-added">
                      Fix: {alert.security_vulnerability.first_patched_version.identifier}
                    </span>
                  )}
                  <ExternalLink size={12} className="text-text-ghost" />
                </a>
              ))}

            {/* High Code Scanning alerts */}
            {codeScanningAlerts
              .filter((a) => a.rule.security_severity_level === 'critical' && a.state === 'open')
              .slice(0, 2)
              .map((alert) => (
                <a
                  key={alert.number}
                  href={alert.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg bg-status-deleted/5 hover:bg-status-deleted/10 transition-colors"
                >
                  {SEVERITY_ICONS.critical}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary truncate">
                      {alert.rule.description}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">
                      {alert.most_recent_instance.location.path}:{alert.most_recent_instance.location.start_line}
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-text-ghost" />
                </a>
              ))}

            {/* Secret scanning alerts */}
            {secretScanningAlerts
              .filter((a) => a.state === 'open')
              .slice(0, 2)
              .map((alert) => (
                <a
                  key={alert.number}
                  href={alert.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg bg-status-deleted/5 hover:bg-status-deleted/10 transition-colors"
                >
                  <Key size={14} className="text-status-deleted" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-primary truncate">
                      {alert.secret_type_display_name}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Detected {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-text-ghost" />
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Security Features Info */}
      {!hasIssues && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Shield size={14} className="text-status-added" />
            Security Status
          </h3>
          <div className="text-sm text-text-muted">
            {dependabotAlerts.length === 0 && codeScanningAlerts.length === 0 && secretScanningAlerts.length === 0 ? (
              <div className="space-y-3">
                <p>
                  Enable GitHub security features to protect your repository from vulnerabilities and leaked secrets.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://github.com/${owner}/${repoName}/settings/security_analysis`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-accent-primary/20 text-accent-primary text-xs font-medium hover:bg-accent-primary/30 transition-colors flex items-center gap-1"
                  >
                    Enable Security Features
                    <ArrowUpRight size={12} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-status-added">
                <CheckCircle size={16} />
                <span>All security checks passed! Your repository has no known vulnerabilities.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDependabotAlerts = () => (
    <div className="space-y-3">
      <button
        onClick={() => setSelectedTab('overview')}
        className="text-xs text-accent-primary hover:text-accent-primary/80 flex items-center gap-1"
      >
        ← Back to Overview
      </button>

      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <Bug size={14} />
        Dependabot Alerts ({stats.dependabot.total} open)
      </h3>

      {dependabotAlerts.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <Bug size={32} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-muted">No Dependabot alerts</p>
          <p className="text-xs text-text-ghost mt-1">
            Enable Dependabot in repository settings to scan for vulnerabilities
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {dependabotAlerts
            .filter((a) => a.state === 'open')
            .sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3 };
              return order[a.security_advisory.severity] - order[b.security_advisory.severity];
            })
            .map((alert) => (
              <a
                key={alert.number}
                href={alert.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-3 block hover:border-accent-primary/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  {SEVERITY_ICONS[alert.security_advisory.severity]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {alert.dependency.package.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${SEVERITY_COLORS[alert.security_advisory.severity]}`}>
                        {alert.security_advisory.severity}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {alert.security_advisory.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-text-ghost">
                      <span>{alert.dependency.package.ecosystem}</span>
                      <span>{alert.security_vulnerability.vulnerable_version_range}</span>
                      {alert.security_vulnerability.first_patched_version && (
                        <span className="text-status-added">
                          → {alert.security_vulnerability.first_patched_version.identifier}
                        </span>
                      )}
                      {alert.security_advisory.cve_id && (
                        <span>{alert.security_advisory.cve_id}</span>
                      )}
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-text-ghost flex-shrink-0" />
                </div>
              </a>
            ))}
        </div>
      )}
    </div>
  );

  const renderCodeScanningAlerts = () => (
    <div className="space-y-3">
      <button
        onClick={() => setSelectedTab('overview')}
        className="text-xs text-accent-primary hover:text-accent-primary/80 flex items-center gap-1"
      >
        ← Back to Overview
      </button>

      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <Shield size={14} />
        Code Scanning Alerts ({stats.codeScanning.total} open)
      </h3>

      {codeScanningAlerts.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <Shield size={32} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-muted">No Code Scanning alerts</p>
          <p className="text-xs text-text-ghost mt-1">
            Enable CodeQL or another scanning tool in your repository
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {codeScanningAlerts
            .filter((a) => a.state === 'open')
            .map((alert) => (
              <a
                key={alert.number}
                href={alert.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-3 block hover:border-accent-primary/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  {SEVERITY_ICONS[alert.rule.security_severity_level || 'low']}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {alert.rule.description}
                      </span>
                      {alert.rule.security_severity_level && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${SEVERITY_COLORS[alert.rule.security_severity_level]}`}>
                          {alert.rule.security_severity_level}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {alert.most_recent_instance.message.text}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-text-ghost">
                      <span className="font-mono">
                        {alert.most_recent_instance.location.path}:{alert.most_recent_instance.location.start_line}
                      </span>
                      <span>{alert.tool.name}</span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-text-ghost flex-shrink-0" />
                </div>
              </a>
            ))}
        </div>
      )}
    </div>
  );

  const renderSecretScanningAlerts = () => (
    <div className="space-y-3">
      <button
        onClick={() => setSelectedTab('overview')}
        className="text-xs text-accent-primary hover:text-accent-primary/80 flex items-center gap-1"
      >
        ← Back to Overview
      </button>

      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <Key size={14} />
        Secret Scanning Alerts ({stats.secretScanning.total} open)
      </h3>

      {secretScanningAlerts.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <Key size={32} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-muted">No Secret Scanning alerts</p>
          <p className="text-xs text-text-ghost mt-1">
            Secret scanning detects exposed credentials and tokens
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {secretScanningAlerts
            .filter((a) => a.state === 'open')
            .map((alert) => (
              <a
                key={alert.number}
                href={alert.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-3 block hover:border-accent-primary/50 transition-all border-l-2 border-l-status-deleted"
              >
                <div className="flex items-start gap-3">
                  <Key size={14} className="text-status-deleted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">
                      {alert.secret_type_display_name}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-text-ghost">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-mono">{alert.secret_type}</span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-text-ghost flex-shrink-0" />
                </div>
              </a>
            ))}
        </div>
      )}
    </div>
  );

  if (loading && !dependabotAlerts.length && !codeScanningAlerts.length && !secretScanningAlerts.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-muted">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading security data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Shield size={18} />
          Security Center
        </h2>
        <button
          onClick={fetchSecurityData}
          disabled={loading}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'dependabot' && renderDependabotAlerts()}
      {selectedTab === 'code' && renderCodeScanningAlerts()}
      {selectedTab === 'secrets' && renderSecretScanningAlerts()}
    </div>
  );
}
