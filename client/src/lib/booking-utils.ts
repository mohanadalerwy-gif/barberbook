export const generateBookingId = (): string => {
  const year = new Date().getFullYear();
  const randomNum = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `SHVI-${year}-${randomNum}`;
};
