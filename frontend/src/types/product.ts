export interface Product {
  _id: string;
  name: string | { en: string; ml: string };
  description: string | { en: string; ml: string };
  price?: number;
  category: string | { _id: string; name: string | { en: string; ml: string }; slug: string };
  celebrationType?: string;
  stock?: number;
  images: string[];
  tags?: string[];
  occasions?: string[];
  isFeatured?: boolean;
  slug?: string;
  defaultImage?: string;
  createdAt?: string;
  updatedAt?: string;
} 