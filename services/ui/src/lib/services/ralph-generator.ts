/**
 * Ralph Loop JSON Generator
 *
 * Generates structured JSON payload for handoff to Ralph build agent.
 * Contains all execution details needed for implementation.
 */

import type { PhaseName, PlanningArtifact } from "$lib/types";
import type { DepartmentView } from "$lib/types/bible";

/**
 * Ralph Loop Payload Schema
 */
export interface RalphLoopPayload {
  metadata: {
    generatedAt: number;
    planningRunId: string;
    confidence: number;
    completeness: number;
  };

  product: {
    vision: string;
    features: FeatureSpec[];
    mvpScope: string[];
  };

  technical: {
    architecture: {
      services: ServiceSpec[];
      cloudflareStack: CloudflareBinding[];
      dataModel: DataModelSpec;
    };
    api: {
      endpoints: APIEndpoint[];
      authentication: AuthSpec;
    };
  };

  business: {
    model: string;
    pricing: PricingTier[];
    metrics: MetricDefinition[];
  };

  execution: {
    tasks: TaskSpec[];
    dependencies: TaskDependency[];
    milestones: Milestone[];
  };

  validation: {
    killConditions: KillCondition[];
    assumptions: Assumption[];
  };
}

export interface FeatureSpec {
  id: string;
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface ServiceSpec {
  name: string;
  type: "worker" | "pages" | "durable-object";
  description: string;
}

export interface CloudflareBinding {
  name: string;
  type: "kv" | "d1" | "r2" | "queue" | "durable-object" | "ai";
}

export interface DataModelSpec {
  entities: Entity[];
  relationships: Relationship[];
}

export interface Entity {
  name: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  required: boolean;
}

export interface Relationship {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
}

export interface APIEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
}

export interface AuthSpec {
  type: "jwt" | "session" | "api-key" | "none";
  provider?: string;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
}

export interface MetricDefinition {
  name: string;
  description: string;
  type: "counter" | "gauge" | "histogram";
}

export interface TaskSpec {
  id: string;
  title: string;
  description: string;
  phase: string;
}

export interface TaskDependency {
  task: string;
  dependsOn: string[];
}

export interface Milestone {
  name: string;
  target: string;
  criteria: string[];
}

export interface KillCondition {
  condition: string;
  severity: "critical" | "major" | "minor";
}

export interface Assumption {
  assumption: string;
  validation: string;
}

/**
 * Generates Ralph Loop JSON payload from planning artifacts.
 *
 * @param artifacts - Map of phase artifacts
 * @param runId - Planning run ID
 * @returns Ralph Loop payload
 */
export function generateRalphLoopJSON(
  artifacts: Record<PhaseName, PlanningArtifact>,
  runId: string
): RalphLoopPayload {
  // Extract all phase content
  const opportunity = artifacts["opportunity"]?.content || {};
  const customerIntel = artifacts["customer-intel"]?.content || {};
  const marketResearch = artifacts["market-research"]?.content || {};
  const competitiveIntel = artifacts["competitive-intel"]?.content || {};
  const strategy = artifacts["strategy"]?.content || {};
  const businessModel = artifacts["business-model"]?.content || {};
  const revenueExpansion = artifacts["revenue-expansion"]?.content || {};
  const productDesign = artifacts["product-design"]?.content || {};
  const techArch = artifacts["tech-arch"]?.content || {};
  const gtm = artifacts["gtm"]?.content || {};
  const contentEngine = artifacts["content-engine"]?.content || {};
  const analytics = artifacts["analytics"]?.content || {};
  const launchExecution = artifacts["launch-execution"]?.content || {};
  const killTest = artifacts["kill-test"]?.content || {};
  const synthesis = artifacts["synthesis"]?.content || {};
  const taskRecon = artifacts["task-reconciliation"]?.content || {};

  return {
    metadata: {
      generatedAt: Date.now(),
      planningRunId: runId,
      confidence: calculateAverageConfidence(artifacts),
      completeness: calculateTotalCompleteness(artifacts),
    },

    product: {
      vision: extractProductVision(productDesign, synthesis, opportunity),
      features: extractFeatures(productDesign, taskRecon),
      mvpScope: extractMVPScope(productDesign, strategy),
    },

    technical: {
      architecture: {
        services: extractServices(techArch),
        cloudflareStack: extractCloudflareBindings(techArch),
        dataModel: extractDataModel(techArch),
      },
      api: {
        endpoints: extractEndpoints(techArch),
        authentication: extractAuth(techArch),
      },
    },

    business: {
      model: extractBusinessModel(businessModel, revenueExpansion),
      pricing: extractPricingTiers(businessModel, revenueExpansion),
      metrics: extractMetrics(analytics, gtm),
    },

    execution: {
      tasks: extractTasks(taskRecon),
      dependencies: extractDependencies(taskRecon),
      milestones: extractMilestones(taskRecon, launchExecution),
    },

    validation: {
      killConditions: extractKillConditions(killTest),
      assumptions: extractAssumptions(killTest, strategy),
    },
  };
}

