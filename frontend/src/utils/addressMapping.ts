/**
 * Address Mapping Utilities
 * Standardizes address data between guest and registered users
 */

export interface StandardRecipientAddress {
  name: string;
  phone: string;
  address: {
    streetName: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  additionalInstructions?: string;
}

export interface GuestFormData {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: {
    street: string;
    houseNumber?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  specialInstructions?: string;
  paymentMethod: string;
}

export interface RecipientAddress {
  name: string;
  phone: string;
  address: {
    streetName: string;
    houseNumber?: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  additionalInstructions?: string;
  isDefault: boolean;
}

/**
 * Maps guest form data to standard recipient address format
 */
export const mapGuestDataToRecipientAddress = (guestData: GuestFormData): StandardRecipientAddress => {
  return {
    name: guestData.recipientName,
    phone: guestData.recipientPhone,
    address: {
      streetName: guestData.deliveryAddress.street,
      houseNumber: guestData.deliveryAddress.houseNumber,
      postalCode: guestData.deliveryAddress.zipCode,
      city: guestData.deliveryAddress.city,
      countryCode: guestData.deliveryAddress.country || 'IN'
    },
    additionalInstructions: guestData.specialInstructions
  };
};

/**
 * Maps recipient address to standard format (already in correct format)
 */
export const mapRecipientAddressToStandard = (recipientAddress: RecipientAddress): StandardRecipientAddress => {
  return {
    name: recipientAddress.name,
    phone: recipientAddress.phone,
    address: recipientAddress.address,
    additionalInstructions: recipientAddress.additionalInstructions
  };
};

/**
 * Creates standardized recipient address for payment order
 * Works for both guest and registered users
 */
export const createStandardRecipientAddress = (
  data: GuestFormData | RecipientAddress,
  isGuest: boolean = false
): StandardRecipientAddress => {
  if (isGuest) {
    return mapGuestDataToRecipientAddress(data as GuestFormData);
  } else {
    return mapRecipientAddressToStandard(data as RecipientAddress);
  }
};
