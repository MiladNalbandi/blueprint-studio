/** Built-in endpoint tester — reads endpoints from flow, sends test requests. */

import { useState, useMemo } from 'react';
import { useFlowStore } from '@/stores';
import { useCodePreviewStore } from '@/stores/useCodePreviewStore';
import type { FlowNodeData } from '@/types';
import type { Node } from '@xyflow/react';

interface TestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  PATCH: '#a855f7',
  DELETE: '#ef4444',
};

const inputCls = 'px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 font-mono outline-none w-full';
const inputStyle = { background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' };

export default function EndpointTester() {
  const { nodes, edges } = useFlowStore();
  const { runner } = useCodePreviewStore();

  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract endpoints from flow
  const endpoints = useMemo(() => {
    return nodes
      .filter((n: Node<FlowNodeData>) => n.data.nodeType === 'endpoint')
      .map((n: Node<FlowNodeData>) => {
        const config = n.data.config || {};
        const endpointMethod = (config.method as string) || 'GET';
        const endpointPath = (config.path as string) || '/';

        // Find connected DTOs for body template
        const connectedDtoIds = edges
          .filter((e) => e.source === n.id || e.target === n.id)
          .map((e) => (e.source === n.id ? e.target : e.source));
        const connectedDtos = nodes.filter(
          (dn: Node<FlowNodeData>) => connectedDtoIds.includes(dn.id) && dn.data.nodeType === 'dto'
        );

        let bodyTemplate = '';
        if (['POST', 'PUT', 'PATCH'].includes(endpointMethod) && connectedDtos.length > 0) {
          const dto = connectedDtos[0];
          const fields = (dto.data.config.fields as Array<{ name: string; type: string }>) || [];
          const obj: Record<string, unknown> = {};
          for (const f of fields) {
            if (f.type === 'int' || f.type === 'float') obj[f.name] = 0;
            else if (f.type === 'boolean') obj[f.name] = false;
            else obj[f.name] = '';
          }
          bodyTemplate = JSON.stringify(obj, null, 2);
        }

        return {
          id: n.id,
          label: n.data.label || `${endpointMethod} ${endpointPath}`,
          method: endpointMethod,
          path: endpointPath,
          bodyTemplate,
        };
      });
  }, [nodes, edges]);

  const selectEndpoint = (ep: typeof endpoints[number]) => {
    setMethod(ep.method);
    setUrl(ep.path);
    setBody(ep.bodyTemplate);
    setResult(null);
    setError(null);
  };

  const sendRequest = async () => {
    if (!runner.running || !runner.port) {
      setError('Server is not running. Start the runner first.');
      return;
    }

    setIsSending(true);
    setResult(null);
    setError(null);

    const start = performance.now();
    try {
      const res = await fetch('/api/projects/run/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: runner.port,
          method,
          path: url,
          body: ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
          headers: { 'Content-Type': 'application/json' },
        }),
      });

      const data = await res.json();
      const duration = Math.round(performance.now() - start);

      if (data.proxy_error) {
        setError(data.proxy_error);
      } else {
        setResult({
          status: data.status,
          statusText: data.status_text || '',
          headers: data.headers || {},
          body: typeof data.body === 'string' ? data.body : JSON.stringify(data.body, null, 2),
          duration,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Endpoint list (left) */}
      <div
        className="w-52 shrink-0 overflow-y-auto border-r"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="p-2">
          <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 px-2 mb-1 block">
            Endpoints
          </label>
          {endpoints.length === 0 ? (
            <p className="text-[10px] text-zinc-600 font-mono px-2 py-2">
              No endpoint nodes in flow
            </p>
          ) : (
            <div className="space-y-0.5">
              {endpoints.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => selectEndpoint(ep)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-white/5 transition-colors"
                >
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: METHOD_COLORS[ep.method] || '#71717a',
                      background: `${METHOD_COLORS[ep.method] || '#71717a'}15`,
                    }}
                  >
                    {ep.method}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 truncate">{ep.path}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request builder (right) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* URL bar */}
        <div className="flex items-center gap-2 p-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs font-mono font-bold outline-none"
            style={{
              ...inputStyle,
              color: METHOD_COLORS[method] || '#71717a',
              minWidth: '80px',
            }}
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/api/endpoint"
            className={inputCls}
            style={inputStyle}
          />
          <button
            onClick={sendRequest}
            disabled={isSending || !url}
            className="px-4 py-1.5 rounded-lg text-[11px] font-display font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-50 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              boxShadow: '0 0 12px rgba(249,115,22,0.2)',
            }}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Body + Response */}
        <div className="flex-1 flex overflow-hidden">
          {/* Request body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div className="w-1/2 flex flex-col border-r" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="px-3 py-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500">
                  Request Body
                </span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 px-3 py-2 text-[11px] font-mono text-zinc-200 outline-none resize-none"
                style={{ background: '#0d1117' }}
                placeholder='{ "key": "value" }'
              />
            </div>
          )}

          {/* Response */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-1.5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500">
                Response
              </span>
              {result && (
                <>
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: result.status < 400 ? '#22c55e' : '#ef4444',
                      background: result.status < 400 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    }}
                  >
                    {result.status} {result.statusText}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">{result.duration}ms</span>
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2" style={{ background: '#0d1117' }}>
              {error && (
                <div className="text-[11px] font-mono text-red-400">{error}</div>
              )}
              {result && (
                <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap">{result.body}</pre>
              )}
              {!result && !error && (
                <p className="text-[10px] text-zinc-600 font-mono">
                  Select an endpoint and click Send to test it.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
