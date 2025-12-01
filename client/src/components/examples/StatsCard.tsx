import StatsCard from '../StatsCard';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Today's Bookings"
        value={8}
        icon={Calendar}
        description="5 confirmed, 3 pending"
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
        title="Avg Rating"
        value="4.9"
        icon={TrendingUp}
        description="Based on 89 reviews"
      />
    </div>
  );
}
