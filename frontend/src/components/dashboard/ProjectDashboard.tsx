/** Project Dashboard — landing page for browsing, creating, and managing projects. */

import { useState, useEffect } from 'react';
import { projectsApi, flowsApi, llmApi } from '@/api/client';
import {
  useProjectStore,
  useFlowStore,
  useLLMStore,
  useChatStore,
  useUIStore,
} from '@/stores';
import type { Node, Edge } from '@xyflow/react';
import type { Project, FlowNodeData } from '@/types';
import ProjectCard from './ProjectCard';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function ProjectDashboard() {
  const { projects, setProjects, setProject } = useProjectStore();
  const { setNodes, setEdges, clear: clearFlow } = useFlowStore();
  const { setConfigs } = useLLMStore();
  const { clear: clearChat } = useChatStore();
  const { setPhase, selectNode, selectEdge } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects on mount & clear stale state
  useEffect(() => {
    setProject(null);
    clearFlow();
    clearChat();
    selectNode(null);
    selectEdge(null);
    setConfigs([]);

    projectsApi
      .list()
      .then(setProjects)
      .catch(() => setError('Failed to load projects'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleNewProject = () => {
    setPhase('wizard');
  };

  const handleSelectProject = async (project: Project) => {
    setLoadingProjectId(project.id);
    try {
      setProject(project);

      // Load flow data
      const flowData = await flowsApi.get(project.id);
      if (flowData) {
        const backendNodes = flowData.nodes ?? [];
        const backendEdges = flowData.edges ?? [];

        const rfNodes: Node<FlowNodeData>[] = backendNodes.map(
          (n: { id: string; type: string; label: string; x: number; y: number; config: Record<string, unknown> }) => ({
            id: n.id,
            type: 'flowNode',
            position: { x: n.x, y: n.y },
            data: {
              label: n.label,
              nodeType: n.type,
              config: n.config ?? {},
            },
          })
        );

        const rfEdges: Edge[] = backendEdges.map(
          (e: { id: string; source: string; target: string }) => ({
            id: e.id,
            source: e.source,
            target: e.target,
          })
        );

        setNodes(rfNodes);
        setEdges(rfEdges);
      }

      // Load LLM configs
      const configs = await llmApi.list(project.id);
      setConfigs(configs);

      clearChat();
      setPhase('canvas', project.id);
    } catch (err) {
      console.error('Failed to load project:', err);
      setLoadingProjectId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await projectsApi.delete(deleteTarget.id);
      setProjects(projects.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }}>
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'var(--forge-glow)', border: '1px solid rgba(249,115,22,0.3)' }}
          >
            ⚒️
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-display tracking-wide">FlowForge</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-2 ml-12">Visual code architecture builder</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-display font-semibold text-zinc-400 tracking-wide">Projects</h2>
          <button
            onClick={handleNewProject}
            className="btn-forge px-5 py-2 text-sm font-bold text-white rounded-xl font-display"
          >
            + New Project
          </button>
        </div>

        {/* States */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="text-zinc-500 text-sm font-mono animate-pulse">Loading projects...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="text-red-400 text-sm font-mono mb-3">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                projectsApi
                  .list()
                  .then(setProjects)
                  .catch(() => setError('Failed to load projects'))
                  .finally(() => setIsLoading(false));
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              style={{ border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '8px' }}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <div className="text-center py-20">
            <div className="text-3xl mb-3">⚒️</div>
            <p className="text-zinc-500 text-sm font-mono mb-1">No projects yet</p>
            <p className="text-zinc-600 text-xs">Create your first project to get started</p>
          </div>
        )}

        {!isLoading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isLoading={loadingProjectId === project.id}
                onSelect={() => handleSelectProject(project)}
                onDelete={() => setDeleteTarget(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          projectName={deleteTarget.name}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
