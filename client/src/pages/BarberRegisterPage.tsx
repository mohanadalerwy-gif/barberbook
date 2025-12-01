import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Scissors, CheckCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  address: z.string().min(5, 'Please enter your work address'),
  experience: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function BarberRegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      experience: '',
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Barber registration:', data);
    setSubmitted(true);
    toast({
      title: 'Registration Submitted',
      description: 'We will review your application and contact you soon.',
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/settings')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Barber Registration</h1>
          </div>
        </header>

        <main className="px-4 py-12 text-center">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for registering. We will review your application and contact you within 24-48 hours.
          </p>
          <Button onClick={() => navigate('/')} data-testid="button-go-home">
            Back to Home
          </Button>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/settings')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Barber Registration</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Join Our Platform</p>
              <p className="text-sm text-muted-foreground">
                Register as a barber and start receiving bookings
              </p>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your full name" 
                      {...field} 
                      data-testid="input-name"
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="+1 (555) 000-0000" 
                      {...field} 
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="your@email.com" 
                      {...field} 
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop/Work Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your work address" 
                      {...field} 
                      data-testid="input-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience & Services</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your experience and the services you offer..."
                      rows={4}
                      {...field} 
                      data-testid="input-experience"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={form.formState.isSubmitting}
              data-testid="button-submit"
            >
              {form.formState.isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNav />
    </div>
  );
}
