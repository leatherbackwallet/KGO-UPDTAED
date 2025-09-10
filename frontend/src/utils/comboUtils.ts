/**
 * Combo Product Utilities
 * Handles combo product price calculations and configurations
 */

import { ComboItem } from '../types/product';

export interface ComboItemConfiguration {
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  defaultQuantity?: number;
}

export interface ComboPriceBreakdown {
  basePrice: number;
  additionalItems: Array<{
    name: string;
    additionalQuantity: number;
    unitPrice: number;
    additionalCost: number;
    unit: string;
  }>;
  totalPrice: number;
}

/**
 * Calculate the total price for a combo product based on base price and item configurations
 */
export const calculateComboPrice = (
  comboBasePrice: number,
  comboItemConfigurations: ComboItemConfiguration[]
): number => {
  if (!comboBasePrice || !Array.isArray(comboItemConfigurations)) {
    return comboBasePrice || 0;
  }

  let totalPrice = comboBasePrice;

  comboItemConfigurations.forEach(item => {
    if (item.unitPrice && item.quantity) {
      // Calculate additional cost for quantities above default
      const additionalQuantity = Math.max(0, item.quantity - (item.defaultQuantity || 1));
      const additionalCost = additionalQuantity * item.unitPrice;
      totalPrice += additionalCost;
    }
  });

  return totalPrice;
};

/**
 * Validate combo item configuration
 */
export const validateComboItemConfig = (itemConfig: ComboItemConfiguration): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!itemConfig.name || typeof itemConfig.name !== 'string' || itemConfig.name.trim() === '') {
    errors.push('Item name is required');
  }

  if (typeof itemConfig.unitPrice !== 'number' || itemConfig.unitPrice < 0) {
    errors.push('Unit price must be a non-negative number');
  }

  if (typeof itemConfig.quantity !== 'number' || itemConfig.quantity < 0) {
    errors.push('Quantity must be a non-negative number');
  }

  if (!itemConfig.unit || typeof itemConfig.unit !== 'string' || itemConfig.unit.trim() === '') {
    errors.push('Unit is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create combo item configuration from product combo items and custom quantities
 */
export const createComboItemConfigurations = (
  comboItems: ComboItem[],
  customQuantities: Record<string, number> = {}
): ComboItemConfiguration[] => {
  if (!Array.isArray(comboItems)) {
    return [];
  }

  return comboItems.map(item => ({
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: customQuantities[item.name] || item.defaultQuantity,
    unit: item.unit,
    defaultQuantity: item.defaultQuantity
  }));
};

/**
 * Format combo price breakdown for display
 */
export const formatComboPriceBreakdown = (
  comboBasePrice: number,
  comboItemConfigurations: ComboItemConfiguration[]
): ComboPriceBreakdown => {
  const breakdown: ComboPriceBreakdown = {
    basePrice: comboBasePrice || 0,
    additionalItems: [],
    totalPrice: comboBasePrice || 0
  };

  if (Array.isArray(comboItemConfigurations)) {
    comboItemConfigurations.forEach(item => {
      const additionalQuantity = Math.max(0, item.quantity - (item.defaultQuantity || 1));
      if (additionalQuantity > 0) {
        const additionalCost = additionalQuantity * item.unitPrice;
        breakdown.additionalItems.push({
          name: item.name,
          additionalQuantity,
          unitPrice: item.unitPrice,
          additionalCost,
          unit: item.unit
        });
        breakdown.totalPrice += additionalCost;
      }
    });
  }

  return breakdown;
};

/**
 * Format price for display with currency
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};
