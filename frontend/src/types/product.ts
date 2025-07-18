export interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  category: string | { _id: string; name: string; slug: string };
  celebrationType?: string;
  stock?: number;
  images: string[];
  tags?: string[];
  isFeatured: boolean;
  slug?: string;
  defaultImage?: string;
  createdAt?: string;
  updatedAt?: string;
} 