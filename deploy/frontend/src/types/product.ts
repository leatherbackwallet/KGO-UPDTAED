export interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  categories: Array<{ _id: string; name: string; slug: string } | string>;
  stock?: number;
  images: string[]; // Image filenames (e.g., "product-123.jpg")
  defaultImage?: string; // Default image filename
  occasions?: string[];
  vendors?: Array<{ _id: string; name: string }>;
  isFeatured?: boolean;
  slug?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
} 