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