import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatsCard from '@/components/StatsCard';
import AppointmentCard from '@/components/AppointmentCard';
import WorkingHoursEditor from '@/components/WorkingHoursEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  Settings, 
  LogOut,
  Scissors,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { mockBookings, mockBarbers, mockWorkingHours } from '@/lib/mock-data';
import type { User, Booking } from '@/lib/types';

interface BarberDashboardProps {
  user?: User | null;
  onLogout?: () => void;
}

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { title: 'Schedule', icon: Calendar, id: 'schedule' },
  { title: 'Working Hours', icon: Clock, id: 'hours' },
  { title: 'Settings', icon: Settings, id: 'settings' },
];

export default function BarberDashboard({ user, onLogout }: BarberDashboardProps) {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [bookings, setBookings] = useState(mockBookings);

  const barber = mockBarbers[0];

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const todaysBookings = bookings.filter(b => b.status === 'confirmed');

  const handleAccept = (booking: Booking) => {
    setBookings(prev => 
      prev.map(b => b.id === booking.id ? { ...b, status: 'confirmed' as const } : b)
    );
    console.log('Accepted booking:', booking.id);
  };

  const handleDecline = (booking: Booking) => {
    setBookings(prev => 
      prev.map(b => b.id === booking.id ? { ...b, status: 'declined' as const } : b)
    );
    console.log('Declined booking:', booking.id);
  };

  const handleComplete = (booking: Booking) => {
    setBookings(prev => 
      prev.map(b => b.id === booking.id ? { ...b, status: 'completed' as const } : b)
    );
    console.log('Completed booking:', booking.id);
  };

  if (!user || user.role !== 'barber') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Scissors className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Barber Access Only</h1>
          <p className="text-muted-foreground mb-4">
            You need to be logged in as a barber to access this dashboard
          </p>
          <Button onClick={() => navigate('/')} data-testid="button-go-home">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={barber.avatar} alt={barber.name} />
                <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{barber.name}</p>
                <p className="text-xs text-muted-foreground truncate">{barber.shopName}</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        data-testid={`menu-${item.id}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onLogout} data-testid="menu-logout">
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-semibold">
                {menuItems.find(m => m.id === activeSection)?.title}
              </h1>
            </div>
          </header>

          <div className="p-6">
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard
                    title="Today's Bookings"
                    value={todaysBookings.length}
                    icon={Calendar}
                    description={`${pendingBookings.length} pending`}
                  />
                  <StatsCard
                    title="Total Clients"
                    value={127}
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                  />
                  <StatsCard
                    title="This Week"
                    value="$1,240"
                    icon={DollarSign}
                    trend={{ value: 8, isPositive: true }}
                  />
                  <StatsCard
                    title="Rating"
                    value={barber.rating}
                    icon={TrendingUp}
                    description={`${barber.reviewCount} reviews`}
                  />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Pending Requests</h2>
                    {pendingBookings.length > 0 ? (
                      <div className="space-y-3">
                        {pendingBookings.map((booking) => (
                          <AppointmentCard
                            key={booking.id}
                            booking={booking}
                            userRole="barber"
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                        No pending requests
                      </p>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
                    {todaysBookings.length > 0 ? (
                      <div className="space-y-3">
                        {todaysBookings.map((booking) => (
                          <AppointmentCard
                            key={booking.id}
                            booking={booking}
                            userRole="barber"
                            onComplete={handleComplete}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                        No appointments today
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'schedule' && (
              <div>
                <Tabs defaultValue="day" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="day">Today</TabsTrigger>
                    <TabsTrigger value="week">This Week</TabsTrigger>
                    <TabsTrigger value="all">All Bookings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="day">
                    <div className="space-y-3">
                      {bookings.filter(b => b.status !== 'declined' && b.status !== 'cancelled').map((booking) => (
                        <AppointmentCard
                          key={booking.id}
                          booking={booking}
                          userRole="barber"
                          onAccept={handleAccept}
                          onDecline={handleDecline}
                          onComplete={handleComplete}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="week">
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <AppointmentCard
                          key={booking.id}
                          booking={booking}
                          userRole="barber"
                          onAccept={handleAccept}
                          onDecline={handleDecline}
                          onComplete={handleComplete}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="all">
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <AppointmentCard
                          key={booking.id}
                          booking={booking}
                          userRole="barber"
                          onAccept={handleAccept}
                          onDecline={handleDecline}
                          onComplete={handleComplete}
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeSection === 'hours' && (
              <div className="max-w-md">
                <WorkingHoursEditor
                  hours={mockWorkingHours}
                  onSave={(hours) => console.log('Saving hours:', hours)}
                />
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="max-w-md space-y-4">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-4">Profile Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Profile settings and account management coming soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
