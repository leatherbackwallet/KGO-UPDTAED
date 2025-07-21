export interface Product {
  _id: string;
  name: string | { en: string; de: string };
  description: string | { en: string; de: string };
  price?: number;
  category: string | { _id: string; name: string; slug: string };
  celebrationType?: string;
  stock?: number;
  images: string[];
  tags?: string[];
  isFeatured?: boolean;
  slug?: string;
  defaultImage?: string;
  createdAt?: string;
  updatedAt?: string;
} 