import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRepoStore, FileStatus } from '@/stores/repo';
import { useUIStore } from '@/stores/ui';

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
  showStageActions,
}: {
  title: string;
  files: FileStatus[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  showStageActions?: boolean;
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
              onStage={showStageActions ? () => {} : undefined}
              onUnstage={!showStageActions ? () => {} : undefined}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function ChangesView() {
  const { stagedFiles, unstagedFiles, untrackedFiles } = useRepoStore();
  const { selectedFile, setSelectedFile } = useUIStore();
  const [expandedSections, setExpandedSections] = useState({
    staged: true,
    unstaged: true,
    untracked: true,
  });
  const [commitMessage, setCommitMessage] = useState('');

  const toggleSection = (section: 'staged' | 'unstaged' | 'untracked') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasChanges = stagedFiles.length > 0 || unstagedFiles.length > 0 || untrackedFiles.length > 0;

  return (
    <div className="h-full flex">
      {/* Left Panel - File List */}
      <div className="w-80 flex flex-col border-r border-white/5">
        <div className="flex-1 overflow-y-auto p-2">
          <FileSection
            title="Staged Changes"
            files={stagedFiles}
            isExpanded={expandedSections.staged}
            onToggle={() => toggleSection('staged')}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />

          <FileSection
            title="Changes"
            files={unstagedFiles}
            isExpanded={expandedSections.unstaged}
            onToggle={() => toggleSection('unstaged')}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            showStageActions
          />

          <FileSection
            title="Untracked"
            files={untrackedFiles}
            isExpanded={expandedSections.untracked}
            onToggle={() => toggleSection('untracked')}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            showStageActions
          />

          {!hasChanges && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Check size={48} className="mb-4 text-status-added/50" />
              <p className="text-sm">No changes</p>
              <p className="text-xs mt-1">Working directory is clean</p>
            </div>
          )}
        </div>

        {/* Commit Form */}
        <div className="p-3 border-t border-white/5 bg-surface">
          <div className="relative mb-3">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="w-full h-20 px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 resize-none"
            />
            <button
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-accent-secondary/20 hover:bg-accent-secondary/30 text-accent-secondary transition-colors"
              title="Generate commit message with AI"
            >
              <Sparkles size={14} />
            </button>
          </div>

          <button
            disabled={stagedFiles.length === 0 || !commitMessage}
            className={cn(
              'w-full py-2 rounded-lg font-medium text-sm transition-all duration-200',
              stagedFiles.length > 0 && commitMessage
                ? 'bg-accent-primary text-void hover:shadow-glow-sm'
                : 'bg-elevated text-text-muted cursor-not-allowed'
            )}
          >
            Commit {stagedFiles.length > 0 && `(${stagedFiles.length} files)`}
          </button>
        </div>
      </div>

      {/* Right Panel - Diff Viewer */}
      <div className="flex-1 flex items-center justify-center bg-void">
        {selectedFile ? (
          <div className="p-4 text-text-secondary">
            <p className="text-sm font-mono">Diff viewer for: {selectedFile}</p>
            <p className="text-xs text-text-muted mt-2">
              Diff content will be displayed here once Git backend is connected
            </p>
          </div>
        ) : (
          <div className="text-center text-text-muted">
            <FileCode size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select a file to view changes</p>
          </div>
        )}
      </div>
    </div>
  );
}
