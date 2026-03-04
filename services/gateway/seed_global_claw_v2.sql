-- Robust seed for Global Claw overview to match UI component requirements
UPDATE `project_documentation` 
SET content = '{
  "executive_summary": {
    "concept": "Autonomous market intelligence for global e-commerce. Real-time scraping and AI-driven analysis.",
    "status": "completed",
    "completeness": 95
  },
  "quick_stats": {
    "budget": "$15,000",
    "timeline": "4 weeks",
    "north_star_metric": "99.9% scrape success",
    "current_phase": "synthesis"
  },
  "health_indicators": {
    "documentation_complete": true,
    "unknowns_resolved": true,
    "checklist_progress": 85,
    "security_coverage": 100
  },
  "critical_path": {
    "next_milestone": "Production Launch",
    "blockers": [],
    "dependencies": ["Residential Proxies", "D1 Stable API"]
  },
  "quick_actions": [
    {"label": "View Live Scraper", "link": "/ai-labs/research/runs/run-global-claw-2026/execution"},
    {"label": "Review Data Schema", "link": "/factory/build-specs/run-global-claw-2026"}
  ]
}'
WHERE project_id = 'run-global-claw-2026' AND section_id = 'overview';
