# FlowForge Chat System — Comprehensive Analysis

## 1. SYSTEM PROMPT CONSTRUCTION (backend/app/api/routes/chat.py:16-100)

### Structure
The system prompt is built from `SYSTEM_PROMPT_TEMPLATE` and customized via `build_system_prompt()` function.

### Core Template Content
- **Project metadata**: Language, Framework, Database, ORM, Architecture
- **Current canvas state**: Lists all existing nodes (id, type, label, config as JSON)
- **Current edges**: Shows node connectivity (source → target)
- **Available node types**: Lists all 10 types
- **NODE CONFIG SHAPES**: Complete specification for each node type with field names, types, and requirements
  - endpoint: method, path, description
  - dto: fields (name, type), description
  - validator: rules (field, rule), onFail
  - logic: condition, outputs (numeric), description
  - entity: tableName, fields (full schema), relations (belongsTo|hasOne|hasMany|manyToMany), indexes
  - response: status, type, description
  - middleware: type (auth|cors|rate-limit|logging|validation|custom), description
  - service: name, methods (array), description
  - repository: entity, methods (array)
  - event: name, payload, async (boolean)

- **ACTIONS section**: Teaches the AI to respond with a JSON block containing:
  - nodes: Create new nodes with tempId, type, label, config
  - edges: Connect nodes (can reference tempIds or existing node IDs)
  - edits: Modify existing nodes by ID (label and/or config)

### Referenced Nodes Enhancement (lines 124-132)
If user uses @-mentions (e.g., @MyEntity), the system appends detailed context:
- Full node ID, type, label
- Complete config as formatted JSON (indented)
- Instructions to "Pay special attention to these nodes"

This is critical for node-specific editing via mentions.

### JSON Parsing Logic (lines 163-171)
- Looks for ```json markers in AI response
- Extracts text between markers
- Parses as JSON
- Returns in ChatResponse.nodes_created field
- Handles parse errors gracefully (logs, returns None)

### Temperature & Model
- Uses first LLM config from project (line 152)
- Temperature passed to provider (default 0.3 in most configs)
- Currently supports Claude, OpenAI, Gemini

---

## 2. NODE POSITIONING ON CANVAS

### Drag-to-Create (Canvas.tsx:69-97)
When user drags a node type from sidebar to canvas:
1. `onDrop` handler gets drop position via `screenToFlowPosition()`
2. Creates node with exact dropped position
3. Position is **reactive** — user can place anywhere on canvas
4. Node ID: `node_${++nodeIdCounter}_${Date.now()}` (global counter + timestamp)

### Chat-Created Nodes (ChatPanel.tsx:102-120)
Position formula: **`x: 250 + i * 250, y: 150 + (i % 2) * 100`**
- i = index in created nodes array (0-based)
- x: starts at 250px, increments by 250px per node → horizontal grid
- y: alternates 150px and 250px → 2-row pattern
- Example: node[0] → (250, 150), node[1] → (500, 250), node[2] → (750, 150), node[3] → (1000, 250)
- **No smart layout**: purely linear/grid, no collision detection, no flow-based positioning

### Limitations
- Nodes cluster if many are created at once
- No auto-layout algorithm
- No dependency-based positioning
- No consideration of existing node positions

---

## 3. CHATPANEL NODE CREATION CODE (ChatPanel.tsx:99-125)

### Node Creation Flow
1. Chat response arrives with `nodes_created` JSON
2. For each node in the array:
   - Generate ID: `chat_${Date.now()}_${i}`
   - Map tempId to real ID (stored in idMap)
   - Normalize type to lowercase (safety check)
   - Validate type exists in DEFAULT_NODE_CONFIGS
   - Create Node object with:
     - Position (see above formula)
     - Label from AI (or default)
     - NodeType (validated)
     - Config: merge DEFAULT_NODE_CONFIGS[type] + AI-provided config
   - Add to newNodes array

3. Call `addNodes(newNodes)` → updates Zustand store → marks `dirty: true`

### Edge Creation (lines 129-153)
- Maps tempIds to real IDs via idMap lookup
- Validates both source and target exist in current canvas
- Warns if edge references missing nodes (logs, skips)
- Creates Edge objects with ID: `chat_edge_${Date.now()}_${i}`
- Calls `addEdges(validEdges)`

### Node Edits (lines 156-170)
- Looks up existing node by ID
- Applies partial updates (label and/or config)
- Uses `updateNodeData(nodeId, data)` from store

### Store Validation (lines 173-174)
- Logs store state after all actions
- Useful for debugging

---

## 4. CHAT API SCHEMAS (backend/app/api/schemas/schemas.py:103-119)

### ChatRequest (lines 105-113)
```python
class ChatRequest(BaseModel):
    message: str                        # User's input text
    history: list[ChatMessage] = []     # Prior conversation
    referenced_node_ids: list[str] | None = None  # From @-mentions
