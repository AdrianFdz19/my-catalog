export interface Product {
  id: number | string;
  name: string;
  slug: string;
  category: string;
  category_slug?: string;
  price: number | string;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  description: string;
  tag?: string;
}