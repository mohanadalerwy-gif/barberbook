import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Scissors, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';

const formSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  shopName: z.string().min(2, 'Please enter your shop name'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  haircutPrice: z.string().min(1, 'Please enter haircut price'),
  beardPrice: z.string().min(1, 'Please enter beard price'),
  address: z.string().min(5, 'Please enter your work address'),
  bio: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function BarberRegisterPage() {
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      shopName: '',
      phone: '',
      haircutPrice: '',
      beardPrice: '',
      address: '',
      bio: '',
      lat: '',
      lng: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('POST', '/api/barbers/register', {
        shopName: data.shopName,
        phone: data.phone,
        haircutPrice: data.haircutPrice,
        beardPrice: data.beardPrice,
        address: data.address,
        bio: data.bio,
        lat: data.lat || '25.2048',
        lng: data.lng || '55.2708',
        priceRange: `$${data.haircutPrice} - $${parseFloat(data.haircutPrice) + parseFloat(data.beardPrice)}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setSubmitted(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to register as a barber.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Registration Failed",
        description: "Failed to register. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(data);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t('error'),
        description: t('locationError'),
        variant: "destructive",
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('lat', position.coords.latitude.toString());
        form.setValue('lng', position.coords.longitude.toString());
        setGettingLocation(false);
        toast({
          title: t('success'),
          description: t('locationObtained'),
        });
      },
      () => {
        setGettingLocation(false);
        toast({
          title: t('error'),
          description: t('locationError'),
          variant: "destructive",
        });
      }
    );
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to register as a barber.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isLoading, isAuthenticated, toast]);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background/80 backdrop-blur-sm">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/profile')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('barberRegistration')}</h1>
          </div>
        </header>

        <main className="px-4 py-12 text-center">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('applicationSubmitted')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('registrationSuccess')}
          </p>
          <Button onClick={() => navigate('/profile')} data-testid="button-go-home">
            {t('viewProfile')}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-sm">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('barberRegistration')}</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{t('joinPlatform')}</p>
              <p className="text-sm text-muted-foreground">
                {t('registerAsBarber')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('barberFullName')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('enterFullName')}
                      {...field} 
                      data-testid="input-full-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('shopName')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('enterShopName')}
                      {...field} 
                      data-testid="input-shop-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phoneNumber')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder={t('enterPhoneNumber')}
                      {...field} 
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="haircutPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('haircutPrice')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder={t('enterHaircutPrice')}
                        {...field} 
                        data-testid="input-haircut-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beardPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('beardPrice')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder={t('enterBeardPrice')}
                        {...field} 
                        data-testid="input-beard-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('shopAddress')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('enterWorkAddress')}
                      {...field} 
                      data-testid="input-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>{t('coordinates')}</FormLabel>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  data-testid="button-get-location"
                >
                  {gettingLocation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  {t('useMyLocation')}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder={t('latitude')}
                          {...field} 
                          readOnly
                          className="bg-muted"
                          data-testid="input-lat"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder={t('longitude')}
                          {...field} 
                          readOnly
                          className="bg-muted"
                          data-testid="input-lng"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('experienceServices')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('tellAboutExperience')}
                      rows={4}
                      {...field} 
                      data-testid="input-bio"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerMutation.isPending}
              data-testid="button-submit"
            >
              {registerMutation.isPending ? t('loading') : t('submitRegistration')}
            </Button>
          </form>
        </Form>
      </main>

    </div>
  );
}
