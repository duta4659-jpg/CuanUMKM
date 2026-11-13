export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerWarung: string;
  sellerPhone: string;
  sellerAddress: string;
  sellerLocation?: {
    lat: number;
    lng: number;
  };
  title: string;
  category: string;
  price: number;
  photoUrl: string;
  omzetDescription: string;
  portionPerDay: number;
  rating: number;
  reviewCount: number;
  city: string;
  // Locked Secret Section
  ingredients: RecipeIngredient[];
  secretTricks: string[];
  steps: string[];
  status: 'approved' | 'review' | 'rejected';
  createdAt: string;
}

export interface RecipeOrder {
  id: string;
  recipeId: string;
  recipeTitle: string;
  recipePhoto: string;
  sellerName: string;
  sellerWarung: string;
  sellerPhone: string;
  sellerCity: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  distanceKm: number;
  price: number;
  status: 'waiting_approval' | 'approved' | 'rejected';
  paymentMethod: 'qris' | 'transfer';
  rejectionReason?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'buyer' | 'seller';
  senderName: string;
  text: string;
  time: string;
}
