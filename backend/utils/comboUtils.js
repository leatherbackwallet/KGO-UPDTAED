/**
 * Combo Product Utilities
 * Handles combo product price calculations and configurations
 */

/**
 * Calculate the total price for a combo product based on base price and item configurations
 * @param {number} comboBasePrice - Base price for the combo
 * @param {Array} comboItemConfigurations - Array of item configurations with quantities and unit prices
 * @returns {number} Total calculated price
 */
const calculateComboPrice = (comboBasePrice, comboItemConfigurations) => {
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
 * @param {Object} itemConfig - Item configuration to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validateComboItemConfig = (itemConfig) => {
  const errors = [];

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
 * @param {Array} comboItems - Product's combo items definition
 * @param {Object} customQuantities - Custom quantities for each item (keyed by item name)
 * @returns {Array} Array of combo item configurations
 */
const createComboItemConfigurations = (comboItems, customQuantities = {}) => {
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
 * @param {number} comboBasePrice - Base price for the combo
 * @param {Array} comboItemConfigurations - Array of item configurations
 * @returns {Object} Formatted price breakdown
 */
const formatComboPriceBreakdown = (comboBasePrice, comboItemConfigurations) => {
  const breakdown = {
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

module.exports = {
  calculateComboPrice,
  validateComboItemConfig,
  createComboItemConfigurations,
  formatComboPriceBreakdown
};
