import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  role: 'customer' | 'barber';
  authProvider: string | null;
  authProviderId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  barber?: {
    id: string;
    bio: string | null;
    address: string | null;
    lat: string | null;
    lng: string | null;
    priceRange: string | null;
    isApproved: boolean | null;
    rating: string | null;
    reviewCount: number | null;
    shopName: string | null;
    phone: string | null;
    haircutPrice: string | null;
    beardPrice: string | null;
  } | null;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
