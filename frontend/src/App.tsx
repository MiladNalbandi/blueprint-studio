/** FlowForge App — routes between wizard and canvas phases. */

import { ReactFlowProvider } from '@xyflow/react';
import { useUIStore } from '@/stores';
import Wizard from '@/components/wizard/Wizard';
import TopBar from '@/components/canvas/TopBar';
import Canvas from '@/components/canvas/Canvas';
import Sidebar from '@/components/canvas/Sidebar';
import DeleteButton from '@/components/canvas/DeleteButton';
import ConfigPanel from '@/components/config/ConfigPanel';
import LLMSettingsModal from '@/components/config/LLMSettingsModal';
import ChatPanel from '@/components/chat/ChatPanel';
import ChatBubble from '@/components/chat/ChatBubble';

function CanvasView() {
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
        </ReactFlowProvider>
        <ConfigPanel />
      </div>
      <ChatBubble />
      <ChatPanel />
      <LLMSettingsModal />
    </div>
  );
}

export default function App() {
  const { phase } = useUIStore();
  return phase === 'wizard' ? <Wizard /> : <CanvasView />;
}
