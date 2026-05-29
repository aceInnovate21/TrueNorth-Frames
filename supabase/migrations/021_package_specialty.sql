-- Add specialty to packages table so packages can be tagged independently of photographer specialties
ALTER TABLE packages ADD COLUMN IF NOT EXISTS specialty text DEFAULT NULL;

-- Index for fast specialty filtering on the browse page
CREATE INDEX IF NOT EXISTS idx_packages_specialty ON packages(specialty) WHERE specialty IS NOT NULL;