// ─── Helper Extraction Functions ─────────────────────────────────────────────

function extractString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === "string" ? value : undefined;
}

function extractArray(obj: Record<string, unknown>, key: string): string[] | undefined {
  const value = obj[key];
  return Array.isArray(value) ? value : undefined;
}

// ─── Product Extraction ───────────────────────────────────────────────────────

function extractProductVision(
  productDesign: Record<string, unknown>,
  synthesis: Record<string, unknown>,
  opportunity: Record<string, unknown>
): string {
  // Try product design first
  const pdVision = extractString(productDesign, "vision");
  if (pdVision) return pdVision;

  // Try synthesis executive summary
  const execSummary = extractString(synthesis, "executiveSummary");
  if (execSummary) return execSummary;

  // Fall back to opportunity key insight
  const keyInsight = extractString(opportunity, "keyInsight");
  if (keyInsight) return keyInsight;

  return "";
}

function extractFeatures(
  productDesign: Record<string, unknown>,
  taskRecon: Record<string, unknown>
): FeatureSpec[] {
  const features: FeatureSpec[] = [];

  // Extract from product design appPages
  const appPages = productDesign.appPages;
  if (Array.isArray(appPages)) {
    appPages.forEach((page: unknown, i: number) => {
      if (typeof page === "object" && page !== null) {
        const pageObj = page as Record<string, unknown>;
        features.push({
          id: `feature-page-${i}`,
          name: extractString(pageObj, "title") || extractString(pageObj, "name") || `Page ${i + 1}`,
          description: extractString(pageObj, "description") || extractString(pageObj, "purpose") || "",
          priority: determinePriority(extractString(pageObj, "priority")),
        });
      }
    });
  }

  // Extract from task reconciliation frontend tasks
  const tasks = taskRecon.tasks;
  if (Array.isArray(tasks)) {
    const frontendTasks = tasks.filter((t: unknown) => {
      if (typeof t === "object" && t !== null) {
        const task = t as Record<string, unknown>;
        return task.category === "frontend";
      }
      return false;
    });

    frontendTasks.forEach((task: unknown, i: number) => {
      if (typeof task === "object" && task !== null) {
        const taskObj = task as Record<string, unknown>;
        features.push({
          id: extractString(taskObj, "id") || `feature-task-${i}`,
          name: extractString(taskObj, "title") || "",
          description: extractString(taskObj, "description") || "",
          priority: determinePriority(extractString(taskObj, "priority")),
        });
      }
    });
  }

  return features;
}

function extractMVPScope(
  productDesign: Record<string, unknown>,
  strategy: Record<string, unknown>
): string[] {
  const scope: string[] = [];

  // Extract from product design mvpScope
  const pdScope = productDesign.mvpScope;
  if (typeof pdScope === "string") {
    scope.push(pdScope);
  } else if (Array.isArray(pdScope)) {
    scope.push(...pdScope.filter((s): s is string => typeof s === "string"));
  } else if (typeof pdScope === "object" && pdScope !== null) {
    const scopeObj = pdScope as Record<string, unknown>;
    Object.values(scopeObj).forEach((val) => {
      if (typeof val === "string") scope.push(val);
    });
  }

  // Extract from strategy thesis
  const thesis = extractString(strategy, "thesis");
  if (thesis) scope.push(`Strategic Thesis: ${thesis}`);

  return scope;
}

function determinePriority(priority: string | undefined): "high" | "medium" | "low" {
  if (!priority) return "medium";
  const lower = priority.toLowerCase();
  if (lower.includes("p0") || lower.includes("high") || lower.includes("critical")) return "high";
  if (lower.includes("p3") || lower.includes("low")) return "low";
  return "medium";
}

// ─── Technical Extraction ─────────────────────────────────────────────────────

