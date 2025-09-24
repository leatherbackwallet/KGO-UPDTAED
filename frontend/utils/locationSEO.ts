/**
 * Location-based SEO utility for Kerala cities and regions
 */

export const KERALA_CITIES = [
  {
    name: 'Kochi',
    slug: 'kochi',
    district: 'Ernakulam',
    description: 'Commercial capital of Kerala',
    keywords: ['kochi gifts', 'ernakulam gifts', 'cochin gifts delivery']
  },
  {
    name: 'Thiruvananthapuram',
    slug: 'trivandrum',
    district: 'Thiruvananthapuram',
    description: 'Capital city of Kerala',
    keywords: ['trivandrum gifts', 'thiruvananthapuram gifts', 'tvm gifts delivery']
  },
  {
    name: 'Kozhikode',
    slug: 'calicut',
    district: 'Kozhikode',
    description: 'City of Spices in Kerala',
    keywords: ['calicut gifts', 'kozhikode gifts', 'malabar gifts delivery']
  },
  {
    name: 'Thrissur',
    slug: 'thrissur',
    district: 'Thrissur',
    description: 'Cultural capital of Kerala',
    keywords: ['thrissur gifts', 'cultural city gifts', 'pooram gifts']
  },
  {
    name: 'Kannur',
    slug: 'kannur',
    district: 'Kannur',
    description: 'Land of Looms and Lores',
    keywords: ['kannur gifts', 'handloom gifts', 'theyyam gifts']
  },
  {
    name: 'Kollam',
    slug: 'kollam',
    district: 'Kollam',
    description: 'Cashew capital of Kerala',
    keywords: ['kollam gifts', 'cashew gifts', 'backwater gifts']
  },
  {
    name: 'Palakkad',
    slug: 'palakkad',
    district: 'Palakkad',
    description: 'Rice bowl of Kerala',
    keywords: ['palakkad gifts', 'palghat gifts', 'rice bowl gifts']
  },
  {
    name: 'Malappuram',
    slug: 'malappuram',
    district: 'Malappuram',
    description: 'Land of Hills and Spices',
    keywords: ['malappuram gifts', 'spice gifts', 'hill station gifts']
  },
  {
    name: 'Alappuzha',
    slug: 'alleppey',
    district: 'Alappuzha',
    description: 'Venice of the East',
    keywords: ['alleppey gifts', 'alappuzha gifts', 'backwater gifts', 'venice east gifts']
  },
  {
    name: 'Kottayam',
    slug: 'kottayam',
    district: 'Kottayam',
    description: 'Land of Letters, Latex and Lakes',
    keywords: ['kottayam gifts', 'rubber gifts', 'literary gifts']
  },
  {
    name: 'Idukki',
    slug: 'idukki',
    district: 'Idukki',
    description: 'Spice garden of Kerala',
    keywords: ['idukki gifts', 'hill station gifts', 'spice garden gifts', 'munnar gifts']
  },
  {
    name: 'Wayanad',
    slug: 'wayanad',
    district: 'Wayanad',
    description: 'Green paradise of Kerala',
    keywords: ['wayanad gifts', 'green paradise gifts', 'tribal gifts', 'wildlife gifts']
  },
  {
    name: 'Kasaragod',
    slug: 'kasaragod',
    district: 'Kasaragod',
    description: 'Land of Forts and Beaches',
    keywords: ['kasaragod gifts', 'fort gifts', 'beach gifts', 'bekal gifts']
  },
  {
    name: 'Pathanamthitta',
    slug: 'pathanamthitta',
    district: 'Pathanamthitta',
    description: 'Headquarters of Pilgrimage Tourism',
    keywords: ['pathanamthitta gifts', 'pilgrimage gifts', 'sabarimala gifts']
  }
];

export const KERALA_REGIONS = [
  {
    name: 'Malabar',
    cities: ['Kozhikode', 'Kannur', 'Malappuram', 'Kasaragod'],
    description: 'Northern Kerala region known for spices and culture',
    keywords: ['malabar gifts', 'north kerala gifts', 'spice coast gifts']
  },
  {
    name: 'Cochin',
    cities: ['Kochi', 'Thrissur', 'Palakkad'],
    description: 'Central Kerala commercial hub',
    keywords: ['cochin gifts', 'central kerala gifts', 'commercial hub gifts']
  },
  {
    name: 'Travancore',
    cities: ['Thiruvananthapuram', 'Kollam', 'Alappuzha', 'Kottayam', 'Pathanamthitta'],
    description: 'Southern Kerala cultural region',
    keywords: ['travancore gifts', 'south kerala gifts', 'backwater gifts']
  },
  {
    name: 'High Range',
    cities: ['Idukki', 'Wayanad'],
    description: 'Hill station region of Kerala',
    keywords: ['high range gifts', 'hill station gifts', 'mountain gifts', 'tea gifts']
  }
];

