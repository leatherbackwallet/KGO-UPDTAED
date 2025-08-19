"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProducts = seedProducts;
const products_model_1 = require("../models/products.model");
async function seedProducts(categories) {
    try {
        const existingProducts = await products_model_1.Product.countDocuments();
        if (existingProducts > 0) {
            console.log('   ⏭️  Products already exist, skipping...');
            return await products_model_1.Product.find();
        }
        const celebrationCakes = categories.find(c => c.slug === 'celebration-cakes');
        const weddingCakes = categories.find(c => c.slug === 'wedding-cakes');
        const birthdayCakes = categories.find(c => c.slug === 'birthday-cakes');
        const cupcakes = categories.find(c => c.slug === 'cupcakes');
        const pastries = categories.find(c => c.slug === 'pastries');
        const cookies = categories.find(c => c.slug === 'cookies');
        const breads = categories.find(c => c.slug === 'breads');
        const products = [
            {
                name: { en: 'Classic Chocolate Celebration Cake', de: 'Classic Chocolate Celebration Cake' },
                slug: 'classic-chocolate-celebration-cake',
                description: { en: 'A rich and moist chocolate cake perfect for any celebration. Made with premium cocoa and topped with chocolate ganache.', de: 'A rich and moist chocolate cake perfect for any celebration. Made with premium cocoa and topped with chocolate ganache.' },
                category: celebrationCakes?._id,
                defaultImage: '/images/products/chocolate-celebration-cake.jpg',
                tags: ['chocolate', 'celebration', 'birthday', 'party'],
                personalizationOptions: [
                    { type: 'text', label: 'Custom Message' },
                    { type: 'color', label: 'Frosting Color' },
                    { type: 'size', label: 'Cake Size' }
                ],
                isActive: true
            },
            {
                name: { en: 'Vanilla Bean Celebration Cake', de: 'Vanilla Bean Celebration Cake' },
                slug: 'vanilla-bean-celebration-cake',
                description: { en: 'Light and fluffy vanilla cake with real vanilla bean specks. Perfect for elegant celebrations.', de: 'Light and fluffy vanilla cake with real vanilla bean specks. Perfect for elegant celebrations.' },
                category: celebrationCakes?._id,
                defaultImage: '/images/products/vanilla-celebration-cake.jpg',
                tags: ['vanilla', 'celebration', 'elegant', 'classic'],
                personalizationOptions: [
                    { type: 'text', label: 'Custom Message' },
                    { type: 'color', label: 'Frosting Color' },
                    { type: 'size', label: 'Cake Size' }
                ],
                isActive: true
            },
            {
                name: { en: 'Traditional 3-Tier Wedding Cake', de: 'Traditional 3-Tier Wedding Cake' },
                slug: 'traditional-3-tier-wedding-cake',
                description: { en: 'Elegant 3-tier wedding cake with classic white fondant and delicate sugar flowers.', de: 'Elegant 3-tier wedding cake with classic white fondant and delicate sugar flowers.' },
                category: weddingCakes?._id,
                defaultImage: '',
                tags: ['wedding', 'traditional', 'elegant', 'fondant'],
                personalizationOptions: [
                    { type: 'text', label: 'Couple Names' },
                    { type: 'color', label: 'Accent Colors' },
                    { type: 'image', label: 'Wedding Theme' },
                    { type: 'size', label: 'Number of Tiers' }
                ],
                isActive: true
            },
            {
                name: { en: 'Modern Naked Wedding Cake', de: 'Modern Naked Wedding Cake' },
                slug: 'modern-naked-wedding-cake',
                description: { en: 'Contemporary naked cake with fresh flowers and rustic charm. Perfect for modern weddings.', de: 'Contemporary naked cake with fresh flowers and rustic charm. Perfect for modern weddings.' },
                category: weddingCakes?._id,
                defaultImage: '',
                tags: ['wedding', 'modern', 'naked', 'rustic'],
                personalizationOptions: [
                    { type: 'text', label: 'Couple Names' },
                    { type: 'color', label: 'Flower Colors' },
                    { type: 'size', label: 'Cake Size' }
                ],
                isActive: true
            },
            {
                name: { en: 'Rainbow Birthday Cake', de: 'Rainbow Birthday Cake' },
                slug: 'rainbow-birthday-cake',
                description: { en: 'Colorful rainbow cake with vibrant layers and fun sprinkles. Perfect for kids and adults alike.', de: 'Colorful rainbow cake with vibrant layers and fun sprinkles. Perfect for kids and adults alike.' },
                category: birthdayCakes?._id,
                defaultImage: '',
                tags: ['birthday', 'rainbow', 'colorful', 'fun'],
                personalizationOptions: [
                    { type: 'text', label: 'Birthday Message' },
                    { type: 'color', label: 'Favorite Colors' },
                    { type: 'size', label: 'Cake Size' }
                ],
                isActive: true
            },
            {
                name: { en: 'Chocolate Truffle Birthday Cake', de: 'Chocolate Truffle Birthday Cake' },
                slug: 'chocolate-truffle-birthday-cake',
                description: { en: 'Decadent chocolate cake with chocolate truffle filling and chocolate ganache frosting.', de: 'Decadent chocolate cake with chocolate truffle filling and chocolate ganache frosting.' },
                category: birthdayCakes?._id,
                defaultImage: '/images/products/chocolate-truffle-cake.jpg',
                tags: ['birthday', 'chocolate', 'truffle', 'decadent'],
                personalizationOptions: [
                    { type: 'text', label: 'Birthday Message' },
                    { type: 'size', label: 'Cake Size' }
                ],
                isActive: true
            },
            {
                name: { en: 'Vanilla Cupcakes with Buttercream', de: 'Vanilla Cupcakes with Buttercream' },
                slug: 'vanilla-cupcakes-buttercream',
                description: { en: 'Classic vanilla cupcakes topped with smooth buttercream frosting and sprinkles.', de: 'Classic vanilla cupcakes topped with smooth buttercream frosting and sprinkles.' },
                category: cupcakes?._id,
                defaultImage: '/images/products/vanilla-cupcakes.jpg',
                tags: ['cupcakes', 'vanilla', 'buttercream', 'classic'],
                personalizationOptions: [
                    { type: 'text', label: 'Custom Message' },
                    { type: 'color', label: 'Frosting Color' },
                    { type: 'size', label: 'Quantity' }
                ],
                isActive: true
            },
            {
                name: { en: 'Red Velvet Cupcakes', de: 'Red Velvet Cupcakes' },
                slug: 'red-velvet-cupcakes',
                description: { en: 'Moist red velvet cupcakes with cream cheese frosting and red velvet crumbs.', de: 'Moist red velvet cupcakes with cream cheese frosting and red velvet crumbs.' },
                category: cupcakes?._id,
                defaultImage: '/images/products/red-velvet-cupcakes.jpg',
                tags: ['cupcakes', 'red-velvet', 'cream-cheese', 'elegant'],
                personalizationOptions: [
                    { type: 'text', label: 'Custom Message' },
                    { type: 'size', label: 'Quantity' }
                ],
                isActive: true
            },
            {
                name: { en: 'Chocolate Croissants', de: 'Chocolate Croissants' },
                slug: 'chocolate-croissants',
                description: { en: 'Flaky croissants filled with rich chocolate. Perfect for breakfast or dessert.', de: 'Flaky croissants filled with rich chocolate. Perfect for breakfast or dessert.' },
                category: pastries?._id,
                defaultImage: '/images/products/chocolate-croissants.jpg',
                tags: ['pastries', 'croissants', 'chocolate', 'breakfast'],
                personalizationOptions: [
                    { type: 'size', label: 'Quantity' }
                ],
                isActive: true
            },
            {
                name: { en: 'Apple Turnovers', de: 'Apple Turnovers' },
                slug: 'apple-turnovers',
                description: { en: 'Golden puff pastry filled with sweet apple filling and cinnamon.', de: 'Golden puff pastry filled with sweet apple filling and cinnamon.' },
                category: pastries?._id,
                defaultImage: '/images/products/apple-turnovers.jpg',
                tags: ['pastries', 'turnovers', 'apple', 'cinnamon'],
                personalizationOptions: [
                    { type: 'size', label: 'Quantity' }
                ],
                isActive: true
            },
            {
                name: { en: 'Chocolate Chip Cookies', de: 'Chocolate Chip Cookies' },
                slug: 'chocolate-chip-cookies',
                description: { en: 'Classic chocolate chip cookies with crispy edges and chewy centers.', de: 'Classic chocolate chip cookies with crispy edges and chewy centers.' },
                category: cookies?._id,
                defaultImage: '/images/products/chocolate-chip-cookies.jpg',
                tags: ['cookies', 'chocolate-chip', 'classic', 'chewy'],
                personalizationOptions: [
                    { type: 'text', label: 'Custom Message' },
                    { type: 'size', label: 'Quantity' }
                ],
                isActive: true
            },
            {
                name: { en: 'Sugar Cookies', de: 'Sugar Cookies' },
                slug: 'sugar-cookies',
                description: { en: 'Buttery sugar cookies decorated with royal icing and colorful sprinkles.', de: 'Buttery sugar cookies decorated with royal icing and colorful sprinkles.' },
                category: cookies?._id,
                defaultImage: '/images/products/sugar-cookies.jpg',
                tags: ['cookies', 'sugar', 'decorated', 'buttery'],
                personalizationOptions: [
                    { type: 'text', label: 'Custom Message' },
                    { type: 'color', label: 'Icing Colors' },
                    { type: 'size', label: 'Quantity' }
                ],
                isActive: true
            },
            {
                name: { en: 'Sourdough Bread', de: 'Sourdough Bread' },
                slug: 'sourdough-bread',
                description: { en: 'Artisan sourdough bread with a crispy crust and tangy flavor.', de: 'Artisan sourdough bread with a crispy crust and tangy flavor.' },
                category: breads?._id,
                defaultImage: '/images/products/sourdough-bread.jpg',
                tags: ['bread', 'sourdough', 'artisan', 'crusty'],
                personalizationOptions: [
                    { type: 'size', label: 'Loaf Size' }
                ],
                isActive: true
            },
            {
                name: { en: 'Whole Wheat Bread', de: 'Whole Wheat Bread' },
                slug: 'whole-wheat-bread',
                description: { en: 'Nutritious whole wheat bread made with stone-ground flour.', de: 'Nutritious whole wheat bread made with stone-ground flour.' },
                category: breads?._id,
                defaultImage: '/images/products/whole-wheat-bread.jpg',
                tags: ['bread', 'whole-wheat', 'healthy', 'nutritious'],
                personalizationOptions: [
                    { type: 'size', label: 'Loaf Size' }
                ],
                isActive: true
            }
        ];
        const createdProducts = await products_model_1.Product.insertMany(products);
        console.log(`   ✅ Created ${createdProducts.length} products`);
        console.log('   📦 Products by Category:');
        const categoryMap = new Map();
        categories.forEach(cat => categoryMap.set(cat._id.toString(), cat.name.en));
        createdProducts.forEach(product => {
            const categoryName = categoryMap.get(product.category.toString());
            console.log(`      - ${categoryName}: ${product.name.en}`);
        });
        return createdProducts;
    }
    catch (error) {
        console.error('   ❌ Error seeding products:', error);
        throw error;
    }
}
//# sourceMappingURL=products.seed.js.map