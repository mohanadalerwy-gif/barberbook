interface BarberLocation {
  lat: number;
  lng: number;
  name: string;
}

export const generateMapsLink = (barber: BarberLocation): string => {
  const query = encodeURIComponent(`${barber.name} ${barber.lat},${barber.lng}`);
  return `https://maps.google.com/?q=${barber.lat},${barber.lng}`;
};

export const openMapsApp = (barber: BarberLocation): void => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isMobile) {
    if (isIOS) {
      const url = `maps://maps.apple.com/?daddr=${barber.lat},${barber.lng}&q=${encodeURIComponent(barber.name)}`;
      window.location.href = url;
      setTimeout(() => {
        window.location.href = generateMapsLink(barber);
      }, 1000);
    } else {
      const url = `geo:${barber.lat},${barber.lng}?q=${encodeURIComponent(barber.name)}`;
      window.location.href = url;
      setTimeout(() => {
        window.location.href = generateMapsLink(barber);
      }, 1000);
    }
  } else {
    window.open(generateMapsLink(barber), '_blank');
  }
};
