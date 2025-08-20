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
        name: 'Celebration Cakes',
        slug: 'celebration-cakes',
        image: '/images/categories/celebration-cakes.jpg'
      },
      {
        name: 'Wedding Cakes',
        slug: 'wedding-cakes',
        image: '/images/categories/wedding-cakes.jpg'
      },
      {
        name: 'Birthday Cakes',
        slug: 'birthday-cakes',
        image: '/images/categories/birthday-cakes.jpg'
      },
      {
        name: 'Anniversary Cakes',
        slug: 'anniversary-cakes',
        image: '/images/categories/anniversary-cakes.jpg'
      },
      {
        name: 'Corporate Cakes',
        slug: 'corporate-cakes',
        image: '/images/categories/corporate-cakes.jpg'
      },
      {
        name: 'Custom Cakes',
        slug: 'custom-cakes',
        image: '/images/categories/custom-cakes.jpg'
      },
      {
        name: 'Cupcakes',
        slug: 'cupcakes',
        image: '/images/categories/cupcakes.jpg'
      },
      {
        name: 'Pastries',
        slug: 'pastries',
        image: '/images/categories/pastries.jpg'
      },
      {
        name: 'Cookies',
        slug: 'cookies',
        image: '/images/categories/cookies.jpg'
      },
      {
        name: 'Breads',
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
        name: 'Chocolate Cakes',
        slug: 'chocolate-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'celebration-cakes')?._id,
        image: '/images/categories/chocolate-cakes.jpg'
      },
      {
        name: 'Vanilla Cakes',
        slug: 'vanilla-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'celebration-cakes')?._id,
        image: '/images/categories/vanilla-cakes.jpg'
      },
      {
        name: 'Red Velvet Cakes',
        slug: 'red-velvet-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'celebration-cakes')?._id,
        image: '/images/categories/red-velvet-cakes.jpg'
      },
      // Subcategories for Wedding Cakes
      {
        name: 'Traditional Wedding Cakes',
        slug: 'traditional-wedding-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'wedding-cakes')?._id,
        image: '/images/categories/traditional-wedding-cakes.jpg'
      },
      {
        name: 'Modern Wedding Cakes',
        slug: 'modern-wedding-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'wedding-cakes')?._id,
        image: '/images/categories/modern-wedding-cakes.jpg'
      },
      // Subcategories for Birthday Cakes
      {
        name: 'Kids Birthday Cakes',
        slug: 'kids-birthday-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'birthday-cakes')?._id,
        image: '/images/categories/kids-birthday-cakes.jpg'
      },
      {
        name: 'Adult Birthday Cakes',
        slug: 'adult-birthday-cakes',
        parentCategory: createdCategories.find(c => c.slug === 'birthday-cakes')?._id,
        image: '/images/categories/adult-birthday-cakes.jpg'
      },
      // Subcategories for Cupcakes
      {
        name: 'Frosted Cupcakes',
        slug: 'frosted-cupcakes',
        parentCategory: createdCategories.find(c => c.slug === 'cupcakes')?._id,
        image: '/images/categories/frosted-cupcakes.jpg'
      },
      {
        name: 'Decorated Cupcakes',
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
              console.log(`      - ${category.name} (${subcats.length} subcategories)`);
    });

    return allCategories;
  } catch (error) {
    console.error('   ❌ Error seeding categories:', error);
    throw error;
  }
} 