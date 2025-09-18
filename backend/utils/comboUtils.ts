/**
 * Combo Product Utilities
 * Handles combo product price calculations and configurations
 */

export interface ComboItemConfig {
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

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Calculate the total price for a combo product based on base price and item configurations
 * @param comboBasePrice - Base price for the combo
 * @param comboItemConfigurations - Array of item configurations with quantities and unit prices
 * @returns Total calculated price
 */
export const calculateComboPrice = (
  comboBasePrice: number,
  comboItemConfigurations: ComboItemConfig[]
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
 * @param itemConfig - Item configuration to validate
 * @returns Validation result with isValid and errors
 */
export const validateComboItemConfig = (itemConfig: any): ValidationResult => {
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
 * @param comboItems - Product's combo items definition
 * @param customQuantities - Custom quantities for each item (keyed by item name)
 * @returns Array of combo item configurations
 */
export const createComboItemConfigurations = (
  comboItems: any[],
  customQuantities: Record<string, number> = {}
): ComboItemConfig[] => {
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
 * @param comboBasePrice - Base price for the combo
 * @param comboItemConfigurations - Array of item configurations
 * @returns Formatted price breakdown
 */
export const formatComboPriceBreakdown = (
  comboBasePrice: number,
  comboItemConfigurations: ComboItemConfig[]
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
