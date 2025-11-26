-- Add verification_status field to manufacturers table
ALTER TABLE manufacturers 
ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'changes_requested'));

-- Add verification_notes field for admin feedback
ALTER TABLE manufacturers
ADD COLUMN verification_notes TEXT;

-- Update existing records to have pending status if not verified, approved if verified
UPDATE manufacturers 
SET verification_status = CASE 
  WHEN verified = true THEN 'approved'
  ELSE 'pending'
END
WHERE verification_status IS NULL;