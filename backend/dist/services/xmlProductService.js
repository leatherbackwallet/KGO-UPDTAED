"use strict";
/**
 * XML Product Service
 *
 * Handles reading and parsing products from XML file for frontend consumption.
 * Provides search, filtering, pagination, and caching functionality.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xmlProductService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xml2js_1 = require("xml2js");
class XmlProductService {
    constructor() {
        this.cachedProducts = null;
        this.cacheTimestamp = 0;
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
        this.xmlFilePath = path_1.default.join(__dirname, '../products.xml');
    }
    /**
     * Check if XML file exists
     */
    xmlFileExists() {
        return fs_1.default.existsSync(this.xmlFilePath);
    }
    /**
     * Get file modification time
     */
    getFileModTime() {
        try {
            return fs_1.default.statSync(this.xmlFilePath).mtime.getTime();
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Check if cache is valid
     */
    isCacheValid() {
        if (!this.cachedProducts)
            return false;
        const now = Date.now();
        const fileModTime = this.getFileModTime();
        // Cache is invalid if file was modified or TTL expired
        return (now - this.cacheTimestamp) < this.CACHE_TTL &&
            fileModTime <= this.cacheTimestamp;
    }
    /**
     * Parse XML array elements
     */
    parseXmlArray(xmlArray, elementName) {
        if (!xmlArray || !Array.isArray(xmlArray))
            return [];
        return xmlArray.map(item => {
            if (typeof item === 'string') {
                return { id: item, name: item };
            }
            else if (item.$ && item.$['id']) {
                return {
                    id: item.$['id'],
                    name: item._ || item.$['id'] || ''
                };
            }
            return { id: '', name: '' };
        }).filter(item => item.id);
    }
    /**
     * Parse combo items from XML
     */
    parseComboItems(comboItemsXml) {
        if (!comboItemsXml || !comboItemsXml['combo-item'])
            return [];
        const items = Array.isArray(comboItemsXml['combo-item'])
            ? comboItemsXml['combo-item']
            : [comboItemsXml['combo-item']];
        return items.map(item => ({
            name: item.name?.[0] || '',
            unitPrice: parseInt(item['unit-price']?.[0] || '0'),
            defaultQuantity: parseInt(item['default-quantity']?.[0] || '1'),
            unit: item.unit?.[0] || 'piece'
        }));
    }
    /**
     * Load and parse products from XML file
     */
    async loadProductsFromXml() {
        try {
            if (!this.xmlFileExists()) {
                console.warn('⚠️ products.xml file not found. Run migration script first.');
                return [];
            }
            console.log('📖 Loading products from XML file...');
            const xmlContent = fs_1.default.readFileSync(this.xmlFilePath, 'utf8');
            const parsedXml = await (0, xml2js_1.parseStringPromise)(xmlContent);
            if (!parsedXml.products || !parsedXml.products.product) {
                console.warn('⚠️ No products found in XML file');
                return [];
            }
            const productsXml = Array.isArray(parsedXml.products.product)
                ? parsedXml.products.product
                : [parsedXml.products.product];
            const products = productsXml.map(productXml => {
                const product = {
                    id: productXml.$?.id || '',
                    name: productXml.name?.[0] || '',
                    description: productXml.description?.[0] || '',
                    slug: productXml.slug?.[0] || '',
                    price: parseInt(productXml.price?.[0] || '0'),
                    costPrice: parseInt(productXml['cost-price']?.[0] || '0'),
                    stock: parseInt(productXml.stock?.[0] || '0'),
                    isFeatured: productXml['is-featured']?.[0] === 'true',
                    isCombo: productXml['is-combo']?.[0] === 'true',
                    comboBasePrice: parseInt(productXml['combo-base-price']?.[0] || '0'),
                    createdAt: productXml['created-at']?.[0] || '',
                    updatedAt: productXml['updated-at']?.[0] || '',
                    defaultImage: productXml['default-image']?.[0] || '',
                    images: productXml.images?.[0]?.image || [],
                    categories: this.parseXmlArray(productXml.categories?.[0]?.category, 'category'),
                    occasions: this.parseXmlArray(productXml.occasions?.[0]?.occasion, 'occasion'),
                    vendors: this.parseXmlArray(productXml.vendors?.[0]?.vendor, 'vendor'),
                    comboItems: this.parseComboItems(productXml['combo-items']?.[0])
                };
                return product;
            });
            console.log(`✅ Loaded ${products.length} products from XML`);
            return products;
        }
        catch (error) {
            console.error('❌ Error loading products from XML:', error);
            return [];
        }
    }
    /**
     * Get all products with caching
     */
    async getAllProducts() {
        if (this.isCacheValid() && this.cachedProducts) {
            console.log('📦 Using cached products');
            return this.cachedProducts;
        }
        console.log('🔄 Refreshing product cache...');
        this.cachedProducts = await this.loadProductsFromXml();
        this.cacheTimestamp = Date.now();
        return this.cachedProducts;
    }
    /**
     * Apply search filter
     */
    applySearchFilter(products, search) {
        if (!search || search.trim() === '')
            return products;
        const searchTerm = search.toLowerCase().trim();
        return products.filter(product => product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.categories.some(cat => cat.name.toLowerCase().includes(searchTerm)) ||
            product.occasions.some(occ => occ.name.toLowerCase().includes(searchTerm)));
    }
    /**
     * Apply category filter
     */
    applyCategoryFilter(products, category) {
        if (!category)
            return products;
        return products.filter(product => product.categories.some(cat => cat.id === category || cat.name.toLowerCase() === category.toLowerCase()));
    }
    /**
     * Apply occasion filter
     */
    applyOccasionFilter(products, occasion) {
        if (!occasion)
            return products;
        return products.filter(product => product.occasions.some(occ => occ.id === occasion || occ.name.toLowerCase() === occasion.toLowerCase()));
    }
    /**
     * Apply price range filter
     */
    applyPriceFilter(products, minPrice, maxPrice) {
        if (minPrice === undefined && maxPrice === undefined)
            return products;
        return products.filter(product => {
            if (minPrice !== undefined && product.price < minPrice)
                return false;
            if (maxPrice !== undefined && product.price > maxPrice)
                return false;
            return true;
        });
    }
    /**
     * Apply sorting
     */
    applySorting(products, sort) {
        const sortedProducts = [...products];
        switch (sort) {
            case 'price-low':
                return sortedProducts.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sortedProducts.sort((a, b) => b.price - a.price);
            case 'name':
                return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            case 'oldest':
                return sortedProducts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'featured':
                return sortedProducts.sort((a, b) => {
                    if (a.isFeatured && !b.isFeatured)
                        return -1;
                    if (!a.isFeatured && b.isFeatured)
                        return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
            case 'newest':
            default:
                return sortedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    }
    /**
     * Apply pagination
     */
    applyPagination(products, page, limit) {
        const total = products.length;
        const pages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = products.slice(startIndex, endIndex);
        return {
            products: paginatedProducts,
            total,
            pages,
            currentPage: page,
            hasMore: page < pages
        };
    }
    /**
     * Get products with filters, search, and pagination
     */
    async getProducts(filters = {}) {
        const { search, category, occasion, vendor, featured, minPrice, maxPrice, page = 1, limit = 24, sort = 'newest' } = filters;
        try {
            // Load all products
            let products = await this.getAllProducts();
            // Apply filters
            if (search) {
                products = this.applySearchFilter(products, search);
            }
            if (category) {
                products = this.applyCategoryFilter(products, category);
            }
            if (occasion) {
                products = this.applyOccasionFilter(products, occasion);
            }
            if (featured !== undefined) {
                products = products.filter(product => product.isFeatured === featured);
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                products = this.applyPriceFilter(products, minPrice, maxPrice);
            }
            // Apply sorting
            products = this.applySorting(products, sort);
            // Apply pagination
            const result = this.applyPagination(products, page, limit);
            console.log(`📊 Filtered products: ${result.total} total, page ${page}/${result.pages}`);
            return result;
        }
        catch (error) {
            console.error('❌ Error getting products from XML:', error);
            return {
                products: [],
                total: 0,
                pages: 0,
                currentPage: page || 1,
                hasMore: false
            };
        }
    }
    /**
     * Get single product by ID
     */
    async getProductById(id) {
        try {
            const products = await this.getAllProducts();
            return products.find(product => product.id === id) || null;
        }
        catch (error) {
            console.error('❌ Error getting product by ID:', error);
            return null;
        }
    }
    /**
     * Get featured products
     */
    async getFeaturedProducts(limit = 8) {
        try {
            const products = await this.getAllProducts();
            return products
                .filter(product => product.isFeatured)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, limit);
        }
        catch (error) {
            console.error('❌ Error getting featured products:', error);
            return [];
        }
    }
    /**
     * Clear cache (useful for development)
     */
    clearCache() {
        this.cachedProducts = null;
        this.cacheTimestamp = 0;
        console.log('🗑️ XML product cache cleared');
    }
    /**
     * Get cache status
     */
    getCacheStatus() {
        return {
            cached: this.cachedProducts !== null,
            timestamp: this.cacheTimestamp,
            count: this.cachedProducts?.length || 0
        };
    }
}
// Export singleton instance
exports.xmlProductService = new XmlProductService();
exports.default = exports.xmlProductService;
