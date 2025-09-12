import { validateMileageUnit, normalizeMileageUnit, getMileageUnitLabel } from '../validation';

describe('Mileage Unit Validation', () => {
  describe('validateMileageUnit', () => {
    it('should accept valid units', () => {
      expect(validateMileageUnit('km')).toEqual({ valid: true });
      expect(validateMileageUnit('mi')).toEqual({ valid: true });
    });

    it('should reject invalid units', () => {
      expect(validateMileageUnit('miles')).toEqual({ 
        valid: false, 
        error: 'Mileage unit must be either "km" or "mi"' 
      });
      expect(validateMileageUnit('kilometers')).toEqual({ 
        valid: false, 
        error: 'Mileage unit must be either "km" or "mi"' 
      });
      expect(validateMileageUnit('KM')).toEqual({ 
        valid: false, 
        error: 'Mileage unit must be either "km" or "mi"' 
      });
      expect(validateMileageUnit('MI')).toEqual({ 
        valid: false, 
        error: 'Mileage unit must be either "km" or "mi"' 
      });
      expect(validateMileageUnit('')).toEqual({ 
        valid: false, 
        error: 'Mileage unit must be either "km" or "mi"' 
      });
      expect(validateMileageUnit('123')).toEqual({ 
        valid: false, 
        error: 'Mileage unit must be either "km" or "mi"' 
      });
    });
  });

  describe('normalizeMileageUnit', () => {
    it('should convert miles to mi', () => {
      expect(normalizeMileageUnit('miles')).toBe('mi');
    });

    it('should leave valid units unchanged', () => {
      expect(normalizeMileageUnit('km')).toBe('km');
      expect(normalizeMileageUnit('mi')).toBe('mi');
    });

    it('should leave invalid units unchanged', () => {
      expect(normalizeMileageUnit('kilometers')).toBe('kilometers');
      expect(normalizeMileageUnit('KM')).toBe('KM');
    });
  });

  describe('getMileageUnitLabel', () => {
    it('should return correct labels', () => {
      expect(getMileageUnitLabel('km')).toBe('Kilometers');
      expect(getMileageUnitLabel('mi')).toBe('Miles');
    });
  });
});
