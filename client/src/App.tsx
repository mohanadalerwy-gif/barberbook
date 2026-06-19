import { useEffect } from 'react';
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from 'react-i18next';
import i18n from "@/lib/i18n";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
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
import LoginPage from "@/pages/LoginPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AdminPage from "@/pages/AdminPage";
import AdminBarbersPage from "@/pages/AdminBarbersPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminBookingsPage from "@/pages/AdminBookingsPage";
import EmployeeTasksPage from "@/pages/EmployeeTasksPage";
import HomeServiceBooking from "@/pages/HomeServiceBooking";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import AboutPage from "@/pages/AboutPage";
import PendingApprovalPage from "@/pages/PendingApprovalPage";
import { useAuth } from "@/hooks/useAuth";

function RoleRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <HomePage />;
  if (!user) return <HomePage />;

  if (user.role === 'admin') return <Redirect to="/panel-d37eb5xcwv" />;
  if (user.role === 'employee') return <Redirect to="/employee" />;
  if (user.role === 'barber') {
    if (user.barber?.isApproved === true) return <Redirect to="/barber-dashboard" />;
    return <Redirect to="/pending-approval" />;
  }

  return <HomePage />;
}

function AppShell() {
  const [location] = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const showBottomNav =
    location === '/' ||
    location === '/book' ||
    location === '/book-by-barber' ||
    location === '/nearby' ||
    location === '/profile' ||
    location === '/settings' ||
    location === '/barber-register' ||
    location === '/support' ||
    location.startsWith('/barber/');

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain safe-area-top"
      >
        <Switch>
          <Route path="/" component={RoleRedirect} />
          <Route path="/book" component={BookPage} />
          <Route path="/book-by-barber" component={BookByBarberPage} />
          <Route path="/nearby" component={NearbyPage} />
          <Route path="/barber/:id" component={BarberProfilePage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/profile/edit" component={ProfileEditPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/barber-register" component={BarberRegisterPage} />
          <Route path="/barber-dashboard" component={BarberDashboard} />
          <Route path="/pending-approval" component={PendingApprovalPage} />
          <Route path="/support" component={SupportCenterPage} />
          <Route path="/price-change-request" component={PriceChangeRequestPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/barbers" component={AdminBarbersPage} />
          <Route path="/admin/users" component={AdminUsersPage} />
          <Route path="/admin/bookings" component={AdminBookingsPage} />
          <Route path="/panel-d37eb5xcwv" component={AdminPage} />
          <Route path="/panel-d37eb5xcwv/barbers" component={AdminBarbersPage} />
          <Route path="/panel-d37eb5xcwv/users" component={AdminUsersPage} />
          <Route path="/panel-d37eb5xcwv/bookings" component={AdminBookingsPage} />
          <Route path="/my-tasks" component={EmployeeTasksPage} />
          <Route path="/employee" component={EmployeeTasksPage} />
          <Route path="/home-service" component={HomeServiceBooking} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/about" component={AboutPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppShell />
        </TooltipProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
