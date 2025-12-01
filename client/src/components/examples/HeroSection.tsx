import HeroSection from '../HeroSection';

export default function HeroSectionExample() {
  return (
    <HeroSection 
      onSearch={(location) => console.log('Searching:', location)}
      onBrowseBarbers={() => console.log('Browse barbers clicked')}
    />
  );
}
