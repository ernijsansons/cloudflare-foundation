-- Global Claw Documentation - Corrected Seed (matches TypeScript interfaces)
-- Project ID: run-global-claw-2026

-- Clear existing data for this project
DELETE FROM project_documentation WHERE project_id = 'run-global-claw-2026';

-- Overview Section (matches OverviewSection interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-overview-001',
  'run-global-claw-2026',
  'overview',
  NULL,
  '{
    "executive_summary": {
      "concept": "Global Claw - Autonomous arcade prize fulfillment network transforming claw machines into AI-verified, blockchain-settled prize delivery systems",
      "status": "in-progress",
      "completeness": 78,
      "key_metrics": {
        "target_machines": "10,000+",
        "avg_prize_value": "$15-50",
        "settlement_time": "<24 hours",
        "success_rate_target": "95%"
      }
    },
    "quick_stats": {
      "budget": "$150,000 - $200,000",
      "timeline": "16 weeks to MVP",
      "north_star_metric": "Verified Prize Deliveries per Month",
      "current_phase": "Phase 2: Core Infrastructure"
    },
    "health_indicators": {
      "documentation_complete": true,
      "unknowns_resolved": true,
      "checklist_progress": 65,
      "security_coverage": 80
    },
    "critical_path": {
      "next_milestone": "Machine Vision Integration",
      "blockers": ["Hardware partner selection pending"],
      "dependencies": ["Edge compute deployment", "Prize verification model training"]
    },
    "quick_actions": [
      {"label": "View Architecture", "link": "#section-D"},
      {"label": "Check Roadmap", "link": "#section-M"},
      {"label": "Security Audit", "link": "#section-J"}
    ]
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section A: Assumptions + Inputs (matches SectionA interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-a-001',
  'run-global-claw-2026',
  'A',
  NULL,
  '{
    "A0_intake": {
      "concept": {
        "codename": "Global Claw",
        "thesis": "Transform arcade claw machines into autonomous prize fulfillment systems with AI verification and instant settlement",
        "target_icp": "Arcade operators with 50+ machines seeking to modernize operations and increase revenue",
        "core_directive": "Verify prize wins via computer vision, process settlements via blockchain, deliver prizes autonomously",
        "why_now": "Edge AI costs dropped 80%, blockchain settlement is mature, arcade industry ready for automation"
      },
      "outcome_unit": {
        "definition": "One verified prize delivery from machine grab to customer doorstep",
        "proof_artifact": "Video verification + delivery confirmation + blockchain receipt",
        "time_to_first_outcome": "< 30 seconds for verification, < 24 hours for delivery",
        "frequency": "Continuous - thousands per day at scale",
        "current_cost": "$3-5 per manual verification, $8-12 for fulfillment"
      },
      "agentic_execution": {
        "allowed_actions": ["verify_grab", "process_settlement", "initiate_shipping", "customer_notification", "refund_processing"],
        "forbidden_actions": ["manual_override_without_audit", "direct_payment_modification", "delete_verification_records"],
        "hitl_threshold": ["disputed_verification", "high_value_prize_over_$100", "system_anomaly_detected"],
        "required_integrations": ["ShipStation API", "Stripe Connect", "Twilio", "Cloudflare Stream"],
        "external_side_effects": ["payment_transfers", "shipping_labels", "sms_notifications"]
      },
      "data_trust": {
        "input_sources": [
          {"source": "Machine camera feeds", "licensing": "Operator agreement"},
          {"source": "Player payment data", "licensing": "PCI-DSS compliant processor"},
          {"source": "Prize inventory", "licensing": "Operator provided"}
        ],
        "output_data_types": ["verification_results", "settlement_records", "shipping_manifests"],
        "data_sensitivity": "financial",
        "retention_requirements": "7 years for financial records, 90 days for video",
        "ground_truth": "Video evidence + blockchain settlement receipt"
      },
      "constraints": {
        "budget_cap": "$200,000 initial build",
        "timeline": "16 weeks to MVP",
        "geography": "US-first, then international",
        "compliance_bar": "SOC2-ready",
        "performance_bar": "< 500ms verification, 99.9% uptime"
      },
      "monetization": {
        "who_pays": "Arcade operators (SaaS) + transaction fees",
        "pricing_anchor": "Cost savings vs manual verification",
        "sales_motion": "sales-led",
        "value_metric": "verified_prize_deliveries"
      },
      "success_kill_switches": {
        "north_star": "10,000 verified deliveries/month by month 6",
        "supporting_metrics": ["Verification accuracy > 98%", "Settlement time < 5 seconds", "Customer satisfaction > 4.5"],
        "kill_conditions": ["Accuracy below 90% after 30 days", "Unit economics negative after 90 days", "Zero operator signups after 60 days"],
        "30_day_done": "3 operators onboarded, 500 verified deliveries",
        "90_day_done": "20 operators, 5,000 deliveries/month, positive unit economics"
      }
    },
    "A1_unknowns": {
      "core_directive": "RESOLVED",
      "hitl_threshold": "RESOLVED",
      "tooling_data_gravity": "RESOLVED - Cloudflare edge for low latency",
      "memory_horizon": "RESOLVED - 90 day video, 7 year financial",
      "verification_standard": "RESOLVED - 98% accuracy threshold"
    },
    "A2_invariants": {
      "no_raw_destructive_ops": true,
      "idempotent_side_effects": true,
      "auditable_receipts": true,
      "llm_gateway": "Workers AI + AI Gateway",
      "fail_closed": true
    }
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section B: North Star (matches SectionB interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-b-001',
  'run-global-claw-2026',
  'B',
  NULL,
  '{
    "business_statement": {
      "statement": "Global Claw transforms arcade prize fulfillment from manual chaos into autonomous verified delivery",
      "target_outcome": "Arcade operators increase revenue 40% while reducing operational costs 60%",
      "proof_of_value": "Video-verified prize grab + blockchain settlement + doorstep delivery confirmation"
    },
    "differentiation": {
      "persistent_stateful_agents": true,
      "verifiable_outcomes": true,
      "secure_execution": true,
      "durable_orchestration": true,
      "cost_controlled": true,
      "custom_differentiators": [
        "Real-time computer vision verification",
        "Sub-second blockchain settlement",
        "Integrated shipping fulfillment",
        "Zero-trust audit trail"
      ]
    },
    "monetization_model": {
      "model_type": "hybrid",
      "platform_fee": "$299/month per location + 2.5% transaction fee",
      "bundles": ["Starter (10 machines)", "Growth (50 machines)", "Enterprise (unlimited)"],
      "higher_tiers": ["White-label option", "Custom integrations", "Dedicated support"]
    },
    "success_metrics": {
      "north_star": "Verified Prize Deliveries per Month",
      "autonomous_success_rate_target": 95,
      "cost_per_outcome_target": "$1.50 per verified delivery",
      "time_to_outcome_targets": {
        "p50": "18 hours to delivery",
        "p95": "48 hours to delivery"
      },
      "hitl_override_rate_target": 5
    }
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section C: Master Checklist (matches SectionC interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-c-001',
  'run-global-claw-2026',
  'C',
  NULL,
  '{
    "C1_agent_definition": [
      {"id": "C1-001", "task": "Define VerificationAgent DO", "dod": "Agent verifies prize grabs via ML model", "owner": "AI Team", "tools": "Workers AI, Durable Objects", "effort": "L", "dependencies": [], "status": "done"},
      {"id": "C1-002", "task": "Define SettlementAgent DO", "dod": "Agent processes blockchain settlements", "owner": "Backend Team", "tools": "Durable Objects, Ethers.js", "effort": "M", "dependencies": ["C1-001"], "status": "in-progress"}
    ],
    "C2_tool_definition": [
      {"id": "C2-001", "task": "Build verify_grab tool", "dod": "MCP tool returns verification confidence", "owner": "AI Team", "tools": "MCP SDK", "effort": "M", "dependencies": ["C1-001"], "status": "done"}
    ],
    "C3_infrastructure": [
      {"id": "C3-001", "task": "Edge compute deployment", "dod": "Workers deployed to 200+ locations", "owner": "DevOps", "tools": "Wrangler, GitHub Actions", "effort": "S", "dependencies": [], "status": "done"},
      {"id": "C3-002", "task": "D1 schema deployment", "dod": "All tables migrated", "owner": "Backend Team", "tools": "Drizzle, Wrangler", "effort": "S", "dependencies": [], "status": "done"}
    ],
    "C4_memory_architecture": [
      {"id": "C4-001", "task": "Design verification memory", "dod": "Store last 1000 verifications per machine", "owner": "Backend Team", "tools": "D1, KV", "effort": "M", "dependencies": [], "status": "in-progress"}
    ],
    "C5_auth_delegation": [
      {"id": "C5-001", "task": "Implement operator OAuth", "dod": "Operators can login via Google/Email", "owner": "Auth Team", "tools": "OpenAuth", "effort": "M", "dependencies": [], "status": "pending"}
    ],
    "C6_agent_loop": [
      {"id": "C6-001", "task": "Implement verification loop", "dod": "Camera feed -> ML -> Decision -> Settlement", "owner": "AI Team", "tools": "Workflows", "effort": "L", "dependencies": ["C1-001", "C1-002"], "status": "in-progress"}
    ],
    "C7_model_routing": [
      {"id": "C7-001", "task": "Route to local vs cloud ML", "dod": "Use edge model for fast, cloud for complex", "owner": "AI Team", "tools": "AI Gateway", "effort": "M", "dependencies": [], "status": "pending"}
    ],
    "C8_mcp_servers": [
      {"id": "C8-001", "task": "Build MCP server for operators", "dod": "Operators can query via MCP", "owner": "Backend Team", "tools": "MCP SDK", "effort": "M", "dependencies": [], "status": "pending"}
    ],
    "C9_long_running_tasks": [
      {"id": "C9-001", "task": "Implement shipping workflow", "dod": "Prize shipped within 24 hours", "owner": "Ops Team", "tools": "Workflows", "effort": "L", "dependencies": ["C2-001"], "status": "pending"}
    ],
    "C10_hitl": [
      {"id": "C10-001", "task": "Build dispute resolution UI", "dod": "Operators can review flagged verifications", "owner": "Frontend Team", "tools": "SvelteKit", "effort": "M", "dependencies": [], "status": "pending"}
    ],
    "C11_agentic_ux": [
      {"id": "C11-001", "task": "Real-time verification status", "dod": "Operators see live verification feed", "owner": "Frontend Team", "tools": "WebSockets, SvelteKit", "effort": "M", "dependencies": [], "status": "pending"}
    ],
    "C12_security_boundaries": [
      {"id": "C12-001", "task": "Implement tenant isolation", "dod": "Operators cannot see other operators data", "owner": "Security Team", "tools": "Middleware", "effort": "M", "dependencies": [], "status": "done"}
    ],
    "C13_evals_testing": [
      {"id": "C13-001", "task": "ML model accuracy testing", "dod": "98% accuracy on test set", "owner": "AI Team", "tools": "Vitest, ML eval", "effort": "L", "dependencies": ["C1-001"], "status": "in-progress"}
    ],
    "C14_observability": [
      {"id": "C14-001", "task": "Setup Analytics Engine", "dod": "All verifications tracked", "owner": "DevOps", "tools": "Analytics Engine", "effort": "S", "dependencies": [], "status": "done"}
    ],
    "C15_pricing_billing": [
      {"id": "C15-001", "task": "Stripe Connect integration", "dod": "Operators billed monthly", "owner": "Backend Team", "tools": "Stripe", "effort": "L", "dependencies": [], "status": "pending"}
    ],
    "C16_gtm": [
      {"id": "C16-001", "task": "Launch landing page", "dod": "globalclaw.io live with waitlist", "owner": "Marketing", "tools": "Pages", "effort": "S", "dependencies": [], "status": "done"}
    ],
    "C17_sales": [
      {"id": "C17-001", "task": "Build sales deck", "dod": "10-slide pitch deck", "owner": "Sales", "tools": "Figma", "effort": "S", "dependencies": [], "status": "done"}
    ],
    "C18_customer_success": [
      {"id": "C18-001", "task": "Onboarding documentation", "dod": "Step-by-step operator guide", "owner": "CS Team", "tools": "Docs", "effort": "M", "dependencies": [], "status": "pending"}
    ],
    "C19_ops_finance": [
      {"id": "C19-001", "task": "Setup accounting integration", "dod": "Revenue tracked in QuickBooks", "owner": "Finance", "tools": "QuickBooks API", "effort": "M", "dependencies": [], "status": "pending"}
    ],
    "C20_scale_reliability": [
      {"id": "C20-001", "task": "Load testing", "dod": "Handle 10k verifications/min", "owner": "DevOps", "tools": "k6", "effort": "M", "dependencies": ["C3-001"], "status": "pending"}
    ]
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section D: Cloudflare Architecture (matches SectionD interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-d-001',
  'run-global-claw-2026',
  'D',
  NULL,
  '{
    "architecture_diagram_url": "https://r2.erlvinc.com/diagrams/global-claw-arch.png",
    "architecture_description": "Edge-first architecture: Camera feeds processed at edge Workers, ML inference via Workers AI, state in Durable Objects, settlements via Workflows, storage in D1/R2.",
    "component_decisions": [
      {"component": "API Gateway", "purpose": "Route all operator/machine requests", "technology": "Hono on Workers", "rationale": "Type-safe, fast, Cloudflare-native"},
      {"component": "Verification Engine", "purpose": "ML-based prize grab detection", "technology": "Workers AI + Custom Model", "rationale": "Edge inference for sub-second response"},
      {"component": "Settlement Processor", "purpose": "Blockchain transaction handling", "technology": "Durable Objects + Workflows", "rationale": "Guaranteed delivery, exactly-once semantics"},
      {"component": "Video Storage", "purpose": "Store verification clips", "technology": "Cloudflare Stream + R2", "rationale": "Global CDN, low latency playback"}
    ],
    "data_model": [
      {"entity": "Operator", "storage_type": "D1", "schema": "id, name, email, stripe_account_id, created_at", "relationships": ["has_many Machines", "has_many Settlements"]},
      {"entity": "Machine", "storage_type": "D1", "schema": "id, operator_id, location, camera_endpoint, status", "relationships": ["belongs_to Operator", "has_many Verifications"]},
      {"entity": "Verification", "storage_type": "D1", "schema": "id, machine_id, video_url, confidence, result, created_at", "relationships": ["belongs_to Machine", "has_one Settlement"]},
      {"entity": "Settlement", "storage_type": "D1", "schema": "id, verification_id, amount, blockchain_tx, status", "relationships": ["belongs_to Verification"]},
      {"entity": "VideoClip", "storage_type": "R2", "schema": "key: verifications/{id}.mp4", "relationships": ["belongs_to Verification"]}
    ],
    "api_endpoints": [
      {"method": "POST", "path": "/api/verify", "purpose": "Submit video for verification", "auth_required": true, "idempotency_required": true},
      {"method": "GET", "path": "/api/verifications/:id", "purpose": "Get verification status", "auth_required": true, "idempotency_required": false},
      {"method": "POST", "path": "/api/settle", "purpose": "Trigger settlement for verification", "auth_required": true, "idempotency_required": true},
      {"method": "GET", "path": "/api/machines", "purpose": "List operator machines", "auth_required": true, "idempotency_required": false},
      {"method": "POST", "path": "/api/machines", "purpose": "Register new machine", "auth_required": true, "idempotency_required": true}
    ],
    "auth_design": "JWT-based auth via OpenAuth, operator tokens scoped to their machines only, machine-to-API auth via API keys with rate limiting",
    "caching_strategy": "KV for hot data (machine status, recent verifications), Cache API for video thumbnails, no caching on settlements",
    "rate_limiting": "100 req/min per operator, 1000 req/min per machine, sliding window via Durable Object",
    "backup_dr": "D1 automatic backups, R2 versioning enabled, cross-region replication for critical data"
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section E: Frontend System (matches SectionE interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-e-001',
  'run-global-claw-2026',
  'E',
  NULL,
  '{
    "ux_primitives": [
      {"name": "Live Feed", "description": "Real-time video feed from machine cameras", "required": true},
      {"name": "Verification Card", "description": "Card showing verification status with confidence score", "required": true},
      {"name": "Settlement Timeline", "description": "Visual timeline of prize grab to delivery", "required": true},
      {"name": "Machine Grid", "description": "Grid view of all operator machines with status", "required": true}
    ],
    "design_tokens": [
      {"category": "color", "name": "primary", "value": "#7C3AED"},
      {"category": "color", "name": "success", "value": "#10B981"},
      {"category": "color", "name": "warning", "value": "#F59E0B"},
      {"category": "color", "name": "error", "value": "#EF4444"},
      {"category": "typography", "name": "font-family", "value": "Inter, system-ui, sans-serif"},
      {"category": "spacing", "name": "base", "value": "4px"}
    ],
    "component_library": [
      {"name": "MachineCard", "purpose": "Display machine status and recent activity", "props": ["machineId", "status", "lastVerification"]},
      {"name": "VerificationBadge", "purpose": "Show verification result with confidence", "props": ["result", "confidence", "timestamp"]},
      {"name": "SettlementTracker", "purpose": "Track settlement through blockchain", "props": ["settlementId", "status", "txHash"]},
      {"name": "VideoPlayer", "purpose": "Play verification video clips", "props": ["videoUrl", "autoplay", "controls"]}
    ],
    "accessibility_requirements": [
      "WCAG 2.1 AA compliance",
      "Keyboard navigation for all interactive elements",
      "Screen reader compatible verification status",
      "High contrast mode support"
    ],
    "onboarding_flow": [
      "Sign up with email or Google",
      "Connect Stripe account for settlements",
      "Register first machine with camera endpoint",
      "Test verification with sample video",
      "Go live with real prizes"
    ]
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section F: Backend/Middleware (matches SectionF interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-f-001',
  'run-global-claw-2026',
  'F',
  NULL,
  '{
    "universal_workflow_pattern": [
      {"step_number": 1, "name": "Receive Video", "description": "Machine uploads video clip to R2", "tools_used": ["R2", "Workers"]},
      {"step_number": 2, "name": "Queue Verification", "description": "Add to verification queue", "tools_used": ["Queues"]},
      {"step_number": 3, "name": "ML Inference", "description": "Run prize grab detection model", "tools_used": ["Workers AI", "AI Gateway"]},
      {"step_number": 4, "name": "Store Result", "description": "Save verification result to D1", "tools_used": ["D1"]},
      {"step_number": 5, "name": "Trigger Settlement", "description": "If verified, start settlement workflow", "tools_used": ["Workflows"]},
      {"step_number": 6, "name": "Blockchain Settlement", "description": "Execute on-chain transaction", "tools_used": ["Durable Objects"]},
      {"step_number": 7, "name": "Notify Parties", "description": "Send notifications to operator and player", "tools_used": ["Queues", "Email"]}
    ],
    "mcp_governance_rules": [
      {"rule": "All tool calls require authentication", "enforcement": "Middleware auth check"},
      {"rule": "Financial operations require confirmation", "enforcement": "Elicitation before settlement"},
      {"rule": "Video access scoped to operator", "enforcement": "Tenant isolation middleware"},
      {"rule": "Rate limits enforced per tool", "enforcement": "DO-backed rate limiter"}
    ],
    "receipts_format": [
      {"name": "VerificationReceipt", "fields": ["verification_id", "machine_id", "timestamp", "confidence", "result", "video_hash"], "verification_method": "SHA-256 hash of video + result"},
      {"name": "SettlementReceipt", "fields": ["settlement_id", "verification_id", "amount", "blockchain_tx", "timestamp"], "verification_method": "Blockchain transaction hash"}
    ],
    "verification_format": "JSON receipt with SHA-256 hash chain, stored in audit_chain table",
    "admin_panel_features": [
      "Operator management",
      "Machine monitoring",
      "Verification review queue",
      "Settlement dashboard",
      "System health metrics"
    ]
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section G: Pricing + Unit Economics (matches SectionG interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-g-001',
  'run-global-claw-2026',
  'G',
  NULL,
  '{
    "value_metric": {
      "metric": "Verified Prize Deliveries",
      "rationale": "Directly tied to operator revenue and player satisfaction",
      "customer_value_alignment": "Operators only pay when system delivers value"
    },
    "cost_drivers": [
      {"driver": "ML Inference", "estimated_cost_per_outcome": "$0.002 per verification", "optimization_strategy": "Edge caching of model, batch inference"},
      {"driver": "Video Storage", "estimated_cost_per_outcome": "$0.05 per 30-second clip", "optimization_strategy": "90-day retention, compression"},
      {"driver": "Blockchain Gas", "estimated_cost_per_outcome": "$0.10 per settlement", "optimization_strategy": "Batch settlements, L2 chains"},
      {"driver": "Shipping Integration", "estimated_cost_per_outcome": "$0.50 per API call", "optimization_strategy": "Bulk label generation"}
    ],
    "markup_model": {
      "internal_cost": "$0.67 per verified delivery",
      "price_point": "$1.50 per verified delivery (included in 2.5% fee)",
      "margin_percentage": 55
    },
    "unit_economics": {
      "gross_profit_per_outcome": "$0.83",
      "breakeven_outcomes": 18000,
      "cac_estimate": "$500 per operator",
      "ltv_estimate": "$15,000 per operator (30 month avg)"
    },
    "pricing_tiers": [
      "Starter: $299/mo + 3% - Up to 10 machines",
      "Growth: $799/mo + 2.5% - Up to 50 machines",
      "Enterprise: $1,999/mo + 2% - Unlimited machines + dedicated support"
    ]
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section H: Go-to-Market (matches SectionH interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-h-001',
  'run-global-claw-2026',
  'H',
  NULL,
  '{
    "positioning_statement": {
      "for_icp": "Arcade operators with 50+ claw machines",
      "who_need": "to reduce manual verification costs and increase player trust",
      "we_provide": "AI-powered prize verification with instant blockchain settlement",
      "that_delivers": "40% revenue increase and 60% operational cost reduction"
    },
    "proof_assets": [
      {"asset_type": "video", "name": "60-second Demo", "purpose": "Show verification flow end-to-end"},
      {"asset_type": "case_study", "name": "Beta Operator Results", "purpose": "Prove ROI with real numbers"},
      {"asset_type": "demo", "name": "Live Dashboard Demo", "purpose": "Let prospects see the product"},
      {"asset_type": "document", "name": "ROI Calculator", "purpose": "Help operators calculate savings"}
    ],
    "acquisition_channels": [
      {"channel": "Industry Trade Shows", "priority": 1, "estimated_cac": "$400", "rationale": "Direct access to decision makers"},
      {"channel": "LinkedIn Outbound", "priority": 2, "estimated_cac": "$300", "rationale": "Target arcade operator groups"},
      {"channel": "Partner Referrals", "priority": 3, "estimated_cac": "$200", "rationale": "Machine manufacturers as channel"},
      {"channel": "Content Marketing", "priority": 4, "estimated_cac": "$600", "rationale": "SEO for arcade automation"}
    ],
    "funnel_metrics": [
      {"stage": "Awareness", "metric_name": "Website Visitors", "target": "5,000/month"},
      {"stage": "Interest", "metric_name": "Demo Requests", "target": "100/month"},
      {"stage": "Consideration", "metric_name": "Trials Started", "target": "30/month"},
      {"stage": "Purchase", "metric_name": "Closed Deals", "target": "10/month"}
    ],
    "launch_plan": "Soft launch with 5 beta operators -> Industry trade show announcement -> Press release -> Full launch",
    "retention_loops": [
      "Weekly performance reports",
      "Monthly optimization recommendations",
      "Quarterly business reviews",
      "Annual contract renewal discounts"
    ]
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section I: Brand Identity (matches SectionI interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-i-001',
  'run-global-claw-2026',
  'I',
  NULL,
  '{
    "naming_framework": {
      "naming_approach": "Descriptive + memorable - conveys global reach and claw machine focus",
      "finalist_names": ["Global Claw", "ClawVerify", "PrizeChain", "GrabProof"],
      "selected_name": "Global Claw",
      "rationale": "Clear industry reference, global ambition, memorable and easy to spell"
    },
    "domain_handles": {
      "domain": "globalclaw.io",
      "social_handles": {
        "twitter": "@GlobalClawHQ",
        "linkedin": "global-claw",
        "youtube": "@GlobalClaw"
      }
    },
    "visual_identity": {
      "color_palette": ["#7C3AED (Primary Purple)", "#10B981 (Success Green)", "#1F2937 (Dark Gray)", "#F9FAFB (Light Gray)"],
      "typography": "Inter for UI, Space Grotesk for headlines",
      "logo_concept": "Stylized claw grabbing a verified checkmark",
      "brand_voice": "Professional, innovative, trustworthy - speaks to arcade business owners"
    },
    "content_templates": [
      {"template_name": "Case Study", "purpose": "Showcase operator success stories", "structure": ["Challenge", "Solution", "Results", "Quote"]},
      {"template_name": "Product Update", "purpose": "Announce new features", "structure": ["Headline", "What is new", "How it helps", "Get started"]},
      {"template_name": "Industry Insight", "purpose": "Thought leadership content", "structure": ["Hook", "Industry context", "Our perspective", "Call to action"]}
    ]
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section J: Security + Compliance (matches SectionJ interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-j-001',
  'run-global-claw-2026',
  'J',
  NULL,
  '{
    "threat_model": [
      {"threat": "Video spoofing/manipulation", "probability": "medium", "impact": "high", "mitigation": "Hash verification, ML anomaly detection"},
      {"threat": "Settlement fraud", "probability": "low", "impact": "fatal", "mitigation": "Blockchain immutability, multi-sig for large amounts"},
      {"threat": "Operator account takeover", "probability": "medium", "impact": "high", "mitigation": "MFA required, session management"},
      {"threat": "DDoS on verification API", "probability": "high", "impact": "medium", "mitigation": "Cloudflare protection, rate limiting"}
    ],
    "security_controls": [
      {"control_name": "Tenant Isolation", "description": "Operators cannot access other operator data", "implementation_status": "implemented"},
      {"control_name": "API Authentication", "description": "JWT-based auth with short-lived tokens", "implementation_status": "implemented"},
      {"control_name": "Audit Logging", "description": "All actions logged with tamper-evident chain", "implementation_status": "implemented"},
      {"control_name": "Encryption at Rest", "description": "D1 and R2 encryption enabled", "implementation_status": "implemented"},
      {"control_name": "PCI Compliance", "description": "Payment data handled by Stripe only", "implementation_status": "in-progress"}
    ],
    "data_handling": [
      {"data_type": "Video clips", "retention_period": "90 days", "encryption": true, "access_controls": "Operator + support only"},
      {"data_type": "Verification results", "retention_period": "7 years", "encryption": true, "access_controls": "Operator + audit"},
      {"data_type": "Settlement records", "retention_period": "7 years", "encryption": true, "access_controls": "Operator + finance + audit"},
      {"data_type": "Player PII", "retention_period": "As needed for delivery", "encryption": true, "access_controls": "Shipping system only"}
    ],
    "incident_response": [
      {"phase": "Detection", "actions": ["Automated alerting", "Log analysis", "Anomaly detection"], "owner": "DevOps"},
      {"phase": "Containment", "actions": ["Isolate affected systems", "Revoke compromised credentials", "Enable enhanced logging"], "owner": "Security Team"},
      {"phase": "Recovery", "actions": ["Restore from backup", "Patch vulnerabilities", "Verify integrity"], "owner": "DevOps"},
      {"phase": "Post-Incident", "actions": ["Root cause analysis", "Update runbooks", "Customer notification if required"], "owner": "Leadership"}
    ],
    "compliance_posture": "SOC2 Type II in progress, PCI-DSS compliant via Stripe, GDPR ready for EU expansion"
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section K: Testing + Observability (matches SectionK interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-k-001',
  'run-global-claw-2026',
  'K',
  NULL,
  '{
    "testing_strategies": [
      {"test_type": "unit", "coverage_target": 80, "tools": ["Vitest"]},
      {"test_type": "integration", "coverage_target": 70, "tools": ["Vitest", "Miniflare"]},
      {"test_type": "e2e", "coverage_target": 60, "tools": ["Playwright"]},
      {"test_type": "security", "coverage_target": 100, "tools": ["OWASP ZAP", "Manual pen testing"]}
    ],
    "continuous_evals": [
      {"eval_name": "ML Accuracy", "frequency": "Daily", "rubric": "Compare predictions to human-labeled ground truth", "failure_threshold": "Below 96% accuracy"},
      {"eval_name": "Settlement Success Rate", "frequency": "Hourly", "rubric": "Settlements completed vs attempted", "failure_threshold": "Below 99%"},
      {"eval_name": "API Latency", "frequency": "Continuous", "rubric": "P95 response time", "failure_threshold": "Above 500ms"}
    ],
    "monitoring_dashboards": [
      {"dashboard_name": "System Health", "metrics": ["Request rate", "Error rate", "P50/P95 latency", "Active DOs"], "alert_conditions": ["Error rate > 1%", "P95 > 1s"]},
      {"dashboard_name": "Verification Metrics", "metrics": ["Verifications/min", "Accuracy rate", "Queue depth"], "alert_conditions": ["Queue depth > 1000", "Accuracy < 96%"]},
      {"dashboard_name": "Business Metrics", "metrics": ["Daily verifications", "Settlement volume", "Active operators"], "alert_conditions": ["Daily verifications < baseline - 20%"]}
    ],
    "slos": [
      {"slo_name": "Availability", "target": "99.9%", "measurement_method": "Successful requests / total requests"},
      {"slo_name": "Verification Latency", "target": "P95 < 500ms", "measurement_method": "Time from video upload to result"},
      {"slo_name": "Settlement Success", "target": "99.5%", "measurement_method": "Successful settlements / attempted"}
    ],
    "rollback_procedure": "1. Detect anomaly via alerts 2. Pause new deployments 3. Rollback via wrangler rollback 4. Verify metrics normalize 5. RCA within 24 hours"
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section L: Operations Playbook (matches SectionL interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-l-001',
  'run-global-claw-2026',
  'L',
  NULL,
  '{
    "operating_cadence": [
      {"frequency": "daily", "activities": ["Review error rates", "Check queue depths", "Monitor ML accuracy"], "owner": "DevOps"},
      {"frequency": "weekly", "activities": ["Review operator feedback", "Analyze verification disputes", "Update ML training data"], "owner": "Product Team"},
      {"frequency": "monthly", "activities": ["Business review", "Cost analysis", "Feature prioritization"], "owner": "Leadership"},
      {"frequency": "quarterly", "activities": ["Security audit", "Performance review", "Roadmap planning"], "owner": "All Teams"}
    ],
    "support_workflows": [
      {"issue_type": "Verification dispute", "triage_steps": ["Review video", "Check ML confidence", "Compare to similar cases"], "escalation_path": "Support -> AI Team -> Manual review", "sla": "4 hours"},
      {"issue_type": "Settlement failure", "triage_steps": ["Check blockchain status", "Verify operator account", "Review error logs"], "escalation_path": "Support -> Backend Team -> Finance", "sla": "2 hours"},
      {"issue_type": "Machine connectivity", "triage_steps": ["Ping machine endpoint", "Check recent uploads", "Review operator network"], "escalation_path": "Support -> DevOps", "sla": "1 hour"}
    ],
    "churn_playbooks": [
      {"churn_signal": "Decreased verification volume", "intervention": "Proactive outreach, usage review, optimization suggestions", "owner": "Customer Success"},
      {"churn_signal": "Multiple support tickets", "intervention": "Executive escalation, dedicated support session", "owner": "Customer Success"},
      {"churn_signal": "Contract renewal approaching", "intervention": "Business review, ROI presentation, renewal discount offer", "owner": "Sales"}
    ],
    "billing_ops": [
      {"process": "Monthly invoice generation", "frequency": "1st of month", "automation_level": "fully-automated"},
      {"process": "Usage tracking", "frequency": "Continuous", "automation_level": "fully-automated"},
      {"process": "Dispute resolution", "frequency": "As needed", "automation_level": "semi-automated"},
      {"process": "Revenue recognition", "frequency": "Monthly", "automation_level": "semi-automated"}
    ]
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);

-- Section M: Execution Roadmap (matches SectionM interface)
INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at, tenant_id)
VALUES (
  'gc-section-m-001',
  'run-global-claw-2026',
  'M',
  NULL,
  '{
    "roadmap_phases": [
      {"phase_number": 1, "phase_name": "Foundation", "duration_weeks": 4, "deliverables": ["Core API", "D1 schema", "Basic verification"], "gate_criteria": ["API deployed", "Single verification works"]},
      {"phase_number": 2, "phase_name": "ML Integration", "duration_weeks": 4, "deliverables": ["ML model deployed", "Accuracy > 95%", "Video processing pipeline"], "gate_criteria": ["Model accuracy verified", "Pipeline handles 100 req/min"]},
      {"phase_number": 3, "phase_name": "Settlement & Shipping", "duration_weeks": 4, "deliverables": ["Blockchain settlement", "Shipping integration", "Operator dashboard"], "gate_criteria": ["Settlement works E2E", "Shipping labels generated"]},
      {"phase_number": 4, "phase_name": "Launch", "duration_weeks": 4, "deliverables": ["5 beta operators", "Production hardening", "Support workflows"], "gate_criteria": ["1000 verifications completed", "No P0 bugs"]}
    ],
    "weekly_milestones": [
      {"week": 1, "milestone_name": "Project Setup", "deliverables": ["Repo structure", "CI/CD pipeline", "Dev environment"], "blocking": true},
      {"week": 2, "milestone_name": "Core API", "deliverables": ["Auth system", "Machine registration", "Basic endpoints"], "blocking": true},
      {"week": 4, "milestone_name": "Phase 1 Gate", "deliverables": ["API deployed to production", "First verification test"], "blocking": true},
      {"week": 8, "milestone_name": "Phase 2 Gate", "deliverables": ["ML model live", "Accuracy benchmarks met"], "blocking": true},
      {"week": 12, "milestone_name": "Phase 3 Gate", "deliverables": ["Full E2E flow working", "First settlement processed"], "blocking": true},
      {"week": 16, "milestone_name": "Launch", "deliverables": ["5 operators onboarded", "Public launch"], "blocking": true}
    ],
    "critical_path": [
      "ML model training and deployment",
      "Blockchain settlement integration",
      "Beta operator onboarding",
      "Production security audit"
    ],
    "resource_allocation": "2 backend engineers, 1 ML engineer, 1 frontend engineer, 0.5 DevOps, 0.5 Product manager"
  }',
  'approved',
  'planning-pipeline',
  strftime('%s', 'now'),
  strftime('%s', 'now'),
  'erlvinc'
);
