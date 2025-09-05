// Интерфейс для данных автомобиля из CSV
export interface CarData {
  year: number;
  make: string;
  model: string;
  bodyStyles: string;
}

// Интерфейс для марки автомобиля
export interface CarMake {
  name: string;
  models: string[];
  years: number[];
}

// Локальная база данных автомобилей
class CarDatabase {
  private cars: CarData[] = [];
  private makes: Map<string, CarMake> = new Map();
  private isLoaded = false;

  // Загружает данные из CSV файлов
  async loadData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Загружаем данные по годам (сначала последние 5 лет для быстрой загрузки)
      const recentYears = [2024, 2023, 2022, 2021, 2020];
      const allYears = Array.from({ length: 35 }, (_, i) => 1992 + i);
      const years = [...recentYears, ...allYears.filter(year => !recentYears.includes(year))];
      let loadedYears = 0;
      
      for (const year of years) {
        try {
          const response = await fetch(`/us-car-models-data-master/${year}.csv`);
          if (response.ok) {
            const csvText = await response.text();
            const yearData = this.parseCSV(csvText, year);
            this.cars.push(...yearData);
            loadedYears++;
            console.log(`Loaded ${yearData.length} cars for year ${year}`);
          } else {
            console.warn(`Failed to load data for year ${year}: ${response.status}`);
          }
        } catch (error) {
          console.warn(`Failed to load data for year ${year}:`, error);
        }
      }

      // Строим индекс марок
      this.buildMakesIndex();
      this.isLoaded = true;
      
      console.log(`Loaded ${this.cars.length} car records from ${loadedYears} years`);
      console.log(`Found ${this.makes.size} unique makes:`, Array.from(this.makes.keys()).sort());
    } catch (error) {
      console.error('Failed to load car data:', error);
    }
  }

  // Парсит CSV текст
  private parseCSV(csvText: string, year: number): CarData[] {
    const lines = csvText.split('\n');
    const data: CarData[] = [];
    let validLines = 0;
    let invalidLines = 0;

    for (let i = 1; i < lines.length; i++) { // Пропускаем заголовок
      const line = lines[i].trim();
      if (!line) continue;

      const columns = this.parseCSVLine(line);
      if (columns.length >= 3 && columns[1]?.trim() && columns[2]?.trim()) {
        data.push({
          year,
          make: columns[1].trim(),
          model: columns[2].trim(),
          bodyStyles: columns[3]?.trim() || ''
        });
        validLines++;
      } else {
        invalidLines++;
      }
    }

    if (invalidLines > 0) {
      console.warn(`Year ${year}: ${invalidLines} invalid lines skipped`);
    }

    return data;
  }

  // Парсит строку CSV с учетом кавычек
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  // Строит индекс марок
  private buildMakesIndex(): void {
    this.cars.forEach(car => {
      if (!car.make || !car.model) return;

      const makeName = car.make.toLowerCase();
      
      if (!this.makes.has(makeName)) {
        this.makes.set(makeName, {
          name: car.make,
          models: [],
          years: []
        });
      }

      const make = this.makes.get(makeName)!;
      
      if (!make.models.includes(car.model)) {
        make.models.push(car.model);
      }
      
      if (!make.years.includes(car.year)) {
        make.years.push(car.year);
      }
    });

    // Сортируем модели и годы
    this.makes.forEach(make => {
      make.models.sort();
      make.years.sort((a, b) => b - a); // Новые годы первыми
    });
  }

  // Получает все марки
  getMakes(): CarMake[] {
    return Array.from(this.makes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // Получает марку по названию
  getMake(makeName: string): CarMake | null {
    return this.makes.get(makeName.toLowerCase()) || null;
  }

  // Получает модели для марки
  getModels(makeName: string): string[] {
    const make = this.getMake(makeName);
    return make ? make.models : [];
  }

  // Поиск автомобилей
  searchCars(query: {
    make?: string;
    model?: string;
    year?: number;
    limit?: number;
  }): CarData[] {
    let results = this.cars;

    if (query.make) {
      results = results.filter(car => 
        car.make.toLowerCase().includes(query.make!.toLowerCase())
      );
    }

    if (query.model) {
      results = results.filter(car => 
        car.model.toLowerCase().includes(query.model!.toLowerCase())
      );
    }

    if (query.year) {
      results = results.filter(car => car.year === query.year);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // Проверяет существование автомобиля
  isValidCar(make: string, model: string, year?: number): boolean {
    const searchResults = this.searchCars({ make, model, year });
    return searchResults.length > 0;
  }

  // Получает статистику
  getStats() {
    return {
      totalCars: this.cars.length,
      totalMakes: this.makes.size,
      yearRange: {
        min: Math.min(...this.cars.map(c => c.year)),
        max: Math.max(...this.cars.map(c => c.year))
      }
    };
  }
}

// Создаем единственный экземпляр базы данных
export const carDatabase = new CarDatabase();

// Инициализируем базу данных при импорте
carDatabase.loadData();
