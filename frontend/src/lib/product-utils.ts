import { Product as ApiProduct } from '@/api/routers/products';

// Interface for the frontend product format (compatible with existing Storefront)
export interface FrontendProduct {
  id: string;
  brand: string;
  model: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  specs: {
    ram: string;
    storage: string;
    network: string;
    color: string;
  };
  rating: number;
  reviewCount: number;
  inStock: boolean;
  description: string;
  features: string[];
  category: string;
  url: string;
  product_id: string;
}

// Transform API product to frontend product format
export const transformApiProduct = (apiProduct: ApiProduct): FrontendProduct => {
  // Extract brand and model from title
  const titleParts = apiProduct.title.split(' ');
  const brand = titleParts[0] || 'Unknown';
  const model = titleParts.slice(1).join(' ') || 'Unknown Model';

  // Get current price (non-struck price)
  const currentPrice = apiProduct.pricing.prices.find(p => !p.strikeOff)?.value || 0;
  const originalPrice = apiProduct.pricing.prices.find(p => p.strikeOff)?.value;

  // Extract specs from specifications array
  const specs = extractSpecs(apiProduct.specifications);

  // Get primary image and all images
  const images = apiProduct.media.map(url => 
    url.replace('{@width}', '600').replace('{@height}', '600').replace('{@quality}', '80')
  );
  const primaryImage = images[0] || '/placeholder-product.jpg';

  return {
    id: apiProduct.id.toString(),
    brand,
    model,
    price: currentPrice,
    originalPrice,
    image: primaryImage,
    images,
    specs,
    rating: apiProduct.rating?.average || 0,
    reviewCount: apiProduct.rating?.reviewCount || 0,
    inStock: apiProduct.availability === 'IN_STOCK',
    description: `${brand} ${model} with ${specs.ram} RAM and ${specs.storage} storage. ${apiProduct.warrantySummary}`,
    features: apiProduct.specifications.slice(0, 4), // Use specs as features
    category: apiProduct.category,
    url: apiProduct.url,
    product_id: apiProduct.product_id,
  };
};

// Extract structured specs from specifications array
const extractSpecs = (specifications: string[]): {
  ram: string;
  storage: string;
  network: string;
  color: string;
} => {
  const specs = {
    ram: 'Unknown',
    storage: 'Unknown',
    network: 'Unknown',
    color: 'Unknown',
  };

  specifications.forEach(spec => {
    const lowerSpec = spec.toLowerCase();
    
    // Extract RAM
    const ramMatch = lowerSpec.match(/(\d+)\s*gb\s*ram/);
    if (ramMatch) {
      specs.ram = `${ramMatch[1]}GB`;
    }

    // Extract Storage
    const storageMatch = lowerSpec.match(/(\d+)\s*gb\s*rom/);
    if (storageMatch) {
      specs.storage = `${storageMatch[1]}GB`;
    }

    // Extract Network
    if (lowerSpec.includes('5g')) {
      specs.network = '5G';
    } else if (lowerSpec.includes('4g')) {
      specs.network = '4G';
    }

    // Extract display size for color approximation (since color info isn't in specs)
    const displayMatch = lowerSpec.match(/\((.*?)\)/);
    if (displayMatch && displayMatch[1]) {
      specs.color = displayMatch[1].split(',')[0] || 'Unknown';
    }
  });

  return specs;
};

// Filter functions for API products
export const filterProducts = (
  products: FrontendProduct[],
  filters: {
    brands?: string[];
    priceRange?: [number, number];
    ram?: string[];
    storage?: string[];
    colors?: string[];
    network?: string[];
    rating?: number;
    inStockOnly?: boolean;
    category?: string;
  }
): FrontendProduct[] => {
  return products.filter(product => {
    if (filters.brands && filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
      return false;
    }
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (product.price < min || product.price > max) {
        return false;
      }
    }
    
    if (filters.ram && filters.ram.length > 0 && !filters.ram.includes(product.specs.ram)) {
      return false;
    }
    
    if (filters.storage && filters.storage.length > 0 && !filters.storage.includes(product.specs.storage)) {
      return false;
    }
    
    if (filters.colors && filters.colors.length > 0 && !filters.colors.includes(product.specs.color)) {
      return false;
    }
    
    if (filters.network && filters.network.length > 0 && !filters.network.includes(product.specs.network)) {
      return false;
    }
    
    if (filters.rating && product.rating < filters.rating) {
      return false;
    }
    
    if (filters.inStockOnly && !product.inStock) {
      return false;
    }
    
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    
    return true;
  });
};

// Sort products
export const sortProducts = (
  products: FrontendProduct[],
  sortBy: string
): FrontendProduct[] => {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'newest':
      return sorted; // API returns newest first by default
    case 'relevance':
    default:
      return sorted;
  }
};

// Get unique values for filters
export const getFilterOptions = (products: FrontendProduct[]) => {
  const brands = [...new Set(products.map(p => p.brand))].sort();
  const ram = [...new Set(products.map(p => p.specs.ram))].sort();
  const storage = [...new Set(products.map(p => p.specs.storage))].sort();
  const colors = [...new Set(products.map(p => p.specs.color))].sort();
  const network = [...new Set(products.map(p => p.specs.network))].sort();
  const categories = [...new Set(products.map(p => p.category))].sort();
  
  // Calculate price range
  const prices = products.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  return {
    brands,
    ram,
    storage,
    colors,
    network,
    categories,
    priceRange: [Math.floor(minPrice), Math.ceil(maxPrice)] as [number, number],
  };
};