/**
 * Generate location-specific SEO data
 */
export function generateLocationSEO(citySlug: string, products: any[] = []) {
  const city = KERALA_CITIES.find(c => c.slug === citySlug);
  
  if (!city) {
    return {
      title: `Kerala Gifts Online - Gift Delivery Service`,
      description: `Premium gift delivery service across Kerala with authentic traditional products.`,
      keywords: `kerala gifts, gift delivery, traditional products`
    };
  }

  const title = `${city.name} Gifts Online - Same Day Delivery | KeralGiftsOnline`;
  const description = `Premium gift delivery in ${city.name}, ${city.district}. ${city.description}. Same day delivery of traditional Kerala products, personalized gifts & authentic items. Order now!`;
  
  const baseKeywords = [
    ...city.keywords,
    `${city.name.toLowerCase()} gift delivery`,
    `${city.name.toLowerCase()} online shopping`,
    `send gifts to ${city.name.toLowerCase()}`,
    `${city.name.toLowerCase()} traditional gifts`,
    `${city.name.toLowerCase()} premium gifts`,
    `${city.district.toLowerCase()} gifts`,
    `same day delivery ${city.name.toLowerCase()}`,
    `express delivery ${city.name.toLowerCase()}`,
    `${city.name.toLowerCase()} gift shop online`
  ];

  // Add product-specific keywords for the city
  if (products.length > 0) {
    products.slice(0, 10).forEach(product => {
      baseKeywords.push(
        `${product.name?.toLowerCase()} ${city.name.toLowerCase()}`,
        `buy ${product.name?.toLowerCase()} ${city.name.toLowerCase()}`,
        `${product.name?.toLowerCase()} delivery ${city.name.toLowerCase()}`
      );
    });
  }

  return {
    title,
    description,
    keywords: baseKeywords.join(', '),
    city,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `KeralGiftsOnline - ${city.name}`,
      "description": description,
      "url": `https://keralagiftsonline.in/delivery/${city.slug}`,
      "areaServed": {
        "@type": "City",
        "name": city.name,
        "containedInPlace": {
          "@type": "State",
          "name": "Kerala",
          "containedInPlace": {
            "@type": "Country",
            "name": "India"
          }
        }
      },
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "addressLocality": city.name,
          "addressRegion": "Kerala",
          "addressCountry": "IN"
        },
        "geoRadius": "50000" // 50km radius
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": `${city.name} Gift Delivery Service`,
        "itemListElement": products.slice(0, 5).map((product, index) => ({
          "@type": "Offer",
          "position": index + 1,
          "itemOffered": {
            "@type": "Product",
            "name": product.name,
            "description": `${product.name} delivery in ${city.name}`
          },
          "areaServed": city.name,
          "deliveryMethod": "ParcelService"
        }))
      }
    }
  };
}

/**
 * Generate region-specific SEO data
 */
export function generateRegionSEO(regionName: string, products: any[] = []) {
  const region = KERALA_REGIONS.find(r => r.name.toLowerCase() === regionName.toLowerCase());
  
  if (!region) {
    return generateLocationSEO('kerala', products);
  }

  const title = `${region.name} Region Gifts - Kerala Traditional Products | KeralGiftsOnline`;
  const description = `Premium gift delivery across ${region.name} region, Kerala. ${region.description}. Serving ${region.cities.join(', ')} with authentic traditional products and personalized gifts.`;
  
  const keywords = [
    ...region.keywords,
    `${region.name.toLowerCase()} region gifts`,
    `${region.name.toLowerCase()} kerala gifts`,
    `${region.cities.join(' gifts, ').toLowerCase()} gifts`,
    `${region.name.toLowerCase()} traditional products`,
    `${region.name.toLowerCase()} gift delivery service`
  ].join(', ');

  return {
    title,
    description,
    keywords,
    region,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": `${region.name} Region Gift Delivery`,
      "description": description,
      "provider": {
        "@type": "Organization",
        "name": "KeralGiftsOnline"
      },
      "areaServed": region.cities.map(city => ({
        "@type": "City",
        "name": city,
        "containedInPlace": {
          "@type": "State",
          "name": "Kerala"
        }
      }))
    }
  };
}
