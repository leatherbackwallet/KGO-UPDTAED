/**
 * Categories Seed - Product categorization hierarchy
 * Creates main categories and subcategories for the marketplace
 */

import { Category, ICategory } from '../models/categories.model';

/**
 * Seed categories with hierarchical structure
 */
export async function seedCategories(): Promise<ICategory[]> {
  try {
    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      console.log('   ⏭️  Categories already exist, skipping...');
      return await Category.find();
    }

    const categories = [
      // Main Categories
      {
        name: { en: 'Celebration Cakes', de: 'Celebration Cakes' },
        slug: 'celebration-cakes',
        image: '/images/categories/celebration-cakes.jpg'
      },
      {
        name: { en: 'Wedding Cakes', de: 'Wedding Cakes' },
        slug: 'wedding-cakes',
        image: '/images/categories/wedding-cakes.jpg'
      },
      {
        name: { en: 'Birthday Cakes', de: 'Birthday Cakes' },
        slug: 'birthday-cakes',
        image: '/images/categories/birthday-cakes.jpg'
      },
      {
        name: { en: 'Anniversary Cakes', de: 'Anniversary Cakes' },
        slug: 'anniversary-cakes',
        image: '/images/categories/anniversary-cakes.jpg'
      },
      {
        name: { en: 'Corporate Cakes', de: 'Corporate Cakes' },
        slug: 'corporate-cakes',
        image: '/images/categories/corporate-cakes.jpg'
      },
      {
        name: { en: 'Custom Cakes', de: 'Custom Cakes' },
        slug: 'custom-cakes',
        image: '/images/categories/custom-cakes.jpg'
      },
      {
        name: { en: 'Cupcakes', de: 'Cupcakes' },
        slug: 'cupcakes',
        image: '/images/categories/cupcakes.jpg'
      },
      {
        name: { en: 'Pastries', de: 'Pastries' },
        slug: 'pastries',
        image: '/images/categories/pastries.jpg'
      },
      {
        name: { en: 'Cookies', de: 'Cookies' },
        slug: 'cookies',
        image: '/images/categories/cookies.jpg'
      },
      {
        name: { en: 'Breads', de: 'Breads' },
        slug: 'breads',
        image: '/images/categories/breads.jpg'
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`   ✅ Created ${createdCategories.length} categories`);

    // Create subcategories
    const subcategories = [
      // Subcategories for Celebration Cakes
      {
        name: { en: 'Chocolate Cakes', de: 'Chocolate Cakes' },
        slug: 'chocolate-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'celebration-cakes')?._id,
        image: '/images/categories/chocolate-cakes.jpg'
      },
      {
        name: { en: 'Vanilla Cakes', de: 'Vanilla Cakes' },
        slug: 'vanilla-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'celebration-cakes')?._id,
        image: '/images/categories/vanilla-cakes.jpg'
      },
      {
        name: { en: 'Red Velvet Cakes', de: 'Red Velvet Cakes' },
        slug: 'red-velvet-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'celebration-cakes')?._id,
        image: '/images/categories/red-velvet-cakes.jpg'
      },
      // Subcategories for Wedding Cakes
      {
        name: { en: 'Traditional Wedding Cakes', de: 'Traditional Wedding Cakes' },
        slug: 'traditional-wedding-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'wedding-cakes')?._id,
        image: '/images/categories/traditional-wedding-cakes.jpg'
      },
      {
        name: { en: 'Modern Wedding Cakes', de: 'Modern Wedding Cakes' },
        slug: 'modern-wedding-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'wedding-cakes')?._id,
        image: '/images/categories/modern-wedding-cakes.jpg'
      },
      // Subcategories for Birthday Cakes
      {
        name: { en: 'Kids Birthday Cakes', de: 'Kids Birthday Cakes' },
        slug: 'kids-birthday-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'birthday-cakes')?._id,
        image: '/images/categories/kids-birthday-cakes.jpg'
      },
      {
        name: { en: 'Adult Birthday Cakes', de: 'Adult Birthday Cakes' },
        slug: 'adult-birthday-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'birthday-cakes')?._id,
        image: '/images/categories/adult-birthday-cakes.jpg'
      },
      // Subcategories for Cupcakes
      {
        name: { en: 'Frosted Cupcakes', de: 'Frosted Cupcakes' },
        slug: 'frosted-cupcakes',
        parentCategory: createdCategories.find(c => c.slug === 'cupcakes')?._id,
        image: '/images/categories/frosted-cupcakes.jpg'
      },
      {
        name: { en: 'Decorated Cupcakes', de: 'Decorated Cupcakes' },
        slug: 'decorated-cupcakes',
        parentCategory: createdCategories.find(c => c.slug === 'cupcakes')?._id,
        image: '/images/categories/decorated-cupcakes.jpg'
      }
    ];

    const createdSubcategories = await Category.insertMany(subcategories);
    console.log(`   ✅ Created ${createdSubcategories.length} subcategories`);

    const allCategories = [...createdCategories, ...createdSubcategories] as ICategory[];
    
    // Log category structure
    console.log('   📁 Category Structure:');
    createdCategories.forEach(category => {
      const subcats = createdSubcategories.filter(sub => 
        sub.parentCategory?.toString() === (category._id as any).toString()
      );
      console.log(`      - ${category.name.en} (${subcats.length} subcategories)`);
    });

    return allCategories;
  } catch (error) {
    console.error('   ❌ Error seeding categories:', error);
    throw error;
  }
} 