import { z } from 'zod';

// Валидация для mileage_unit - принимает только km | mi
export const mileageUnitSchema = z.enum(['km', 'mi'], {
  errorMap: () => ({
    message: 'Mileage unit must be either "km" or "mi"'
  })
});

// Валидация для полной формы с mileage
export const mileageFormSchema = z.object({
  mileage: z.number().int().min(0).optional(),
  mileage_unit: mileageUnitSchema.optional(),
  cost: z.number().min(0).optional(),
  currency: z.string().optional(),
});

// Утилита для валидации mileage_unit
export function validateMileageUnit(value: string): { valid: boolean; error?: string } {
  try {
    mileageUnitSchema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        error: error.errors[0]?.message || 'Invalid mileage unit' 
      };
    }
    return { valid: false, error: 'Invalid mileage unit' };
  }
}

// Утилита для преобразования miles в mi (для обратной совместимости)
export function normalizeMileageUnit(value: string): string {
  if (value === 'miles') {
    return 'mi';
  }
  return value;
}

// Утилита для получения отображаемого названия единицы
export function getMileageUnitLabel(unit: 'km' | 'mi'): string {
  switch (unit) {
    case 'km':
      return 'Kilometers';
    case 'mi':
      return 'Miles';
    default:
      return unit;
  }
}

// Утилита для получения короткого названия единицы
export function getMileageUnitShort(unit: 'km' | 'mi'): string {
  switch (unit) {
    case 'km':
      return 'km';
    case 'mi':
      return 'mi';
    default:
      return unit;
  }
}
