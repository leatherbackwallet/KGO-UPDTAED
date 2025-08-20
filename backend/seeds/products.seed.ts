/**
 * Products Seed - Sample product templates
 * Creates product templates with personalization options
 */

import { Product, IProduct } from '../models/products.model';
import { ICategory } from '../models/categories.model';

/**
 * Seed products with categories
 */
export async function seedProducts(categories: ICategory[]): Promise<IProduct[]> {
  try {
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('   ⏭️  Products already exist, skipping...');
      return await Product.find();
    }

    // Get category IDs
    const celebrationCakes = categories.find(c => c.slug === 'celebration-cakes');
    const weddingCakes = categories.find(c => c.slug === 'wedding-cakes');
    const birthdayCakes = categories.find(c => c.slug === 'birthday-cakes');
    const cupcakes = categories.find(c => c.slug === 'cupcakes');
    const pastries = categories.find(c => c.slug === 'pastries');
    const cookies = categories.find(c => c.slug === 'cookies');
    const breads = categories.find(c => c.slug === 'breads');

    const products = [
      // Celebration Cakes
      {
        name: 'Classic Chocolate Celebration Cake',
        slug: 'classic-chocolate-celebration-cake',
        description: 'A rich and moist chocolate cake perfect for any celebration. Made with premium cocoa and topped with chocolate ganache.',
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
        name: 'Vanilla Bean Celebration Cake',
        slug: 'vanilla-bean-celebration-cake',
        description: 'Light and fluffy vanilla cake with real vanilla bean specks. Perfect for elegant celebrations.',
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
      // Wedding Cakes
      {
        name: 'Traditional 3-Tier Wedding Cake',
        slug: 'traditional-3-tier-wedding-cake',
        description: 'Elegant 3-tier wedding cake with classic white fondant and delicate sugar flowers.',
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
        name: 'Modern Naked Wedding Cake',
        slug: 'modern-naked-wedding-cake',
        description: 'Contemporary naked cake with fresh flowers and rustic charm. Perfect for modern weddings.',
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
      // Birthday Cakes
      {
        name: 'Rainbow Birthday Cake',
        slug: 'rainbow-birthday-cake',
        description: 'Colorful rainbow cake with vibrant layers and fun sprinkles. Perfect for kids and adults alike.',
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
        name: 'Chocolate Truffle Birthday Cake',
        slug: 'chocolate-truffle-birthday-cake',
        description: 'Decadent chocolate cake with chocolate truffle filling and chocolate ganache frosting.',
        category: birthdayCakes?._id,
        defaultImage: '/images/products/chocolate-truffle-cake.jpg',
        tags: ['birthday', 'chocolate', 'truffle', 'decadent'],
        personalizationOptions: [
          { type: 'text', label: 'Birthday Message' },
          { type: 'size', label: 'Cake Size' }
        ],
        isActive: true
      },
      // Cupcakes
      {
        name: 'Vanilla Cupcakes with Buttercream',
        slug: 'vanilla-cupcakes-buttercream',
        description: 'Classic vanilla cupcakes topped with smooth buttercream frosting and sprinkles.',
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
        name: 'Red Velvet Cupcakes',
        slug: 'red-velvet-cupcakes',
        description: 'Moist red velvet cupcakes with cream cheese frosting and red velvet crumbs.',
        category: cupcakes?._id,
        defaultImage: '/images/products/red-velvet-cupcakes.jpg',
        tags: ['cupcakes', 'red-velvet', 'cream-cheese', 'elegant'],
        personalizationOptions: [
          { type: 'text', label: 'Custom Message' },
          { type: 'size', label: 'Quantity' }
        ],
        isActive: true
      },
      // Pastries
      {
        name: 'Chocolate Croissants',
        slug: 'chocolate-croissants',
        description: 'Flaky croissants filled with rich chocolate. Perfect for breakfast or dessert.',
        category: pastries?._id,
        defaultImage: '/images/products/chocolate-croissants.jpg',
        tags: ['pastries', 'croissants', 'chocolate', 'breakfast'],
        personalizationOptions: [
          { type: 'size', label: 'Quantity' }
        ],
        isActive: true
      },
      {
        name: 'Apple Turnovers',
        slug: 'apple-turnovers',
        description: 'Golden puff pastry filled with sweet apple filling and cinnamon.',
        category: pastries?._id,
        defaultImage: '/images/products/apple-turnovers.jpg',
        tags: ['pastries', 'turnovers', 'apple', 'cinnamon'],
        personalizationOptions: [
          { type: 'size', label: 'Quantity' }
        ],
        isActive: true
      },
      // Cookies
      {
        name: 'Chocolate Chip Cookies',
        slug: 'chocolate-chip-cookies',
        description: 'Classic chocolate chip cookies with crispy edges and chewy centers.',
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
        name: 'Sugar Cookies',
        slug: 'sugar-cookies',
        description: 'Buttery sugar cookies decorated with royal icing and colorful sprinkles.',
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
      // Breads
      {
        name: 'Sourdough Bread',
        slug: 'sourdough-bread',
        description: 'Artisan sourdough bread with a crispy crust and tangy flavor.',
        category: breads?._id,
        defaultImage: '/images/products/sourdough-bread.jpg',
        tags: ['bread', 'sourdough', 'artisan', 'crusty'],
        personalizationOptions: [
          { type: 'size', label: 'Loaf Size' }
        ],
        isActive: true
      },
      {
        name: 'Whole Wheat Bread',
        slug: 'whole-wheat-bread',
        description: 'Nutritious whole wheat bread made with stone-ground flour.',
        category: breads?._id,
        defaultImage: '/images/products/whole-wheat-bread.jpg',
        tags: ['bread', 'whole-wheat', 'healthy', 'nutritious'],
        personalizationOptions: [
          { type: 'size', label: 'Loaf Size' }
        ],
        isActive: true
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`   ✅ Created ${createdProducts.length} products`);

    // Log products by category
    console.log('   📦 Products by Category:');
    const categoryMap = new Map();
          categories.forEach(cat => categoryMap.set((cat._id as any).toString(), cat.name));
    
    createdProducts.forEach(product => {
      const categoryName = categoryMap.get((product.category as any).toString());
              console.log(`      - ${categoryName}: ${product.name}`);
    });

    return createdProducts as IProduct[];
  } catch (error) {
    console.error('   ❌ Error seeding products:', error);
    throw error;
  }
} 