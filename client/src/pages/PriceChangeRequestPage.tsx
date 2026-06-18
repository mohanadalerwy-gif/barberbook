import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';

interface PriceChangeRequest {
  id: string;
  barberId: string;
  oldHaircutPrice: string;
  oldBeardPrice: string;
  newHaircutPrice: string;
  newBeardPrice: string;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface PriceFormData {
  newHaircutPrice: string;
  newBeardPrice: string;
  notes: string;
}

export default function PriceChangeRequestPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const barber = user?.barber;

  const form = useForm<PriceFormData>({
    defaultValues: {
      newHaircutPrice: '',
      newBeardPrice: '',
      notes: '',
    },
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<PriceChangeRequest[]>({
    queryKey: ['/api/price-change-requests'],
    enabled: isAuthenticated && user?.role === 'barber',
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: PriceFormData) => {
      return await apiRequest('POST', '/api/price-change-requests', {
        newHaircutPrice: data.newHaircutPrice,
        newBeardPrice: data.newBeardPrice,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-change-requests'] });
      form.reset();
      toast({
        title: t('success'),
        description: t('priceChangeRequestSubmitted'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToSubmitRequest'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: PriceFormData) => {
    if (!data.newHaircutPrice || !data.newBeardPrice) {
      toast({
        title: t('error'),
        description: t('fillRequiredFields'),
        variant: 'destructive',
      });
      return;
    }
    createRequestMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'barber') {
    navigate('/profile');
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            {t('pending')}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('approved')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            {t('rejected')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const hasPendingRequest = requests.some(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{t('requestPriceChange')}</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('currentPrices')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span>{t('haircut')}</span>
              <span className="font-semibold">${barber?.haircutPrice || '0'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>{t('beardTrim')}</span>
              <span className="font-semibold">${barber?.beardPrice || '0'}</span>
            </div>
          </CardContent>
        </Card>

        {hasPendingRequest ? (
          <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="font-medium text-yellow-800 dark:text-yellow-400">
                {t('pendingRequestExists')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('waitForApproval')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('newPrices')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newHaircutPrice">{t('newHaircutPrice')}</Label>
                  <Input
                    id="newHaircutPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('newHaircutPrice')}
                    placeholder={t('enterNewPrice')}
                    data-testid="input-new-haircut-price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newBeardPrice">{t('newBeardPrice')}</Label>
                  <Input
                    id="newBeardPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('newBeardPrice')}
                    placeholder={t('enterNewPrice')}
                    data-testid="input-new-beard-price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('notesOptional')}</Label>
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    placeholder={t('reasonForPriceChange')}
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full"
              disabled={createRequestMutation.isPending}
              data-testid="button-submit-request"
            >
              {createRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submitRequest')
              )}
            </Button>
          </form>
        )}

        {requests.length > 0 && (
          <section>
            <h3 className="font-semibold mb-3">{t('previousRequests')}</h3>
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} data-testid={`card-request-${request.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(request.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('haircut')}</p>
                        <p>
                          <span className="line-through text-muted-foreground">${request.oldHaircutPrice}</span>
                          {' → '}
                          <span className="font-medium">${request.newHaircutPrice}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('beardTrim')}</p>
                        <p>
                          <span className="line-through text-muted-foreground">${request.oldBeardPrice}</span>
                          {' → '}
                          <span className="font-medium">${request.newBeardPrice}</span>
                        </p>
                      </div>
                    </div>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        "{request.notes}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
