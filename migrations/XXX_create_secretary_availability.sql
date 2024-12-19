CREATE TYPE availability_type AS ENUM ('Available', 'Unavailable', 'Preferred');
CREATE TYPE recurrence_pattern AS ENUM ('Weekly', 'Monthly', 'Yearly');

CREATE TABLE secretary_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secretary_id UUID NOT NULL REFERENCES secretaries(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    start_time TIME,  -- NULL means all day
    end_date DATE NOT NULL,
    end_time TIME,    -- NULL means all day
    type availability_type NOT NULL,
    note TEXT,
    recurrence_pattern recurrence_pattern,
    recurrence_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure end date/time is after start date/time
    CONSTRAINT valid_date_range CHECK (
        (end_date > start_date) OR 
        (end_date = start_date AND (
            start_time IS NULL OR 
            end_time IS NULL OR 
            end_time > start_time
        ))
    )
);

-- Index for quick lookups by secretary
CREATE INDEX idx_secretary_availability_secretary_id ON secretary_availability(secretary_id);
-- Index for date range queries
CREATE INDEX idx_secretary_availability_dates ON secretary_availability(start_date, end_date);

-- Trigger to update updated_at
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON secretary_availability
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 