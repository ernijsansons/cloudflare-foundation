import { z } from "zod";

/**
 * Diagram Generation Schema (Phase 17)
 * Generates Mermaid diagrams for visualization of technical architecture
 *
 * Post-processing phase that consumes all prior phase outputs to create:
 * - State machine diagrams (from workflows)
 * - Event flow diagrams (from queues/events)
 * - Agent topology diagrams (from agent governance)
 * - Deployment tree (from launch execution + tech arch)
 * - Task dependency DAG (from task reconciliation)
 * - API sequence diagrams (from API routes)
 * - Database ER diagrams (from database schema)
 *
 * Enhanced for Phase 3 (Week 9) with structured metadata and rendering hints
 */

// Mermaid Diagram Types
export const MermaidDiagramTypeSchema = z.enum([
  "stateDiagram-v2",
  "flowchart",
  "graph",
  "sequenceDiagram",
  "classDiagram",
  "erDiagram",
  "journey",
  "gantt",
]);

export type MermaidDiagramType = z.infer<typeof MermaidDiagramTypeSchema>;

// Individual Diagram Schema (Enhanced)
export const DiagramSchema = z.object({
  name: z.string(),
  type: MermaidDiagramTypeSchema,
  description: z.string(),
  mermaidCode: z.string(), // Complete Mermaid syntax
  sourcePhases: z.array(z.string()).default([]), // Which phases contributed data to this diagram
  renderHints: z.object({
    theme: z.enum(["default", "forest", "dark", "neutral"]).default("default"),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  metadata: z.object({
    complexity: z.enum(["simple", "moderate", "complex"]).optional(),
    nodeCount: z.number().optional(),
    edgeCount: z.number().optional(),
  }).optional(),
});

export type Diagram = z.infer<typeof DiagramSchema>;

// Legacy format (backward compatibility)
export const DiagramOutputSchema = z.object({
  agentTopology: z.string(),     // Mermaid.js diagram of agents + tools
  taskDependencyGraph: z.string(), // Mermaid.js DAG of tasks
  workflowStates: z.string(),    // Mermaid.js state machine for workflows
  dataFlow: z.string(),         // Mermaid.js sequence diagram for key data flows
  deploymentArchitecture: z.string() // Mermaid.js deployment tree
});

// Enhanced Diagram Generation Output Schema (Phase 3)
export const DiagramGenerationOutputSchema = z.object({
  // Legacy format (for backward compatibility)
  diagrams: DiagramOutputSchema,
  visualSummary: z.string(), // Markdown summary of the system architecture

  // Enhanced structured format (Phase 3)
  structuredDiagrams: z.object({
    // Agent topology (from Product Design Phase 9 - Agent Governance)
    agentTopology: DiagramSchema.extend({
      type: z.enum(["flowchart", "graph"]),
      agents: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(["primary", "sub-agent", "supervisor", "worker"]),
        autonomyLevel: z.enum(["fully-autonomous", "supervised", "human-approval-required"]),
      })).default([]),
      communications: z.array(z.object({
        from: z.string(),
        to: z.string(),
        protocol: z.enum(["rpc", "queue", "event", "http"]),
        description: z.string().optional(),
      })).default([]),
      governancePattern: z.enum([
        "single-agent",
        "commander-scout",
        "supervisor-worker",
        "peer-swarm",
        "hierarchical",
      ]).optional(),
    }).optional(),

    // Task dependency DAG (from Task Reconciliation Phase 16)
    taskDependencyDAG: DiagramSchema.extend({
      type: z.enum(["flowchart", "graph"]),
      tasks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        status: z.enum(["pending", "in-progress", "completed", "blocked"]).default("pending"),
        estimatedEffort: z.string().optional(),
        phase: z.string().optional(),
      })).default([]),
      dependencies: z.array(z.object({
        taskId: z.string(),
        dependsOn: z.array(z.string()), // Task IDs this depends on
        dependencyType: z.enum(["hard", "soft", "informational"]).default("hard"),
      })).default([]),
      criticalPath: z.array(z.string()).optional(), // Task IDs on critical path
    }).optional(),

    // State machines (from Workflows - Tech Arch Phase 12)
    stateMachines: z.array(DiagramSchema.extend({
      type: z.literal("stateDiagram-v2"),
      stateMachine: z.object({
        name: z.string(),
        workflowName: z.string().optional(),
        initialState: z.string(),
        finalStates: z.array(z.string()).default([]),
        states: z.array(z.object({
          name: z.string(),
          type: z.enum(["simple", "composite", "choice", "fork", "join"]).default("simple"),
          description: z.string().optional(),
        })).default([]),
        transitions: z.array(z.object({
          from: z.string(),
          to: z.string(),
          event: z.string(),
          guard: z.string().optional(),
        })).default([]),
      }),
    })).default([]),

    // Event flows (from Queues + Events - Tech Arch Phase 12)
    eventFlows: z.array(DiagramSchema.extend({
      type: z.enum(["flowchart", "sequenceDiagram"]),
      flowDirection: z.enum(["TB", "BT", "LR", "RL"]).default("TB"),
      nodes: z.array(z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["process", "decision", "start", "end", "queue", "database", "api", "worker", "durable-object"]).default("process"),
      })).default([]),
      edges: z.array(z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().optional(),
        type: z.enum(["solid", "dotted", "thick"]).default("solid"),
      })).default([]),
    })).default([]),

    // Deployment architecture (from Launch Execution Phase 14 + Tech Arch Phase 12)
    deploymentTree: DiagramSchema.extend({
      type: z.enum(["flowchart", "graph"]),
      deploymentUnits: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum([
          "worker",
          "durable-object",
          "pages",
          "queue",
          "workflow",
          "d1-database",
          "r2-bucket",
          "kv-namespace",
          "vectorize-index",
          "ai-gateway",
        ]),
        dependencies: z.array(z.string()).default([]), // IDs of other deployment units
      })).default([]),
      deploymentStages: z.array(z.object({
        stage: z.string(),
        units: z.array(z.string()), // Unit IDs deployed in this stage
        parallelizable: z.boolean().default(false),
      })).default([]),
    }).optional(),

    // API sequence diagrams (from Tech Arch Phase 12 - API Routes)
    apiSequences: z.array(DiagramSchema.extend({
      type: z.literal("sequenceDiagram"),
      apiRoute: z.string().optional(), // e.g., "POST /api/deals"
      participants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(["client", "gateway", "worker", "durable-object", "database", "external-api", "queue"]),
      })).default([]),
      interactions: z.array(z.object({
        from: z.string(),
        to: z.string(),
        message: z.string(),
        type: z.enum(["sync-call", "async-call", "response", "error"]).default("sync-call"),
        note: z.string().optional(),
      })).default([]),
    })).default([]),

    // Database ER diagram (from Tech Arch Phase 12 - Database Schema)
    databaseER: DiagramSchema.extend({
      type: z.literal("erDiagram"),
      entities: z.array(z.object({
        name: z.string(),
        attributes: z.array(z.object({
          name: z.string(),
          type: z.string(),
          key: z.enum(["PK", "FK", "UK", "none"]).default("none"),
        })).default([]),
      })).default([]),
      relationships: z.array(z.object({
        from: z.string(),
        to: z.string(),
        cardinality: z.enum(["one-to-one", "one-to-many", "many-to-many"]),
        label: z.string().optional(),
      })).default([]),
    }).optional(),
  }).optional(),

  // Metadata
  diagramsGenerated: z.number().default(0),
  renderInstructions: z.object({
    recommendedRenderer: z.enum(["mermaid-js", "mermaid-cli", "kroki"]).default("mermaid-js"),
    renderOrder: z.array(z.string()).default([]), // Diagram names in recommended render order
    exportFormats: z.array(z.enum(["svg", "png", "pdf"])).default(["svg"]),
  }).optional(),

  // Source data summary
  sourceDataSummary: z.object({
    workflowsAnalyzed: z.number().default(0),
    agentsAnalyzed: z.number().default(0),
    apiRoutesAnalyzed: z.number().default(0),
    tasksAnalyzed: z.number().default(0),
    databaseTablesAnalyzed: z.number().default(0),
    queuesAnalyzed: z.number().default(0),
  }).optional(),
}).passthrough();

export type DiagramGenerationOutput = z.infer<typeof DiagramGenerationOutputSchema>;

// Helper type for phase input (consumes all prior phases)
export interface DiagramGenerationInput {
  idea: string;
  // All prior phase outputs are available via RAG context
}
