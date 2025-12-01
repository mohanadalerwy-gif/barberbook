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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Calendar,
  Settings, 
  LogOut,
  Scissors,
  Plus,
  Search,
  Trash2,
  Edit,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { mockBookings, mockBarbers, mockBarberShops } from '@/lib/mock-data';
import type { User, BarberShop } from '@/lib/types';

interface AdminDashboardProps {
  user?: User | null;
  onLogout?: () => void;
}

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { title: 'Barber Shops', icon: Store, id: 'shops' },
  { title: 'Users', icon: Users, id: 'users' },
  { title: 'Bookings', icon: Calendar, id: 'bookings' },
  { title: 'Settings', icon: Settings, id: 'settings' },
];

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [shops, setShops] = useState(mockBarberShops);
  const [searchQuery, setSearchQuery] = useState('');
  const [addShopOpen, setAddShopOpen] = useState(false);
  const [newShop, setNewShop] = useState({ name: '', address: '', phone: '' });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Scissors className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Only</h1>
          <p className="text-muted-foreground mb-4">
            You need admin privileges to access this dashboard
          </p>
          <Button onClick={() => navigate('/')} data-testid="button-go-home">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleAddShop = () => {
    if (newShop.name && newShop.address) {
      const shop: BarberShop = {
        id: (shops.length + 1).toString(),
        ...newShop,
      };
      setShops([...shops, shop]);
      setNewShop({ name: '', address: '', phone: '' });
      setAddShopOpen(false);
      console.log('Added shop:', shop);
    }
  };

  const handleDeleteShop = (id: string) => {
    setShops(shops.filter(s => s.id !== id));
    console.log('Deleted shop:', id);
  };

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-semibold">Admin Panel</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        data-testid={`admin-menu-${item.id}`}
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
                    <SidebarMenuButton onClick={onLogout} data-testid="admin-menu-logout">
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
              <SidebarTrigger data-testid="admin-sidebar-toggle" />
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
                    title="Total Bookings"
                    value={mockBookings.length}
                    icon={Calendar}
                    trend={{ value: 15, isPositive: true }}
                  />
                  <StatsCard
                    title="Active Barbers"
                    value={mockBarbers.length}
                    icon={Users}
                  />
                  <StatsCard
                    title="Barber Shops"
                    value={shops.length}
                    icon={Store}
                  />
                  <StatsCard
                    title="Total Revenue"
                    value="$12,450"
                    icon={DollarSign}
                    trend={{ value: 22, isPositive: true }}
                  />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Barber</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockBookings.slice(0, 5).map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>{booking.customerName}</TableCell>
                              <TableCell>{booking.barberName}</TableCell>
                              <TableCell>
                                <StatusBadge status={booking.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Barbers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Reviews</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockBarbers.map((barber) => (
                            <TableRow key={barber.id}>
                              <TableCell className="font-medium">{barber.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  {barber.rating}
                                </div>
                              </TableCell>
                              <TableCell>{barber.reviewCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeSection === 'shops' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search shops..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-shops"
                    />
                  </div>
                  <Button onClick={() => setAddShopOpen(true)} data-testid="button-add-shop">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shop
                  </Button>
                </div>

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShops.map((shop) => (
                        <TableRow key={shop.id}>
                          <TableCell className="font-medium">{shop.name}</TableCell>
                          <TableCell>{shop.address}</TableCell>
                          <TableCell>{shop.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                data-testid={`button-edit-shop-${shop.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteShop(shop.id)}
                                data-testid={`button-delete-shop-${shop.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

                <Dialog open={addShopOpen} onOpenChange={setAddShopOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Barber Shop</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Shop Name</Label>
                        <Input
                          value={newShop.name}
                          onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                          placeholder="Enter shop name"
                          data-testid="input-shop-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={newShop.address}
                          onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                          placeholder="Enter address"
                          data-testid="input-shop-address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={newShop.phone}
                          onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                          placeholder="Enter phone number"
                          data-testid="input-shop-phone"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddShopOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddShop} data-testid="button-save-shop">
                        Add Shop
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {activeSection === 'users' && (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBarbers.map((barber) => (
                      <TableRow key={barber.id}>
                        <TableCell className="font-medium">{barber.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Barber</Badge>
                        </TableCell>
                        <TableCell>{barber.shopName}</TableCell>
                        <TableCell>{barber.rating}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {activeSection === 'bookings' && (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Barber</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.customerName}</TableCell>
                        <TableCell>{booking.barberName}</TableCell>
                        <TableCell>{booking.serviceName}</TableCell>
                        <TableCell>{booking.date} {booking.time}</TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status} />
                        </TableCell>
                        <TableCell>${booking.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {activeSection === 'settings' && (
              <div className="max-w-md">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      System configuration and settings coming soon.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
