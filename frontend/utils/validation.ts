/**
 * Comprehensive Validation Utilities
 * Provides real-time validation for checkout form inputs
 * Supports Indian phone numbers, postal codes, and name formats
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;
  type: 'error' | 'warning' | 'success';
}

export interface FieldValidationState {
  isValid: boolean;
  isTouched: boolean;
  errorMessage: string;
  showError: boolean;
}

// Email validation with comprehensive regex
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      message: 'Email address is required',
      type: 'error'
    };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      message: 'Please enter a valid email address (e.g., john@example.com)',
      type: 'error'
    };
  }

  if (email.length > 254) {
    return {
      isValid: false,
      message: 'Email address is too long',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Valid email address',
    type: 'success'
  };
};

// Full name validation - ensures first and last name with space
export const validateFullName = (name: string): ValidationResult => {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      message: 'Full name is required',
      type: 'error'
    };
  }

  const trimmedName = name.trim();
  
  // Check for minimum length
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters long',
      type: 'error'
    };
  }

  // Check for maximum length
  if (trimmedName.length > 50) {
    return {
      isValid: false,
      message: 'Name must be less than 50 characters',
      type: 'error'
    };
  }

  // Check for space between first and last name
  const nameParts = trimmedName.split(/\s+/);
  if (nameParts.length < 2) {
    return {
      isValid: false,
      message: 'Please enter your full name (first and last name)',
      type: 'error'
    };
  }

  // Check each part has at least 2 characters
  for (const part of nameParts) {
    if (part.length < 2) {
      return {
        isValid: false,
        message: 'Each name part must be at least 2 characters long',
        type: 'error'
      };
    }
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
      type: 'error'
    };
  }

  // Check for consecutive spaces
  if (trimmedName.includes('  ')) {
    return {
      isValid: false,
      message: 'Name cannot have consecutive spaces',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Valid full name',
    type: 'success'
  };
};

// Indian phone number validation
export const validateIndianPhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      message: 'Phone number is required',
      type: 'error'
    };
  }

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid Indian mobile number
  if (cleanPhone.length === 10) {
    // Check if it starts with valid Indian mobile prefixes
    const validPrefixes = ['6', '7', '8', '9'];
    if (validPrefixes.includes(cleanPhone[0])) {
      return {
        isValid: true,
        message: 'Valid Indian mobile number',
        type: 'success'
      };
    } else {
      return {
        isValid: false,
        message: 'Indian mobile numbers must start with 6, 7, 8, or 9',
        type: 'error'
      };
    }
  }

  // Check for international format with +91
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    const mobilePart = cleanPhone.substring(2);
    const validPrefixes = ['6', '7', '8', '9'];
    if (validPrefixes.includes(mobilePart[0])) {
      return {
        isValid: true,
        message: 'Valid Indian mobile number',
        type: 'success'
      };
    }
  }

  if (cleanPhone.length < 10) {
    return {
      isValid: false,
      message: 'Phone number is too short',
      type: 'error'
    };
  }

  if (cleanPhone.length > 12) {
    return {
      isValid: false,
      message: 'Phone number is too long',
      type: 'error'
    };
  }

  return {
    isValid: false,
    message: 'Please enter a valid 10-digit Indian mobile number',
    type: 'error'
  };
};

// Indian ZIP code validation
export const validateIndianZipCode = (zipCode: string): ValidationResult => {
  if (!zipCode || zipCode.trim() === '') {
    return {
      isValid: false,
      message: 'ZIP code is required',
      type: 'error'
    };
  }

  const cleanZipCode = zipCode.trim();
  
  // Check if it's exactly 6 digits
  const zipRegex = /^\d{6}$/;
  if (!zipRegex.test(cleanZipCode)) {
    return {
      isValid: false,
      message: 'ZIP code must be exactly 6 digits (e.g., 110001)',
      type: 'error'
    };
  }

  // Check for valid Indian postal code ranges
  const firstDigit = parseInt(cleanZipCode[0]);
  if (firstDigit < 1 || firstDigit > 9) {
    return {
      isValid: false,
      message: 'Please enter a valid Indian postal code',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Valid Indian postal code',
    type: 'success'
  };
};

// Address validation
export const validateAddress = (address: string, fieldName: string = 'Address'): ValidationResult => {
  if (!address || address.trim() === '') {
    return {
      isValid: false,
      message: `${fieldName} is required`,
      type: 'error'
    };
  }

  const trimmedAddress = address.trim();
  
  // Check minimum length
  if (trimmedAddress.length < 5) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 5 characters long`,
      type: 'error'
    };
  }

  // Check maximum length
  if (trimmedAddress.length > 200) {
    return {
      isValid: false,
      message: `${fieldName} must be less than 200 characters`,
      type: 'error'
    };
  }

  // Check for valid characters (letters, numbers, spaces, common punctuation)
  const addressRegex = /^[a-zA-Z0-9\s\.,\-#/]+$/;
  if (!addressRegex.test(trimmedAddress)) {
    return {
      isValid: false,
      message: `${fieldName} contains invalid characters`,
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Valid address',
    type: 'success'
  };
};

// City validation
export const validateCity = (city: string): ValidationResult => {
  if (!city || city.trim() === '') {
    return {
      isValid: false,
      message: 'City is required',
      type: 'error'
    };
  }

  const trimmedCity = city.trim();
  
  if (trimmedCity.length < 2) {
    return {
      isValid: false,
      message: 'City name must be at least 2 characters long',
      type: 'error'
    };
  }

  if (trimmedCity.length > 50) {
    return {
      isValid: false,
      message: 'City name must be less than 50 characters',
      type: 'error'
    };
  }

  // Check for valid characters (letters, spaces, hyphens)
  const cityRegex = /^[a-zA-Z\s\-]+$/;
  if (!cityRegex.test(trimmedCity)) {
    return {
      isValid: false,
      message: 'City name can only contain letters, spaces, and hyphens',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Valid city name',
    type: 'success'
  };
};

// State validation
export const validateState = (state: string): ValidationResult => {
  if (!state || state.trim() === '') {
    return {
      isValid: false,
      message: 'State is required',
      type: 'error'
    };
  }

  const trimmedState = state.trim();
  
  if (trimmedState.length < 2) {
    return {
      isValid: false,
      message: 'State name must be at least 2 characters long',
      type: 'error'
    };
  }

  if (trimmedState.length > 50) {
    return {
      isValid: false,
      message: 'State name must be less than 50 characters',
      type: 'error'
    };
  }

  // Check for valid characters (letters, spaces, hyphens)
  const stateRegex = /^[a-zA-Z\s\-]+$/;
  if (!stateRegex.test(trimmedState)) {
    return {
      isValid: false,
      message: 'State name can only contain letters, spaces, and hyphens',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Valid state name',
    type: 'success'
  };
};

// Special instructions validation (optional field)
export const validateSpecialInstructions = (instructions: string): ValidationResult => {
  if (!instructions || instructions.trim() === '') {
    return {
      isValid: true,
      message: 'Special instructions are optional',
      type: 'success'
    };
  }

  const trimmedInstructions = instructions.trim();
  
  if (trimmedInstructions.length > 500) {
    return {
      isValid: false,
      message: 'Special instructions must be less than 500 characters',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Valid special instructions',
    type: 'success'
  };
};

// Real-time validation helper
export const createFieldValidator = (validationFn: (value: string) => ValidationResult) => {
  return (value: string, isTouched: boolean = false): FieldValidationState => {
    const result = validationFn(value);
    
    return {
      isValid: result.isValid,
      isTouched,
      errorMessage: result.message,
      showError: isTouched && !result.isValid
    };
  };
};

// Phone number formatting helper
export const formatIndianPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return cleanPhone;
  }
  
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return cleanPhone.substring(2);
  }
  
  return cleanPhone;
};

// ZIP code formatting helper
export const formatIndianZipCode = (zipCode: string): string => {
  return zipCode.replace(/\D/g, '').substring(0, 6);
};

// Name formatting helper
export const formatFullName = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

// Validation status icons
export const getValidationIcon = (validationState: FieldValidationState): string => {
  if (!validationState.isTouched) return '';
  if (validationState.isValid) return '✅';
  return '❌';
};

// Character counter helper
export const getCharacterCount = (text: string, maxLength: number): { current: number; max: number; isOverLimit: boolean } => {
  const current = text.length;
  return {
    current,
    max: maxLength,
    isOverLimit: current > maxLength
  };
};
