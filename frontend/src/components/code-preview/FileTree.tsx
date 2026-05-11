/** Collapsible file tree built from flat GeneratedFile paths. */

import { useMemo, useState } from 'react';

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

interface Props {
  files: { path: string }[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function buildTree(files: { path: string }[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', isDir: true, children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join('/');
      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, path: fullPath, isDir: !isLast, children: [] };
        current.children.push(child);
      }
      current = child;
    }
  }

  // Sort: dirs first, then alpha
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sort(n.children));
  };
  sort(root.children);

  return root.children;
}

function getFileIcon(name: string): string {
  if (name.endsWith('.php')) return 'php';
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'ts';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'js';
  if (name.endsWith('.py')) return 'py';
  if (name.endsWith('.go')) return 'go';
  if (name.endsWith('.rs')) return 'rs';
  if (name.endsWith('.java')) return 'java';
  if (name.endsWith('.json')) return '{}';
  if (name.endsWith('.yaml') || name.endsWith('.yml')) return 'yml';
  return '·';
}

function TreeItem({ node, selectedPath, onSelect, depth }: {
  node: TreeNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = node.path === selectedPath;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-white/5 rounded transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="text-[10px] text-zinc-600 w-3 text-center">{expanded ? '▾' : '▸'}</span>
          <span className="text-[10px] text-orange-400/70">■</span>
          <span className="text-[11px] font-mono text-zinc-400">{node.name}</span>
        </button>
        {expanded && node.children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            selectedPath={selectedPath}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`w-full flex items-center gap-1.5 px-2 py-1 text-left rounded transition-colors ${
        isSelected ? 'bg-orange-500/10 text-zinc-100' : 'hover:bg-white/5 text-zinc-400'
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <span className="text-[9px] font-mono text-cyan-500/60 w-3 text-center">{getFileIcon(node.name)}</span>
      <span className={`text-[11px] font-mono truncate ${isSelected ? 'text-zinc-100' : ''}`}>{node.name}</span>
    </button>
  );
}

export default function FileTree({ files, selectedPath, onSelect }: Props) {
  const tree = useMemo(() => buildTree(files), [files]);

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[10px] text-zinc-600 font-mono">No files generated</p>
      </div>
    );
  }

  return (
    <div className="py-2 overflow-y-auto h-full">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}
