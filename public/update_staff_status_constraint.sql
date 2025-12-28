-- Update the staff status check constraint to include 'retired' status

-- First, drop the existing constraint
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_status_check;

-- Then add the updated constraint with 'retired' included
ALTER TABLE staff ADD CONSTRAINT staff_status_check 
CHECK (status IN ('active', 'inactive', 'on_leave', 'retired'));

-- Verify the constraint was added (updated for newer PostgreSQL versions)
SELECT conname, condeferrable, condeferred 
FROM pg_constraint 
WHERE conrelid = 'staff'::regclass AND conname = 'staff_status_check';
