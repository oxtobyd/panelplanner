-- Secretary availability table
CREATE TABLE secretary_availability (
    id SERIAL PRIMARY KEY,
    secretary_id INTEGER REFERENCES panel_secretaries(id),
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(secretary_id, date)
);

-- Events table
CREATE TABLE panel_events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Panel', 'Carousel')),
    panel_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    week_number INTEGER NOT NULL,
    venue_id INTEGER REFERENCES panel_venues(id),
    secretary_id INTEGER REFERENCES panel_secretaries(id),
    estimated_attendance INTEGER DEFAULT 12,
    actual_attendance INTEGER DEFAULT 0,
    report_date DATE,
    report_deadline DATE,
    notes TEXT,
    status VARCHAR(50) CHECK (status IN ('Confirmed', 'Booked', 'Available')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    time TIME
);

-- Resources table
CREATE TABLE panel_resources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (
        resource_type IN (
            'Image Set',
            'CofE News Item',
            'World News Item',
            'Pastoral Scenario',
            'Pastoral E-Mail',
            'Safeguarding Scenario',
            'Safeguarding E-Mail',
            'Group Exercise',
            'Other'
        )
    ),
    status TEXT NOT NULL DEFAULT 'Available' CHECK (
        status IN ('Available', 'InUse', 'Retired')
    ),
    times_used INTEGER NOT NULL DEFAULT 0,
    last_used TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link table for events and resources
CREATE TABLE event_resources (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES panel_events(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES panel_resources(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, resource_id)
);

-- Create indexes for common queries
CREATE INDEX idx_panel_events_date ON panel_events(date);
CREATE INDEX idx_panel_events_secretary_id ON panel_events(secretary_id);
CREATE INDEX idx_panel_events_venue_id ON panel_events(venue_id);
CREATE INDEX idx_secretary_availability_date ON secretary_availability(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for events table
CREATE TRIGGER update_panel_events_updated_at
    BEFORE UPDATE ON panel_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get historical attendance data
CREATE OR REPLACE FUNCTION get_historical_attendance(p_week_number INTEGER, p_type VARCHAR)
RETURNS TABLE (
    events BIGINT,
    total_candidates BIGINT,
    avg_per_event NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH event_stats AS (
        SELECT 
            p.panel_type,
            EXTRACT(WEEK FROM p.panel_date) as week_number,
            COUNT(DISTINCT p.panel_date) as number_of_events,
            COUNT(CASE WHEN pa.attendee_type = 'C' THEN pa.id END) as total_candidates,
            ROUND(COUNT(CASE WHEN pa.attendee_type = 'C' THEN pa.id END)::decimal / 
                  NULLIF(COUNT(DISTINCT p.panel_date), 0), 1) as avg_candidates_per_event
        FROM panels p
        LEFT JOIN panel_attendees pa ON p.id = pa.panel_id
        WHERE 
            p.panel_type = p_type
            AND EXTRACT(WEEK FROM p.panel_date) = p_week_number
            AND p.panel_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY 
            p.panel_type,
            EXTRACT(WEEK FROM p.panel_date)
    )
    SELECT 
        COALESCE(SUM(number_of_events), 0) as events,
        COALESCE(SUM(total_candidates), 0) as total_candidates,
        COALESCE(ROUND(AVG(avg_candidates_per_event), 1), 0) as avg_per_event
    FROM event_stats;
END;
$$ LANGUAGE plpgsql;