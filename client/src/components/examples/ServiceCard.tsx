import { useState } from 'react';
import ServiceCard from '../ServiceCard';
import { mockServices } from '@/lib/mock-data';

export default function ServiceCardExample() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="max-w-lg space-y-4">
      {mockServices.map((service) => (
        <ServiceCard 
          key={service.id}
          service={service}
          selected={selectedId === service.id}
          onSelect={(s) => setSelectedId(s.id)}
        />
      ))}
    </div>
  );
}
