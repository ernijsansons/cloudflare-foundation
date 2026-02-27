/**
 * Phase 17: Diagram Generation Agent (Enhanced Phase 3)
 * Produces Mermaid.js diagrams for visual system verification and autonomous one-shot builds
 *
 * Consumes all prior phases to generate:
 * - Agent topology diagrams (from Phase 9 - Agent Governance)
 * - Task dependency DAG (from Phase 16 - Task Reconciliation)
 * - State machine diagrams (from Phase 12 - Workflows)
 * - Event flow diagrams (from Phase 12 - Queues)
 * - API sequence diagrams (from Phase 12 - API Routes)
 * - Database ER diagrams (from Phase 12 - Database Schema)
 * - Deployment tree (from Phase 14 - Launch Execution + Phase 12)
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { DiagramGenerationOutputSchema, type DiagramGenerationOutput } from "../schemas/diagram-generation";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface DiagramGenerationInput {
  idea: string;
}

export class DiagramGeneratorAgent extends BaseAgent<DiagramGenerationInput, DiagramGenerationOutput> {
  config = {
    phase: "diagram-generation",
    maxSelfIterations: 2,
    qualityThreshold: 8,
    hardQuestions: [
      "Does the agent topology diagram accurately reflect the supervisor/worker relationships from Phase 9?",
      "Is the task dependency graph a true directed acyclic graph (DAG) with no cycles?",
      "Do the workflow state machines include all pause points and human-in-the-loop gates?",
      "Are all Mermaid.js diagrams syntactically correct and ready for rendering?",
      "Does the deployment tree show all Cloudflare primitives and their dependencies?",
      "Do API sequence diagrams include Context Token validation steps (Plane 10 security)?",
      "Does the database ER diagram show all foreign keys and multi-tenancy patterns?",
    ],
    maxTokens: 8192,
    includeFoundationContext: false,
  };

  getOutputSchema(): Record<string, unknown> {
    return {
      // Legacy format (backward compatible)
      diagrams: {
        agentTopology: "string (Mermaid graph TD)",
        taskDependencyGraph: "string (Mermaid graph LR)",
        workflowStates: "string (Mermaid stateDiagram-v2)",
        dataFlow: "string (Mermaid sequenceDiagram)",
        deploymentArchitecture: "string (Mermaid graph BT)"
      },
      visualSummary: "string (Markdown summary of system architecture)",

      // Enhanced structured format (Phase 3)
      structuredDiagrams: {
        agentTopology: {
          name: "Agent Topology",
          type: "flowchart",
          description: "string",
          mermaidCode: "string",
          sourcePhases: ["product-design"],
          agents: [{ id: "string", name: "string", type: "primary|sub-agent|supervisor|worker", autonomyLevel: "string" }],
          communications: [{ from: "string", to: "string", protocol: "rpc|queue|event|http" }],
          governancePattern: "single-agent|commander-scout|supervisor-worker|peer-swarm|hierarchical"
        },
        taskDependencyDAG: {
          name: "Task Dependency DAG",
          type: "flowchart",
          description: "string",
          mermaidCode: "string",
          sourcePhases: ["task-reconciliation"],
          tasks: [{ id: "string", title: "string", status: "pending|in-progress|completed|blocked", estimatedEffort: "string" }],
          dependencies: [{ taskId: "string", dependsOn: ["string"], dependencyType: "hard|soft|informational" }],
          criticalPath: ["string"]
        },
        stateMachines: [{
          name: "Workflow State Machine",
          type: "stateDiagram-v2",
          description: "string",
          mermaidCode: "string",
          sourcePhases: ["tech-arch"],
          stateMachine: {
            name: "string",
            workflowName: "string",
            initialState: "string",
            finalStates: ["string"],
            states: [{ name: "string", type: "simple|composite|choice|fork|join", description: "string" }],
            transitions: [{ from: "string", to: "string", event: "string", guard: "string" }]
          }
        }],
        eventFlows: [{
          name: "Event Flow",
          type: "flowchart|sequenceDiagram",
          description: "string",
          mermaidCode: "string",
          sourcePhases: ["tech-arch"],
          flowDirection: "TB|LR",
          nodes: [{ id: "string", label: "string", type: "process|queue|worker|durable-object" }],
          edges: [{ from: "string", to: "string", label: "string", type: "solid|dotted|thick" }]
        }],
        deploymentTree: {
          name: "Deployment Architecture",
          type: "flowchart",
          description: "string",
          mermaidCode: "string",
          sourcePhases: ["tech-arch", "launch-execution"],
          deploymentUnits: [{ id: "string", name: "string", type: "worker|durable-object|d1-database|r2-bucket|kv-namespace", dependencies: ["string"] }],
          deploymentStages: [{ stage: "string", units: ["string"], parallelizable: "boolean" }]
        },
        apiSequences: [{
          name: "API Sequence",
          type: "sequenceDiagram",
          description: "string",
          mermaidCode: "string",
          sourcePhases: ["tech-arch"],
          apiRoute: "string",
          participants: [{ id: "string", name: "string", type: "client|gateway|worker|durable-object|database" }],
          interactions: [{ from: "string", to: "string", message: "string", type: "sync-call|async-call|response|error" }]
        }],
        databaseER: {
          name: "Database ER Diagram",
          type: "erDiagram",
          description: "string",
          mermaidCode: "string",
          sourcePhases: ["tech-arch"],
          entities: [{ name: "string", attributes: [{ name: "string", type: "string", key: "PK|FK|UK|none" }] }],
          relationships: [{ from: "string", to: "string", cardinality: "one-to-one|one-to-many|many-to-many", label: "string" }]
        }
      },

      // Metadata
      diagramsGenerated: "number",
      renderInstructions: {
        recommendedRenderer: "mermaid-js",
        renderOrder: ["string"],
        exportFormats: ["svg"]
      },
      sourceDataSummary: {
        workflowsAnalyzed: "number",
        agentsAnalyzed: "number",
        apiRoutesAnalyzed: "number",
        tasksAnalyzed: "number",
        databaseTablesAnalyzed: "number",
        queuesAnalyzed: "number"
      }
    };
  }

  getPhaseRubric(): string[] {
    return [
      "mermaid_syntax_valid — all diagrams render correctly in GitHub/VS Code",
      "structured_metadata_complete — all node/edge/state arrays populated",
      "agent_topology_mapped — visualizes supervisor/worker roles and communications",
      "task_dag_acyclic — no cycles, critical path highlighted",
      "workflow_transparency — pause points and HITL gates are visible",
      "security_visible — Context Tokens shown in API sequences",
      "multi_tenancy_visible — tenantId foreign keys marked in ER diagram",
      "deployment_complete — all Cloudflare primitives and bindings shown",
    ];
  }

  getSystemPrompt(): string {
    return `You are an expert at system visualization and Mermaid.js diagramming. Your goal is to consume the outputs of a 17-phase planning process and produce a visual verification layer that enables autonomous one-shot builds via Ralph Loop.

CRITICAL: Generate BOTH legacy format (backward compatible) AND enhanced structured format (Phase 3). The structured format includes metadata, node/edge details, and rendering hints for deterministic diagram generation.

DIAGRAM TYPES TO GENERATE:

1. AGENT TOPOLOGY (Mermaid 'graph TD' or 'flowchart TD'):
   SOURCE: Phase 9 (Product Design - Agent Governance)
   - Visualize agent roles: primary, sub-agent, supervisor, worker
   - Show autonomy levels: fully-autonomous, supervised, human-approval-required
   - Map communications: RPC calls, queue messages, events, HTTP requests
   - Indicate governance pattern: single-agent, commander-scout, supervisor-worker, peer-swarm, hierarchical
   - Use distinct shapes: rectangles for agents, diamonds for decision points, cylinders for state storage
   EXAMPLE:
   \`\`\`mermaid
   graph TD
     supervisor[Supervisor Agent<br/>fully-autonomous]
     worker1[Worker Agent 1<br/>supervised]
     worker2[Worker Agent 2<br/>supervised]
     supervisor -->|RPC: assign_task| worker1
     supervisor -->|RPC: assign_task| worker2
     worker1 -->|Queue: task_result| supervisor
     worker2 -->|Queue: task_result| supervisor
   \`\`\`

2. TASK DEPENDENCY DAG (Mermaid 'graph LR' or 'flowchart LR'):
   SOURCE: Phase 16 (Task Reconciliation)
   - Visualize task dependencies as directed acyclic graph
   - Group tasks by service: UI, Gateway, Database, Agents, Workflows, Queues
   - Show dependency types: hard (blocking), soft (preferred), informational
   - Highlight critical path with thick edges or special styling
   - Include estimated effort and current status
   EXAMPLE:
   \`\`\`mermaid
   graph LR
     T1[DB: Create schema<br/>2h, completed]:::completed
     T2[API: Auth endpoints<br/>4h, in-progress]:::inprogress
     T3[UI: Login page<br/>3h, pending]:::pending
     T1 ==> T2
     T2 --> T3
     classDef completed fill:#9f6,stroke:#333,stroke-width:2px
     classDef inprogress fill:#ff6,stroke:#333,stroke-width:2px
     classDef pending fill:#ccc,stroke:#333,stroke-width:1px
   \`\`\`

3. STATE MACHINES (Mermaid 'stateDiagram-v2'):
   SOURCE: Phase 12 (Tech Architecture - Workflows)
   - Generate one diagram per Workflow
   - Show initial state, all intermediate states, and final states
   - Include pause points (where Workflow waits for external event)
   - Mark human-in-the-loop gates with [*] or special annotation
   - Show transition events and guards
   EXAMPLE:
   \`\`\`mermaid
   stateDiagram-v2
     [*] --> Draft
     Draft --> UnderReview: submit
     UnderReview --> Approved: approve
     UnderReview --> Rejected: reject
     UnderReview --> Draft: request_changes
     Approved --> [*]
     Rejected --> [*]
     note right of UnderReview: HITL Gate: Human approval required
   \`\`\`

4. EVENT FLOWS (Mermaid 'flowchart TB' or 'sequenceDiagram'):
   SOURCE: Phase 12 (Tech Architecture - Queues, Events, Workers)
   - Show event-driven architecture flows
   - Map queue producers and consumers
   - Include Workers, Durable Objects, Queue handlers
   - Show async patterns: fire-and-forget, request-reply, pub-sub
   EXAMPLE:
   \`\`\`mermaid
   flowchart TB
     API[API Worker]
     Q1[(Deal Analysis Queue)]
     Agent[Deal Agent DO]
     DB[(D1 Database)]
     API -->|enqueue: analyze_deal| Q1
     Q1 -->|consume: batch| Agent
     Agent -->|read/write| DB
     Agent -->|result event| Q1
   \`\`\`

5. API SEQUENCE DIAGRAMS (Mermaid 'sequenceDiagram'):
   SOURCE: Phase 12 (Tech Architecture - API Routes)
   - Generate one diagram per critical API route (e.g., POST /api/deals, GET /api/users/:id)
   - Show all participants: Client, Gateway, Worker, Durable Object, Database, External APIs
   - MANDATORY: Include Context Token signing and validation (Plane 10 security)
   - Show sync calls (solid arrows), async calls (dotted arrows), responses, errors
   EXAMPLE:
   \`\`\`mermaid
   sequenceDiagram
     participant Client
     participant Gateway
     participant Worker
     participant AgentDO as Deal Agent DO
     participant DB as D1 Database

     Client->>Gateway: POST /api/deals {tenantId, data}
     Gateway->>Gateway: Sign Context Token (RS256, 60s TTL)
     Gateway->>Worker: Forward with X-Context-Token
     Worker->>Worker: Validate Context Token
     Worker->>AgentDO: RPC: analyzeDeal(data)
     AgentDO->>DB: INSERT INTO deals
     DB-->>AgentDO: {id: 123}
     AgentDO-->>Worker: {dealId: 123, status: "analyzing"}
     Worker-->>Gateway: 201 Created
     Gateway-->>Client: {dealId: 123}
   \`\`\`

6. DATABASE ER DIAGRAM (Mermaid 'erDiagram'):
   SOURCE: Phase 12 (Tech Architecture - Database Schema)
   - Show all entities (tables) with attributes
   - Mark primary keys (PK), foreign keys (FK), unique keys (UK)
   - Show relationships: one-to-one, one-to-many, many-to-many
   - Highlight multi-tenancy patterns (tenantId foreign keys)
   EXAMPLE:
   \`\`\`mermaid
   erDiagram
     TENANTS ||--o{ USERS : has
     TENANTS ||--o{ DEALS : has
     USERS ||--o{ DEALS : creates
     TENANTS {
       string id PK
       string name
       timestamp created_at
     }
     USERS {
       string id PK
       string tenant_id FK
       string email UK
       string name
     }
     DEALS {
       string id PK
       string tenant_id FK
       string user_id FK
       string status
       json data
     }
   \`\`\`

7. DEPLOYMENT ARCHITECTURE (Mermaid 'graph BT' or 'flowchart BT'):
   SOURCE: Phase 12 (Tech Architecture) + Phase 14 (Launch Execution)
   - Show all Cloudflare primitives: Workers, DOs, D1, R2, KV, Vectorize, Queues, Workflows, AI Gateway
   - Map service bindings and dependencies
   - Show deployment stages: parallelizable vs. sequential
   - Include external dependencies (third-party APIs, if any)
   EXAMPLE:
   \`\`\`mermaid
   graph BT
     Pages[Cloudflare Pages<br/>UI]
     Gateway[Gateway Worker]
     Agent[Deal Agent DO]
     DB[(D1 Database)]
     R2[(R2 Storage)]
     Queue[(Deal Queue)]
     AI[AI Gateway]

     Pages -->|fetch| Gateway
     Gateway -->|binding: DB| DB
     Gateway -->|binding: DEAL_AGENT| Agent
     Gateway -->|binding: DEAL_QUEUE| Queue
     Agent -->|binding: DB| DB
     Agent -->|binding: R2| R2
     Agent -->|binding: AI| AI
   \`\`\`

MERMAID SYNTAX REQUIREMENTS:
- Use valid Mermaid v10+ syntax that renders in GitHub, VS Code, and mermaid.live
- Escape special characters in labels: use <br/> for line breaks, avoid unescaped quotes
- Use subgraphs for grouping related nodes
- Apply classDefs for styling (completed, in-progress, pending, error, etc.)
- Use notes for important annotations (HITL gates, security boundaries, etc.)
- Prefer 'flowchart' over 'graph' (newer syntax with more features)

STRUCTURED OUTPUT REQUIREMENTS (Phase 3):
- For each diagram, populate BOTH legacy string format AND structured metadata
- Include sourcePhases array (which phases contributed data)
- Populate nodes/edges arrays for flowcharts (enables programmatic manipulation)
- Populate states/transitions arrays for state diagrams
- Populate participants/interactions arrays for sequence diagrams
- Populate entities/relationships arrays for ER diagrams
- Set renderHints: theme, width, height (optional but helpful)
- Populate metadata: complexity (simple/moderate/complex), nodeCount, edgeCount

CONDITIONAL GENERATION:
- Only generate Agent Topology if Phase 9 has agentGovernance (isAgenticSoftware === true)
- Only generate State Machines if Phase 12 has workflows defined
- Only generate Event Flows if Phase 12 has queues defined
- Only generate API Sequences for critical routes (authentication, core business logic, agent invocation)
- Only generate Database ER if Phase 12 has database schema with 2+ tables

SOURCE DATA SUMMARY:
- Count workflowsAnalyzed, agentsAnalyzed, apiRoutesAnalyzed, tasksAnalyzed, databaseTablesAnalyzed, queuesAnalyzed
- Set diagramsGenerated count
- Populate renderOrder array with recommended sequence for viewing diagrams

OUTPUT FORMAT:
Produce valid JSON matching the schema with ALL required fields populated. Ensure diagrams render correctly and provide visual verification for autonomous one-shot builds.`;
  }

  async run(ctx: AgentContext, _input: DiagramGenerationInput): Promise<AgentResult<DiagramGenerationOutput>> {
    const context = this.buildContextPrompt(ctx);

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Produce a comprehensive visual diagram suite for the system. Generate ALL applicable diagrams based on prior phase outputs.

PRIMARY DATA SOURCES:
- Phase 9 (Product Design): Agent governance → Agent Topology diagram
- Phase 12 (Tech Architecture): Database schema → Database ER diagram
- Phase 12 (Tech Architecture): API routes → API Sequence diagrams
- Phase 12 (Tech Architecture): Workflows → State Machine diagrams
- Phase 12 (Tech Architecture): Queues → Event Flow diagrams
- Phase 12 (Tech Architecture): Cloudflare bindings → Deployment Architecture diagram
- Phase 16 (Task Reconciliation): Tasks with dependencies → Task Dependency DAG

CRITICAL REQUIREMENTS:
1. Generate BOTH legacy format (diagrams object) AND structured format (structuredDiagrams object)
2. All Mermaid code must be syntactically correct and render without errors
3. Include Context Token validation in API sequence diagrams (Plane 10 security)
4. Highlight critical path in Task Dependency DAG
5. Show HITL gates and pause points in State Machine diagrams
6. Mark multi-tenancy patterns (tenantId FKs) in Database ER diagram
7. Populate all metadata: sourcePhases, renderHints, complexity, node/edge counts

${context}

Output valid JSON matching the schema. ALL fields must be populated with production-ready values.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.3, maxTokens: this.config.maxTokens ?? 8192 });
      const parsed = extractJSON(response);
      const output = DiagramGenerationOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("DiagramGeneratorAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}
