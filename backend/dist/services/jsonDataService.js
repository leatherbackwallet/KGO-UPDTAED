"use strict";
/**
 * JSON Data Service - Handles all product, category, and occasion data from JSON files
 * Completely replaces MongoDB for items page ecosystem
 * No MongoDB dependencies - pure JSON file reading
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonDataService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class JsonDataService {
    constructor() {
        this.products = null;
        this.categories = null;
        this.occasions = null;
        this.lastLoadTime = 0;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
        this.PRODUCTS_FILE = path_1.default.join(process.cwd(), 'Products/keralagiftsonline.products.json');
        this.CATEGORIES_FILE = path_1.default.join(process.cwd(), 'Products/keralagiftsonline.categories.json');
        this.OCCASIONS_FILE = path_1.default.join(process.cwd(), 'Products/keralagiftsonline.occasions.json');
    }
    /**
     * Load and cache all JSON data
     */
    async loadData() {
        const now = Date.now();
        // Return cached data if still valid
        if (this.products && this.categories && this.occasions &&
            (now - this.lastLoadTime) < this.CACHE_DURATION) {
            return;
        }
        console.log('🔄 Loading JSON data from files...');
        try {
            // Load all JSON files in parallel
            const [productsData, categoriesData, occasionsData] = await Promise.all([
                this.loadJsonFile(this.PRODUCTS_FILE),
                this.loadJsonFile(this.CATEGORIES_FILE),
                this.loadJsonFile(this.OCCASIONS_FILE)
            ]);
            // Normalize data
            this.products = productsData.map(this.normalizeProduct);
            this.categories = categoriesData.map(this.normalizeCategory);
            this.occasions = occasionsData.map(this.normalizeOccasion);
            this.lastLoadTime = now;
            console.log(`✅ Loaded ${this.products.length} products, ${this.categories.length} categories, ${this.occasions.length} occasions`);
        }
        catch (error) {
            console.error('❌ Error loading JSON data:', error);
            throw new Error('Failed to load product data');
        }
    }
    /**
     * Load JSON file with error handling
     */
    async loadJsonFile(filePath) {
        try {
            const data = await fs_1.default.promises.readFile(filePath, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error(`❌ Error loading ${filePath}:`, error);
            throw new Error(`Failed to load ${path_1.default.basename(filePath)}`);
        }
    }
    /**
     * Normalize MongoDB-style product to clean format
     */
    normalizeProduct(product) {
        return {
            _id: typeof product._id === 'string' ? product._id : product._id.$oid,
            name: product.name,
            description: product.description,
            slug: product.slug,
            categories: product.categories?.map(cat => typeof cat === 'string' ? cat : cat.$oid) || [],
            price: product.price,
            costPrice: product.costPrice,
            stock: product.stock,
            images: product.images,
            defaultImage: product.defaultImage,
            occasions: product.occasions || [],
            vendors: product.vendors?.map(vendor => typeof vendor === 'string' ? vendor : vendor.$oid) || [],
            isFeatured: product.isFeatured,
            isDeleted: product.isDeleted,
            isCombo: product.isCombo,
            comboBasePrice: product.comboBasePrice,
            comboItems: product.comboItems,
            createdAt: typeof product.createdAt === 'string' ? product.createdAt : product.createdAt.$date,
            updatedAt: typeof product.updatedAt === 'string' ? product.updatedAt : product.updatedAt.$date
        };
    }
    /**
     * Normalize MongoDB-style category to clean format
     */
    normalizeCategory(category) {
        return {
            _id: typeof category._id === 'string' ? category._id : category._id.$oid,
            name: category.name,
            slug: category.slug,
            description: category.description,
            parentCategory: category.parentCategory ?
                (typeof category.parentCategory === 'string' ? category.parentCategory : category.parentCategory.$oid) : undefined,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
            isDeleted: category.isDeleted,
            createdAt: typeof category.createdAt === 'string' ? category.createdAt : category.createdAt.$date,
            updatedAt: typeof category.updatedAt === 'string' ? category.updatedAt : category.updatedAt.$date
        };
    }
    /**
     * Normalize MongoDB-style occasion to clean format
     */
    normalizeOccasion(occasion) {
        return {
            _id: typeof occasion._id === 'string' ? occasion._id : occasion._id.$oid,
            name: occasion.name,
            slug: occasion.slug,
            description: occasion.description,
            icon: occasion.icon,
            color: occasion.color,
            dateRange: occasion.dateRange,
            priority: occasion.priority,
            seasonalFlags: occasion.seasonalFlags,
            isActive: occasion.isActive,
            sortOrder: occasion.sortOrder,
            isDeleted: occasion.isDeleted,
            createdAt: typeof occasion.createdAt === 'string' ? occasion.createdAt : occasion.createdAt.$date,
            updatedAt: typeof occasion.updatedAt === 'string' ? occasion.updatedAt : occasion.updatedAt.$date
        };
    }
    /**
     * Get products with filtering, search, pagination, and sorting
     */
    async getProducts(options = {}) {
        await this.loadData();
        let filteredProducts = [...this.products];
        // Filter by deleted status
        if (!options.includeDeleted) {
            filteredProducts = filteredProducts.filter(p => !p.isDeleted);
        }
        // Filter by category
        if (options.category) {
            // Find category by slug or ID
            const category = this.categories.find(c => c.slug === options.category || c._id === options.category);
            if (category) {
                filteredProducts = filteredProducts.filter(p => p.categories.includes(category._id));
            }
            else {
                // No matching category found
                return { products: [], total: 0, pages: 0, currentPage: options.page || 1 };
            }
        }
        // Filter by occasions
        if (options.occasions) {
            const occasionSlugs = options.occasions.split(',').map(s => s.trim());
            filteredProducts = filteredProducts.filter(p => p.occasions && p.occasions.some(occ => occasionSlugs.includes(occ)));
        }
        // Filter by featured
        if (options.featured) {
            filteredProducts = filteredProducts.filter(p => p.isFeatured);
        }
        // Filter by price range
        if (options.min !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price >= options.min);
        }
        if (options.max !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price <= options.max);
        }
        // Search filter
        if (options.search) {
            const searchTerm = options.search.toLowerCase();
            filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm));
        }
        // Sort products
        const sortBy = options.sort || 'newest';
        switch (sortBy) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
            default:
                filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }
        // Return all products without pagination
        const total = filteredProducts.length;
        return {
            products: filteredProducts,
            total,
            pages: 1,
            currentPage: 1
        };
    }
    /**
     * Get single product by ID
     */
    async getProductById(id) {
        await this.loadData();
        return this.products.find(p => p._id === id) || null;
    }
    /**
     * Get categories with filtering
     */
    async getCategories(options = {}) {
        await this.loadData();
        let filteredCategories = [...this.categories];
        // Filter by active status
        if (!options.includeInactive) {
            filteredCategories = filteredCategories.filter(c => c.isActive && !c.isDeleted);
        }
        // Sort by sortOrder
        filteredCategories.sort((a, b) => a.sortOrder - b.sortOrder);
        return filteredCategories;
    }
    /**
     * Get single category by ID or slug
     */
    async getCategoryById(id) {
        await this.loadData();
        return this.categories.find(c => c._id === id || c.slug === id) || null;
    }
    /**
     * Get occasions with filtering
     */
    async getOccasions(options = {}) {
        await this.loadData();
        let filteredOccasions = [...this.occasions];
        // Filter by active status
        if (!options.includeInactive) {
            filteredOccasions = filteredOccasions.filter(o => o.isActive && !o.isDeleted);
        }
        // Sort by sortOrder
        filteredOccasions.sort((a, b) => a.sortOrder - b.sortOrder);
        return filteredOccasions;
    }
    /**
     * Get single occasion by ID or slug
     */
    async getOccasionById(id) {
        await this.loadData();
        return this.occasions.find(o => o._id === id || o.slug === id) || null;
    }
    /**
     * Clear cache (for testing or manual refresh)
     */
    clearCache() {
        this.products = null;
        this.categories = null;
        this.occasions = null;
        this.lastLoadTime = 0;
        console.log('🗑️ JSON data cache cleared');
    }
}
// Export singleton instance
exports.jsonDataService = new JsonDataService();