function extractServices(techArch: Record<string, unknown>): ServiceSpec[] {
  const services: ServiceSpec[] = [];

  // Extract from workflows
  const workflows = techArch.workflows;
  if (Array.isArray(workflows)) {
    workflows.forEach((w: unknown) => {
      if (typeof w === "object" && w !== null) {
        const workflow = w as Record<string, unknown>;
        services.push({
          name: extractString(workflow, "name") || "Unnamed Workflow",
          type: "worker",
          description: extractString(workflow, "description") || "Temporal workflow",
        });
      } else if (typeof w === "string") {
        services.push({
          name: w,
          type: "worker",
          description: "Temporal workflow",
        });
      }
    });
  }

  // Extract from durableObjects
  const durableObjects = techArch.durableObjects;
  if (Array.isArray(durableObjects)) {
    durableObjects.forEach((d: unknown) => {
      if (typeof d === "object" && d !== null) {
        const dobj = d as Record<string, unknown>;
        services.push({
          name: extractString(dobj, "name") || "Unnamed Durable Object",
          type: "durable-object",
          description: extractString(dobj, "description") || "Durable Object",
        });
      } else if (typeof d === "string") {
        services.push({
          name: d,
          type: "durable-object",
          description: "Durable Object",
        });
      }
    });
  }

  // Extract from sveltekitRoutes for Pages
  const routes = techArch.sveltekitRoutes;
  if (Array.isArray(routes) && routes.length > 0) {
    services.push({
      name: "SvelteKit Pages Application",
      type: "pages",
      description: `SvelteKit application with ${routes.length} routes`,
    });
  }

  return services;
}

function extractCloudflareBindings(techArch: Record<string, unknown>): CloudflareBinding[] {
  const bindings: CloudflareBinding[] = [];

  // Parse wranglerChanges for bindings
  const wranglerChanges = techArch.wranglerChanges;
  if (typeof wranglerChanges === "object" && wranglerChanges !== null) {
    const wrangler = wranglerChanges as Record<string, unknown>;

    // KV namespaces
    if (Array.isArray(wrangler.kv_namespaces)) {
      wrangler.kv_namespaces.forEach((kv: unknown) => {
        if (typeof kv === "object" && kv !== null) {
          const kvObj = kv as Record<string, unknown>;
          bindings.push({
            name: extractString(kvObj, "binding") || "KV",
            type: "kv",
          });
        }
      });
    }

    // D1 databases
    if (Array.isArray(wrangler.d1_databases)) {
      wrangler.d1_databases.forEach((d1: unknown) => {
        if (typeof d1 === "object" && d1 !== null) {
          const d1Obj = d1 as Record<string, unknown>;
          bindings.push({
            name: extractString(d1Obj, "binding") || "DB",
            type: "d1",
          });
        }
      });
    }

    // R2 buckets
    if (Array.isArray(wrangler.r2_buckets)) {
      wrangler.r2_buckets.forEach((r2: unknown) => {
        if (typeof r2 === "object" && r2 !== null) {
          const r2Obj = r2 as Record<string, unknown>;
          bindings.push({
            name: extractString(r2Obj, "binding") || "BUCKET",
            type: "r2",
          });
        }
      });
    }

    // Queues
    if (Array.isArray(wrangler.queues)) {
      wrangler.queues.forEach((q: unknown) => {
        if (typeof q === "object" && q !== null) {
          const qObj = q as Record<string, unknown>;
          bindings.push({
            name: extractString(qObj, "binding") || "QUEUE",
            type: "queue",
          });
        }
      });
    }

    // AI bindings
    if (wrangler.ai) {
      bindings.push({
        name: "AI",
        type: "ai",
      });
    }
  }

  return bindings;
}

function extractDataModel(techArch: Record<string, unknown>): DataModelSpec {
  const entities: Entity[] = [];
  const relationships: Relationship[] = [];

  const databaseSchema = techArch.databaseSchema;
  if (typeof databaseSchema === "object" && databaseSchema !== null) {
    const schema = databaseSchema as Record<string, unknown>;

    // Try to extract tables
    const tables = schema.tables;
    if (Array.isArray(tables)) {
      tables.forEach((table: unknown) => {
        if (typeof table === "object" && table !== null) {
          const tableObj = table as Record<string, unknown>;
          const fields: Field[] = [];

          const columns = tableObj.columns;
          if (Array.isArray(columns)) {
            columns.forEach((col: unknown) => {
              if (typeof col === "object" && col !== null) {
                const colObj = col as Record<string, unknown>;
                fields.push({
                  name: extractString(colObj, "name") || "",
                  type: extractString(colObj, "type") || "text",
                  required: colObj.required === true || colObj.notNull === true,
                });
              }
            });
          }

          entities.push({
            name: extractString(tableObj, "name") || "unknown",
            fields,
          });
        }
      });
    }
  }

  return { entities, relationships };
}

