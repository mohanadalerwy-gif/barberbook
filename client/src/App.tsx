import { useState } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import BarbersPage from "@/pages/BarbersPage";
import MyBookingsPage from "@/pages/MyBookingsPage";
import BarberDashboard from "@/pages/BarberDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import type { User, UserRole } from '@/lib/types';

// todo: remove mock functionality - replace with real auth
const mockUsers: Record<UserRole, User> = {
  customer: {
    id: 'c1',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'customer',
  },
  barber: {
    id: 'b1',
    name: 'Marcus Johnson',
    email: 'marcus@example.com',
    role: 'barber',
  },
  admin: {
    id: 'a1',
    name: 'Admin User',
    email: 'admin@barberbook.com',
    role: 'admin',
  },
};

function Router() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loginRole, setLoginRole] = useState<UserRole>('customer');

  const handleLogin = () => {
    // todo: remove mock functionality - cycle through roles for demo
    const roles: UserRole[] = ['customer', 'barber', 'admin'];
    const currentIndex = roles.indexOf(loginRole);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    
    setUser(mockUsers[loginRole]);
    setLoginRole(nextRole);
    
    toast({
      title: 'Signed in successfully',
      description: `Welcome back, ${mockUsers[loginRole].name}! (Demo: Click sign in again for ${nextRole} role)`,
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
      <Route path="/">
        <HomePage user={user} onLogin={handleLogin} onLogout={handleLogout} />
      </Route>
      <Route path="/barbers">
        <BarbersPage user={user} onLogin={handleLogin} onLogout={handleLogout} />
      </Route>
      <Route path="/my-bookings">
        <MyBookingsPage user={user} onLogin={handleLogin} onLogout={handleLogout} />
      </Route>
      <Route path="/barber-dashboard">
        <BarberDashboard user={user} onLogout={handleLogout} />
      </Route>
      <Route path="/admin">
        <AdminDashboard user={user} onLogout={handleLogout} />
      </Route>
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
