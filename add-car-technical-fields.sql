-- Add technical fields to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS power INTEGER,
ADD COLUMN IF NOT EXISTS engine TEXT,
ADD COLUMN IF NOT EXISTS volume TEXT,
ADD COLUMN IF NOT EXISTS gearbox TEXT,
ADD COLUMN IF NOT EXISTS drive TEXT;

-- Add comments for documentation
COMMENT ON COLUMN cars.power IS 'Engine power in PS (horsepower)';
COMMENT ON COLUMN cars.engine IS 'Engine type (Benzin, Diesel, Elektro, Hybrid)';
COMMENT ON COLUMN cars.volume IS 'Engine displacement (e.g., 2.0L, 3.0L)';
COMMENT ON COLUMN cars.gearbox IS 'Transmission type (Automatik, Schaltgetriebe)';
COMMENT ON COLUMN cars.drive IS 'Drive type (Frontantrieb, Heckantrieb, Allrad)';