function extractEndpoints(techArch: Record<string, unknown>): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];

  const apiRoutes = techArch.apiRoutes;
  if (Array.isArray(apiRoutes)) {
    apiRoutes.forEach((route: unknown) => {
      if (typeof route === "object" && route !== null) {
        const routeObj = route as Record<string, unknown>;
        endpoints.push({
          path: extractString(routeObj, "path") || "/api/unknown",
          method: (extractString(routeObj, "method") as "GET" | "POST" | "PUT" | "DELETE" | "PATCH") || "GET",
          description: extractString(routeObj, "description") || "",
        });
      } else if (typeof route === "string") {
        // Parse string like "POST /api/auth/register"
        const parts = route.split(" ");
        if (parts.length === 2) {
          endpoints.push({
            path: parts[1],
            method: parts[0] as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
            description: "",
          });
        } else {
          endpoints.push({
            path: route,
            method: "GET",
            description: "",
          });
        }
      }
    });
  }

  return endpoints;
}

function extractAuth(techArch: Record<string, unknown>): AuthSpec {
  const authFlow = techArch.authFlowDecisions;

  if (typeof authFlow === "object" && authFlow !== null) {
    const auth = authFlow as Record<string, unknown>;
    const authType = extractString(auth, "type") || extractString(auth, "method");

    if (authType) {
      const lower = authType.toLowerCase();
      if (lower.includes("jwt")) {
        return {
          type: "jwt",
          provider: extractString(auth, "provider"),
        };
      }
      if (lower.includes("session")) {
        return {
          type: "session",
        };
      }
      if (lower.includes("api-key") || lower.includes("apikey")) {
        return {
          type: "api-key",
        };
      }
      if (lower.includes("none") || lower.includes("public")) {
        return {
          type: "none",
        };
      }
    }
  }

  // Default to JWT
  return {
    type: "jwt",
  };
}

// ─── Business Extraction ──────────────────────────────────────────────────────

function extractBusinessModel(
  businessModel: Record<string, unknown>,
  revenueExpansion: Record<string, unknown>
): string {
  // Try business model type
  const modelType = extractString(businessModel, "modelType");
  if (modelType) return modelType;

  // Try revenue model
  const revenueModel = extractString(businessModel, "revenueModel");
  if (revenueModel) return revenueModel;

  // Try primary model from revenue expansion
  const primaryModel = extractString(revenueExpansion, "primaryModel");
  if (primaryModel) return primaryModel;

  return "Unknown";
}

function extractPricingTiers(
  businessModel: Record<string, unknown>,
  revenueExpansion: Record<string, unknown>
): PricingTier[] {
  const tiers: PricingTier[] = [];

  // Extract from business model
  const bmTiers = businessModel.pricingTiers;
  if (Array.isArray(bmTiers)) {
    bmTiers.forEach((t: unknown) => {
      if (typeof t === "object" && t !== null) {
        const tier = t as Record<string, unknown>;
        tiers.push({
          name: extractString(tier, "name") || "Unnamed Tier",
          price: typeof tier.price === "number" ? tier.price : 0,
          features: Array.isArray(tier.features)
            ? tier.features.filter((f): f is string => typeof f === "string")
            : [],
        });
      } else if (typeof t === "string") {
        tiers.push({
          name: t,
          price: 0,
          features: [],
        });
      }
    });
  }

  // Extract from revenue expansion
  const reTiers = revenueExpansion.tiers || revenueExpansion.pricingTiers;
  if (Array.isArray(reTiers) && tiers.length === 0) {
    reTiers.forEach((t: unknown) => {
      if (typeof t === "object" && t !== null) {
        const tier = t as Record<string, unknown>;
        tiers.push({
          name: extractString(tier, "name") || "Unnamed Tier",
          price: typeof tier.price === "number" ? tier.price : 0,
          features: Array.isArray(tier.features)
            ? tier.features.filter((f): f is string => typeof f === "string")
            : [],
        });
      }
    });
  }

  return tiers;
}

