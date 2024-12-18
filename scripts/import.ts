import { parse } from 'csv-parse';
import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import { format, parse as parseDate } from 'date-fns';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary connection pool just for this import
const importPool = new Pool({
  user: 'davidoxtoby',
  host: 'localhost',
  database: 'MDS_RawData',
  port: 5432
});

// Specify the path to your CSV file relative to the project root
const csvFilePath = path.join(__dirname, '../data/events.csv');

async function importCSV(filePath: string) {
  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      bom: true  // Handle BOM character
    }));

  try {
    for await (const record of parser) {
      try {
        // Parse the date from format "(Wed) DD-MMM-YY HH:mm"
        const dateString = record.date.replace(/\([A-Za-z]+\)\s/, '').split(' ')[0];
        const parsedDate = parseDate(dateString, 'dd-MMM-yy', new Date());
        
        // Map 'na' status to 'Available'
        const status = record.status === 'na' ? 'Available' : record.status || 'Available';

        // Get the type from the record, handling potential BOM character
        const type = record.type || record['type'] || record.Type || record['Type'];

        if (!type) {
          console.error('Missing type for record:', record);
          continue;
        }

        await importPool.query(`
          INSERT INTO panel_events (
            type,
            panel_number,
            date,
            week_number,
            venue_id,
            secretary_id,
            estimated_attendance,
            actual_attendance,
            report_date,
            report_deadline,
            notes,
            status,
            time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          type,
          record.panel_number,
          parsedDate,
          parseInt(record.week_number),
          record.venue_id || null,
          record.secretary_id || null,
          record.estimated_attendance || null,
          record.actual_attendance || 0,
          record.report_date || null,
          record.report_deadline || null,
          record.notes || '',
          status,
          record.time || null
        ]);
        
        console.log(`Imported: ${type} ${record.panel_number} for ${format(parsedDate, 'yyyy-MM-dd')}`);
      } catch (error) {
        console.error(`Error importing record:`, record, error);
      }
    }
  } finally {
    // Make sure we close the pool when done
    await importPool.end();
  }
}

// Run the import
importCSV(csvFilePath)
  .then(() => {
    console.log('Import completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });