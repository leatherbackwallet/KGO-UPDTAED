/**
 * JSON Data Transformers
 * Transform JSON data from static files to match the expected interface structures
 */

import { Product, Category, Occasion } from '../types/shared';

/**
 * Transform JSON product to Product interface
 */
export const transformJsonProduct = (jsonProduct: any): Product => {
  return {
    _id: jsonProduct._id?.$oid || jsonProduct._id || '',
    name: jsonProduct.name || '',
    description: jsonProduct.description || '',
    price: jsonProduct.price || 0,
    originalPrice: jsonProduct.costPrice || jsonProduct.price || 0,
    category: jsonProduct.categories?.[0] || '',
    categories: jsonProduct.categories || [],
    stock: jsonProduct.stock || 0,
    images: jsonProduct.images || [],
    slug: jsonProduct.slug || '',
    occasions: jsonProduct.occasions || [],
    isFeatured: jsonProduct.isFeatured || false,
    inStock: (jsonProduct.stock || 0) > 0,
    featured: jsonProduct.isFeatured || false,
    defaultImage: jsonProduct.defaultImage || jsonProduct.images?.[0] || '',
    isCombo: jsonProduct.isCombo || false,
    comboBasePrice: jsonProduct.comboBasePrice || 0,
    comboItems: jsonProduct.comboItems || [],
    createdAt: jsonProduct.createdAt?.$date || jsonProduct.createdAt || '',
    updatedAt: jsonProduct.updatedAt?.$date || jsonProduct.updatedAt || '',
    isDeleted: jsonProduct.isDeleted || false,
    isActive: !jsonProduct.isDeleted,
    isSeasonal: false
  };
};

/**
 * Transform JSON category to Category interface
 */
export const transformJsonCategory = (jsonCategory: any): Category => {
  return {
    _id: jsonCategory._id?.$oid || jsonCategory._id || '',
    name: jsonCategory.name || '',
    slug: jsonCategory.slug || '',
    description: jsonCategory.description || '',
    sortOrder: jsonCategory.sortOrder || 0,
    isActive: jsonCategory.isActive !== false,
    isDeleted: jsonCategory.isDeleted || false,
    createdAt: jsonCategory.createdAt?.$date || jsonCategory.createdAt || '',
    updatedAt: jsonCategory.updatedAt?.$date || jsonCategory.updatedAt || ''
  };
};

/**
 * Transform JSON occasion to Occasion interface
 */
export const transformJsonOccasion = (jsonOccasion: any): Occasion => {
  return {
    _id: jsonOccasion._id?.$oid || jsonOccasion._id || '',
    name: jsonOccasion.name || '',
    slug: jsonOccasion.slug || '',
    description: jsonOccasion.description || '',
    icon: jsonOccasion.icon || '',
    color: jsonOccasion.color || '#000000',
    dateRange: jsonOccasion.dateRange || {
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
      isRecurring: false
    },
    priority: jsonOccasion.priority || {
      level: 'medium',
      boostMultiplier: 1.0
    },
    isActive: jsonOccasion.isActive !== false,
    isDeleted: jsonOccasion.isDeleted || false,
    createdAt: jsonOccasion.createdAt?.$date || jsonOccasion.createdAt || '',
    updatedAt: jsonOccasion.updatedAt?.$date || jsonOccasion.updatedAt || ''
  };
};

/**
 * Load and transform products from JSON (server-side)
 */
export const loadProductsFromJSON = async (): Promise<Product[]> => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), 'public', 'data', 'keralagiftsonline.products.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    return jsonData.map(transformJsonProduct);
  } catch (error) {
    console.error('Error loading products from JSON:', error);
    return [];
  }
};

/**
 * Load and transform categories from JSON (server-side)
 */
export const loadCategoriesFromJSON = async (): Promise<Category[]> => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), 'public', 'data', 'keralagiftsonline.categories.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    return jsonData.map(transformJsonCategory);
  } catch (error) {
    console.error('Error loading categories from JSON:', error);
    return [];
  }
};

/**
 * Load and transform occasions from JSON (server-side)
 */
export const loadOccasionsFromJSON = async (): Promise<Occasion[]> => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), 'public', 'data', 'keralagiftsonline.occasions.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    return jsonData.map(transformJsonOccasion);
  } catch (error) {
    console.error('Error loading occasions from JSON:', error);
    return [];
  }
};
