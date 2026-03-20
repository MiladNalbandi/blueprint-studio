/** Inline editor for function name, params, and return type. */

import type { FunctionParam } from '@/types';

interface Props {
  name: string;
  params: FunctionParam[];
  returnType: string;
  description: string;
  connectedTypes?: string[];
  onChange: (data: { name?: string; params?: FunctionParam[]; return_type?: string; description?: string }) => void;
}

const COMMON_TYPES = ['string', 'int', 'float', 'bool', 'void', 'array', 'object', 'any'];

const inputCls = 'px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 font-mono outline-none';
const inputStyle = { background: 'var(--surface-0)', border: '1px solid var(--border-subtle)' };

export default function FunctionSignatureEditor({ name, params, returnType, description, connectedTypes = [], onChange }: Props) {
  const updateParam = (index: number, patch: Partial<FunctionParam>) => {
    const updated = params.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ params: updated });
  };

  const addParam = () => {
    onChange({ params: [...params, { name: '', type: 'string', default_value: null }] });
  };

  const removeParam = (index: number) => {
    onChange({ params: params.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      {/* Function name */}
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">
          Function Name
        </label>
        <input
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`w-full ${inputCls}`}
          style={inputStyle}
          placeholder="myFunction"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">
          Description
        </label>
        <input
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={`w-full ${inputCls}`}
          style={inputStyle}
          placeholder="What does this function do?"
        />
      </div>

      {/* Parameters */}
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">
          Parameters
        </label>
        <div className="space-y-1.5">
          {params.map((param, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={param.name}
                onChange={(e) => updateParam(i, { name: e.target.value })}
                placeholder="name"
                className={`flex-1 ${inputCls}`}
                style={inputStyle}
              />
              <select
                value={param.type}
                onChange={(e) => updateParam(i, { type: e.target.value })}
                className={inputCls}
                style={inputStyle}
              >
                {COMMON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                {connectedTypes.length > 0 && (
                  <optgroup label="Connected">
                    {connectedTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </optgroup>
                )}
              </select>
              <button
                onClick={() => removeParam(i)}
                className="text-zinc-600 hover:text-red-400 text-sm px-0.5 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addParam}
            className="w-full py-1.5 text-xs text-zinc-500 border border-dashed rounded-lg hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            + Add Parameter
          </button>
        </div>
      </div>

      {/* Return type */}
      <div>
        <label className="text-[10px] font-display font-bold tracking-wider uppercase text-zinc-500 mb-1.5 block">
          Return Type
        </label>
        <select
          value={returnType}
          onChange={(e) => onChange({ return_type: e.target.value })}
          className={`w-full ${inputCls}`}
          style={inputStyle}
        >
          {COMMON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          {connectedTypes.length > 0 && (
            <optgroup label="Connected">
              {connectedTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </optgroup>
          )}
        </select>
      </div>
    </div>
  );
}
