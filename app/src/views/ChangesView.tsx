import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  FileCode,
  File,
  RotateCcw,
  Sparkles,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRepoStore, FileStatus } from '@/stores/repo';
import { useUIStore } from '@/stores/ui';
import { useAI, useStatus, useDiff, useCommits, FileDiff } from '@/hooks/useGit';

// Diff Viewer Component
function DiffViewer({ diff, loading }: { diff: FileDiff | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent">
        <Loader2 size={32} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent p-4">
        <div className="glass-card-subtle p-8 text-center text-text-muted">
          <FileCode size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium">Select a file to view changes</p>
        </div>
      </div>
    );
  }

  if (diff.is_binary) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent p-4">
        <div className="glass-card-subtle p-8 text-center text-text-muted">
          <File size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium">Binary file</p>
          <p className="text-xs mt-1">Cannot display diff for binary files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden">
      {/* Diff Header */}
      <div className="m-2 mb-0">
        <div className="glass-card-subtle flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-accent-primary" />
            <span className="text-sm font-mono text-text-primary">{diff.path}</span>
            {diff.old_path && diff.old_path !== diff.path && (
              <span className="text-xs text-text-muted">← {diff.old_path}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="text-status-added">+{diff.additions}</span>
            <span className="text-status-deleted">-{diff.deletions}</span>
          </div>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-auto font-mono text-sm">
        {diff.hunks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            <p>No changes to display</p>
          </div>
        ) : (
          diff.hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex} className="border-b border-white/5">
              {/* Hunk Header */}
              <div className="px-4 py-1 bg-accent-primary/10 text-accent-primary text-xs">
                {hunk.header}
              </div>
              {/* Hunk Lines */}
              <div>
                {hunk.lines.map((line, lineIndex) => (
                  <div
                    key={lineIndex}
                    className={cn(
                      'flex px-4 py-0.5 hover:bg-white/5',
                      line.line_type === 'addition' && 'bg-status-added/10',
                      line.line_type === 'deletion' && 'bg-status-deleted/10',
                      line.line_type === 'header' && 'bg-accent-primary/5'
                    )}
                  >
                    {/* Line Numbers */}
                    <span className="w-12 flex-shrink-0 text-text-ghost text-right pr-2 select-none">
                      {line.old_line ?? ''}
                    </span>
                    <span className="w-12 flex-shrink-0 text-text-ghost text-right pr-2 select-none border-r border-white/5 mr-2">
                      {line.new_line ?? ''}
                    </span>
                    {/* Line Content */}
                    <span
                      className={cn(
                        'flex-1 whitespace-pre',
                        line.line_type === 'addition' && 'text-status-added',
                        line.line_type === 'deletion' && 'text-status-deleted',
                        line.line_type === 'context' && 'text-text-secondary',
                        line.line_type === 'header' && 'text-accent-primary'
                      )}
                    >
                      {line.line_type === 'addition' && '+'}
                      {line.line_type === 'deletion' && '-'}
                      {line.line_type === 'context' && ' '}
                      {line.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FileItem({
  file,
  selected,
  onSelect,
  onStage,
  onUnstage,
  onDiscard,
}: {
  file: FileStatus;
  selected: boolean;
  onSelect: () => void;
  onStage?: () => void;
  onUnstage?: () => void;
  onDiscard?: () => void;
}) {
  const statusIcon = {
    added: <Plus size={14} className="text-status-added" />,
    modified: <FileCode size={14} className="text-status-modified" />,
    deleted: <Minus size={14} className="text-status-deleted" />,
    renamed: <File size={14} className="text-status-renamed" />,
    untracked: <File size={14} className="text-status-untracked" />,
    conflict: <File size={14} className="text-status-conflict" />,
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors',
        selected ? 'bg-accent-primary/15' : 'hover:bg-hover'
      )}
    >
      {statusIcon[file.status]}
      <span className={cn('flex-1 text-sm truncate', selected && 'text-accent-primary')}>
        {file.path}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {file.staged ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnstage?.();
            }}
            className="p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary"
            title="Unstage"
          >
            <Minus size={14} />
          </button>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStage?.();
              }}
              className="p-1 rounded hover:bg-surface text-text-muted hover:text-status-added"
              title="Stage"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDiscard?.();
              }}
              className="p-1 rounded hover:bg-surface text-text-muted hover:text-status-deleted"
              title="Discard changes"
            >
              <RotateCcw size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FileSection({
  title,
  files,
  isExpanded,
  onToggle,
  selectedFile,
  onSelectFile,
  onStage,
  onUnstage,
  onDiscard,
}: {
  title: string;
  files: FileStatus[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onStage?: (path: string) => void;
  onUnstage?: (path: string) => void;
  onDiscard?: (path: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-text-secondary hover:text-text-primary transition-colors"
      >
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        <span className="ml-auto text-xs text-text-muted">{files.length}</span>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-1 space-y-0.5"
        >
          {files.map((file) => (
            <FileItem
              key={file.path}
              file={file}
              selected={selectedFile === file.path}
              onSelect={() => onSelectFile(file.path)}
              onStage={onStage ? () => onStage(file.path) : undefined}
              onUnstage={onUnstage ? () => onUnstage(file.path) : undefined}
              onDiscard={onDiscard ? () => onDiscard(file.path) : undefined}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function ChangesView() {
  const { repo, stagedFiles, unstagedFiles, untrackedFiles } = useRepoStore();
  const { selectedFile, setSelectedFile } = useUIStore();
  const { generateCommitMessage, loading: aiLoading, error: _aiError } = useAI();
  const { refreshStatus, stageFiles, unstageFiles, discardChanges, loading: statusLoading } = useStatus();
  const { createCommit, loading: commitLoading } = useCommits();
  const { diff, getFileDiff, loading: diffLoading } = useDiff();
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    unstaged: true,
    untracked: true,
  });
  const [commitMessage, setCommitMessage] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch status when component mounts or repo changes
  useEffect(() => {
    if (repo) {
      refreshStatus().catch(console.error);
    }
  }, [repo, refreshStatus]);

  // Refresh status periodically (every 5 seconds)
  useEffect(() => {
    if (!repo) return;
    const interval = setInterval(() => {
      refreshStatus().catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, [repo, refreshStatus]);

  // Fetch diff when selected file changes
  useEffect(() => {
    if (!selectedFile) return;

    // Determine if the file is staged
    const isStaged = stagedFiles.some(f => f.path === selectedFile);

    getFileDiff(selectedFile, isStaged).catch(console.error);
  }, [selectedFile, stagedFiles, getFileDiff]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGenerateMessage = async () => {
    if (stagedFiles.length === 0) {
      showNotification('Stage some files first to generate a commit message', 'error');
      return;
    }
    try {
      const message = await generateCommitMessage();
      setCommitMessage(message);
      showNotification('Commit message generated', 'success');
    } catch (e) {
      showNotification(`Failed to generate: ${e}`, 'error');
    }
  };

  const toggleSection = (section: 'staged' | 'unstaged' | 'untracked') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasChanges = stagedFiles.length > 0 || unstagedFiles.length > 0 || untrackedFiles.length > 0;

  const handleStageFile = async (path: string) => {
    try {
      await stageFiles([path]);
      showNotification(`Staged: ${path}`, 'success');
    } catch (e) {
      showNotification(`Failed to stage: ${e}`, 'error');
    }
  };

  const handleUnstageFile = async (path: string) => {
    try {
      await unstageFiles([path]);
      showNotification(`Unstaged: ${path}`, 'success');
    } catch (e) {
      showNotification(`Failed to unstage: ${e}`, 'error');
    }
  };

  const handleDiscardFile = async (path: string) => {
    try {
      await discardChanges([path]);
      showNotification(`Discarded changes: ${path}`, 'success');
    } catch (e) {
      showNotification(`Failed to discard: ${e}`, 'error');
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshStatus();
      showNotification('Status refreshed', 'success');
    } catch (e) {
      showNotification(`Failed to refresh: ${e}`, 'error');
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || stagedFiles.length === 0) return;

    try {
      await createCommit(commitMessage);
      setCommitMessage('');
      showNotification('Commit created successfully', 'success');
      await refreshStatus();
    } catch (e) {
      showNotification(`Failed to commit: ${e}`, 'error');
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - File List */}
      <div className="w-80 flex flex-col border-r border-white/5">
        {/* Refresh Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Changes</span>
          <button
            onClick={handleRefresh}
            disabled={statusLoading}
            className="p-1.5 rounded-lg hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Refresh status"
          >
            <RefreshCw size={14} className={statusLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <FileSection
            title="Staged Changes"
            files={stagedFiles}
            isExpanded={expandedSections.staged}
            onToggle={() => toggleSection('staged')}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onUnstage={handleUnstageFile}
          />

          <FileSection
            title="Changes"
            files={unstagedFiles}
            isExpanded={expandedSections.unstaged}
            onToggle={() => toggleSection('unstaged')}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onStage={handleStageFile}
            onDiscard={handleDiscardFile}
          />

          <FileSection
            title="Untracked"
            files={untrackedFiles}
            isExpanded={expandedSections.untracked}
            onToggle={() => toggleSection('untracked')}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onStage={handleStageFile}
          />

          {!hasChanges && (
            <div className="glass-card-subtle mx-2 p-6 flex flex-col items-center justify-center text-text-muted">
              <Check size={48} className="mb-4 text-status-added/50" />
              <p className="text-sm font-medium">No changes</p>
              <p className="text-xs mt-1">Working directory is clean</p>
            </div>
          )}
        </div>

        {/* Commit Form */}
        <div className="p-3 border-t border-white/5">
          <div className="glass-card-subtle p-3">
            <div className="relative mb-3">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="w-full h-20 px-3 py-2 bg-surface/50 rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 resize-none"
              />
              <button
                onClick={handleGenerateMessage}
                disabled={aiLoading || stagedFiles.length === 0}
                className={cn(
                  'absolute top-2 right-2 p-1.5 rounded-lg transition-colors',
                  stagedFiles.length > 0
                    ? 'bg-accent-secondary/20 hover:bg-accent-secondary/30 text-accent-secondary'
                    : 'bg-elevated text-text-muted cursor-not-allowed'
                )}
                title="Generate commit message with AI"
              >
                {aiLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
              </button>
            </div>

            <button
              onClick={handleCommit}
              disabled={stagedFiles.length === 0 || !commitMessage.trim() || commitLoading}
              className={cn(
                'w-full py-2 rounded-lg font-medium text-sm transition-all duration-200',
                stagedFiles.length > 0 && commitMessage.trim()
                  ? 'bg-accent-primary text-void hover:shadow-glow-sm'
                  : 'bg-elevated text-text-muted cursor-not-allowed'
              )}
            >
              {commitLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Committing...
                </span>
              ) : (
                <>Commit {stagedFiles.length > 0 && `(${stagedFiles.length} files)`}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Diff Viewer */}
      <DiffViewer diff={selectedFile ? diff : null} loading={diffLoading} />

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50',
              notification.type === 'success'
                ? 'bg-status-added/20 border border-status-added/30 text-status-added'
                : 'bg-status-deleted/20 border border-status-deleted/30 text-status-deleted'
            )}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
