import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ObjectUploader } from '@/components/ObjectUploader';
import { ArrowLeft, Camera, Loader2, Upload } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { UploadResult } from '@uppy/core';

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
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      setPreviewImageUrl(user.profileImageUrl || '');
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

  const handleGetUploadParameters = async () => {
    const res = await apiRequest('POST', '/api/objects/upload', {});
    const data = await res.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageURL = uploadedFile.uploadURL;

      if (imageURL) {
        setIsUploadingImage(true);
        try {
          const res = await apiRequest('PUT', '/api/profile-images', { imageURL });
          const data = await res.json();

          form.setValue('profileImageUrl', data.objectPath);
          setPreviewImageUrl(data.objectPath);

          toast({
            title: t('success'),
            description: t('imageUploaded'),
          });
        } catch (error) {
          toast({
            title: t('error'),
            description: t('failedToUploadImage'),
            variant: 'destructive',
          });
        } finally {
          setIsUploadingImage(false);
        }
      }
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--ds-gold-primary)' }} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/profile');
    return null;
  }

  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || t('user');

  const getImageSrc = () => {
    if (previewImageUrl) {
      return previewImageUrl;
    }
    return '';
  };

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 px-4 py-3.5 backdrop-blur-md"
        style={{
          background: 'rgba(250,248,245,0.88)',
          borderBottom: '1px solid rgba(176,132,66,0.14)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-xl active:opacity-60 transition-opacity"
            style={{ background: 'rgba(176,132,66,0.10)' }}
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: 'var(--ds-gold-primary)' }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ds-gold-primary)' }}>
            {t('editProfile')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* ── Avatar + upload ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="relative">
            <Avatar
              className="h-24 w-24"
              style={{ border: '2.5px solid rgba(176,132,66,0.35)' }}
            >
              <AvatarImage src={getImageSrc()} alt={userName} />
              <AvatarFallback
                style={{
                  background: 'rgba(176,132,66,0.12)',
                  color: 'var(--ds-gold-primary)',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                }}
              >
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div
              className="absolute bottom-0 end-0 p-1.5 rounded-full"
              style={{ background: 'var(--ds-gold-primary)' }}
            >
              <Camera className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={5242880}
            allowedFileTypes={['image/*']}
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonVariant="outline"
            buttonClassName="border-[rgba(176,132,66,0.45)] text-[#B08442] bg-[rgba(176,132,66,0.06)] hover:bg-[rgba(176,132,66,0.14)] hover:text-[#B08442]"
            disabled={isUploadingImage}
          >
            <div className="flex items-center gap-2">
              {isUploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{t('uploadPhoto')}</span>
            </div>
          </ObjectUploader>
        </div>

        {/* ── Form ────────────────────────────────────────────────────── */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal info card */}
          <div className="ds-card space-y-4">
            <h2 className="font-bold text-base" style={{ color: 'var(--ds-gold-primary)' }}>
              {t('personalInfo')}
            </h2>

            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-sm font-medium">
                {t('firstName')}
              </label>
              <input
                id="firstName"
                {...form.register('firstName')}
                placeholder={t('enterFirstName')}
                className="ds-input w-full px-3 h-10 text-sm"
                data-testid="input-first-name"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-medium">
                {t('lastName')}
              </label>
              <input
                id="lastName"
                {...form.register('lastName')}
                placeholder={t('enterLastName')}
                className="ds-input w-full px-3 h-10 text-sm"
                data-testid="input-last-name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('phoneNumber')}</label>
              <div
                className="px-3 h-10 flex items-center rounded-xl text-sm text-muted-foreground"
                style={{
                  background: 'var(--ds-bg-tertiary)',
                  border: '2px solid var(--ds-bg-tertiary)',
                }}
              >
                {user.phone || t('notProvided')}
              </div>
              <p className="text-xs text-muted-foreground">{t('phoneNotEditable')}</p>
            </div>
          </div>

          {/* Save button */}
          <button
            type="submit"
            className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm"
            disabled={updateProfileMutation.isPending || isUploadingImage}
            data-testid="button-save-profile"
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('saveChanges')
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
