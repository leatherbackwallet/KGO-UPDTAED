/**
 * Comprehensive SEO Keywords Utility
 * Generates targeted keywords for maximum search visibility
 */

// Core Gift Keywords
export const CORE_GIFT_KEYWORDS = [
  'gifts', 'kerala gifts', 'personalized gifts', 'delivery', 'kerala delivery',
  'premium gifts', 'traditional gifts kerala', 'authentic kerala gifts',
  'custom gifts', 'handmade gifts', 'luxury gifts', 'cultural gifts',
  'heritage gifts', 'unique gifts', 'special gifts', 'exclusive gifts'
];

// Location-Based Keywords
export const LOCATION_KEYWORDS = [
  'kerala gift delivery', 'kochi gifts', 'trivandrum gifts', 'calicut gifts',
  'thrissur gifts', 'kannur gifts', 'kollam gifts', 'palakkad gifts',
  'malappuram gifts', 'ernakulam gifts', 'alappuzha gifts', 'kasaragod gifts',
  'pathanamthitta gifts', 'idukki gifts', 'wayanad gifts',
  'kerala to worldwide delivery', 'international kerala gifts',
  'same day delivery kerala', 'express delivery gifts', 'fast delivery kerala',
  'kerala online shopping', 'kerala e-commerce', 'kerala store online'
];

// Occasion-Based Keywords (from backend occasions)
export const OCCASION_KEYWORDS = [
  'onam gifts kerala', 'diwali gifts delivery', 'birthday gifts kerala',
  'anniversary gifts personalized', 'wedding gifts traditional',
  'festival gifts kerala', 'celebration gifts', 'holiday gifts',
  'fathers day gifts', 'mothers day gifts', 'valentine gifts kerala',
  'christmas gifts kerala', 'new year gifts', 'graduation gifts',
  'housewarming gifts kerala', 'congratulation gifts', 'thank you gifts',
  'get well soon gifts', 'sympathy gifts', 'condolence gifts',
  'traditional celebration gifts', 'cultural festival gifts'
];

// Product Category Keywords
export const PRODUCT_CATEGORY_KEYWORDS = [
  'kerala snacks online', 'traditional sweets kerala', 'kerala spices online',
  'handicrafts kerala', 'kerala textiles', 'ayurvedic products kerala',
  'kerala tea online', 'kerala coffee', 'coconut products kerala',
  'kerala pickles online', 'traditional kerala food', 'kerala delicacies',
  'kerala souvenirs', 'kerala artifacts', 'kerala crafts online',
  'kerala jewelry traditional', 'kerala sarees online', 'kerala mundu',
  'kerala brass items', 'kerala wooden crafts', 'kerala pottery'
];

// Service-Related Keywords
export const SERVICE_KEYWORDS = [
  'gift wrapping kerala', 'surprise delivery kerala', 'bulk order gifts',
  'corporate gifts kerala', 'wholesale gifts kerala', 'gift hampers kerala',
  'gift baskets kerala', 'personalized gift boxes', 'custom gift packaging',
  'gift delivery service', 'online gift shopping', 'gift store kerala',
  'gift shop online', 'send gifts kerala', 'gift courier kerala',
  'gift subscription kerala', 'monthly gift box', 'seasonal gifts'
];

// Long-tail High-Intent Keywords
export const HIGH_INTENT_KEYWORDS = [
  'buy kerala gifts online', 'order kerala gifts', 'kerala gifts home delivery',
  'authentic kerala products online', 'traditional kerala gifts buy',
  'kerala gift store online shopping', 'send kerala gifts worldwide',
  'kerala gifts cash on delivery', 'kerala gifts free shipping',
  'kerala gifts next day delivery', 'kerala gifts bulk order discount',
  'kerala traditional gifts for occasions', 'kerala cultural gifts authentic'
];

// Quality & Trust Keywords
export const TRUST_KEYWORDS = [
  'authentic kerala gifts', 'genuine kerala products', 'verified kerala sellers',
  'quality kerala gifts', 'premium kerala items', 'trusted kerala store',
  'certified kerala products', 'original kerala gifts', 'handpicked kerala items',
  'artisan kerala products', 'traditional kerala craftsmanship'
];

// Seasonal & Trending Keywords
export const SEASONAL_KEYWORDS = [
  'monsoon gifts kerala', 'summer gifts kerala', 'winter gifts kerala',
  'kerala new year gifts', 'kerala harvest festival gifts', 'kerala boat race gifts',
  'kerala elephant festival gifts', 'kerala temple festival gifts',
  'kerala backwater gifts', 'kerala hill station gifts', 'kerala beach gifts'
];

/**
 * Generate comprehensive keywords for a specific context
 */
