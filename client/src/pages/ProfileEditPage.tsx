import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

export default function ProfileEditPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      profileImageUrl: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profileImageUrl: user.profileImageUrl || '',
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest('PATCH', '/api/auth/user', data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      await queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: t('success'),
        description: t('profileUpdated'),
      });
      navigate('/profile');
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToUpdateProfile'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/profile');
    return null;
  }

  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || t('user');

  return (
    <div className="min-h-screen bg-background pb-20">
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
          <h1 className="text-xl font-bold">{t('editProfile')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={form.watch('profileImageUrl') || user.profileImageUrl || ''} 
                alt={userName} 
              />
              <AvatarFallback className="text-2xl">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 p-1 bg-primary rounded-full">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstName')}</Label>
                <Input
                  id="firstName"
                  {...form.register('firstName')}
                  placeholder={t('enterFirstName')}
                  data-testid="input-first-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastName')}</Label>
                <Input
                  id="lastName"
                  {...form.register('lastName')}
                  placeholder={t('enterLastName')}
                  data-testid="input-last-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileImageUrl">{t('profileImageUrl')}</Label>
                <Input
                  id="profileImageUrl"
                  {...form.register('profileImageUrl')}
                  placeholder={t('enterImageUrl')}
                  data-testid="input-profile-image-url"
                />
                <p className="text-xs text-muted-foreground">{t('imageUrlHint')}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('phoneNumber')}</Label>
                <div className="p-3 bg-muted rounded-md text-muted-foreground">
                  {user.phone || t('notProvided')}
                </div>
                <p className="text-xs text-muted-foreground">{t('phoneNotEditable')}</p>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full"
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('saveChanges')
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
