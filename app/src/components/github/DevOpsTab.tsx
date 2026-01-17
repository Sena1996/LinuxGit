import { useEffect } from 'react';
import { useDevOpsStore, DevOpsTab as DevOpsTabType } from '@/presentation/stores';
import { useGitHubStore } from '@/stores/github';
import { DevOpsOverview } from './devops/DevOpsOverview';
import { PipelinesDashboard } from './devops/PipelinesDashboard';
import { DeploymentsManager } from './devops/DeploymentsManager';
import { EnvironmentsManager } from './devops/EnvironmentsManager';
import { SetupWizard } from './devops/SetupWizard';
import { SecurityCenter } from './devops/SecurityCenter';
import {
  LayoutDashboard,
  GitBranch,
  Rocket,
  Server,
  RefreshCw,
  Wand2,
  Shield,
} from 'lucide-react';

const subTabs: { id: DevOpsTabType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
  { id: 'setup', label: 'Setup Wizard', icon: <Wand2 size={14} /> },
  { id: 'pipelines', label: 'Pipelines', icon: <GitBranch size={14} /> },
  { id: 'deployments', label: 'Deployments', icon: <Rocket size={14} /> },
  { id: 'environments', label: 'Environments', icon: <Server size={14} /> },
  { id: 'security', label: 'Security', icon: <Shield size={14} /> },
];

export function DevOpsTab() {
  const { owner, repoName } = useGitHubStore();
  const {
    activeTab,
    setActiveTab,
    loading,
    fetchWorkflowRuns,
    fetchDeployments,
    fetchDeploymentSummary,
    fetchEnvironments,
  } = useDevOpsStore();

  useEffect(() => {
    if (owner && repoName) {
      refreshData();
    }
  }, [owner, repoName]);

  const refreshData = async () => {
    if (!owner || !repoName) return;

    await Promise.all([
      fetchWorkflowRuns(owner, repoName),
      fetchDeployments(owner, repoName),
      fetchDeploymentSummary(owner, repoName),
      fetchEnvironments(owner, repoName),
    ]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DevOpsOverview />;
      case 'setup':
        return <SetupWizard />;
      case 'pipelines':
        return <PipelinesDashboard />;
      case 'deployments':
        return <DeploymentsManager />;
      case 'environments':
        return <EnvironmentsManager />;
      case 'security':
        return <SecurityCenter />;
      default:
        return <DevOpsOverview />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${
                    activeTab === tab.id
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
}
