# FlowForge — Project Overview

FlowForge is a **visual code architecture builder**. Users design backend architectures on a drag-and-drop canvas (endpoints, DTOs, validators, services, entities, logic blocks, etc.), connect them to define data flow, then generate a full idiomatic codebase.

## Core Pipeline
1. **Wizard** — 6-step setup: language → framework → database → ORM → architecture → LLM providers
2. **Canvas** — React Flow canvas for visual node/edge construction
3. **Flow → IR** — FlowToIRService converts React Flow graph to language-agnostic Intermediate Representation
4. **IR → Code** — Jinja2 template-based generators produce framework-specific code
5. **Export** — generated files as downloadable zip

## Supported Node Types
endpoint, dto, validator, logic, entity, response, middleware, service, repository, event

## Architecture
Hexagonal (Ports & Adapters) — domain logic has no framework deps, adapters implement port interfaces.
