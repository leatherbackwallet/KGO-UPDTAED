/**
 * Validation Utilities Test Suite
 * Tests all validation functions to ensure proper behavior
 */

import {
  validateEmail,
  validateFullName,
  validatePhone,
  validateIndianZipCode,
  validateAddress,
  validateCity,
  validateState,
  validateSpecialInstructions
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.in',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('success');
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('error');
      });
    });
  });

  describe('validateFullName', () => {
    it('should validate correct full names with first and last name', () => {
      const validNames = [
        'John Doe',
        'Mary Jane Smith',
        'Dr. Sarah Johnson',
        'Jean-Pierre Dubois'
      ];

      validNames.forEach(name => {
        const result = validateFullName(name);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('success');
      });
    });

    it('should reject names without space (single name)', () => {
      const invalidNames = [
        'John',
        'Mary',
        'Dr.',
        'Jean-Pierre'
      ];

      invalidNames.forEach(name => {
        const result = validateFullName(name);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('full name');
      });
    });

    it('should reject names with invalid characters', () => {
      const invalidNames = [
        'John123 Doe',
        'Mary@Jane Smith',
        'John#Doe',
        'Mary$Smith'
      ];

      invalidNames.forEach(name => {
        const result = validateFullName(name);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('error');
      });
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers (10-12 digits)', () => {
      const validPhones = [
        '9876543210',
        '1234567890',
        '11234567890',
        '123456789012'
      ];

      validPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('success');
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '',
        '123456789',   // too short (9 digits)
        '1234567890123', // too long (13 digits)
        'abc1234567'  // contains letters
      ];

      invalidPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('error');
      });
    });
  });

  describe('validateIndianZipCode', () => {
    it('should validate correct Indian postal codes', () => {
      const validZipCodes = [
        '110001',
        '400001',
        '560001',
        '700001'
      ];

      validZipCodes.forEach(zipCode => {
        const result = validateIndianZipCode(zipCode);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('success');
      });
    });

    it('should reject invalid postal codes', () => {
      const invalidZipCodes = [
        '',
        '12345',   // too short
        '1234567', // too long
        '000000',  // invalid
        'abc123'  // contains letters
      ];

      invalidZipCodes.forEach(zipCode => {
        const result = validateIndianZipCode(zipCode);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('error');
      });
    });
  });

  describe('validateAddress', () => {
    it('should validate correct addresses', () => {
      const validAddresses = [
        '123 Main Street, Area Name',
        'Building A, Floor 2, Sector 15',
        'Near Metro Station, Connaught Place'
      ];

      validAddresses.forEach(address => {
        const result = validateAddress(address);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('success');
      });
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        '',
        '123', // too short
        'A'.repeat(201) // too long
      ];

      invalidAddresses.forEach(address => {
        const result = validateAddress(address);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('error');
      });
    });
  });

  describe('validateSpecialInstructions', () => {
    it('should accept valid special instructions', () => {
      const validInstructions = [
        '',
        'Please deliver after 6 PM',
        'Ring the doorbell twice',
        'Leave with security guard'
      ];

      validInstructions.forEach(instructions => {
        const result = validateSpecialInstructions(instructions);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('success');
      });
    });

    it('should reject instructions that are too long', () => {
      const longInstructions = 'A'.repeat(501);
      const result = validateSpecialInstructions(longInstructions);
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('error');
    });
  });
});
