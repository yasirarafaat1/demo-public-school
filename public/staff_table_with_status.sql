-- Create the staff table with status column
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    qualification VARCHAR(255),
    contact VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'retired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- Add a comment to the table
COMMENT ON TABLE staff IS 'Stores staff member information including personal details, role, and employment status';

-- Enable Row Level Security (RLS)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create policies for the staff table
-- Allow authenticated users to read staff
CREATE POLICY IF NOT EXISTS "Allow read access to authenticated users" ON staff
FOR SELECT TO authenticated USING (true);

-- Allow admin users to insert staff
CREATE POLICY IF NOT EXISTS "Allow insert access to admin users" ON staff
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'admin@school.edu'  -- Replace with actual admin email
    )
);

-- Allow admin users to update staff
CREATE POLICY IF NOT EXISTS "Allow update access to admin users" ON staff
FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'admin@school.edu'  -- Replace with actual admin email
    )
);

-- Allow admin users to delete staff
CREATE POLICY IF NOT EXISTS "Allow delete access to admin users" ON staff
FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'admin@school.edu'  -- Replace with actual admin email
    )
);

-- Grant necessary permissions
GRANT ALL ON TABLE staff TO authenticated;

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at 
BEFORE UPDATE ON staff 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();