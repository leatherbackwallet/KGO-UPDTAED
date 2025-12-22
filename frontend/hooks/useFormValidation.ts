/**
 * Custom hook for form validation state management
 * Provides real-time validation with visual feedback
 */

import { useState, useCallback, useMemo } from 'react';
import {
  validateEmail,
  validateFullName,
  validatePhone,
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
  validateField: (fieldName: string, value: string, allFormData?: Record<string, string>) => void;
  touchField: (fieldName: string) => void;
  isFormValid: boolean;
  getFieldState: (fieldName: string) => FieldValidationState;
  resetValidation: () => void;
}

// Validation function mapping
const validationFunctions = {
  senderName: validateFullName,
  senderEmail: validateEmail,
  senderPhone: validatePhone,
  recipientName: validateFullName,
  recipientPhone: validatePhone,
  specialInstructions: validateSpecialInstructions
};

export const useFormValidation = (): UseFormValidationReturn => {
  const [validationState, setValidationState] = useState<FormValidationState>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const validateField = useCallback((fieldName: string, value: string, allFormData?: Record<string, string>) => {
    const validationFn = validationFunctions[fieldName as keyof typeof validationFunctions];
    
    if (!validationFn) {
      console.warn(`No validation function found for field: ${fieldName}`);
      return;
    }

    const result = validationFn(value);
    const isTouched = touchedFields.has(fieldName);
    
    // Cross-field validation: Check if senderPhone and recipientPhone are different
    let finalResult = result;
    let finalErrorMessage = result.message;
    
    if ((fieldName === 'senderPhone' || fieldName === 'recipientPhone') && allFormData) {
      const senderPhone = allFormData.senderPhone || '';
      const recipientPhone = allFormData.recipientPhone || '';
      
      // Only check uniqueness if both fields have valid phone numbers
      if (result.isValid && senderPhone && recipientPhone) {
        const cleanSenderPhone = senderPhone.replace(/\D/g, '');
        const cleanRecipientPhone = recipientPhone.replace(/\D/g, '');
        
        if (cleanSenderPhone === cleanRecipientPhone && cleanSenderPhone.length === 10) {
          finalResult = {
            isValid: false,
            message: fieldName === 'senderPhone' 
              ? 'Your phone number must be different from the recipient\'s phone number'
              : 'Recipient\'s phone number must be different from your phone number',
            type: 'error' as const
          };
          finalErrorMessage = finalResult.message;
        }
      }
    }

    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        isValid: finalResult.isValid,
        isTouched,
        errorMessage: finalErrorMessage,
        showError: isTouched && !finalResult.isValid
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