export function generateKeywords(context: {
  products?: Array<{name: string; categories?: any[]; occasions?: any[]}>;
  categories?: Array<{name: string}>;
  occasions?: Array<{name: string}>;
  location?: string;
  searchTerm?: string;
  isHomepage?: boolean;
}): string {
  const keywords: string[] = [];

  // Always include core keywords
  keywords.push(...CORE_GIFT_KEYWORDS);

  // Add location-based keywords
  keywords.push(...LOCATION_KEYWORDS);

  // Add service keywords
  keywords.push(...SERVICE_KEYWORDS);

  // Add trust keywords
  keywords.push(...TRUST_KEYWORDS);

  // Context-specific keywords
  if (context.isHomepage) {
    keywords.push(...OCCASION_KEYWORDS);
    keywords.push(...PRODUCT_CATEGORY_KEYWORDS);
    keywords.push(...HIGH_INTENT_KEYWORDS);
    keywords.push(...SEASONAL_KEYWORDS);
  }

  // Product-specific keywords
  if (context.products && context.products.length > 0) {
    context.products.slice(0, 20).forEach(product => {
      if (product.name) {
        keywords.push(
          `${product.name.toLowerCase()} kerala`,
          `buy ${product.name.toLowerCase()}`,
          `${product.name.toLowerCase()} online`,
          `${product.name.toLowerCase()} delivery`
        );
      }

      // Category-based keywords
      if (product.categories) {
        product.categories.forEach(category => {
          const catName = typeof category === 'string' ? category : 
                         typeof category.name === 'string' ? category.name : category.name?.en;
          if (catName) {
            keywords.push(
              `${catName.toLowerCase()} kerala`,
              `${catName.toLowerCase()} gifts`,
              `traditional ${catName.toLowerCase()}`
            );
          }
        });
      }

      // Occasion-based keywords
      if (product.occasions) {
        product.occasions.forEach(occasion => {
          const occName = typeof occasion === 'string' ? occasion : occasion.name;
          if (occName) {
            keywords.push(
              `${occName.toLowerCase()} gifts kerala`,
              `${product.name.toLowerCase()} for ${occName.toLowerCase()}`
            );
          }
        });
      }
    });
  }

  // Category-specific keywords
  if (context.categories && context.categories.length > 0) {
    context.categories.forEach(category => {
      const catName = typeof category.name === 'string' ? category.name : category.name?.en;
      if (catName) {
        keywords.push(
          `${catName.toLowerCase()} kerala`,
          `${catName.toLowerCase()} gifts`,
          `buy ${catName.toLowerCase()} online`,
          `traditional ${catName.toLowerCase()}`,
          `authentic ${catName.toLowerCase()} kerala`
        );
      }
    });
  }

  // Occasion-specific keywords
  if (context.occasions && context.occasions.length > 0) {
    context.occasions.forEach(occasion => {
      const occName = typeof occasion.name === 'string' ? occasion.name : occasion.name?.en;
      if (occName) {
        keywords.push(
          `${occName.toLowerCase()} gifts kerala`,
          `${occName.toLowerCase()} celebration gifts`,
          `traditional ${occName.toLowerCase()} gifts`,
          `kerala ${occName.toLowerCase()} shopping`
        );
      }
    });
  }

  // Search-specific keywords
  if (context.searchTerm) {
    keywords.push(
      `${context.searchTerm} kerala`,
      `${context.searchTerm} gifts`,
      `buy ${context.searchTerm}`,
      `${context.searchTerm} online shopping`,
      `${context.searchTerm} home delivery`
    );
  }

  // Location-specific keywords
  if (context.location) {
    keywords.push(
      `gifts ${context.location}`,
      `${context.location} gift delivery`,
      `${context.location} online shopping`,
      `send gifts to ${context.location}`
    );
  }

  // Remove duplicates and return as comma-separated string
  const uniqueKeywords = [...new Set(keywords)]
    .filter(keyword => keyword.length > 0)
    .slice(0, 100); // Limit to 100 most relevant keywords

  return uniqueKeywords.join(', ');
}

/**
 * Generate location-specific keywords for Kerala cities
 */
export function getLocationKeywords(city?: string): string[] {
  const baseKeywords = [...LOCATION_KEYWORDS];
  
  if (city) {
    baseKeywords.push(
      `gifts ${city}`,
      `${city} gift delivery`,
      `${city} online shopping`,
      `send gifts to ${city}`,
      `${city} gift store`,
      `${city} traditional gifts`
    );
  }

  return baseKeywords;
}

/**
 * Generate occasion-specific keywords with seasonal relevance
 */
export function getOccasionKeywords(occasionName?: string): string[] {
  const baseKeywords = [...OCCASION_KEYWORDS];
  
  if (occasionName) {
    baseKeywords.push(
      `${occasionName.toLowerCase()} gifts kerala`,
      `${occasionName.toLowerCase()} celebration`,
      `traditional ${occasionName.toLowerCase()} gifts`,
      `${occasionName.toLowerCase()} shopping kerala`,
      `${occasionName.toLowerCase()} gift ideas`,
      `best ${occasionName.toLowerCase()} gifts`
    );
  }

  return baseKeywords;
}
