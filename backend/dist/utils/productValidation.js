"use strict";
/**
 * Product Validation Utilities
 * Centralized validation logic for product creation and updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateComboItems = exports.validateImageFormat = exports.validateCategoryIds = exports.validateProductId = exports.validateProductData = void 0;
/**
 * Comprehensive product validation for both creation and updates
 */
const validateProductData = (productData, isUpdate = false) => {
    const errors = [];
    // Validate required fields
    if (!productData.name || productData.name.trim() === '') {
        errors.push('Product name is required');
    }
    if (!productData.description || productData.description.trim() === '') {
        errors.push('Product description is required');
    }
    if (!productData.price || productData.price <= 0) {
        errors.push('Valid price is required');
    }
    if (!productData.categories || !Array.isArray(productData.categories) || productData.categories.length === 0) {
        errors.push('At least one category is required');
    }
    // Validate images if provided
    if (productData.images && Array.isArray(productData.images)) {
        for (const image of productData.images) {
            if (image && !image.startsWith('keralagiftsonline/products/') && !/^[a-zA-Z0-9._-]+$/.test(image)) {
                errors.push(`Invalid image format: ${image}`);
            }
        }
    }
    // Validate defaultImage if provided
    if (productData.defaultImage && !productData.defaultImage.startsWith('keralagiftsonline/products/') && !/^[a-zA-Z0-9._-]+$/.test(productData.defaultImage)) {
        errors.push(`Invalid default image format: ${productData.defaultImage}`);
    }
    // Validate combo-specific fields if it's a combo product
    if (productData.isCombo) {
        if (productData.comboBasePrice !== undefined && productData.comboBasePrice < 0) {
            errors.push('Combo base price cannot be negative');
        }
        if (productData.comboItems && Array.isArray(productData.comboItems)) {
            for (let i = 0; i < productData.comboItems.length; i++) {
                const item = productData.comboItems[i];
                if (!item.name || item.name.trim() === '') {
                    errors.push(`Combo item ${i + 1} name is required`);
                }
                if (item.unitPrice === undefined || item.unitPrice < 0) {
                    errors.push(`Combo item ${i + 1} unit price must be non-negative`);
                }
                if (item.defaultQuantity === undefined || item.defaultQuantity < 0) {
                    errors.push(`Combo item ${i + 1} default quantity must be non-negative`);
                }
                if (!item.unit || item.unit.trim() === '') {
                    errors.push(`Combo item ${i + 1} unit is required`);
                }
            }
        }
    }
    // Sanitize and set defaults
    const sanitizedData = {
        ...productData,
        name: productData.name?.trim() || '',
        description: productData.description?.trim() || '',
        stock: productData.stock || 200,
        costPrice: productData.costPrice || 0,
        isFeatured: productData.isFeatured || false,
        isDeleted: isUpdate ? productData.isDeleted : false, // Don't reset isDeleted on updates
        isCombo: productData.isCombo || false,
        comboBasePrice: productData.comboBasePrice || 0,
        comboItems: productData.comboItems || []
    };
    return {
        isValid: errors.length === 0,
        errors,
        sanitizedData
    };
};
exports.validateProductData = validateProductData;
/**
 * Validate product ID format
 */
const validateProductId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};
exports.validateProductId = validateProductId;
/**
 * Validate category IDs
 */
const validateCategoryIds = (categories) => {
    return categories.every(id => /^[0-9a-fA-F]{24}$/.test(id));
};
exports.validateCategoryIds = validateCategoryIds;
/**
 * Validate image URLs/IDs
 */
const validateImageFormat = (image) => {
    if (!image)
        return true;
    // Allow Cloudinary public IDs
    if (image.startsWith('keralagiftsonline/products/')) {
        return true;
    }
    // Allow local filenames (alphanumeric, hyphens, underscores, dots)
    return /^[a-zA-Z0-9._-]+$/.test(image);
};
exports.validateImageFormat = validateImageFormat;
/**
 * Validate combo items structure
 */
const validateComboItems = (comboItems) => {
    const errors = [];
    if (!Array.isArray(comboItems)) {
        return { isValid: false, errors: ['Combo items must be an array'] };
    }
    for (let i = 0; i < comboItems.length; i++) {
        const item = comboItems[i];
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
            errors.push(`Combo item ${i + 1}: Name is required`);
        }
        if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
            errors.push(`Combo item ${i + 1}: Unit price must be a non-negative number`);
        }
        if (typeof item.defaultQuantity !== 'number' || item.defaultQuantity < 0) {
            errors.push(`Combo item ${i + 1}: Default quantity must be a non-negative number`);
        }
        if (!item.unit || typeof item.unit !== 'string' || item.unit.trim() === '') {
            errors.push(`Combo item ${i + 1}: Unit is required`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateComboItems = validateComboItems;
