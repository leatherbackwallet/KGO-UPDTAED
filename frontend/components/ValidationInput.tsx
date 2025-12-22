/**
 * Enhanced Input Component with Real-time Validation
 * Provides visual feedback, error messages, and character counting
 */

import React, { useState, useEffect } from 'react';
import { FieldValidationState, getValidationIcon, getCharacterCount } from '../utils/validation';

interface ValidationInputProps {
  type?: 'text' | 'email' | 'tel' | 'textarea';
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label: string;
  required?: boolean;
  validationState: FieldValidationState;
  maxLength?: number;
  rows?: number;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
}

const ValidationInput: React.FC<ValidationInputProps> = ({
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  label,
  required = false,
  validationState,
  maxLength,
  rows = 3,
  className = '',
  disabled = false,
  autoComplete
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showCharacterCount, setShowCharacterCount] = useState(false);

  // Show character count for fields with maxLength
  useEffect(() => {
    setShowCharacterCount(!!maxLength && value.length > 0);
  }, [maxLength, value.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    // Apply formatting based on field type
    if (name === 'senderPhone' || name === 'recipientPhone') {
      // Format phone number - remove non-digits and limit to 10 digits
      newValue = newValue.replace(/\D/g, '').substring(0, 10);
    } else if (name === 'zipCode') {
      // Format ZIP code - remove non-digits and limit to 6 digits
      newValue = newValue.replace(/\D/g, '').substring(0, 6);
    } else if (maxLength) {
      // Limit to maxLength if specified
      newValue = newValue.substring(0, maxLength);
    }
    
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Get input styling based on validation state
  const getInputClasses = () => {
    const baseClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none transition-colors';
    const focusClasses = 'focus:ring-2 focus:ring-blue-500';
    const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
    
    if (validationState.isTouched) {
      if (validationState.isValid) {
        return `${baseClasses} ${focusClasses} ${disabledClasses} border-green-500 bg-green-50`;
      } else {
        return `${baseClasses} ${focusClasses} ${disabledClasses} border-red-500 bg-red-50`;
      }
    }
    
    return `${baseClasses} ${focusClasses} ${disabledClasses} border-gray-300`;
  };

  // Get label styling
  const getLabelClasses = () => {
    const baseClasses = 'block text-sm font-medium mb-1';
    
    if (validationState.isTouched) {
      if (validationState.isValid) {
        return `${baseClasses} text-green-700`;
      } else {
        return `${baseClasses} text-red-700`;
      }
    }
    
    return `${baseClasses} text-gray-700`;
  };

  // Character count info
  const characterCount = maxLength ? getCharacterCount(value, maxLength) : null;

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label with validation icon */}
      <div className="flex items-center justify-between">
        <label htmlFor={name} className={getLabelClasses()}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Validation icon */}
        {validationState.isTouched && (
          <span className="text-lg" title={validationState.errorMessage}>
            {getValidationIcon(validationState)}
          </span>
        )}
      </div>

      {/* Input field */}
      <div className="relative">
        <InputComponent
          id={name}
          type={type === 'textarea' ? undefined : type}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          rows={type === 'textarea' ? rows : undefined}
          className={getInputClasses()}
          maxLength={maxLength}
        />
        
        {/* Character count */}
        {showCharacterCount && characterCount && (
          <div className={`absolute right-2 top-2 text-xs ${
            characterCount.isOverLimit ? 'text-red-500' : 'text-gray-500'
          }`}>
            {characterCount.current}/{characterCount.max}
          </div>
        )}
      </div>

      {/* Error message */}
      {validationState.showError && (
        <div className="text-red-600 text-sm flex items-center space-x-1">
          <span>❌</span>
          <span>{validationState.errorMessage}</span>
        </div>
      )}

      {/* Success message (optional) */}
      {validationState.isTouched && validationState.isValid && !validationState.showError && (
        <div className="text-green-600 text-sm flex items-center space-x-1">
          <span>✅</span>
          <span>Looks good!</span>
        </div>
      )}

      {/* Helpful hints */}
      {isFocused && !validationState.showError && (
        <div className="text-gray-500 text-xs">
          {name === 'senderName' || name === 'recipientName' ? (
            '💡 Enter your full name (first and last name)'
          ) : name === 'senderEmail' ? (
            '💡 We\'ll use this to send order updates'
          ) : name === 'senderPhone' || name === 'recipientPhone' ? (
            '💡 Enter your phone number (10-12 digits)'
          ) : name === 'zipCode' ? (
            '💡 Enter 6-digit Indian postal code'
          ) : name === 'street' ? (
            '💡 Include house number, street name, and area'
          ) : name === 'specialInstructions' ? (
            '💡 Any special delivery instructions (optional)'
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ValidationInput;
