-- Update marine insurance rate from 1% to 1.5% to match client spreadsheet
UPDATE settings SET value = '1.5' WHERE key = 'spain_marine_insurance_percentage';
