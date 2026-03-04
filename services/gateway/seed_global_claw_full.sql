-- Global Claw Full Documentation Seed
-- Populates ALL 13 sections (overview, A-M) with correct section_id format
-- Run with: wrangler d1 execute foundation-primary --remote --file=seed_global_claw_full.sql

-- First, clear existing data for this project to avoid duplicates
DELETE FROM project_documentation WHERE tenant_id = 'default' AND project_id = 'run-global-claw-2026';

-- Section: overview
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-overview-main',
  'default',
  'run-global-claw-2026',
  'overview',
  NULL,
  '{
    "executive_summary": {
      "concept": "Global Claw is a nationwide arcade claw machine network with real-time IoT monitoring, mobile app integration, and AI-powered prize optimization. Players can play remotely via live video feeds or find machines nearby.",
      "status": "in-progress",
      "completeness": 65
    },
    "quick_stats": {
      "budget": "$150,000",
      "timeline": "6 months to MVP",
      "north_star_metric": "Monthly Active Players (target: 50,000)",
      "current_phase": "Phase 2: Core Platform"
    },
    "health_indicators": {
      "documentation_complete": true,
      "unknowns_resolved": true,
      "checklist_progress": 45,
      "security_coverage": 80
    },
    "critical_path": {
      "next_milestone": "IoT SDK Integration Complete",
      "blockers": [],
      "dependencies": ["Hardware vendor API docs", "Payment processor approval"]
    },
    "quick_actions": [
      {"label": "View Architecture", "link": "#D"},
      {"label": "Check Security", "link": "#J"},
      {"label": "See Roadmap", "link": "#M"}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section A: Assumptions & Intake
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-A-main',
  'default',
  'run-global-claw-2026',
  'A',
  NULL,
  '{
    "intake_form": {
      "project_name": "Global Claw",
      "submitted_by": "ERLV INC",
      "submission_date": "2026-01-15",
      "elevator_pitch": "Uber for arcade claw machines - play anywhere, win real prizes",
      "target_audience": "Casual gamers 18-35, arcade enthusiasts, prize collectors",
      "problem_statement": "Arcade claw machines are location-bound, limiting player access and operator revenue potential",
      "proposed_solution": "Network of IoT-enabled claw machines playable via mobile app with live video streaming",
      "success_criteria": "50,000 MAU within 12 months, 500 machines deployed, $2M ARR",
      "budget_range": "$100k-200k",
      "timeline_expectation": "MVP in 6 months, full launch in 12 months"
    },
    "unknowns": [
      {
        "id": "U1",
        "category": "technical",
        "description": "Latency requirements for real-time claw control",
        "impact": "high",
        "resolution_strategy": "Prototype with 5G and edge computing",
        "status": "resolved",
        "resolution": "Sub-100ms achievable with Cloudflare Workers at edge"
      },
      {
        "id": "U2",
        "category": "business",
        "description": "Revenue share model with venue operators",
        "impact": "high",
        "resolution_strategy": "Market research and operator interviews",
        "status": "resolved",
        "resolution": "70/30 split (platform/venue) industry standard"
      },
      {
        "id": "U3",
        "category": "regulatory",
        "description": "Gaming license requirements by state",
        "impact": "medium",
        "resolution_strategy": "Legal consultation",
        "status": "in-progress",
        "resolution": null
      }
    ],
    "global_invariants": [
      {
        "id": "GI1",
        "statement": "All prize wins must be verifiable via video recording",
        "rationale": "Prevents fraud claims and ensures fair play",
        "enforcement": "Automated video capture on every play session"
      },
      {
        "id": "GI2",
        "statement": "Payment processing must complete before machine activation",
        "rationale": "Prevents revenue loss from failed payments",
        "enforcement": "Stripe payment confirmation webhook triggers machine unlock"
      },
      {
        "id": "GI3",
        "statement": "Machine telemetry must be encrypted in transit and at rest",
        "rationale": "Protects operator business data and user privacy",
        "enforcement": "TLS 1.3 for transit, AES-256 for D1 storage"
      }
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section B: North Star & Strategy
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-B-main',
  'default',
  'run-global-claw-2026',
  'B',
  NULL,
  '{
    "business_statement": {
      "vision": "Make arcade gaming accessible anywhere, anytime",
      "mission": "Connect players with real claw machines through technology, creating joy and fair winning opportunities",
      "values": ["Fairness", "Accessibility", "Fun", "Transparency"]
    },
    "differentiation": {
      "unique_value_proposition": "Play real claw machines remotely with live video - not a simulation",
      "competitive_advantages": [
        "Real machines, real prizes - not virtual",
        "AI-optimized prize placement for fair win rates",
        "Instant prize shipping or venue pickup",
        "Social features: watch friends play, gift plays"
      ],
      "moat_strategy": "Network effects (more machines = more players = more operators joining) + proprietary IoT SDK"
    },
    "monetization_model": {
      "primary_revenue": "Per-play fees ($2-5 per attempt)",
      "secondary_revenue": [
        "Premium subscriptions (unlimited plays, priority queue)",
        "Venue operator SaaS fees",
        "Advertising in app/on machine screens",
        "Prize sponsorships from brands"
      ],
      "pricing_strategy": "Dynamic pricing based on prize value and demand"
    },
    "success_metrics": {
      "north_star": "Monthly Active Players",
      "target_value": "50,000",
      "supporting_metrics": [
        {"name": "Plays per User per Month", "target": "12"},
        {"name": "Win Rate", "target": "15-20%"},
        {"name": "Machine Uptime", "target": "99.5%"},
        {"name": "Player NPS", "target": "50+"}
      ]
    }
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section C: Implementation Checklist
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-C-main',
  'default',
  'run-global-claw-2026',
  'C',
  NULL,
  '{
    "C1_domain_setup": [
      {"task": "Register globalclaw.com", "status": "completed", "notes": "Registered via Cloudflare"},
      {"task": "Configure DNS", "status": "completed", "notes": "Proxied through CF"},
      {"task": "SSL certificates", "status": "completed", "notes": "Universal SSL active"}
    ],
    "C2_repository_setup": [
      {"task": "Create monorepo structure", "status": "completed", "notes": "pnpm workspace"},
      {"task": "Configure CI/CD", "status": "completed", "notes": "GitHub Actions"},
      {"task": "Set up branch protection", "status": "completed", "notes": "Main branch protected"}
    ],
    "C3_database_schema": [
      {"task": "Design D1 schema", "status": "completed", "notes": "12 tables defined"},
      {"task": "Create migrations", "status": "completed", "notes": "Drizzle migrations"},
      {"task": "Seed test data", "status": "in-progress", "notes": "50% complete"}
    ],
    "C4_authentication": [
      {"task": "Implement user auth", "status": "completed", "notes": "OpenAuth integration"},
      {"task": "Operator auth flow", "status": "completed", "notes": "Separate tenant"},
      {"task": "Machine auth (IoT)", "status": "in-progress", "notes": "JWT + device certs"}
    ],
    "C5_core_api": [
      {"task": "User endpoints", "status": "completed", "notes": "CRUD + profile"},
      {"task": "Machine endpoints", "status": "in-progress", "notes": "70% complete"},
      {"task": "Play session endpoints", "status": "in-progress", "notes": "50% complete"}
    ],
    "C6_payment_integration": [
      {"task": "Stripe Connect setup", "status": "completed", "notes": "Platform account ready"},
      {"task": "Payment intents", "status": "completed", "notes": "Per-play payments"},
      {"task": "Subscription billing", "status": "pending", "notes": "Phase 2"}
    ],
    "C7_iot_integration": [
      {"task": "Define IoT protocol", "status": "completed", "notes": "MQTT over WebSocket"},
      {"task": "Build device SDK", "status": "in-progress", "notes": "60% complete"},
      {"task": "Telemetry pipeline", "status": "in-progress", "notes": "Analytics Engine"}
    ],
    "C8_video_streaming": [
      {"task": "WebRTC integration", "status": "in-progress", "notes": "Cloudflare Stream"},
      {"task": "Low-latency pipeline", "status": "pending", "notes": "Target <200ms"},
      {"task": "Recording storage", "status": "pending", "notes": "R2 bucket ready"}
    ],
    "C9_mobile_app": [
      {"task": "React Native setup", "status": "completed", "notes": "Expo managed"},
      {"task": "Core screens", "status": "in-progress", "notes": "5/12 complete"},
      {"task": "Push notifications", "status": "pending", "notes": "Phase 2"}
    ],
    "C10_admin_dashboard": [
      {"task": "Operator dashboard", "status": "in-progress", "notes": "SvelteKit"},
      {"task": "Admin super-panel", "status": "pending", "notes": "Phase 3"},
      {"task": "Analytics views", "status": "pending", "notes": "Phase 2"}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section D: Architecture
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-D-main',
  'default',
  'run-global-claw-2026',
  'D',
  NULL,
  '{
    "component_decisions": [
      {
        "component": "API Gateway",
        "technology": "Cloudflare Workers + Hono",
        "rationale": "Edge-native, sub-10ms cold starts, global distribution",
        "alternatives_considered": ["AWS Lambda", "Fastify on Fly.io"],
        "tradeoffs": "Limited compute time (30s) acceptable for API workloads"
      },
      {
        "component": "Primary Database",
        "technology": "Cloudflare D1 (SQLite)",
        "rationale": "Zero-latency from Workers, automatic replication, familiar SQL",
        "alternatives_considered": ["PlanetScale", "Turso"],
        "tradeoffs": "5GB limit per database (sharding strategy planned)"
      },
      {
        "component": "Real-time State",
        "technology": "Durable Objects",
        "rationale": "Per-machine state isolation, WebSocket support, hibernation",
        "alternatives_considered": ["Redis", "Supabase Realtime"],
        "tradeoffs": "Learning curve, but perfect fit for machine actors"
      },
      {
        "component": "Video Streaming",
        "technology": "Cloudflare Stream + WebRTC",
        "rationale": "Integrated billing, global edge delivery, low latency",
        "alternatives_considered": ["Mux", "AWS IVS"],
        "tradeoffs": "Less customizable than self-hosted WebRTC"
      },
      {
        "component": "File Storage",
        "technology": "Cloudflare R2",
        "rationale": "S3-compatible, zero egress fees, Workers integration",
        "alternatives_considered": ["S3", "Backblaze B2"],
        "tradeoffs": "Newer service, but S3 API ensures portability"
      }
    ],
    "data_model": [
      {
        "entity": "User",
        "fields": ["id", "email", "display_name", "avatar_url", "created_at", "subscription_tier"],
        "relationships": ["has_many PlaySessions", "has_many Prizes"]
      },
      {
        "entity": "Machine",
        "fields": ["id", "venue_id", "hardware_id", "status", "prize_inventory", "last_telemetry"],
        "relationships": ["belongs_to Venue", "has_many PlaySessions"]
      },
      {
        "entity": "PlaySession",
        "fields": ["id", "user_id", "machine_id", "started_at", "ended_at", "result", "video_url"],
        "relationships": ["belongs_to User", "belongs_to Machine", "has_one Prize"]
      },
      {
        "entity": "Venue",
        "fields": ["id", "operator_id", "name", "address", "geo_location", "operating_hours"],
        "relationships": ["belongs_to Operator", "has_many Machines"]
      }
    ],
    "api_endpoints": [
      {"method": "GET", "path": "/api/machines", "description": "List available machines", "auth": "optional"},
      {"method": "GET", "path": "/api/machines/:id", "description": "Machine details + live status", "auth": "optional"},
      {"method": "POST", "path": "/api/machines/:id/play", "description": "Start play session", "auth": "required"},
      {"method": "POST", "path": "/api/machines/:id/control", "description": "Send claw command", "auth": "required"},
      {"method": "GET", "path": "/api/users/me/sessions", "description": "User play history", "auth": "required"},
      {"method": "GET", "path": "/api/users/me/prizes", "description": "User prize inventory", "auth": "required"}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section E: Frontend & UX
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-E-main',
  'default',
  'run-global-claw-2026',
  'E',
  NULL,
  '{
    "ux_primitives": [
      {
        "name": "Machine Card",
        "purpose": "Display machine preview with status and prize preview",
        "interactions": ["tap to view details", "swipe for quick play"],
        "states": ["available", "in-use", "maintenance", "offline"]
      },
      {
        "name": "Play Controller",
        "purpose": "Virtual joystick + button for claw control",
        "interactions": ["drag for movement", "tap for grab/release"],
        "states": ["waiting", "controlling", "grabbing", "result"]
      },
      {
        "name": "Video Feed",
        "purpose": "Live stream from machine camera",
        "interactions": ["pinch to zoom", "tap for fullscreen"],
        "states": ["connecting", "live", "buffering", "ended"]
      }
    ],
    "design_tokens": {
      "colors": {
        "primary": "#FF6B35",
        "secondary": "#004E89",
        "success": "#2ECC71",
        "warning": "#F39C12",
        "error": "#E74C3C",
        "background": "#1A1A2E",
        "surface": "#16213E",
        "text": "#EAEAEA"
      },
      "typography": {
        "font_family": "Inter, system-ui, sans-serif",
        "heading_scale": [48, 36, 28, 22, 18, 16],
        "body_sizes": {"large": 18, "medium": 16, "small": 14}
      },
      "spacing": {
        "unit": 4,
        "scale": [4, 8, 12, 16, 24, 32, 48, 64]
      },
      "radii": {
        "small": 4,
        "medium": 8,
        "large": 16,
        "full": 9999
      }
    },
    "components": [
      {"name": "Button", "variants": ["primary", "secondary", "ghost", "danger"], "sizes": ["sm", "md", "lg"]},
      {"name": "Card", "variants": ["elevated", "outlined", "filled"], "sizes": ["compact", "standard", "expanded"]},
      {"name": "Input", "variants": ["text", "password", "search", "number"], "states": ["default", "focus", "error", "disabled"]},
      {"name": "Modal", "variants": ["center", "bottom-sheet", "fullscreen"], "animations": ["fade", "slide", "scale"]},
      {"name": "Toast", "variants": ["info", "success", "warning", "error"], "positions": ["top", "bottom"]}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section F: Backend & Workflows
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-F-main',
  'default',
  'run-global-claw-2026',
  'F',
  NULL,
  '{
    "workflow_steps": [
      {
        "workflow": "Play Session",
        "steps": [
          {"order": 1, "name": "payment_capture", "description": "Capture payment via Stripe", "timeout": "30s"},
          {"order": 2, "name": "machine_reserve", "description": "Reserve machine via DO", "timeout": "5s"},
          {"order": 3, "name": "video_connect", "description": "Establish WebRTC stream", "timeout": "10s"},
          {"order": 4, "name": "play_active", "description": "User controls claw", "timeout": "60s"},
          {"order": 5, "name": "result_capture", "description": "Determine win/loss", "timeout": "5s"},
          {"order": 6, "name": "session_complete", "description": "Release machine, store recording", "timeout": "30s"}
        ]
      },
      {
        "workflow": "Prize Fulfillment",
        "steps": [
          {"order": 1, "name": "prize_detected", "description": "AI confirms prize captured", "timeout": "10s"},
          {"order": 2, "name": "user_choice", "description": "User selects pickup or ship", "timeout": "24h"},
          {"order": 3, "name": "fulfillment_queue", "description": "Add to operator queue", "timeout": "1m"},
          {"order": 4, "name": "prize_dispatched", "description": "Mark as shipped/ready", "timeout": "48h"},
          {"order": 5, "name": "prize_confirmed", "description": "User confirms receipt", "timeout": "7d"}
        ]
      }
    ],
    "mcp_governance_rules": [
      {
        "rule": "machine_control_auth",
        "description": "Only authenticated users with active session can send control commands",
        "enforcement": "JWT validation + session DO check"
      },
      {
        "rule": "rate_limit_commands",
        "description": "Max 10 commands per second per user",
        "enforcement": "KV-backed rate limiter"
      }
    ],
    "receipts": [
      {"event": "payment_completed", "stored_in": "D1 + Stripe webhook logs", "retention": "7 years"},
      {"event": "play_session", "stored_in": "D1 + R2 video", "retention": "90 days"},
      {"event": "prize_won", "stored_in": "D1 + audit chain", "retention": "7 years"}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section G: Pricing & Economics
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-G-main',
  'default',
  'run-global-claw-2026',
  'G',
  NULL,
  '{
    "value_metric": {
      "metric": "Per Play",
      "justification": "Aligns revenue with user engagement, low barrier to entry",
      "alternatives_considered": ["Monthly subscription only", "Credit packs"]
    },
    "cost_drivers": [
      {"category": "Infrastructure", "item": "Cloudflare Workers", "monthly_estimate": "$50-200", "scaling_factor": "requests"},
      {"category": "Infrastructure", "item": "D1 Database", "monthly_estimate": "$5-50", "scaling_factor": "storage + reads"},
      {"category": "Infrastructure", "item": "Stream (Video)", "monthly_estimate": "$100-500", "scaling_factor": "minutes delivered"},
      {"category": "Infrastructure", "item": "R2 Storage", "monthly_estimate": "$10-50", "scaling_factor": "GB stored"},
      {"category": "Payment", "item": "Stripe Fees", "monthly_estimate": "2.9% + $0.30/txn", "scaling_factor": "transactions"},
      {"category": "Operations", "item": "Support Staff", "monthly_estimate": "$3,000", "scaling_factor": "fixed initially"}
    ],
    "markup_model": {
      "base_play_cost": "$0.50",
      "platform_fee": "$0.75",
      "venue_share": "$0.75",
      "player_price": "$2.00",
      "gross_margin": "37.5%"
    },
    "unit_economics": {
      "cac": "$5.00",
      "ltv": "$48.00",
      "ltv_cac_ratio": 9.6,
      "payback_period": "2 weeks",
      "assumptions": ["12 plays/user/month", "6-month retention", "$2 avg play price"]
    }
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section H: Go-to-Market
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-H-main',
  'default',
  'run-global-claw-2026',
  'H',
  NULL,
  '{
    "positioning_statement": {
      "target": "Casual mobile gamers aged 18-35",
      "category": "Remote arcade gaming",
      "benefit": "Play real claw machines from anywhere and win actual prizes",
      "reason_to_believe": "Live video streaming proves authenticity"
    },
    "proof_assets": [
      {"type": "video", "title": "How It Works", "purpose": "Explain remote play concept"},
      {"type": "testimonial", "title": "First Winner Story", "purpose": "Social proof"},
      {"type": "comparison", "title": "Real vs Virtual", "purpose": "Differentiation from simulations"},
      {"type": "demo", "title": "Live Machine Tour", "purpose": "Show machine network"}
    ],
    "acquisition_channels": [
      {"channel": "TikTok", "strategy": "Win reaction videos", "budget": "$5,000/mo", "expected_cac": "$3"},
      {"channel": "Instagram", "strategy": "Prize showcase reels", "budget": "$3,000/mo", "expected_cac": "$4"},
      {"channel": "YouTube", "strategy": "Influencer partnerships", "budget": "$2,000/mo", "expected_cac": "$6"},
      {"channel": "SEO", "strategy": "Arcade gaming content", "budget": "$500/mo", "expected_cac": "$2"}
    ],
    "funnel_metrics": [
      {"stage": "Awareness", "metric": "Impressions", "target": "1M/month"},
      {"stage": "Interest", "metric": "App Downloads", "target": "50K/month"},
      {"stage": "Consideration", "metric": "Account Created", "target": "25K/month"},
      {"stage": "Conversion", "metric": "First Play", "target": "15K/month"},
      {"stage": "Retention", "metric": "Monthly Active", "target": "50K"}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section I: Brand Identity
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-I-main',
  'default',
  'run-global-claw-2026',
  'I',
  NULL,
  '{
    "naming_framework": {
      "brand_name": "Global Claw",
      "tagline": "Real Machines. Real Prizes. Anywhere.",
      "naming_rationale": "Combines worldwide reach (Global) with the iconic arcade element (Claw)",
      "naming_alternatives": ["ClawZone", "GrabIt", "PrizeClaw", "ArcadeAnywhere"]
    },
    "domain_handles": {
      "primary_domain": "globalclaw.com",
      "secondary_domains": ["globalclaw.io", "globalclaw.app"],
      "social_handles": {
        "twitter": "@GlobalClaw",
        "instagram": "@globalclaw",
        "tiktok": "@globalclaw",
        "youtube": "@GlobalClawOfficial"
      }
    },
    "visual_identity": {
      "logo_concept": "Stylized claw grabbing a globe",
      "color_palette": ["#FF6B35 (Claw Orange)", "#004E89 (Arcade Blue)", "#1A1A2E (Night Mode)"],
      "typography": "Inter for UI, Bebas Neue for headers",
      "imagery_style": "Vibrant, playful, with motion blur effects suggesting action"
    },
    "content_templates": [
      {"type": "social_post", "format": "Reel/TikTok", "elements": ["Win reaction", "Prize reveal", "CTA"]},
      {"type": "email", "format": "Welcome sequence", "elements": ["Brand intro", "How to play", "First play bonus"]},
      {"type": "push_notification", "format": "Re-engagement", "elements": ["Machine available nearby", "New prizes added"]}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section J: Security
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-J-main',
  'default',
  'run-global-claw-2026',
  'J',
  NULL,
  '{
    "threat_model": [
      {
        "threat": "Replay attacks on claw commands",
        "likelihood": "medium",
        "impact": "high",
        "mitigation": "Signed commands with timestamp + nonce, 5s validity window"
      },
      {
        "threat": "Video stream tampering",
        "likelihood": "low",
        "impact": "high",
        "mitigation": "Stream signing via Cloudflare Stream, tamper detection"
      },
      {
        "threat": "Payment fraud",
        "likelihood": "medium",
        "impact": "high",
        "mitigation": "Stripe Radar, velocity checks, device fingerprinting"
      },
      {
        "threat": "Bot automation for plays",
        "likelihood": "high",
        "impact": "medium",
        "mitigation": "Turnstile on play initiation, behavioral analysis"
      }
    ],
    "security_controls": [
      {"control": "Authentication", "implementation": "JWT with 1h expiry, refresh tokens in httpOnly cookies"},
      {"control": "Authorization", "implementation": "Role-based (user, operator, admin) + resource ownership"},
      {"control": "Rate Limiting", "implementation": "KV-backed per-user limits, Durable Object for machine-level"},
      {"control": "Input Validation", "implementation": "Zod schemas on all endpoints, parameterized D1 queries"},
      {"control": "Encryption", "implementation": "TLS 1.3 in transit, AES-256 at rest in D1"}
    ],
    "data_handling_policies": [
      {"data_type": "PII (email, name)", "storage": "D1 encrypted", "retention": "Account lifetime + 30 days", "access": "User + support"},
      {"data_type": "Payment data", "storage": "Stripe only (PCI compliant)", "retention": "Per Stripe policy", "access": "Stripe dashboard"},
      {"data_type": "Play videos", "storage": "R2 with signed URLs", "retention": "90 days", "access": "User + admin"},
      {"data_type": "Telemetry", "storage": "Analytics Engine", "retention": "90 days", "access": "Internal only"}
    ],
    "incident_response": {
      "severity_levels": ["P1 (data breach)", "P2 (service down)", "P3 (degraded)", "P4 (minor)"],
      "response_times": {"P1": "15 minutes", "P2": "1 hour", "P3": "4 hours", "P4": "24 hours"},
      "communication_channels": ["PagerDuty", "Slack #incidents", "Status page"],
      "post_incident": "Blameless postmortem within 48 hours, action items tracked"
    }
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section K: Testing Strategy
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-K-main',
  'default',
  'run-global-claw-2026',
  'K',
  NULL,
  '{
    "testing_strategy": [
      {
        "layer": "Unit",
        "framework": "Vitest",
        "coverage_target": "80%",
        "focus_areas": ["Business logic", "Utility functions", "Validators"]
      },
      {
        "layer": "Integration",
        "framework": "Vitest + Miniflare",
        "coverage_target": "60%",
        "focus_areas": ["API endpoints", "D1 queries", "DO interactions"]
      },
      {
        "layer": "E2E",
        "framework": "Playwright",
        "coverage_target": "Critical paths",
        "focus_areas": ["User flows", "Payment flow", "Machine interaction"]
      }
    ],
    "continuous_eval": [
      {"metric": "Test pass rate", "threshold": ">99%", "action_on_fail": "Block deploy"},
      {"metric": "Coverage delta", "threshold": "No decrease", "action_on_fail": "Warning"},
      {"metric": "Flaky test rate", "threshold": "<1%", "action_on_fail": "Quarantine test"}
    ],
    "monitoring_dashboards": [
      {"name": "API Health", "metrics": ["Request rate", "Error rate", "P95 latency"], "tool": "Cloudflare Analytics"},
      {"name": "Machine Status", "metrics": ["Online count", "Play sessions", "Win rate"], "tool": "Custom D1 + Grafana"},
      {"name": "Business KPIs", "metrics": ["Revenue", "MAU", "Retention"], "tool": "Analytics Engine + Metabase"}
    ],
    "slos": [
      {"service": "API", "metric": "Availability", "target": "99.9%", "window": "30 days"},
      {"service": "API", "metric": "Latency P95", "target": "<200ms", "window": "30 days"},
      {"service": "Video Stream", "metric": "Buffering ratio", "target": "<2%", "window": "7 days"},
      {"service": "Payment", "metric": "Success rate", "target": ">98%", "window": "7 days"}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section L: Operations
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-L-main',
  'default',
  'run-global-claw-2026',
  'L',
  NULL,
  '{
    "operating_cadence": [
      {"activity": "Daily standup", "frequency": "Daily 9am", "participants": ["Engineering", "Product"]},
      {"activity": "Sprint planning", "frequency": "Bi-weekly Monday", "participants": ["All team"]},
      {"activity": "Incident review", "frequency": "Weekly Friday", "participants": ["Engineering", "Ops"]},
      {"activity": "Metrics review", "frequency": "Weekly Monday", "participants": ["Leadership", "Product"]}
    ],
    "support_workflow": {
      "channels": ["In-app chat", "Email support@globalclaw.com", "Twitter DMs"],
      "tiers": [
        {"tier": 1, "scope": "FAQs, basic troubleshooting", "response_time": "4 hours"},
        {"tier": 2, "scope": "Technical issues, refunds", "response_time": "24 hours"},
        {"tier": 3, "scope": "Engineering escalation", "response_time": "48 hours"}
      ],
      "tools": ["Intercom", "Linear for tickets", "Slack integration"]
    },
    "churn_playbook": [
      {"signal": "No play in 14 days", "action": "Push notification with bonus credits"},
      {"signal": "No play in 30 days", "action": "Email with new machines/prizes"},
      {"signal": "No play in 60 days", "action": "Win-back offer (50% off next play)"},
      {"signal": "Churn exit survey", "action": "Collect feedback, offer retention incentive"}
    ],
    "billing_ops": {
      "billing_cycle": "Per-play (immediate) + Monthly subscription",
      "payment_methods": ["Credit/Debit cards", "Apple Pay", "Google Pay"],
      "refund_policy": "Full refund if technical issue prevented play, partial for user error",
      "dunning_process": "3 retry attempts over 7 days, then subscription paused"
    }
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Section M: Roadmap
INSERT INTO project_documentation (id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
VALUES (
  'gc-M-main',
  'default',
  'run-global-claw-2026',
  'M',
  NULL,
  '{
    "roadmap_phases": [
      {
        "phase": "Phase 1: Foundation",
        "status": "completed",
        "objectives": ["Core infrastructure", "User auth", "Single machine prototype"],
        "key_deliverables": ["API gateway", "D1 schema", "Basic mobile app"]
      },
      {
        "phase": "Phase 2: Core Platform",
        "status": "in-progress",
        "objectives": ["Multi-machine support", "Payment integration", "Video streaming"],
        "key_deliverables": ["IoT SDK", "Stripe integration", "WebRTC pipeline"]
      },
      {
        "phase": "Phase 3: Scale",
        "status": "planned",
        "objectives": ["100 machines", "5,000 users", "Operator onboarding"],
        "key_deliverables": ["Operator dashboard", "Machine provisioning", "Analytics"]
      },
      {
        "phase": "Phase 4: Growth",
        "status": "planned",
        "objectives": ["50,000 MAU", "500 machines", "Premium features"],
        "key_deliverables": ["Subscription tiers", "Social features", "Prize marketplace"]
      }
    ],
    "milestones": [
      {"name": "MVP Launch", "date": "2026-06-01", "criteria": "10 machines live, 100 users"},
      {"name": "Seed Round", "date": "2026-07-15", "criteria": "1,000 MAU, positive unit economics"},
      {"name": "Regional Expansion", "date": "2026-10-01", "criteria": "100 machines, 5 cities"},
      {"name": "Series A Ready", "date": "2027-01-01", "criteria": "50,000 MAU, $2M ARR run rate"}
    ]
  }',
  'approved',
  'seed-script',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Verify insertion
SELECT section_id, subsection_key, length(content) as content_length
FROM project_documentation
WHERE tenant_id = 'default' AND project_id = 'run-global-claw-2026'
ORDER BY section_id;
