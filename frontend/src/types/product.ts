export interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  categories: Array<{ _id: string; name: string; slug: string }>;
  stock?: number;
  images: string[];
  defaultImage?: string;
  occasions?: string[];
  vendors?: Array<{ _id: string; name: string }>;
  isFeatured?: boolean;
  slug?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
} 