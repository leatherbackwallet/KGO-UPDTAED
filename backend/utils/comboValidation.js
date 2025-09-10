/**
 * Combo Product Validation Utilities
 * Validates combo product data before saving to database
 */

/**
 * Validate combo item data
 * @param {Object} comboItem - The combo item to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validateComboItem = (comboItem) => {
  const errors = [];

  if (!comboItem.name || typeof comboItem.name !== 'string' || comboItem.name.trim() === '') {
    errors.push('Combo item name is required');
  }

  if (typeof comboItem.unitPrice !== 'number' || comboItem.unitPrice < 0) {
    errors.push('Combo item unit price must be a non-negative number');
  }

  if (typeof comboItem.defaultQuantity !== 'number' || comboItem.defaultQuantity < 0) {
    errors.push('Combo item default quantity must be a non-negative number');
  }

  if (!comboItem.unit || typeof comboItem.unit !== 'string' || comboItem.unit.trim() === '') {
    errors.push('Combo item unit is required');
  }

  const validUnits = ['kg', 'set', 'piece', 'dozen', 'gram', 'liter', 'box', 'pack'];
  if (comboItem.unit && !validUnits.includes(comboItem.unit)) {
    errors.push(`Combo item unit must be one of: ${validUnits.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate combo product data
 * @param {Object} productData - The product data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validateComboProduct = (productData) => {
  const errors = [];

  // If isCombo is true, validate combo-specific fields
  if (productData.isCombo === true) {
    if (typeof productData.comboBasePrice !== 'number' || productData.comboBasePrice < 0) {
      errors.push('Combo base price must be a non-negative number');
    }

    if (!Array.isArray(productData.comboItems)) {
      errors.push('Combo items must be an array');
    } else {
      if (productData.comboItems.length === 0) {
        errors.push('Combo products must have at least one combo item');
      }

      // Validate each combo item
      productData.comboItems.forEach((item, index) => {
        const itemValidation = validateComboItem(item);
        if (!itemValidation.isValid) {
          itemValidation.errors.forEach(error => {
            errors.push(`Combo item ${index + 1}: ${error}`);
          });
        }
      });

      // Check for duplicate item names
      const itemNames = productData.comboItems.map(item => item.name?.toLowerCase().trim());
      const uniqueNames = new Set(itemNames);
      if (itemNames.length !== uniqueNames.size) {
        errors.push('Combo items must have unique names');
      }
    }
  } else {
    // If not a combo, ensure combo fields are not set
    if (productData.comboBasePrice !== undefined && productData.comboBasePrice !== 0) {
      errors.push('Non-combo products cannot have a combo base price');
    }
    if (productData.comboItems !== undefined && productData.comboItems.length > 0) {
      errors.push('Non-combo products cannot have combo items');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize combo product data
 * @param {Object} productData - The product data to sanitize
 * @returns {Object} - Sanitized product data
 */
const sanitizeComboProduct = (productData) => {
  const sanitized = { ...productData };

  // Ensure isCombo is boolean
  sanitized.isCombo = Boolean(sanitized.isCombo);

  if (sanitized.isCombo) {
    // Ensure comboBasePrice is a number
    sanitized.comboBasePrice = Number(sanitized.comboBasePrice) || 0;

    // Ensure comboItems is an array and sanitize each item
    if (Array.isArray(sanitized.comboItems)) {
      sanitized.comboItems = sanitized.comboItems.map(item => ({
        name: String(item.name || '').trim(),
        unitPrice: Number(item.unitPrice) || 0,
        defaultQuantity: Number(item.defaultQuantity) || 1,
        unit: String(item.unit || 'piece').trim()
      }));
    } else {
      sanitized.comboItems = [];
    }
  } else {
    // Clear combo fields for non-combo products
    sanitized.comboBasePrice = 0;
    sanitized.comboItems = [];
  }

  return sanitized;
};

module.exports = {
  validateComboItem,
  validateComboProduct,
  sanitizeComboProduct
};
