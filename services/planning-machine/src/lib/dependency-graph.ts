/**
 * Dependency graph utilities for TASKS.json.
 * Provides cycle detection and topological sort for task ordering.
 * Uses DFS (depth-first search) for both operations.
 */

export interface GraphNode {
  id: string;
  dependencies: string[];
}

export interface CycleDetectionResult {
  hasCycles: boolean;
  cycles: string[][];
}

export interface TopologicalSortResult {
  success: boolean;
  order: string[];
  /** Only populated if success is false — contains detected cycles */
  cycles: string[][];
}

/**
 * Detect cycles in a directed dependency graph using DFS.
 * Returns all detected cycles so they can be reported for fixing.
 */
export function detectCycles(nodes: GraphNode[]): CycleDetectionResult {
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const WHITE = 0; // not visited
  const GRAY = 1;  // in current DFS path (potential cycle)
  const BLACK = 2; // fully processed

  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const cycles: string[][] = [];

  for (const node of nodes) {
    color.set(node.id, WHITE);
    parent.set(node.id, null);
  }

  function dfs(nodeId: string): void {
    color.set(nodeId, GRAY);
    const node = nodeMap.get(nodeId);
    if (!node) return;

    for (const dep of node.dependencies) {
      if (!nodeMap.has(dep)) continue; // Skip references to non-existent tasks

      if (color.get(dep) === GRAY) {
        // Found a cycle — trace it back
        const cycle: string[] = [dep, nodeId];
        let cur: string | null | undefined = parent.get(nodeId);
        while (cur && cur !== dep) {
          cycle.push(cur);
          cur = parent.get(cur);
        }
        cycles.push(cycle.reverse());
      } else if (color.get(dep) === WHITE) {
        parent.set(dep, nodeId);
        dfs(dep);
      }
    }

    color.set(nodeId, BLACK);
  }

  for (const node of nodes) {
    if (color.get(node.id) === WHITE) {
      dfs(node.id);
    }
  }

  return { hasCycles: cycles.length > 0, cycles };
}

/**
 * Topological sort using Kahn's algorithm (BFS-based).
 * Returns tasks in an order where all dependencies come before dependents.
 * If a cycle exists, returns the cycle information instead of an order.
 */
export function topologicalSort(nodes: GraphNode[]): TopologicalSortResult {
  // First check for cycles
  const cycleCheck = detectCycles(nodes);
  if (cycleCheck.hasCycles) {
    return { success: false, order: [], cycles: cycleCheck.cycles };
  }

  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>(); // dependents of each node
  const nodeIds = new Set<string>(nodes.map((n) => n.id));

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const node of nodes) {
    for (const dep of node.dependencies) {
      if (!nodeIds.has(dep)) continue; // Skip missing deps
      const current = inDegree.get(node.id) ?? 0;
      inDegree.set(node.id, current + 1);
      const adj = adjacency.get(dep) ?? [];
      adj.push(node.id);
      adjacency.set(dep, adj);
    }
  }

  // Start with all nodes that have no dependencies
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    order.push(nodeId);

    for (const dependent of adjacency.get(nodeId) ?? []) {
      const newDegree = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  return { success: true, order, cycles: [] };
}

/**
 * Find the critical path through the dependency graph.
 * Returns the longest chain of task IDs.
 * For TASKS.json: the critical path is the sequence that, if delayed, delays the whole project.
 */
export function findCriticalPath(nodes: GraphNode[]): string[] {
  const sortResult = topologicalSort(nodes);
  if (!sortResult.success) return [];

  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Dynamic programming: longest path ending at each node
  const longest = new Map<string, number>();
  const predecessor = new Map<string, string | null>();

  for (const id of sortResult.order) {
    longest.set(id, 1);
    predecessor.set(id, null);
  }

  for (const id of sortResult.order) {
    const node = nodeMap.get(id);
    if (!node) continue;
    for (const dep of node.dependencies) {
      if (!nodeMap.has(dep)) continue;
      const candidate = (longest.get(dep) ?? 0) + 1;
      if (candidate > (longest.get(id) ?? 1)) {
        longest.set(id, candidate);
        predecessor.set(id, dep);
      }
    }
  }

  // Find the node with the maximum path length
  let maxLen = 0;
  let endNode = "";
  for (const [id, len] of longest) {
    if (len > maxLen) {
      maxLen = len;
      endNode = id;
    }
  }

  // Trace back the path
  const path: string[] = [];
  let cur: string | null | undefined = endNode;
  while (cur) {
    path.unshift(cur);
    cur = predecessor.get(cur);
  }

  return path;
}

/**
 * Assign build phases to tasks based on dependency resolution.
 * Tasks with no dependencies get phase 1 (or the minimum phase of their category).
 * Tasks with dependencies get max(dependency phase) + 1, capped at 8.
 *
 * Note: This is the algorithmic phase assignment — the reconciliation agent
 * applies domain-specific phase overrides (e.g., security tasks always in phase 6).
 */
export function assignBuildPhases(
  nodes: GraphNode[],
  categoryPhaseMap: Record<string, number>
): Map<string, number> {
  const sortResult = topologicalSort(nodes);
  if (!sortResult.success) {
    // On cycle, just use category-based phases as fallback
    const result = new Map<string, number>();
    for (const node of nodes) {
      const nodeWithCategory = node as GraphNode & { category?: string };
      const phase = nodeWithCategory.category
        ? (categoryPhaseMap[nodeWithCategory.category] ?? 3)
        : 3;
      result.set(node.id, phase);
    }
    return result;
  }

  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  const assignedPhase = new Map<string, number>();
  const nodeWithCategory = nodes as Array<GraphNode & { category?: string }>;
  const catMap = new Map(nodeWithCategory.map((n) => [n.id, n.category ?? "backend"]));

  for (const id of sortResult.order) {
    const node = nodeMap.get(id);
    if (!node) continue;

    const categoryPhase = categoryPhaseMap[catMap.get(id) ?? "backend"] ?? 3;
    const depMaxPhase = node.dependencies.reduce((max, dep) => {
      return Math.max(max, (assignedPhase.get(dep) ?? 0));
    }, 0);

    // Phase is max(category default, dependency max + 1), capped at 8
    const phase = Math.min(8, Math.max(categoryPhase, depMaxPhase + (node.dependencies.length > 0 ? 1 : 0)));
    assignedPhase.set(id, phase === 0 ? categoryPhase : phase);
  }

  return assignedPhase;
}

/** Standard build phase mapping by task category */
export const CATEGORY_BUILD_PHASE: Record<string, number> = {
  devops: 1,
  infrastructure: 1,
  database: 2,
  backend: 3,
  middleware: 3,
  security: 3,
  frontend: 4,
  integration: 5,
  testing: 6,
  copy: 7,
  seo: 7,
  content: 7,
  campaign: 7,
  social: 7,
  email: 7,
  marketing: 7,
  documentation: 6,
  "pr-review": 8,
  launch: 8,
};
