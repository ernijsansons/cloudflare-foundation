-- 0016: Enhance ideas table for deal lifecycle
-- Adds rich metadata columns for Twenty CRM-style deal cards

-- Extended description field
ALTER TABLE ideas ADD COLUMN description TEXT DEFAULT '';

-- JSON array of { id: string, text: string, created_at: number }
ALTER TABLE ideas ADD COLUMN constraints TEXT DEFAULT '[]';

-- JSON array of { id: string, text: string, created_at: number, updated_at: number }
ALTER TABLE ideas ADD COLUMN notes TEXT DEFAULT '[]';

-- JSON array of { name: string, key: string, type: string, size: number, uploaded_at: number }
ALTER TABLE ideas ADD COLUMN attachments TEXT DEFAULT '[]';

-- Priority: 'low' | 'normal' | 'high' | 'critical'
ALTER TABLE ideas ADD COLUMN priority TEXT DEFAULT 'normal';

-- JSON array of tag strings
ALTER TABLE ideas ADD COLUMN tags TEXT DEFAULT '[]';

-- Deal stage: 'idea' | 'researching' | 'production' | 'parked' | 'killed'
ALTER TABLE ideas ADD COLUMN deal_stage TEXT DEFAULT 'idea';

-- Index for filtering by deal stage
CREATE INDEX idx_ideas_deal_stage ON ideas(deal_stage);

-- Index for filtering by priority
CREATE INDEX idx_ideas_priority ON ideas(priority);
