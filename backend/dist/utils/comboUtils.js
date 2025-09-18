"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatComboPriceBreakdown = exports.createComboItemConfigurations = exports.validateComboItemConfig = exports.calculateComboPrice = void 0;
const calculateComboPrice = (comboBasePrice, comboItemConfigurations) => {
    if (!comboBasePrice || !Array.isArray(comboItemConfigurations)) {
        return comboBasePrice || 0;
    }
    let totalPrice = comboBasePrice;
    comboItemConfigurations.forEach(item => {
        if (item.unitPrice && item.quantity) {
            const additionalQuantity = Math.max(0, item.quantity - (item.defaultQuantity || 1));
            const additionalCost = additionalQuantity * item.unitPrice;
            totalPrice += additionalCost;
        }
    });
    return totalPrice;
};
exports.calculateComboPrice = calculateComboPrice;
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
exports.validateComboItemConfig = validateComboItemConfig;
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
exports.createComboItemConfigurations = createComboItemConfigurations;
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
exports.formatComboPriceBreakdown = formatComboPriceBreakdown;
//# sourceMappingURL=comboUtils.js.map