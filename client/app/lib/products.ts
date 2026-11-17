export interface FormattedProduct {
  id: string | number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  category: string;
  category_slug: string;
  image_url: string | null;
  tag: string | null;
}

export function formatProduct(product: any): FormattedProduct {
  const primaryImgObj =
    product.product_images?.find((img: any) => img.is_primary) ||
    product.product_images?.[0];

  const categoryObj = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    stock: product.stock,
    is_active: product.is_active,
    created_at: product.created_at,
    category: categoryObj?.name || "Sin categoría",
    category_slug: categoryObj?.slug || "",
    image_url: primaryImgObj ? primaryImgObj.image_url : null,
    tag: product.tag,
  };
}

export function getPaginationParams(searchParams: URLSearchParams, defaultLimit = 10) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || defaultLimit));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}

export function buildPaginationMeta(page: number, limit: number, totalItems: number) {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}