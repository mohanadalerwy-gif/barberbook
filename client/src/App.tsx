import { useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from 'react-i18next';
import i18n from "@/lib/i18n";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import BookPage from "@/pages/BookPage";
import BookByBarberPage from "@/pages/BookByBarberPage";
import NearbyPage from "@/pages/NearbyPage";
import BarberProfilePage from "@/pages/BarberProfilePage";
import ProfilePage from "@/pages/ProfilePage";
import ProfileEditPage from "@/pages/ProfileEditPage";
import SettingsPage from "@/pages/SettingsPage";
import BarberRegisterPage from "@/pages/BarberRegisterPage";
import BarberDashboard from "@/pages/BarberDashboard";
import SupportCenterPage from "@/pages/SupportCenterPage";
import PriceChangeRequestPage from "@/pages/PriceChangeRequestPage";

function Router() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/book" component={BookPage} />
      <Route path="/book-by-barber" component={BookByBarberPage} />
      <Route path="/nearby" component={NearbyPage} />
      <Route path="/barber/:id" component={BarberProfilePage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/profile/edit" component={ProfileEditPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/barber-register" component={BarberRegisterPage} />
      <Route path="/barber-dashboard" component={BarberDashboard} />
      <Route path="/support" component={SupportCenterPage} />
      <Route path="/price-change-request" component={PriceChangeRequestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