```

### ChatResponse (lines 116-118)
```python
class ChatResponse(BaseModel):
    reply: str                          # AI's text response
    nodes_created: dict | None = None   # Parsed JSON actions (or None if parsing failed)
```

### ChatMessage (lines 105-107)
```python
class ChatMessage(BaseModel):
    role: str                           # "user" or "assistant"
    content: str                        # Text content
```

Note: Backend schemas don't include nodes_created field; it's added by chat route.

---

## 5. FRONTEND TYPES (frontend/src/types/index.ts:45-53)

### ChatMessage Type
```typescript
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  nodes_created?: {
    nodes?: Array<{ tempId: string; type: NodeType; label: string; config: Record<string, unknown> }>;
    edges?: Array<{ from: string; to: string }>;
    edits?: Array<{ nodeId: string; label?: string; config?: Record<string, unknown> }>;
  } | null;
}
```

All three arrays (nodes, edges, edits) are optional — AI can create just nodes, or just edit existing ones, etc.

### Config Field
- `config: Record<string, unknown>` — flexible, matches node type schemas
- Must match shape defined in DEFAULT_NODE_CONFIGS

---

## 6. ZUSTAND STORES (frontend/src/stores/index.ts)

### FlowStore Key Methods
- `addNode(node)` → appends single node, marks dirty
- `addNodes(nodes)` → appends array, marks dirty
- `addEdges(edges)` → appends array with ID generation, marks dirty
- `updateNodeData(nodeId, data)` → shallow merge data, marks dirty
- `onNodesChange()` → handles React Flow changes (drag, delete), marks dirty
- `onEdgesChange()` → same for edges, marks dirty

### Dirty Tracking
- **dirty** flag = true when user/AI makes changes
- **markClean()** called after successful save
- Used by auto-save hook to detect unsaved work

### Auto-Save (via useAutoSave hook)
- Periodically checks if dirty
- Calls `/projects/{id}/flow` PUT endpoint
- Uses `toBackendFlow()` transform to serialize

---

## 7. NODE TYPE DEFINITIONS (frontend/src/constants/index.ts:186-197)

Each node type has:
- **type**: NodeType enum value (endpoint, dto, etc.)
- **name**: Display name
- **icon**: Unicode emoji
- **color**: Hex color code
- **category**: Grouping (API, Data Flow, Database, Logic)
- **desc**: Short description

Default configs in DEFAULT_NODE_CONFIGS (lines 201-212):
- All types include sensible defaults
- Entity has rich defaults (id field, empty relations/indexes)
- Service/repository have empty names/methods

---

## 8. KEY INSIGHTS FOR IMPROVEMENT

### Current Limitations
1. **Node positioning**: Dumb grid formula, no context about existing nodes
2. **System prompt**: Good structure but could be more prescriptive
3. **AI instructions**: Only 1-3 sentences, no examples of good/bad flows
4. **Config validation**: Minimal — AI can create invalid configs
5. **Layout strategy**: No hierarchical or flow-based positioning
6. **Node descriptions**: Not used by system prompt to guide AI

### Opportunities
1. **Smarter positioning**: Detect existing nodes, position new nodes nearby with offset
2. **Richer system prompt**: Add architectural guidance, anti-patterns, best practices
3. **Node documentation**: Store descriptions in config, surface in system prompt
4. **Layout algorithms**: Implement Dagre or force-directed for dependency-aware placement
5. **Config templates**: Provide more detailed examples in system prompt
6. **Node relationships**: Guide AI on common patterns (endpoint → service → repository → entity)
7. **Context awareness**: Use project architecture to suggest node patterns (DDD → aggregates, Hex → ports)