function extractMetrics(
  analytics: Record<string, unknown>,
  gtm: Record<string, unknown>
): MetricDefinition[] {
  const metrics: MetricDefinition[] = [];

  // Extract from analytics KPIs
  const kpis = analytics.kpis;
  if (Array.isArray(kpis)) {
    kpis.forEach((k: unknown) => {
      if (typeof k === "object" && k !== null) {
        const kpi = k as Record<string, unknown>;
        metrics.push({
          name: extractString(kpi, "name") || "Unnamed KPI",
          description: extractString(kpi, "description") || "",
          type: determineMetricType(extractString(kpi, "type")),
        });
      } else if (typeof k === "string") {
        metrics.push({
          name: k,
          description: "",
          type: "counter",
        });
      }
    });
  }

  // Extract from analytics dashboard metrics
  const dashboardMetrics = analytics.dashboardMetrics;
  if (Array.isArray(dashboardMetrics)) {
    dashboardMetrics.forEach((m: unknown) => {
      if (typeof m === "object" && m !== null) {
        const metric = m as Record<string, unknown>;
        metrics.push({
          name: extractString(metric, "name") || "Unnamed Metric",
          description: extractString(metric, "description") || "",
          type: determineMetricType(extractString(metric, "type")),
        });
      }
    });
  }

  // Extract from GTM success metrics
  const gtmMetrics = gtm.successMetrics;
  if (Array.isArray(gtmMetrics)) {
    gtmMetrics.forEach((m: unknown) => {
      if (typeof m === "object" && m !== null) {
        const metric = m as Record<string, unknown>;
        const name = extractString(metric, "name");
        // Avoid duplicates
        if (name && !metrics.some((existing) => existing.name === name)) {
          metrics.push({
            name,
            description: extractString(metric, "description") || extractString(metric, "target") || "",
            type: "gauge",
          });
        }
      }
    });
  }

  return metrics;
}

function determineMetricType(type: string | undefined): "counter" | "gauge" | "histogram" {
  if (!type) return "counter";
  const lower = type.toLowerCase();
  if (lower.includes("histogram") || lower.includes("distribution")) return "histogram";
  if (lower.includes("gauge") || lower.includes("current") || lower.includes("rate")) return "gauge";
  return "counter";
}

// ─── Execution Extraction ─────────────────────────────────────────────────────

function extractTasks(taskRecon: Record<string, unknown>): TaskSpec[] {
  const tasks: TaskSpec[] = [];

  // Extract code tasks
  const codeTasks = taskRecon.tasks;
  if (Array.isArray(codeTasks)) {
    codeTasks.forEach((t: unknown) => {
      if (typeof t === "object" && t !== null) {
        const task = t as Record<string, unknown>;
        tasks.push({
          id: extractString(task, "id") || `task-${tasks.length}`,
          title: extractString(task, "title") || "Unnamed Task",
          description: extractString(task, "description") || "",
          phase: extractString(task, "sourcePhase") || extractString(task, "category") || "unknown",
        });
      }
    });
  }

  // Extract marketing tasks
  const marketingTasks = taskRecon.marketingTasks;
  if (Array.isArray(marketingTasks)) {
    marketingTasks.forEach((t: unknown) => {
      if (typeof t === "object" && t !== null) {
        const task = t as Record<string, unknown>;
        tasks.push({
          id: extractString(task, "id") || `marketing-task-${tasks.length}`,
          title: extractString(task, "title") || "Unnamed Marketing Task",
          description: extractString(task, "description") || "",
          phase: "marketing",
        });
      }
    });
  }

  return tasks;
}

function extractDependencies(taskRecon: Record<string, unknown>): TaskDependency[] {
  const dependencies: TaskDependency[] = [];

  const codeTasks = taskRecon.tasks;
  if (Array.isArray(codeTasks)) {
    codeTasks.forEach((t: unknown) => {
      if (typeof t === "object" && t !== null) {
        const task = t as Record<string, unknown>;
        const taskId = extractString(task, "id");
        const deps = task.dependencies;

        if (taskId && Array.isArray(deps) && deps.length > 0) {
          const depStrings = deps.filter((d): d is string => typeof d === "string");
          if (depStrings.length > 0) {
            dependencies.push({
              task: taskId,
              dependsOn: depStrings,
            });
          }
        }
      }
    });
  }

  return dependencies;
}

