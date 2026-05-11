/** FlowForge App — routes between dashboard, wizard, and canvas phases. */

import { ReactFlowProvider } from '@xyflow/react';
import { useUIStore } from '@/stores';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import ProjectDashboard from '@/components/dashboard/ProjectDashboard';
import Wizard from '@/components/wizard/Wizard';
import TopBar from '@/components/canvas/TopBar';
import Canvas from '@/components/canvas/Canvas';
import Sidebar from '@/components/canvas/Sidebar';
import DeleteButton from '@/components/canvas/DeleteButton';
import ConfigPanel from '@/components/config/ConfigPanel';
import LLMSettingsModal from '@/components/config/LLMSettingsModal';
import ChatPanel from '@/components/chat/ChatPanel';
import FunctionBuilderModal from '@/components/function-builder/FunctionBuilderModal';
import CodePreviewPanel from '@/components/code-preview/CodePreviewPanel';
import DependencyPanel from '@/components/dependencies/DependencyPanel';

function CanvasView() {
  useSessionRestore();
  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--surface-0)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <ReactFlowProvider>
          <Sidebar />
          <div className="flex-1 relative">
            <Canvas />
            <DeleteButton />
          </div>
          <ChatPanel />
        </ReactFlowProvider>
        <ConfigPanel />
      </div>
      <LLMSettingsModal />
      <FunctionBuilderModal />
      <CodePreviewPanel />
      <DependencyPanel />
    </div>
  );
}

export default function App() {
  const { phase } = useUIStore();
  if (phase === 'dashboard') return <ProjectDashboard />;
  if (phase === 'wizard') return <Wizard />;
  return <CanvasView />;
}
