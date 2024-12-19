-- Add performance indexes
BEGIN;

-- First, check if indexes already exist and drop them if they do
DROP INDEX IF EXISTS idx_panel_events_type_date;
DROP INDEX IF EXISTS idx_panel_events_status;
DROP INDEX IF EXISTS idx_panel_events_panel_number;
DROP INDEX IF EXISTS idx_panel_events_week_number;
DROP INDEX IF EXISTS idx_secretary_availability_secretary_date;
DROP INDEX IF EXISTS idx_secretary_availability_is_available;
DROP INDEX IF EXISTS idx_panel_attendees_panel_type;
DROP INDEX IF EXISTS idx_panel_attendees_attendance_date;
DROP INDEX IF EXISTS idx_event_resources_resource;
DROP INDEX IF EXISTS idx_panel_resources_type_status;

-- Create new indexes
CREATE INDEX idx_panel_events_type_date ON panel_events(type, date);
CREATE INDEX idx_panel_events_status ON panel_events(status);
CREATE INDEX idx_panel_events_panel_number ON panel_events(panel_number);
CREATE INDEX idx_panel_events_week_number ON panel_events(week_number);

CREATE INDEX idx_secretary_availability_secretary_date ON secretary_availability(secretary_id, date);
CREATE INDEX idx_secretary_availability_is_available ON secretary_availability(is_available);

CREATE INDEX idx_panel_attendees_panel_type ON panel_attendees(attendee_type, panel_id);
CREATE INDEX idx_panel_attendees_attendance_date ON panel_attendees(created_date);

CREATE INDEX idx_event_resources_resource ON event_resources(resource_id);
CREATE INDEX idx_panel_resources_type_status ON panel_resources(resource_type, status);

-- Analyze tables to update statistics
ANALYZE panel_events;
ANALYZE secretary_availability;
ANALYZE panel_attendees;
ANALYZE event_resources;
ANALYZE panel_resources;

COMMIT;