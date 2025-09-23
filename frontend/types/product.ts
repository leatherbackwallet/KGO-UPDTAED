export interface ComboItem {
  name: string;
  unitPrice: number;
  defaultQuantity: number;
  unit: string; // e.g., 'kg', 'set', 'piece', 'dozen'
}

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
  // Combo product fields
  isCombo?: boolean;
  comboBasePrice?: number;
  comboItems?: ComboItem[];
  createdAt?: string;
  updatedAt?: string;
} 