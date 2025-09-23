/**
 * Address Mapping Tests
 * Verifies that both guest and registered users produce consistent data structures
 */

import { createStandardRecipientAddress, mapGuestDataToRecipientAddress, mapRecipientAddressToStandard } from '../addressMapping';

// Mock data for testing
const mockGuestData = {
  senderName: 'John Doe',
  senderEmail: 'john@example.com',
  senderPhone: '+1234567890',
  recipientName: 'Jane Smith',
  recipientPhone: '+0987654321',
  deliveryAddress: {
    street: '123 Main Street',
    houseNumber: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  },
  specialInstructions: 'Please deliver after 5 PM',
  paymentMethod: 'razorpay'
};

const mockRecipientAddress = {
  name: 'Jane Smith',
  phone: '+0987654321',
  address: {
    streetName: '123 Main Street',
    houseNumber: 'Apt 4B',
    postalCode: '10001',
    city: 'New York',
    countryCode: 'US'
  },
  additionalInstructions: 'Please deliver after 5 PM',
  isDefault: true
};

describe('Address Mapping Consistency', () => {
  test('Guest data should map to standard format correctly', () => {
    const result = mapGuestDataToRecipientAddress(mockGuestData);
    
    expect(result).toEqual({
      name: 'Jane Smith',
      phone: '+0987654321',
      address: {
        streetName: '123 Main Street',
        houseNumber: 'Apt 4B',
        postalCode: '10001',
        city: 'New York',
        countryCode: 'US'
      },
      additionalInstructions: 'Please deliver after 5 PM'
    });
  });

  test('Recipient address should map to standard format correctly', () => {
    const result = mapRecipientAddressToStandard(mockRecipientAddress);
    
    expect(result).toEqual({
      name: 'Jane Smith',
      phone: '+0987654321',
      address: {
        streetName: '123 Main Street',
        houseNumber: 'Apt 4B',
        postalCode: '10001',
        city: 'New York',
        countryCode: 'US'
      },
      additionalInstructions: 'Please deliver after 5 PM'
    });
  });

  test('Both user types should produce identical standard format', () => {
    const guestResult = createStandardRecipientAddress(mockGuestData, true);
    const registeredResult = createStandardRecipientAddress(mockRecipientAddress, false);
    
    // Both should produce the same structure
    expect(guestResult).toEqual(registeredResult);
    
    // Verify all required fields are present
    expect(guestResult.name).toBeDefined();
    expect(guestResult.phone).toBeDefined();
    expect(guestResult.address.streetName).toBeDefined();
    expect(guestResult.address.postalCode).toBeDefined();
    expect(guestResult.address.city).toBeDefined();
    expect(guestResult.address.countryCode).toBeDefined();
    expect(guestResult.additionalInstructions).toBeDefined();
  });

  test('Guest data with missing optional fields should handle gracefully', () => {
    const guestDataMinimal = {
      ...mockGuestData,
      deliveryAddress: {
        ...mockGuestData.deliveryAddress,
        houseNumber: undefined,
        country: undefined
      },
      specialInstructions: undefined
    };
    
    const result = createStandardRecipientAddress(guestDataMinimal, true);
    
    expect(result.address.houseNumber).toBeUndefined();
    expect(result.address.countryCode).toBe('IN'); // Should default to 'IN'
    expect(result.additionalInstructions).toBeUndefined();
  });

  test('Field name consistency should be maintained', () => {
    const guestResult = createStandardRecipientAddress(mockGuestData, true);
    
    // Verify field names match expected standard
    expect(guestResult.address).toHaveProperty('streetName');
    expect(guestResult.address).toHaveProperty('postalCode');
    expect(guestResult.address).toHaveProperty('countryCode');
    expect(guestResult).toHaveProperty('additionalInstructions');
    
    // Verify old field names are not present
    expect(guestResult.address).not.toHaveProperty('street');
    expect(guestResult.address).not.toHaveProperty('zipCode');
    expect(guestResult.address).not.toHaveProperty('country');
    expect(guestResult).not.toHaveProperty('specialInstructions');
  });
});
