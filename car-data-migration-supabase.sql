-- Миграция данных автомобилей в Supabase
-- Адаптация данных из automobiles.sql для Supabase

-- 1. Создание таблицы brands (если еще не создана)
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(191) NOT NULL UNIQUE,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создание таблицы car_models
CREATE TABLE IF NOT EXISTS car_models (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(191) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- 3. Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_name ON car_models(name);

-- 4. RLS политики
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_models ENABLE ROW LEVEL SECURITY;

-- Политики для brands - все могут читать
DROP POLICY IF EXISTS "Brands are viewable by everyone" ON brands;
CREATE POLICY "Brands are viewable by everyone" ON brands
  FOR SELECT USING (true);

-- Политики для car_models - все могут читать
DROP POLICY IF EXISTS "Car models are viewable by everyone" ON car_models;
CREATE POLICY "Car models are viewable by everyone" ON car_models
  FOR SELECT USING (true);

-- 5. Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для обновления updated_at
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_car_models_updated_at ON car_models;
CREATE TRIGGER update_car_models_updated_at BEFORE UPDATE ON car_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Вставка данных брендов (из brands.sql)
INSERT INTO brands (name, logo) VALUES
('AC', 'https://s1.cdn.autoevolution.com/images/producers/ac-sm.jpg'),
('ACURA', 'https://s1.cdn.autoevolution.com/images/producers/acura-sm.jpg'),
('ALFA ROMEO', 'https://s1.cdn.autoevolution.com/images/producers/alfa-romeo-sm.jpg'),
('ALPINE', 'https://s1.cdn.autoevolution.com/images/producers/alpine-sm.jpg'),
('ARIEL', 'https://s1.cdn.autoevolution.com/images/producers/ariel-sm.jpg'),
('ARO', 'https://s1.cdn.autoevolution.com/images/producers/aro-sm.jpg'),
('ARTEGA', 'https://s1.cdn.autoevolution.com/images/producers/artega-sm.jpg'),
('ASTON MARTIN', 'https://s1.cdn.autoevolution.com/images/producers/aston-martin-sm.jpg'),
('AUDI', 'https://s1.cdn.autoevolution.com/images/producers/audi-sm.jpg'),
('AURUS', 'https://s1.cdn.autoevolution.com/images/producers/aurus-sm.jpg'),
('BENTLEY', 'https://s1.cdn.autoevolution.com/images/producers/bentley-sm.jpg'),
('BMW', 'https://s1.cdn.autoevolution.com/images/producers/bmw-sm.jpg'),
('BRISTOL', 'https://s1.cdn.autoevolution.com/images/producers/bristol-sm.jpg'),
('BUFORI', 'https://s1.cdn.autoevolution.com/images/producers/bufori-sm.jpg'),
('BUGATTI', 'https://s1.cdn.autoevolution.com/images/producers/bugatti-sm.jpg'),
('BUICK', 'https://s1.cdn.autoevolution.com/images/producers/buick-sm.jpg'),
('CADILLAC', 'https://s1.cdn.autoevolution.com/images/producers/cadillac-sm.jpg'),
('CATERHAM', 'https://s1.cdn.autoevolution.com/images/producers/caterham-sm.jpg'),
('CHEVROLET', 'https://s1.cdn.autoevolution.com/images/producers/chevrolet-sm.jpg'),
('CHRYSLER', 'https://s1.cdn.autoevolution.com/images/producers/chrysler-sm.jpg'),
('CITROEN', 'https://s1.cdn.autoevolution.com/images/producers/citroen-sm.jpg'),
('CUPRA', 'https://s1.cdn.autoevolution.com/images/producers/cupra-sm.jpg'),
('DACIA', 'https://s1.cdn.autoevolution.com/images/producers/dacia-sm.jpg'),
('DAEWOO', 'https://s1.cdn.autoevolution.com/images/producers/daewoo-sm.jpg'),
('DAIHATSU', 'https://s1.cdn.autoevolution.com/images/producers/daihatsu-sm.jpg'),
('DATSUN', 'https://s1.cdn.autoevolution.com/images/producers/datsun-sm.jpg'),
('DeLorean', 'https://s1.cdn.autoevolution.com/images/producers/delorean-sm.jpg'),
('DODGE', 'https://s1.cdn.autoevolution.com/images/producers/dodge-sm.jpg'),
('DONKERVOORT', 'https://s1.cdn.autoevolution.com/images/producers/donkervoort-sm.jpg'),
('DR MOTOR', 'https://s1.cdn.autoevolution.com/images/producers/dr-motor-sm.jpg'),
('DS AUTOMOBILES', 'https://s1.cdn.autoevolution.com/images/producers/ds-automobiles-sm.jpg'),
('EAGLE', 'https://s1.cdn.autoevolution.com/images/producers/eagle-sm.jpg'),
('FERRARI', 'https://s1.cdn.autoevolution.com/images/producers/ferrari-sm.jpg'),
('FIAT', 'https://s1.cdn.autoevolution.com/images/producers/fiat-sm.jpg'),
('FISKER', 'https://s1.cdn.autoevolution.com/images/producers/fisker-sm.jpg'),
('FORD', 'https://s1.cdn.autoevolution.com/images/producers/ford-sm.jpg'),
('FSO', 'https://s1.cdn.autoevolution.com/images/producers/fso-sm.jpg'),
('GEELY', 'https://s1.cdn.autoevolution.com/images/producers/geely-sm.jpg'),
('GENESIS', 'https://s1.cdn.autoevolution.com/images/producers/genesis-sm.jpg'),
('GMC', 'https://s1.cdn.autoevolution.com/images/producers/gmc-sm.jpg'),
('GORDON MURRAY Automotive', 'https://s1.cdn.autoevolution.com/images/producers/gordon-murray-automotive-sm.jpg'),
('GTA Motor', 'https://s1.cdn.autoevolution.com/images/producers/gta-motor-sm.jpg'),
('HINDUSTAN', 'https://s1.cdn.autoevolution.com/images/producers/hindustan-sm.jpg'),
('HOLDEN', 'https://s1.cdn.autoevolution.com/images/producers/holden-sm.jpg'),
('HONDA', 'https://s1.cdn.autoevolution.com/images/producers/honda-sm.jpg'),
('HUMMER', 'https://s1.cdn.autoevolution.com/images/producers/hummer-sm.jpg'),
('HYUNDAI', 'https://s1.cdn.autoevolution.com/images/producers/hyundai-sm.jpg'),
('INEOS', 'https://s1.cdn.autoevolution.com/images/producers/ineos-sm.jpg'),
('INFINITI', 'https://s1.cdn.autoevolution.com/images/producers/infiniti-sm.jpg'),
('ISUZU', 'https://s1.cdn.autoevolution.com/images/producers/isuzu-sm.jpg'),
('JAGUAR', 'https://s1.cdn.autoevolution.com/images/producers/jaguar-sm.jpg'),
('JEEP', 'https://s1.cdn.autoevolution.com/images/producers/jeep-sm.jpg'),
('Karma', 'https://s1.cdn.autoevolution.com/images/producers/karma-sm.jpg'),
('KIA', 'https://s1.cdn.autoevolution.com/images/producers/kia-sm.jpg'),
('KOENIGSEGG', 'https://s1.cdn.autoevolution.com/images/producers/koenigsegg-sm.jpg'),
('KTM', 'https://s1.cdn.autoevolution.com/images/producers/ktm-sm.jpg'),
('LADA', 'https://s1.cdn.autoevolution.com/images/producers/lada-sm.jpg'),
('LAMBORGHINI', 'https://s1.cdn.autoevolution.com/images/producers/lamborghini-sm.jpg'),
('LANCIA', 'https://s1.cdn.autoevolution.com/images/producers/lancia-sm.jpg'),
('LAND ROVER', 'https://s1.cdn.autoevolution.com/images/producers/land-rover-sm.jpg'),
('LEXUS', 'https://s1.cdn.autoevolution.com/images/producers/lexus-sm.jpg'),
('LIGHTYEAR', 'https://s1.cdn.autoevolution.com/images/producers/lightyear-sm.jpg'),
('LINCOLN', 'https://s1.cdn.autoevolution.com/images/producers/lincoln-sm.jpg'),
('LOTUS', 'https://s1.cdn.autoevolution.com/images/producers/lotus-sm.jpg'),
('Lucid Motors', 'https://s1.cdn.autoevolution.com/images/producers/lucid-motors-sm.jpg'),
('Mahindra', 'https://s1.cdn.autoevolution.com/images/producers/mahindra-sm.jpg'),
('MARUSSIA', 'https://s1.cdn.autoevolution.com/images/producers/marussia-sm.jpg'),
('MARUTI SUZUKI', 'https://s1.cdn.autoevolution.com/images/producers/maruti-suzuki-sm.jpg'),
('MASERATI', 'https://s1.cdn.autoevolution.com/images/producers/maserati-sm.jpg'),
('MAYBACH', 'https://s1.cdn.autoevolution.com/images/producers/maybach-sm.jpg'),
('MAZDA', 'https://s1.cdn.autoevolution.com/images/producers/mazda-sm.jpg'),
('MCLAREN', 'https://s1.cdn.autoevolution.com/images/producers/mclaren-sm.jpg'),
('MERCEDES BENZ', 'https://s1.cdn.autoevolution.com/images/producers/mercedes-benz-sm.jpg'),
('Mercedes-AMG', 'https://s1.cdn.autoevolution.com/images/producers/mercedes-amg-sm.jpg'),
('MERCURY', 'https://s1.cdn.autoevolution.com/images/producers/mercury-sm.jpg'),
('MG', 'https://s1.cdn.autoevolution.com/images/producers/mg-sm.jpg'),
('MINI', 'https://s1.cdn.autoevolution.com/images/producers/mini-sm.jpg'),
('MITSUBISHI', 'https://s1.cdn.autoevolution.com/images/producers/mitsubishi-sm.jpg'),
('MORGAN', 'https://s1.cdn.autoevolution.com/images/producers/morgan-sm.jpg'),
('NIO', 'https://s1.cdn.autoevolution.com/images/producers/nio-sm.jpg'),
('NISSAN', 'https://s1.cdn.autoevolution.com/images/producers/nissan-sm.jpg'),
('OLDSMOBILE', 'https://s1.cdn.autoevolution.com/images/producers/oldsmobile-sm.jpg'),
('OPEL', 'https://s1.cdn.autoevolution.com/images/producers/opel-sm.jpg'),
('PAGANI', 'https://s1.cdn.autoevolution.com/images/producers/pagani-sm.jpg'),
('PANOZ', 'https://s1.cdn.autoevolution.com/images/producers/panoz-sm.jpg'),
('PERODUA', 'https://s1.cdn.autoevolution.com/images/producers/perodua-sm.jpg'),
('PEUGEOT', 'https://s1.cdn.autoevolution.com/images/producers/peugeot-sm.jpg'),
('Pininfarina', 'https://s1.cdn.autoevolution.com/images/producers/pininfarina-sm.jpg'),
('PLYMOUTH', 'https://s1.cdn.autoevolution.com/images/producers/plymouth-sm.jpg'),
('Polestar', 'https://s1.cdn.autoevolution.com/images/producers/polestar-sm.jpg'),
('PONTIAC', 'https://s1.cdn.autoevolution.com/images/producers/pontiac-sm.jpg'),
('PORSCHE', 'https://s1.cdn.autoevolution.com/images/producers/porsche-sm.jpg'),
('PROTON', 'https://s1.cdn.autoevolution.com/images/producers/proton-sm.jpg'),
('QOROS', 'https://s1.cdn.autoevolution.com/images/producers/qoros-sm.jpg'),
('RAM Trucks', 'https://s1.cdn.autoevolution.com/images/producers/ram-trucks-sm.jpg'),
('RENAULT', 'https://s1.cdn.autoevolution.com/images/producers/renault-sm.jpg'),
('RIMAC', 'https://s1.cdn.autoevolution.com/images/producers/rimac-sm.jpg'),
('RIVIAN', 'https://s1.cdn.autoevolution.com/images/producers/rivian-sm.jpg'),
('ROLLS-ROYCE', 'https://s1.cdn.autoevolution.com/images/producers/rolls-royce-sm.jpg'),
('SAAB', 'https://s1.cdn.autoevolution.com/images/producers/saab-sm.jpg'),
('SALEEN', 'https://s1.cdn.autoevolution.com/images/producers/saleen-sm.jpg'),
('SAMSUNG', 'https://s1.cdn.autoevolution.com/images/producers/samsung-sm.jpg'),
('SANTANA', 'https://s1.cdn.autoevolution.com/images/producers/santana-sm.jpg'),
('SATURN', 'https://s1.cdn.autoevolution.com/images/producers/saturn-sm.jpg'),
('SCION', 'https://s1.cdn.autoevolution.com/images/producers/scion-sm.jpg'),
('SEAT', 'https://s1.cdn.autoevolution.com/images/producers/seat-sm.jpg'),
('SKODA', 'https://s1.cdn.autoevolution.com/images/producers/skoda-sm.jpg'),
('SMART', 'https://s1.cdn.autoevolution.com/images/producers/smart-sm.jpg'),
('SPYKER', 'https://s1.cdn.autoevolution.com/images/producers/spyker-sm.jpg'),
('SSANGYONG', 'https://s1.cdn.autoevolution.com/images/producers/ssangyong-sm.jpg'),
('SUBARU', 'https://s1.cdn.autoevolution.com/images/producers/subaru-sm.jpg'),
('SUZUKI', 'https://s1.cdn.autoevolution.com/images/producers/suzuki-sm.jpg'),
('TATA MOTORS', 'https://s1.cdn.autoevolution.com/images/producers/tata-motors-sm.jpg'),
('TESLA', 'https://s1.cdn.autoevolution.com/images/producers/tesla-sm.jpg'),
('TOYOTA', 'https://s1.cdn.autoevolution.com/images/producers/toyota-sm.jpg'),
('TVR', 'https://s1.cdn.autoevolution.com/images/producers/tvr-sm.jpg'),
('VAUXHALL', 'https://s1.cdn.autoevolution.com/images/producers/vauxhall-sm.jpg'),
('VinFast', 'https://s1.cdn.autoevolution.com/images/producers/vinfast-sm.jpg'),
('VOLKSWAGEN', 'https://s1.cdn.autoevolution.com/images/producers/volkswagen-sm.jpg'),
('VOLVO', 'https://s1.cdn.autoevolution.com/images/producers/volvo-sm.jpg'),
('WIESMANN', 'https://s1.cdn.autoevolution.com/images/producers/wiesmann-sm.jpg'),
('Xpeng', 'https://s1.cdn.autoevolution.com/images/producers/xpeng-sm.jpg'),
('ZENDER', 'https://s1.cdn.autoevolution.com/images/producers/zender-sm.jpg'),
('Zenvo', 'https://s1.cdn.autoevolution.com/images/producers/zenvo-sm.jpg')
ON CONFLICT (name) DO NOTHING;
