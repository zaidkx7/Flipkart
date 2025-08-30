"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, ShoppingCart, Plus, ChevronUp, ListFilter, SearchX, ShoppingBag, SquareMinus, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { productsApi } from "@/api/routers/products";
import { 
  transformApiProduct, 
  filterProducts, 
  sortProducts, 
  getFilterOptions,
  type FrontendProduct 
} from "@/lib/product-utils";

// Use the FrontendProduct type from utils
type Product = FrontendProduct;

interface CartItem {
  product: Product;
  quantity: number;
  variant: {
    color: string;
    storage: string;
  };
}

interface Filters {
  brands: string[];
  priceRange: [number, number];
  ram: string[];
  storage: string[];
  colors: string[];
  network: string[];
  condition: string[];
  rating: number;
  inStockOnly: boolean;
}

// Filter options will be dynamically generated from API data

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    brands: [],
    priceRange: [0, 50000],
    ram: [],
    storage: [],
    colors: [],
    network: [],
    condition: [],
    rating: 0,
    inStockOnly: false
  });
  const [filterOptions, setFilterOptions] = useState({
    brands: [] as string[],
    ram: [] as string[],
    storage: [] as string[],
    colors: [] as string[],
    network: [] as string[],
    condition: ["New", "Refurbished"] as string[],
    priceRange: [0, 50000] as [number, number],
  });
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pageSize, setPageSize] = useState(12);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "success">("cart");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [checkoutForm, setCheckoutForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "US",
    phone: "",
    shippingMethod: "standard"
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset image index when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedProduct]);

  useEffect(() => {
    setQuickViewImageIndex(0);
  }, [quickViewProduct]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedProduct) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedImageIndex(prev => 
            prev <= 0 ? selectedProduct.images.length - 1 : prev - 1
          );
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedImageIndex(prev => 
            prev >= selectedProduct.images.length - 1 ? 0 : prev + 1
          );
        }
      } else if (quickViewProduct) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setQuickViewImageIndex(prev => 
            prev <= 0 ? quickViewProduct.images.length - 1 : prev - 1
          );
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setQuickViewImageIndex(prev => 
            prev >= quickViewProduct.images.length - 1 ? 0 : prev + 1
          );
        }
      }
    };

    if (selectedProduct || quickViewProduct) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedProduct, quickViewProduct]);

  // Load products from API on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiProducts = await productsApi.getAllProducts();
        const transformedProducts = apiProducts.map(transformApiProduct);
        
        setAllProducts(transformedProducts);
        setProducts(transformedProducts);
        
        // Update filter options based on loaded products
        const options = getFilterOptions(transformedProducts);
        setFilterOptions(prev => ({
          ...prev,
          brands: options.brands,
          ram: options.ram,
          storage: options.storage,
          colors: options.colors,
          network: options.network,
          priceRange: options.priceRange,
        }));
        
        // Update initial filter price range
        setFilters(prev => ({
          ...prev,
          priceRange: options.priceRange,
        }));
        
      } catch (error) {
        console.error('Failed to load products:', error);
        setError('Failed to load products. Please try again.');
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("storefront-cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart:", error);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("storefront-cart", JSON.stringify(cart));
  }, [cart]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setLoading(true);
        try {
          // Try API search first, fallback to local filtering
          const searchResults = await productsApi.searchProducts(searchQuery);
          const transformedResults = searchResults.map(transformApiProduct);
          setProducts(transformedResults);
        } catch (error) {
          console.error('Search failed:', error);
          // Fallback to local search
          const filtered = allProducts.filter(product =>
            product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setProducts(filtered);
        } finally {
          setLoading(false);
        }
      } else {
        setProducts(allProducts);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, allProducts]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = filterProducts(products, filters);
    return sortProducts(filtered, sortBy);
  }, [products, filters, sortBy]);

  const addToCart = useCallback((product: Product, quantity: number = 1, variant = { color: product.specs.color, storage: product.specs.storage }) => {
    setCart(prev => {
      const existingItem = prev.find(item => 
        item.product.id === product.id && 
        item.variant.color === variant.color &&
        item.variant.storage === variant.storage
      );
      
      if (existingItem) {
        return prev.map(item =>
          item === existingItem
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { product, quantity, variant }];
      }
    });
    
    toast.success(`Added ${product.model} to cart`, {
      action: {
        label: "View Cart",
        onClick: () => setCartOpen(true)
      }
    });
  }, []);

  const removeFromCart = useCallback((itemIndex: number) => {
    setCart(prev => prev.filter((_, index) => index !== itemIndex));
    toast.success("Item removed from cart");
  }, []);

  const updateCartQuantity = useCallback((itemIndex: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemIndex);
      return;
    }
    
    setCart(prev => 
      prev.map((item, index) =>
        index === itemIndex ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [removeFromCart]);

  const clearFilters = useCallback(() => {
    setFilters({
      brands: [],
      priceRange: filterOptions.priceRange,
      ram: [],
      storage: [],
      colors: [],
      network: [],
      condition: [],
      rating: 0,
      inStockOnly: false
    });
  }, [filterOptions.priceRange]);

  const refreshProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiProducts = await productsApi.getAllProducts();
      const transformedProducts = apiProducts.map(transformApiProduct);
      
      setAllProducts(transformedProducts);
      setProducts(transformedProducts);
      
      toast.success('Products refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh products:', error);
      setError('Failed to refresh products');
      toast.error('Failed to refresh products');
    } finally {
      setLoading(false);
    }
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const handleCheckout = useCallback(async () => {
    setLoading(true);
    // Mock checkout API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setCheckoutStep("success");
    toast.success("Order placed successfully!");
  }, []);

  // Image navigation handlers
  const nextImage = useCallback((isQuickView = false) => {
    if (isQuickView && quickViewProduct) {
      setQuickViewImageIndex(prev => 
        prev >= quickViewProduct.images.length - 1 ? 0 : prev + 1
      );
    } else if (selectedProduct) {
      setSelectedImageIndex(prev => 
        prev >= selectedProduct.images.length - 1 ? 0 : prev + 1
      );
    }
  }, [selectedProduct, quickViewProduct]);

  const prevImage = useCallback((isQuickView = false) => {
    if (isQuickView && quickViewProduct) {
      setQuickViewImageIndex(prev => 
        prev <= 0 ? quickViewProduct.images.length - 1 : prev - 1
      );
    } else if (selectedProduct) {
      setSelectedImageIndex(prev => 
        prev <= 0 ? selectedProduct.images.length - 1 : prev - 1
      );
    }
  }, [selectedProduct, quickViewProduct]);

  const selectImage = useCallback((index: number, isQuickView = false) => {
    if (isQuickView) {
      setQuickViewImageIndex(index);
    } else {
      setSelectedImageIndex(index);
    }
  }, []);

  const FilterSection = () => (
    <div className="space-y-6 p-4">

      
      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Price Range: ₹{filters.priceRange[0].toLocaleString()} - ₹{filters.priceRange[1].toLocaleString()}
        </Label>
        <Slider
          value={filters.priceRange}
          onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
          max={filterOptions.priceRange[1]}
          min={filterOptions.priceRange[0]}
          step={Math.ceil((filterOptions.priceRange[1] - filterOptions.priceRange[0]) / 100)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>₹{filterOptions.priceRange[0].toLocaleString()}</span>
          <span>₹{filterOptions.priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <Separator />

        {/* Brand Filter */}
        <div>
        <Label className="text-sm font-medium mb-3 block">Brand</Label>
        <div className="space-y-2">
          {filterOptions.brands.map(brand => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={filters.brands.includes(brand)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    brands: checked
                      ? [...prev.brands, brand]
                      : prev.brands.filter(b => b !== brand)
                  }));
                }}
              />
              <Label htmlFor={`brand-${brand}`} className="text-sm">{brand}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* RAM Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">RAM</Label>
        <div className="space-y-2">
          {filterOptions.ram.map(ram => (
            <div key={ram} className="flex items-center space-x-2">
              <Checkbox
                id={`ram-${ram}`}
                checked={filters.ram.includes(ram)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    ram: checked
                      ? [...prev.ram, ram]
                      : prev.ram.filter(r => r !== ram)
                  }));
                }}
              />
              <Label htmlFor={`ram-${ram}`} className="text-sm">{ram}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Storage Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Storage</Label>
        <div className="space-y-2">
          {filterOptions.storage.map(storage => (
            <div key={storage} className="flex items-center space-x-2">
              <Checkbox
                id={`storage-${storage}`}
                checked={filters.storage.includes(storage)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    storage: checked
                      ? [...prev.storage, storage]
                      : prev.storage.filter(s => s !== storage)
                  }));
                }}
              />
              <Label htmlFor={`storage-${storage}`} className="text-sm">{storage}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* In Stock Only */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="in-stock"
          checked={filters.inStockOnly}
          onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStockOnly: !!checked }))}
        />
        <Label htmlFor="in-stock" className="text-sm">In Stock Only</Label>
      </div>

      <div className="pt-4 space-y-2">
        <Button onClick={clearFilters} variant="outline" className="w-full">
          Clear All Filters
        </Button>
      </div>
    </div>
  );

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group cursor-pointer transition-all hover:shadow-lg h-full flex flex-col">
      <CardHeader className="p-0">
        <div className="aspect-square-max overflow-hidden rounded-t-lg">
          <img
            src={product.image}
            alt={`${product.brand} ${product.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onClick={() => setSelectedProduct(product)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          <h3 className="font-semibold text-sm">{product.brand} {product.model}</h3>
          <p className="text-xs text-muted-foreground">
            {product.specs.ram} • {product.specs.storage} • {product.specs.network}
          </p>
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <span className="font-bold text-lg">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {!product.inStock && (
              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-xs ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-muted-foreground">({product.reviewCount})</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setQuickViewProduct(product)}
        >
          Quick View
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => addToCart(product)}
          disabled={!product.inStock}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary">FlipkartShop</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshProducts}
                disabled={loading}
                title="Refresh products"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search phones..."
                  className="pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                    onClick={() => setSearchQuery("")}
                  >
                    <SearchX className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Promo Strip */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center text-sm font-medium">
            🎉 Back to School Sale - Up to 30% off select devices
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filters</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <FilterSection />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Product Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <ListFilter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-full mt-4">
                      <FilterSection />
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
                <span className="text-sm text-muted-foreground">
                  {filteredAndSortedProducts.length} results
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            {error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Products</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refreshProducts}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <SearchX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button onClick={clearFilters}>Clear All Filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {filteredAndSortedProducts.slice(0, pageSize).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.brand} {selectedProduct.model}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Main Image with Navigation */}
                  <div className="aspect-square relative group">
                    <img
                      src={selectedProduct.images[selectedImageIndex] || selectedProduct.image}
                      alt={selectedProduct.model}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    
                    {/* Navigation Arrows */}
                    {selectedProduct.images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white border-0"
                          onClick={() => prevImage(false)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white border-0"
                          onClick={() => nextImage(false)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {selectedImageIndex + 1} of {selectedProduct.images.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Navigation */}
                  {selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedProduct.images.map((img, index) => (
                        <button
                          key={index}
                          className={`flex-shrink-0 w-16 h-16 rounded border-2 transition-all ${
                            index === selectedImageIndex 
                              ? 'border-primary ring-2 ring-primary/20' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => selectImage(index, false)}
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold">₹{selectedProduct.price.toLocaleString()}</span>
                      {selectedProduct.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          ₹{selectedProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(selectedProduct.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span>({selectedProduct.reviewCount} reviews)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Specifications</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>RAM: {selectedProduct.specs.ram}</div>
                      <div>Storage: {selectedProduct.specs.storage}</div>
                      <div>Network: {selectedProduct.specs.network}</div>
                      <div>Color: {selectedProduct.specs.color}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Key Features</h4>
                    <ul className="text-sm space-y-1">
                      {selectedProduct.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => addToCart(selectedProduct)}
                    disabled={!selectedProduct.inStock}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {selectedProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick View Dialog */}
      <Dialog open={!!quickViewProduct} onOpenChange={() => setQuickViewProduct(null)}>
        <DialogContent>
          {quickViewProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{quickViewProduct.brand} {quickViewProduct.model}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {/* Main Image with Navigation */}
                  <div className="aspect-square relative group">
                    <img
                      src={quickViewProduct.images[quickViewImageIndex] || quickViewProduct.image}
                      alt={quickViewProduct.model}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    
                    {/* Navigation Arrows */}
                    {quickViewProduct.images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white border-0"
                          onClick={() => prevImage(true)}
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white border-0"
                          onClick={() => nextImage(true)}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {quickViewImageIndex + 1} of {quickViewProduct.images.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Navigation */}
                  {quickViewProduct.images.length > 1 && (
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {quickViewProduct.images.map((img, index) => (
                        <button
                          key={index}
                          className={`flex-shrink-0 w-12 h-12 rounded border-2 transition-all ${
                            index === quickViewImageIndex 
                              ? 'border-primary ring-2 ring-primary/20' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => selectImage(index, true)}
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">₹{quickViewProduct.price.toLocaleString()}</span>
                    {quickViewProduct.originalPrice && (
                      <span className="text-muted-foreground line-through">
                        ₹{quickViewProduct.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div>RAM: {quickViewProduct.specs.ram}</div>
                    <div>Storage: {quickViewProduct.specs.storage}</div>
                    <div>Network: {quickViewProduct.specs.network}</div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    disabled={!quickViewProduct.inStock}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {quickViewProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {checkoutStep === "cart" && "Shopping Cart"}
              {checkoutStep === "checkout" && "Checkout"}
              {checkoutStep === "success" && "Order Complete"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 h-full flex flex-col">
            {checkoutStep === "cart" && (
              <>
                <ScrollArea className="flex-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <div key={index} className="flex gap-3 p-3 border rounded-lg">
                          <img
                            src={item.product.image}
                            alt={item.product.model}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {item.product.brand} {item.product.model}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {item.variant.color} • {item.variant.storage}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateCartQuantity(index, item.quantity - 1)}
                                >
                                  <SquareMinus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateCartQuantity(index, item.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {cart.length > 0 && (
                  <div className="mt-6 pt-4 border-t space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{cartTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>₹149</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>₹{Math.round(cartTotal * 0.08).toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{Math.round(cartTotal + 149 + cartTotal * 0.08).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => setCheckoutStep("checkout")}
                      >
                        Proceed to Checkout
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setCartOpen(false)}
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {checkoutStep === "checkout" && (
              <div className="space-y-4">
                <ScrollArea className="flex-1 max-h-96">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={checkoutForm.firstName}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={checkoutForm.lastName}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={checkoutForm.address}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={checkoutForm.city}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={checkoutForm.postalCode}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, postalCode: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="pt-4 border-t space-y-2">
                  <Button
                    className="w-full"
                    onClick={handleCheckout}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : `Place Order - ₹${Math.round(cartTotal + 149 + cartTotal * 0.08).toLocaleString()}`}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCheckoutStep("cart")}
                  >
                    Back to Cart
                  </Button>
                </div>
              </div>
            )}

            {checkoutStep === "success" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h3 className="text-lg font-semibold">Order Complete!</h3>
                <p className="text-muted-foreground">
                  Thank you for your purchase. You'll receive a confirmation email shortly.
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    setCart([]);
                    setCheckoutStep("cart");
                    setCartOpen(false);
                  }}
                >
                  Continue Shopping
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}