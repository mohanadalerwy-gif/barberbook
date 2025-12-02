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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format, parseISO } from 'date-fns';

interface SupportTicket {
  id: string;
  userId: string;
  category: 'price_change' | 'technical_issue' | 'general_question';
  message: string;
  photoUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface TicketFormData {
  category: string;
  message: string;
  photoUrl: string;
}

export default function SupportCenterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('my-tickets');

  const form = useForm<TicketFormData>({
    defaultValues: {
      category: '',
      message: '',
      photoUrl: '',
    },
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support-tickets'],
    enabled: isAuthenticated,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      return await apiRequest('POST', '/api/support-tickets', {
        category: data.category,
        message: data.message,
        photoUrl: data.photoUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      form.reset();
      setActiveTab('my-tickets');
      toast({
        title: t('success'),
        description: t('ticketSubmitted'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToSubmitTicket'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    if (!data.category || !data.message) {
      toast({
        title: t('error'),
        description: t('fillRequiredFields'),
        variant: 'destructive',
      });
      return;
    }
    createTicketMutation.mutate(data);
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'price_change':
        return t('priceChange');
      case 'technical_issue':
        return t('technicalIssue');
      case 'general_question':
        return t('generalQuestion');
      default:
        return category;
    }
  };

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
          <h1 className="text-xl font-bold">{t('supportCenter')}</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-tickets" data-testid="tab-my-tickets">
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('myTickets')}
            </TabsTrigger>
            <TabsTrigger value="submit-ticket" data-testid="tab-submit-ticket">
              <Plus className="h-4 w-4 mr-2" />
              {t('submitTicket')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tickets" className="space-y-4">
            {ticketsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t('noTickets')}
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket.id} data-testid={`card-ticket-${ticket.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{getCategoryLabel(ticket.category)}</Badge>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm mb-2">{ticket.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="submit-ticket">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('newTicket')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('category')}</Label>
                    <Select
                      value={form.watch('category')}
                      onValueChange={(value) => form.setValue('category', value)}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price_change">{t('priceChange')}</SelectItem>
                        <SelectItem value="technical_issue">{t('technicalIssue')}</SelectItem>
                        <SelectItem value="general_question">{t('generalQuestion')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('message')}</Label>
                    <Textarea
                      id="message"
                      {...form.register('message')}
                      placeholder={t('describeIssue')}
                      rows={5}
                      data-testid="input-message"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photoUrl">{t('photoOptional')}</Label>
                    <Input
                      id="photoUrl"
                      {...form.register('photoUrl')}
                      placeholder={t('enterPhotoUrl')}
                      data-testid="input-photo-url"
                    />
                    <p className="text-xs text-muted-foreground">{t('photoHint')}</p>
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full"
                disabled={createTicketMutation.isPending}
                data-testid="button-submit-ticket"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submitTicket')
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
