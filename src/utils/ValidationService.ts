/**
 * Form validation utilities to eliminate repeated validation logic
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationService {
  static validatePin(pin: string): ValidationResult {
    if (!pin) {
      return { isValid: false, error: 'PIN is required' };
    }
    
    if (!/^\d{6}$/.test(pin)) {
      return { isValid: false, error: 'PIN must be exactly 6 digits' };
    }
    
    return { isValid: true };
  }

  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  }

  static validatePinConfirmation(pin: string, confirmPin: string): ValidationResult {
    const pinValidation = this.validatePin(pin);
    if (!pinValidation.isValid) return pinValidation;
    
    const confirmValidation = this.validatePin(confirmPin);
    if (!confirmValidation.isValid) {
      return { isValid: false, error: 'Confirmation PIN must be exactly 6 digits' };
    }
    
    if (pin !== confirmPin) {
      return { isValid: false, error: 'PIN and confirmation PIN do not match' };
    }
    
    return { isValid: true };
  }

  static validateRequiredField(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, error: `${fieldName} is required` };
    }
    
    return { isValid: true };
  }
}