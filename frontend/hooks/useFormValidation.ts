/**
 * Custom hook for form validation state management
 * Provides real-time validation with visual feedback
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  validateEmail, 
  validateFullName, 
  validateIndianPhone, 
  validateIndianZipCode, 
  validateAddress, 
  validateCity, 
  validateState, 
  validateSpecialInstructions,
  FieldValidationState 
} from '../utils/validation';

export interface FormValidationState {
  [key: string]: FieldValidationState;
}

export interface UseFormValidationReturn {
  validationState: FormValidationState;
  validateField: (fieldName: string, value: string) => void;
  touchField: (fieldName: string) => void;
  isFormValid: boolean;
  getFieldState: (fieldName: string) => FieldValidationState;
  resetValidation: () => void;
}

// Validation function mapping
const validationFunctions = {
  senderName: validateFullName,
  senderEmail: validateEmail,
  senderPhone: validateIndianPhone,
  recipientName: validateFullName,
  recipientPhone: validateIndianPhone,
  specialInstructions: validateSpecialInstructions
};

export const useFormValidation = (): UseFormValidationReturn => {
  const [validationState, setValidationState] = useState<FormValidationState>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const validateField = useCallback((fieldName: string, value: string) => {
    const validationFn = validationFunctions[fieldName as keyof typeof validationFunctions];
    
    if (!validationFn) {
      console.warn(`No validation function found for field: ${fieldName}`);
      return;
    }

    const result = validationFn(value);
    const isTouched = touchedFields.has(fieldName);

    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        isValid: result.isValid,
        isTouched,
        errorMessage: result.message,
        showError: isTouched && !result.isValid
      }
    }));
  }, [touchedFields]);

  const touchField = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
    
    // Re-validate the field when it's touched
    const currentState = validationState[fieldName];
    if (currentState) {
      setValidationState(prev => ({
        ...prev,
        [fieldName]: {
          ...currentState,
          isTouched: true,
          showError: !currentState.isValid
        }
      }));
    }
  }, [validationState]);

  const getFieldState = useCallback((fieldName: string): FieldValidationState => {
    return validationState[fieldName] || {
      isValid: false,
      isTouched: false,
      errorMessage: '',
      showError: false
    };
  }, [validationState]);

  const isFormValid = useMemo(() => {
    const requiredFields = [
      'senderName', 'senderEmail', 'senderPhone', 
      'recipientName', 'recipientPhone'
    ];

    return requiredFields.every(fieldName => {
      const fieldState = validationState[fieldName];
      return fieldState?.isValid === true;
    });
  }, [validationState]);

  const resetValidation = useCallback(() => {
    setValidationState({});
    setTouchedFields(new Set());
  }, []);

  return {
    validationState,
    validateField,
    touchField,
    isFormValid,
    getFieldState,
    resetValidation
  };
};
