-- Add technical fields to cars table
-- This script adds technical specification fields to the cars table

-- Add the technical fields
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS engine TEXT,
ADD COLUMN IF NOT EXISTS volume TEXT,
ADD COLUMN IF NOT EXISTS gearbox TEXT,
ADD COLUMN IF NOT EXISTS drive TEXT,
ADD COLUMN IF NOT EXISTS power INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.cars.engine IS 'Type of engine (Benzin, Diesel, Hybrid, Elektro, Gas, Wasserstoff)';
COMMENT ON COLUMN public.cars.volume IS 'Engine displacement (e.g., 2.0L, 1.5L)';
COMMENT ON COLUMN public.cars.gearbox IS 'Type of transmission (Schaltgetriebe, Automatik, Halbautomatik, CVT)';
COMMENT ON COLUMN public.cars.drive IS 'Type of drive (Frontantrieb, Heckantrieb, Allradantrieb, 4WD)';
COMMENT ON COLUMN public.cars.power IS 'Engine power in PS (horsepower)';

-- Optional: Add indexes for better query performance if these fields will be frequently searched
-- CREATE INDEX IF NOT EXISTS idx_cars_engine ON public.cars(engine);
-- CREATE INDEX IF NOT EXISTS idx_cars_power ON public.cars(power);