function extractMilestones(
  taskRecon: Record<string, unknown>,
  launchExecution: Record<string, unknown>
): Milestone[] {
  const milestones: Milestone[] = [];

  // Extract from build phases
  const buildPhases = taskRecon.buildPhases;
  if (Array.isArray(buildPhases)) {
    buildPhases.forEach((phase: unknown) => {
      if (typeof phase === "object" && phase !== null) {
        const p = phase as Record<string, unknown>;
        const name = extractString(p, "name");
        if (name) {
          milestones.push({
            name,
            target: `Complete Build Phase ${p.id || ""}`,
            criteria: [`All tasks in ${name} completed`],
          });
        }
      }
    });
  }

  // Extract from launch execution 90-day plan
  const ninetyDayPlan = launchExecution.ninetyDayPlan;
  if (typeof ninetyDayPlan === "object" && ninetyDayPlan !== null) {
    const plan = ninetyDayPlan as Record<string, unknown>;

    // Try milestones array
    const planMilestones = plan.milestones;
    if (Array.isArray(planMilestones)) {
      planMilestones.forEach((m: unknown) => {
        if (typeof m === "object" && m !== null) {
          const milestone = m as Record<string, unknown>;
          milestones.push({
            name: extractString(milestone, "name") || "Unnamed Milestone",
            target: extractString(milestone, "target") || extractString(milestone, "date") || "",
            criteria: Array.isArray(milestone.criteria)
              ? milestone.criteria.filter((c): c is string => typeof c === "string")
              : [],
          });
        }
      });
    }
  }

  return milestones;
}

// ─── Validation Extraction ────────────────────────────────────────────────────

function extractKillConditions(killTest: Record<string, unknown>): KillCondition[] {
  const conditions: KillCondition[] = [];

  const killConditions = killTest.killConditions;
  if (Array.isArray(killConditions)) {
    killConditions.forEach((c: unknown) => {
      if (typeof c === "object" && c !== null) {
        const cond = c as Record<string, unknown>;
        conditions.push({
          condition: extractString(cond, "condition") || extractString(cond, "description") || "",
          severity: determineSeverity(extractString(cond, "severity")),
        });
      } else if (typeof c === "string") {
        conditions.push({
          condition: c,
          severity: "major",
        });
      }
    });
  }

  return conditions;
}

function extractAssumptions(
  killTest: Record<string, unknown>,
  strategy: Record<string, unknown>
): Assumption[] {
  const assumptions: Assumption[] = [];

  // Extract from kill test
  const ktAssumptions = killTest.assumptions;
  if (Array.isArray(ktAssumptions)) {
    ktAssumptions.forEach((a: unknown) => {
      if (typeof a === "object" && a !== null) {
        const assumption = a as Record<string, unknown>;
        assumptions.push({
          assumption: extractString(assumption, "assumption") || extractString(assumption, "description") || "",
          validation: extractString(assumption, "validation") || extractString(assumption, "test") || "",
        });
      } else if (typeof a === "string") {
        assumptions.push({
          assumption: a,
          validation: "",
        });
      }
    });
  }

  // Extract from strategy assumptions
  const stratAssumptions = strategy.assumptions;
  if (Array.isArray(stratAssumptions)) {
    stratAssumptions.forEach((a: unknown) => {
      if (typeof a === "object" && a !== null) {
        const assumption = a as Record<string, unknown>;
        const assumptionText = extractString(assumption, "assumption") || extractString(assumption, "description");
        // Avoid duplicates
        if (assumptionText && !assumptions.some((existing) => existing.assumption === assumptionText)) {
          assumptions.push({
            assumption: assumptionText,
            validation: extractString(assumption, "validation") || "",
          });
        }
      } else if (typeof a === "string") {
        // Avoid duplicates
        if (!assumptions.some((existing) => existing.assumption === a)) {
          assumptions.push({
            assumption: a,
            validation: "",
          });
        }
      }
    });
  }

  return assumptions;
}

function determineSeverity(severity: string | undefined): "critical" | "major" | "minor" {
  if (!severity) return "major";
  const lower = severity.toLowerCase();
  if (lower.includes("critical") || lower.includes("blocking") || lower.includes("p0")) return "critical";
  if (lower.includes("minor") || lower.includes("p3") || lower.includes("low")) return "minor";
  return "major";
}

function calculateAverageConfidence(artifacts: Record<PhaseName, PlanningArtifact>): number {
  const scores = Object.values(artifacts)
    .map((a) => a.overall_score)
    .filter((s): s is number => typeof s === "number");

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

function calculateTotalCompleteness(artifacts: Record<PhaseName, PlanningArtifact>): number {
  const totalPhases = 16; // All phases
  const completedPhases = Object.keys(artifacts).length;
  return Math.round((completedPhases / totalPhases) * 100);
}
