import { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import BookPage from "@/pages/BookPage";
import NearbyPage from "@/pages/NearbyPage";
import BarberProfilePage from "@/pages/BarberProfilePage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import BarberRegisterPage from "@/pages/BarberRegisterPage";
import BarberDashboard from "@/pages/BarberDashboard";
import type { User } from '@/lib/types';

function Router() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogin = (method: 'phone' | 'apple' | 'google') => {
    const mockUser: User = {
      id: 'u1',
      name: 'John Smith',
      phone: '+1 555-123-4567',
      email: 'john@example.com',
      role: 'customer',
    };
    setUser(mockUser);
    toast({
      title: 'Signed in successfully',
      description: `Welcome, ${mockUser.name}!`,
    });
  };

  const handleLogout = () => {
    setUser(null);
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
  };

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/book" component={BookPage} />
      <Route path="/nearby" component={NearbyPage} />
      <Route path="/barber/:id" component={BarberProfilePage} />
      <Route path="/profile">
        <ProfilePage user={user} onLogin={handleLogin} onLogout={handleLogout} />
      </Route>
      <Route path="/settings" component={SettingsPage} />
      <Route path="/barber-register" component={BarberRegisterPage} />
      <Route path="/barber-dashboard" component={BarberDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
