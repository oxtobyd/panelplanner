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