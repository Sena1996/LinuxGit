import { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommit, GitMerge, GitBranch, Tag, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CommitActionMenu,
  ConfirmDialog,
  InputDialog,
  DiffViewerModal,
  type CommitAction
} from './CommitActionMenu';
import { invoke } from '@tauri-apps/api/core';
import { useRepoStore } from '@/stores/repo';

// ============================================================================
// TYPES
// ============================================================================

interface GraphCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  email: string;
  date: string;
  timestamp: number;
  parents: string[];
  column: number;
  row: number;
  color: string;
  branchName: string | null;
  isMerge: boolean;
  isBranchTip: boolean;
  isBranchPoint: boolean;
}

interface GraphBranch {
  name: string;
  color: string;
  column: number;
  tipSha: string;
  isCurrent: boolean;
  startRow: number;
  endRow: number;
}

interface BackendCommit {
  sha: string;
  short_sha: string;
  message: string;
  author: string;
  email: string;
  date: string;
  timestamp: number;
  parents: string[];
}

interface BackendBranch {
  name: string;
  is_remote: boolean;
  is_current: boolean;
  upstream: string | null;
  ahead: number;
  behind: number;
  tip_sha: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLUMN_WIDTH = 36;
const ROW_HEIGHT = 56;
const NODE_SIZE = 26;
const GRAPH_PADDING = 28;

// Black and white theme
const BRANCH_COLORS: Record<string, string> = {
  main: '#ffffff',
  master: '#ffffff',
  develop: '#e5e5e5',
  development: '#e5e5e5',
};

const LANE_COLORS = [
  '#ffffff', // White (main)
  '#e5e5e5', // Light gray
  '#d4d4d4', // Gray
  '#a3a3a3', // Medium gray
  '#737373', // Dark gray
  '#525252', // Darker gray
  '#404040', // Almost black
  '#262626', // Near black
];

function getBranchColor(_name: string, index: number): string {
  return LANE_COLORS[index % LANE_COLORS.length];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Monochrome avatar colors
const AVATAR_COLORS = [
  '#404040',
  '#525252',
  '#737373',
  '#525252',
  '#404040',
  '#737373',
];

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// MD5 implementation for Gravatar
function md5(string: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function F(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function I(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    const wordArray: number[] = [];
    const length = str.length * 8;
    for (let i = 0; i < str.length; i++) {
      const j = i * 8;
      wordArray[j >> 5] |= (str.charCodeAt(i) & 0xff) << (j % 32);
    }
    wordArray[length >> 5] |= 0x80 << (length % 32);
    wordArray[(((length + 64) >>> 9) << 4) + 14] = length;
    return wordArray;
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      hex += ('0' + byte.toString(16)).slice(-2);
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  const S = [[7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]];
  const T = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    const m = x.slice(k, k + 16);
    while (m.length < 16) m.push(0);

    a = FF(a, b, c, d, m[0], S[0][0], T[0]); d = FF(d, a, b, c, m[1], S[0][1], T[1]);
    c = FF(c, d, a, b, m[2], S[0][2], T[2]); b = FF(b, c, d, a, m[3], S[0][3], T[3]);
    a = FF(a, b, c, d, m[4], S[0][0], T[4]); d = FF(d, a, b, c, m[5], S[0][1], T[5]);
    c = FF(c, d, a, b, m[6], S[0][2], T[6]); b = FF(b, c, d, a, m[7], S[0][3], T[7]);
    a = FF(a, b, c, d, m[8], S[0][0], T[8]); d = FF(d, a, b, c, m[9], S[0][1], T[9]);
    c = FF(c, d, a, b, m[10], S[0][2], T[10]); b = FF(b, c, d, a, m[11], S[0][3], T[11]);
    a = FF(a, b, c, d, m[12], S[0][0], T[12]); d = FF(d, a, b, c, m[13], S[0][1], T[13]);
    c = FF(c, d, a, b, m[14], S[0][2], T[14]); b = FF(b, c, d, a, m[15], S[0][3], T[15]);

    a = GG(a, b, c, d, m[1], S[1][0], T[16]); d = GG(d, a, b, c, m[6], S[1][1], T[17]);
    c = GG(c, d, a, b, m[11], S[1][2], T[18]); b = GG(b, c, d, a, m[0], S[1][3], T[19]);
    a = GG(a, b, c, d, m[5], S[1][0], T[20]); d = GG(d, a, b, c, m[10], S[1][1], T[21]);
    c = GG(c, d, a, b, m[15], S[1][2], T[22]); b = GG(b, c, d, a, m[4], S[1][3], T[23]);
    a = GG(a, b, c, d, m[9], S[1][0], T[24]); d = GG(d, a, b, c, m[14], S[1][1], T[25]);
    c = GG(c, d, a, b, m[3], S[1][2], T[26]); b = GG(b, c, d, a, m[8], S[1][3], T[27]);
    a = GG(a, b, c, d, m[13], S[1][0], T[28]); d = GG(d, a, b, c, m[2], S[1][1], T[29]);
    c = GG(c, d, a, b, m[7], S[1][2], T[30]); b = GG(b, c, d, a, m[12], S[1][3], T[31]);

    a = HH(a, b, c, d, m[5], S[2][0], T[32]); d = HH(d, a, b, c, m[8], S[2][1], T[33]);
    c = HH(c, d, a, b, m[11], S[2][2], T[34]); b = HH(b, c, d, a, m[14], S[2][3], T[35]);
    a = HH(a, b, c, d, m[1], S[2][0], T[36]); d = HH(d, a, b, c, m[4], S[2][1], T[37]);
    c = HH(c, d, a, b, m[7], S[2][2], T[38]); b = HH(b, c, d, a, m[10], S[2][3], T[39]);
    a = HH(a, b, c, d, m[13], S[2][0], T[40]); d = HH(d, a, b, c, m[0], S[2][1], T[41]);
    c = HH(c, d, a, b, m[3], S[2][2], T[42]); b = HH(b, c, d, a, m[6], S[2][3], T[43]);
    a = HH(a, b, c, d, m[9], S[2][0], T[44]); d = HH(d, a, b, c, m[12], S[2][1], T[45]);
    c = HH(c, d, a, b, m[15], S[2][2], T[46]); b = HH(b, c, d, a, m[2], S[2][3], T[47]);

    a = II(a, b, c, d, m[0], S[3][0], T[48]); d = II(d, a, b, c, m[7], S[3][1], T[49]);
    c = II(c, d, a, b, m[14], S[3][2], T[50]); b = II(b, c, d, a, m[5], S[3][3], T[51]);
    a = II(a, b, c, d, m[12], S[3][0], T[52]); d = II(d, a, b, c, m[3], S[3][1], T[53]);
    c = II(c, d, a, b, m[10], S[3][2], T[54]); b = II(b, c, d, a, m[1], S[3][3], T[55]);
    a = II(a, b, c, d, m[8], S[3][0], T[56]); d = II(d, a, b, c, m[15], S[3][1], T[57]);
    c = II(c, d, a, b, m[6], S[3][2], T[58]); b = II(b, c, d, a, m[13], S[3][3], T[59]);
    a = II(a, b, c, d, m[4], S[3][0], T[60]); d = II(d, a, b, c, m[11], S[3][1], T[61]);
    c = II(c, d, a, b, m[2], S[3][2], T[62]); b = II(b, c, d, a, m[9], S[3][3], T[63]);

    a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

// Get Gravatar URL from email
function getGravatarUrl(email: string, size: number = 80): string {
  const hash = md5(email.toLowerCase().trim());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=${size}`;
}

// ============================================================================
// GRAPH BUILDING ALGORITHM
// ============================================================================

interface GraphData {
  commits: GraphCommit[];
  branches: GraphBranch[];
  maxColumn: number;
}

function buildGraphData(
  backendCommits: BackendCommit[],
  backendBranches: BackendBranch[]
): GraphData {
  if (backendCommits.length === 0) {
    return { commits: [], branches: [], maxColumn: 0 };
  }

  const localBranches = backendBranches
    .filter(b => !b.is_remote && b.tip_sha)
    .sort((a, b) => {
      if (a.name === 'main' || a.name === 'master') return -1;
      if (b.name === 'main' || b.name === 'master') return 1;
      if (a.is_current) return -1;
      if (b.is_current) return 1;
      return a.name.localeCompare(b.name);
    });

  const shaToCommit = new Map<string, BackendCommit>();
  const shaToRow = new Map<string, number>();
  backendCommits.forEach((c, i) => {
    shaToCommit.set(c.sha, c);
    shaToRow.set(c.sha, i);
  });

  const childMap = new Map<string, string[]>();
  backendCommits.forEach(commit => {
    commit.parents.forEach(parentSha => {
      if (!childMap.has(parentSha)) {
        childMap.set(parentSha, []);
      }
      childMap.get(parentSha)!.push(commit.sha);
    });
  });

  const commitToBranch = new Map<string, string>();
  const branchCommits = new Map<string, Set<string>>();

  localBranches.forEach(branch => {
    if (!branch.tip_sha) return;
    const commits = new Set<string>();
    const stack = [branch.tip_sha];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const sha = stack.pop()!;
      if (visited.has(sha)) continue;
      visited.add(sha);

      const commit = shaToCommit.get(sha);
      if (!commit) continue;

      if (!commitToBranch.has(sha)) {
        commitToBranch.set(sha, branch.name);
        commits.add(sha);
      }

      if (commit.parents.length > 0) {
        stack.push(commit.parents[0]);
      }
    }

    branchCommits.set(branch.name, commits);
  });

  const branchToColumn = new Map<string, number>();
  localBranches.forEach((branch, index) => {
    branchToColumn.set(branch.name, index);
  });

  const graphBranches: GraphBranch[] = localBranches.map((branch, index) => {
    const commits = branchCommits.get(branch.name) || new Set();
    const rows = Array.from(commits)
      .map(sha => shaToRow.get(sha))
      .filter((r): r is number => r !== undefined)
      .sort((a, b) => a - b);

    return {
      name: branch.name,
      color: getBranchColor(branch.name, index),
      column: index,
      tipSha: branch.tip_sha!,
      isCurrent: branch.is_current,
      startRow: rows.length > 0 ? rows[0] : 0,
      endRow: rows.length > 0 ? rows[rows.length - 1] : 0,
    };
  });

  const commitToColumn = new Map<string, number>();
  const commitToColor = new Map<string, string>();

  backendCommits.forEach(commit => {
    const branchName = commitToBranch.get(commit.sha);
    if (branchName) {
      const col = branchToColumn.get(branchName) || 0;
      commitToColumn.set(commit.sha, col);
      const branch = graphBranches.find(b => b.name === branchName);
      commitToColor.set(commit.sha, branch?.color || LANE_COLORS[col % LANE_COLORS.length]);
    } else {
      const col = localBranches.length;
      commitToColumn.set(commit.sha, col);
      commitToColor.set(commit.sha, LANE_COLORS[col % LANE_COLORS.length]);
    }
  });

  const branchTips = new Set(localBranches.map(b => b.tip_sha).filter(Boolean));
  const branchPoints = new Set<string>();
  backendCommits.forEach(commit => {
    const children = childMap.get(commit.sha) || [];
    if (children.length > 1) {
      branchPoints.add(commit.sha);
    }
  });

  const graphCommits: GraphCommit[] = backendCommits.map((commit, row) => ({
    sha: commit.sha,
    shortSha: commit.short_sha,
    message: commit.message.split('\n')[0],
    author: commit.author,
    email: commit.email,
    date: formatDate(commit.timestamp),
    timestamp: commit.timestamp,
    parents: commit.parents,
    column: commitToColumn.get(commit.sha) || 0,
    row,
    color: commitToColor.get(commit.sha) || LANE_COLORS[0],
    branchName: commitToBranch.get(commit.sha) || null,
    isMerge: commit.parents.length > 1,
    isBranchTip: branchTips.has(commit.sha),
    isBranchPoint: branchPoints.has(commit.sha),
  }));

  const maxColumn = Math.max(localBranches.length - 1, 0);

  return { commits: graphCommits, branches: graphBranches, maxColumn };
}

// ============================================================================
// UNIFIED COMMIT ROW COMPONENT
// ============================================================================

interface CommitRowProps {
  commit: GraphCommit;
  commits: GraphCommit[];
  maxColumn: number;
  isSelected: boolean;
  isHead: boolean;
  gitUser: GitUserConfig | null;
  avatarUrl: string | null;
  onSelect: () => void;
  onContextMenu: (pos: { x: number; y: number }) => void;
}

function CommitRow({ commit, commits, maxColumn, isSelected, isHead, gitUser, avatarUrl, onSelect, onContextMenu }: CommitRowProps) {
  const graphWidth = GRAPH_PADDING * 2 + (maxColumn + 1) * COLUMN_WIDTH;
  const nodeHalf = NODE_SIZE / 2;

  // Find parent commits for drawing lines
  const shaToCommit = useMemo(() => {
    const map = new Map<string, GraphCommit>();
    commits.forEach(c => map.set(c.sha, c));
    return map;
  }, [commits]);

  const getX = (col: number) => Math.round(GRAPH_PADDING + col * COLUMN_WIDTH);
  const centerY = Math.round(ROW_HEIGHT / 2);

  // Line color - bright white matching nodes
  const lineColor = '#ffffff';

  return (
    <div
      className="relative cursor-pointer flex justify-center"
      style={{ height: ROW_HEIGHT }}
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Graph container - positioned on right */}
      <div className="relative" style={{ width: graphWidth }}>
        {/* SVG for connection lines */}
        <svg
          width={graphWidth}
          height={ROW_HEIGHT}
          className="absolute inset-0 pointer-events-none z-0"
          style={{ shapeRendering: 'geometricPrecision', overflow: 'visible' }}
        >
        {/* Filter for floating glow effect on lines */}
        <defs>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset in="blur" dx="0" dy="2" result="shadow" />
            <feFlood floodColor="black" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="shadow" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Draw lines to parents (only bottom half) */}
        {commit.parents.map((parentSha) => {
          const parent = shaToCommit.get(parentSha);
          if (!parent) return null;

          const x1 = getX(commit.column);
          const x2 = getX(parent.column);

          if (commit.column === parent.column) {
            return (
              <line
                key={parentSha}
                x1={x1}
                y1={centerY + nodeHalf}
                x2={x1}
                y2={ROW_HEIGHT}
                stroke="var(--accent-primary)"
                strokeWidth={2.5}
                opacity={0.8}
              />
            );
          } else {
            const midX = Math.round((x1 + x2) / 2);
            const path = `
              M ${x1} ${centerY + nodeHalf}
              L ${x1} ${Math.round(ROW_HEIGHT * 0.75)}
              Q ${x1} ${ROW_HEIGHT}, ${midX} ${ROW_HEIGHT}
            `;
            return (
              <path
                key={parentSha}
                d={path}
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth={2.5}
                opacity={0.8}
              />
            );
          }
        })}

        {/* Draw incoming lines from children (top half) */}
        {commits.map(child => {
          if (!child.parents.includes(commit.sha)) return null;

          const x1 = getX(child.column);
          const x2 = getX(commit.column);

          if (child.column === commit.column) {
            return (
              <line
                key={`from-${child.sha}`}
                x1={x2}
                y1={0}
                x2={x2}
                y2={centerY - nodeHalf}
                stroke="var(--accent-primary)"
                strokeWidth={2.5}
                opacity={0.8}
              />
            );
          } else {
            const midX = Math.round((x1 + x2) / 2);
            const path = `
              M ${midX} 0
              Q ${x2} 0, ${x2} ${Math.round(ROW_HEIGHT * 0.25)}
              L ${x2} ${centerY - nodeHalf}
            `;
            return (
              <path
                key={`from-${child.sha}`}
                d={path}
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth={2.5}
                opacity={0.8}
              />
            );
          }
        })}
        </svg>

        {/* Circular Node - 3D Liquid Glass Effect */}
        <div
          className={cn(
            'absolute rounded-full cursor-pointer flex items-center justify-center',
            'transition-all duration-200',
            commit.isBranchTip ? 'z-30' : commit.isMerge ? 'z-20' : 'z-10'
          )}
          style={{
            left: getX(commit.column) - nodeHalf,
            top: centerY - nodeHalf,
            width: NODE_SIZE,
            height: NODE_SIZE,
            // Theme-aware circle with visible border
            background: `linear-gradient(145deg, var(--bg-hover) 0%, var(--bg-elevated) 100%)`,
            // Floating shadow with glow
            boxShadow: isHead
              ? `
                0 4px 16px rgba(0, 0, 0, 0.5),
                0 0 20px var(--accent-primary-glow),
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
              `
              : isSelected
                ? `
                  0 6px 20px rgba(0, 0, 0, 0.5),
                  0 0 12px var(--accent-primary-glow),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `
                : `
                  0 4px 16px rgba(0, 0, 0, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.08)
                `,
            border: isHead
              ? '2px solid var(--accent-primary)'
              : isSelected
                ? '2px solid var(--accent-primary)'
                : '2px solid rgba(255, 255, 255, 0.2)',
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          {/* Inner indicator for branch tips and merges */}
          {(commit.isBranchTip || commit.isMerge) && !isHead && (
            <div
              className="rounded-full"
              style={{
                width: 10,
                height: 10,
                background: 'var(--accent-primary)',
                boxShadow: '0 0 8px rgba(0, 212, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}
          {/* Filled dot for HEAD */}
          {isHead && (
            <div
              className="rounded-full"
              style={{
                width: 12,
                height: 12,
                background: 'var(--accent-primary)',
                boxShadow: '0 0 12px rgba(0, 212, 255, 0.7), 0 2px 6px rgba(0, 0, 0, 0.4)',
              }}
            />
          )}
        </div>

        {/* HEAD indicator with avatar and triangle pointer on the left (opposite to branch name) */}
        {isHead && (
          <div
            className="absolute flex items-center z-50"
            style={{
              right: graphWidth - getX(commit.column) + nodeHalf + 4,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {/* Avatar circle - theme-aware */}
            <div
              className="rounded-full overflow-hidden flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                background: `linear-gradient(145deg, var(--bg-hover) 0%, var(--bg-elevated) 100%)`,
                border: '2px solid var(--accent-primary)',
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.5),
                  0 1px 4px rgba(0, 0, 0, 0.3),
                  0 0 12px var(--accent-primary-glow)
                `,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={gitUser?.name || 'User'}
                  className="w-full h-full object-cover"
                  style={{
                    imageRendering: 'auto',
                    WebkitImageSmoothing: 'high',
                  }}
                />
              ) : gitUser?.name ? (
                <span className="text-xs font-bold select-none" style={{ color: 'var(--text-primary)' }}>
                  {getInitials(gitUser.name)}
                </span>
              ) : (
                <User size={18} className="text-text-secondary" strokeWidth={2} />
              )}
            </div>
            {/* Triangle pointer pointing right towards node */}
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: '8px solid var(--accent-primary)',
                filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.4))',
              }}
            />
          </div>
        )}

        {/* Branch label - theme-aware */}
        {commit.isBranchTip && commit.branchName && (
          <div
            className="absolute text-[11px] font-semibold px-2.5 py-1 rounded whitespace-nowrap z-40"
            style={{
              left: getX(commit.column) + nodeHalf + 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: `linear-gradient(145deg, var(--bg-hover) 0%, var(--bg-elevated) 100%)`,
              color: 'var(--text-primary)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: `
                0 4px 16px rgba(0, 0, 0, 0.4),
                0 1px 4px rgba(0, 0, 0, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
            }}
          >
            {commit.branchName}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DETAIL PANEL
// ============================================================================

interface DetailPanelProps {
  commit: GraphCommit;
  isHead: boolean;
  gitUser: GitUserConfig | null;
  avatarUrl: string | null;
}

function DetailPanel({ commit, isHead, gitUser, avatarUrl }: DetailPanelProps) {
  const authorColor = stringToColor(commit.author);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: authorColor, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          {getInitials(commit.author)}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{commit.author}</p>
          <p className="text-xs text-text-muted">{commit.email}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-text-primary">{commit.message}</p>
        <p className="text-xs text-text-muted mt-1">{commit.date}</p>
      </div>

      {commit.branchName && (
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-neutral-400" />
          <span className="text-xs text-neutral-300">{commit.branchName}</span>
        </div>
      )}

      <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
        <p className="text-xs text-text-muted mb-1">SHA</p>
        <code className="text-xs font-mono text-neutral-300 break-all">{commit.sha}</code>
      </div>

      {commit.parents.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-1">
            {commit.parents.length > 1 ? 'Parents' : 'Parent'}
          </p>
          <div className="flex flex-wrap gap-1">
            {commit.parents.map((p, i) => (
              <code
                key={p}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-mono',
                  i === 0 ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-700 text-neutral-400'
                )}
              >
                {p.slice(0, 7)}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isHead && (
          <span className="px-2 py-1 rounded text-xs bg-white text-neutral-900 border border-neutral-400 flex items-center gap-1.5 font-medium">
            {avatarUrl ? (
              <>
                <img
                  src={avatarUrl}
                  alt={gitUser?.name || 'User'}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span>HEAD</span>
              </>
            ) : gitUser?.name ? (
              <>
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: stringToColor(gitUser.name) }}
                >
                  {getInitials(gitUser.name)}
                </div>
                <span>HEAD</span>
              </>
            ) : (
              <>
                <User size={12} />
                <span>HEAD</span>
              </>
            )}
          </span>
        )}
        {commit.isBranchTip && (
          <span className="px-2 py-1 rounded text-xs bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
            <GitBranch size={12} /> Branch Tip
          </span>
        )}
        {commit.isMerge && (
          <span className="px-2 py-1 rounded text-xs bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
            <GitMerge size={12} /> Merge
          </span>
        )}
        {commit.isBranchPoint && (
          <span className="px-2 py-1 rounded text-xs bg-neutral-800 text-neutral-400 border border-neutral-700">
            Branch Point
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface BranchGraphProps {
  selectedBranch?: string | null;
}

interface GitUserConfig {
  name: string | null;
  email: string | null;
}

interface GitHubAuthStatus {
  authenticated: boolean;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function BranchGraph({ selectedBranch: _selectedBranch }: BranchGraphProps) {
  const { repo } = useRepoStore();
  const [graphData, setGraphData] = useState<GraphData>({ commits: [], branches: [], maxColumn: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSha, setSelectedSha] = useState<string | null>(null);
  const [gitUser, setGitUser] = useState<GitUserConfig | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Dialog states
  const [contextMenu, setContextMenu] = useState<{ commit: GraphCommit; position: { x: number; y: number } } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; confirmLabel: string; danger: boolean; action: () => void } | null>(null);
  const [inputDialog, setInputDialog] = useState<{ title: string; placeholder: string; confirmLabel: string; icon: React.ReactNode; action: (v: string) => void } | null>(null);
  const [diffViewer, setDiffViewer] = useState<GraphCommit | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!repo) {
        setGraphData({ commits: [], branches: [], maxColumn: 0 });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [backendCommits, backendBranches, userConfig, githubStatus] = await Promise.all([
          invoke<BackendCommit[]>('get_commits', { limit: 100 }),
          invoke<BackendBranch[]>('get_branches'),
          invoke<GitUserConfig>('get_git_config'),
          invoke<GitHubAuthStatus>('github_auth_status').catch(() => null),
        ]);

        const data = buildGraphData(backendCommits, backendBranches);
        setGraphData(data);
        setGitUser(userConfig);

        // Use GitHub avatar if authenticated, otherwise fall back to Gravatar
        if (githubStatus?.authenticated && githubStatus.avatar_url) {
          setAvatarUrl(githubStatus.avatar_url);
        } else if (userConfig?.email) {
          setAvatarUrl(getGravatarUrl(userConfig.email, 200));
        }
      } catch (e) {
        console.error('Failed to load graph:', e);
        setGraphData({ commits: [], branches: [], maxColumn: 0 });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [repo]);

  const { commits, branches, maxColumn } = graphData;
  const selectedCommit = commits.find(c => c.sha === selectedSha);
  const currentBranchInfo = branches.find(b => b.isCurrent);
  const currentBranch = currentBranchInfo?.name || repo?.currentBranch || 'main';
  const headSha = currentBranchInfo?.tipSha || null;

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleContextMenu = useCallback((commit: GraphCommit, position: { x: number; y: number }) => {
    setContextMenu({ commit, position });
    setSelectedSha(commit.sha);
  }, []);

  const handleAction = useCallback(async (action: CommitAction) => {
    if (!contextMenu) return;
    const commit = contextMenu.commit;

    switch (action) {
      // === CORE ACTIONS ===
      case 'view-changes':
        setContextMenu(null);
        setDiffViewer(commit);
        break;

      case 'copy-sha':
        await navigator.clipboard.writeText(commit.sha);
        showNotification(`Copied ${commit.shortSha}`, 'success');
        setContextMenu(null);
        break;

      case 'copy-message':
        await navigator.clipboard.writeText(commit.message);
        showNotification('Copied commit message', 'success');
        setContextMenu(null);
        break;

      case 'browse-files':
        setContextMenu(null);
        // TODO: Implement file browser at commit - needs new view
        showNotification('Browse files - coming soon', 'success');
        break;

      // === COMPARE & INSPECT ===
      case 'compare-with-head':
        setContextMenu(null);
        // TODO: Implement compare view - needs new diff component
        showNotification('Compare with HEAD - coming soon', 'success');
        break;

      case 'compare-with':
        setContextMenu(null);
        // TODO: Implement commit picker for compare
        showNotification('Compare with... - coming soon', 'success');
        break;

      // === BRANCH OPERATIONS ===
      case 'create-branch':
        setContextMenu(null);
        setInputDialog({
          title: 'Create Branch',
          placeholder: 'feature/new-branch',
          confirmLabel: 'Create',
          icon: <GitBranch size={24} />,
          action: async (name: string) => {
            try {
              await invoke('create_branch', { name, fromSha: commit.sha });
              showNotification(`Branch '${name}' created`, 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setInputDialog(null);
          },
        });
        break;

      case 'checkout':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Checkout',
          message: `Checkout ${commit.shortSha}? (detached HEAD)`,
          confirmLabel: 'Checkout',
          danger: false,
          action: async () => {
            try {
              await invoke('checkout_commit', { sha: commit.sha });
              showNotification('Checked out', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'merge-into-current':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Merge',
          message: `Merge ${commit.shortSha} into ${currentBranch}?`,
          confirmLabel: 'Merge',
          danger: false,
          action: async () => {
            try {
              await invoke('merge_commit', { sha: commit.sha });
              showNotification('Merged successfully', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      // === HISTORY REWRITING ===
      case 'cherry-pick':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Cherry-pick',
          message: `Apply "${commit.message}" to ${currentBranch}?`,
          confirmLabel: 'Cherry-pick',
          danger: false,
          action: async () => {
            try {
              await invoke('cherry_pick_commit', { sha: commit.sha });
              showNotification('Cherry-picked', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'revert':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Revert',
          message: `Revert "${commit.message}"?`,
          confirmLabel: 'Revert',
          danger: false,
          action: async () => {
            try {
              await invoke('revert_commit', { sha: commit.sha });
              showNotification('Reverted', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'reset-soft':
      case 'reset-mixed':
      case 'reset-hard': {
        const resetType = action.replace('reset-', '');
        setContextMenu(null);
        setConfirmDialog({
          title: `${resetType.charAt(0).toUpperCase() + resetType.slice(1)} Reset`,
          message: resetType === 'hard'
            ? `WARNING: Reset to ${commit.shortSha}? Changes will be LOST!`
            : `Reset to ${commit.shortSha}?`,
          confirmLabel: 'Reset',
          danger: resetType === 'hard',
          action: async () => {
            try {
              await invoke('reset_to_commit', { sha: commit.sha, resetType });
              showNotification(`Reset (${resetType})`, 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;
      }

      case 'rebase-onto':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Rebase',
          message: `Rebase ${currentBranch} onto ${commit.shortSha}?`,
          confirmLabel: 'Rebase',
          danger: false,
          action: async () => {
            try {
              await invoke('rebase_onto', { sha: commit.sha });
              showNotification('Rebased successfully', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'interactive-rebase':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Interactive Rebase',
          message: `Start interactive rebase from ${commit.shortSha}? This requires a terminal.`,
          confirmLabel: 'Start',
          danger: false,
          action: async () => {
            try {
              await invoke('interactive_rebase', { sha: commit.sha });
              showNotification('Interactive rebase started', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      // === TAGS ===
      case 'create-tag':
        setContextMenu(null);
        setInputDialog({
          title: 'Create Tag',
          placeholder: 'v1.0.0',
          confirmLabel: 'Create',
          icon: <Tag size={24} />,
          action: async (name: string) => {
            try {
              await invoke('create_tag', { sha: commit.sha, tagName: name, message: null });
              showNotification(`Tag '${name}' created`, 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setInputDialog(null);
          },
        });
        break;

      case 'delete-tag':
        setContextMenu(null);
        if (commit.tags && commit.tags.length > 0) {
          // If commit has tags, show selection or delete first one
          setConfirmDialog({
            title: 'Delete Tag',
            message: `Delete tag "${commit.tags[0]}"?`,
            confirmLabel: 'Delete',
            danger: true,
            action: async () => {
              try {
                await invoke('delete_tag', { tagName: commit.tags![0] });
                showNotification(`Tag deleted`, 'success');
              } catch (e) {
                showNotification(`Failed: ${e}`, 'error');
              }
              setConfirmDialog(null);
            },
          });
        } else {
          showNotification('No tags on this commit', 'error');
        }
        break;

      // === ADVANCED ===
      case 'squash-with-parent':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Squash with Parent',
          message: `Squash "${commit.message}" with its parent commit?`,
          confirmLabel: 'Squash',
          danger: true,
          action: async () => {
            try {
              await invoke('squash_commits', { sha: commit.sha });
              showNotification('Squashed successfully', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'edit-message':
        setContextMenu(null);
        setInputDialog({
          title: 'Edit Commit Message',
          placeholder: commit.message,
          confirmLabel: 'Update',
          icon: <GitCommit size={24} />,
          action: async (newMessage: string) => {
            try {
              await invoke('amend_commit_message', { sha: commit.sha, message: newMessage });
              showNotification('Message updated', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setInputDialog(null);
          },
        });
        break;

      case 'drop-commit':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Drop Commit',
          message: `WARNING: Remove "${commit.message}" from history? This cannot be undone!`,
          confirmLabel: 'Drop',
          danger: true,
          action: async () => {
            try {
              await invoke('drop_commit', { sha: commit.sha });
              showNotification('Commit dropped', 'success');
            } catch (e) {
              showNotification(`Failed: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      default:
        setContextMenu(null);
    }
  }, [contextMenu, currentBranch, showNotification]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent-primary" />
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted">
        <div className="text-center">
          <GitCommit size={48} className="mx-auto mb-3 opacity-50" />
          <p>No commits to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Commit list with integrated graph */}
        <div className="flex-1 overflow-y-auto">
          {commits.map(commit => (
            <CommitRow
              key={commit.sha}
              commit={commit}
              commits={commits}
              maxColumn={maxColumn}
              isSelected={selectedSha === commit.sha}
              isHead={commit.sha === headSha}
              gitUser={gitUser}
              avatarUrl={avatarUrl}
              onSelect={() => setSelectedSha(commit.sha)}
              onContextMenu={(pos) => handleContextMenu(commit, pos)}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selectedCommit && (
          <div className="w-72 flex-shrink-0 border-l border-white/10 overflow-y-auto bg-surface/30">
            <DetailPanel commit={selectedCommit} isHead={selectedCommit.sha === headSha} gitUser={gitUser} avatarUrl={avatarUrl} />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && createPortal(
        <AnimatePresence>
          <CommitActionMenu
            commit={{
              sha: contextMenu.commit.sha,
              shortSha: contextMenu.commit.shortSha,
              message: contextMenu.commit.message,
              author: contextMenu.commit.author,
              date: contextMenu.commit.date,
              branch: currentBranch,
              color: contextMenu.commit.color,
            }}
            position={contextMenu.position}
            currentBranch={currentBranch}
            onClose={() => setContextMenu(null)}
            onAction={handleAction}
          />
        </AnimatePresence>,
        document.body
      )}

      {/* Dialogs */}
      <AnimatePresence>
        {confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={confirmDialog.confirmLabel}
            danger={confirmDialog.danger}
            onConfirm={confirmDialog.action}
            onCancel={() => setConfirmDialog(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inputDialog && (
          <InputDialog
            title={inputDialog.title}
            placeholder={inputDialog.placeholder}
            confirmLabel={inputDialog.confirmLabel}
            icon={inputDialog.icon}
            onConfirm={inputDialog.action}
            onCancel={() => setInputDialog(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {diffViewer && (
          <DiffViewerModal
            commit={{
              sha: diffViewer.sha,
              shortSha: diffViewer.shortSha,
              message: diffViewer.message,
              author: diffViewer.author,
              date: diffViewer.date,
              branch: currentBranch,
              color: diffViewer.color,
            }}
            onClose={() => setDiffViewer(null)}
          />
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              'fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 text-white text-sm',
              notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            )}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
