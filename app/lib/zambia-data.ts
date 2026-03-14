// Zambia-specific data for the bus booking system

// Zambian Flag Colors
export const zambianColors = {
  green: '#2BB2A9',      // Zambian Green - Natural resources
  red: '#1A8A82',        // Zambian Red - Struggle for freedom
  black: '#000000',      // Zambian Black - Zambian people
  orange: '#659E85',     // Zambian Orange - Mineral wealth (copper)
  white: '#FFFFFF',      // White - Unity
};

// Comprehensive list of Zambian cities and towns
export const zambianCities = [
  // Capital and Major Cities
  { name: 'Lusaka', province: 'Lusaka', population: 'large' },
  { name: 'Kitwe', province: 'Copperbelt', population: 'large' },
  { name: 'Ndola', province: 'Copperbelt', population: 'large' },
  { name: 'Kabwe', province: 'Central', population: 'large' },
  { name: 'Chingola', province: 'Copperbelt', population: 'medium' },
  { name: 'Mufulira', province: 'Copperbelt', population: 'medium' },
  { name: 'Luanshya', province: 'Copperbelt', population: 'medium' },
  { name: 'Livingstone', province: 'Southern', population: 'large' },
  { name: 'Kasama', province: 'Northern', population: 'medium' },
  { name: 'Chipata', province: 'Eastern', population: 'medium' },
  
  // Provincial Capitals
  { name: 'Solwezi', province: 'North-Western', population: 'medium' },
  { name: 'Mansa', province: 'Luapula', population: 'medium' },
  { name: 'Mongu', province: 'Western', population: 'medium' },
  
  // Other Important Towns
  { name: 'Choma', province: 'Southern', population: 'medium' },
  { name: 'Mazabuka', province: 'Southern', population: 'medium' },
  { name: 'Kafue', province: 'Lusaka', population: 'medium' },
  { name: 'Kapiri Mposhi', province: 'Central', population: 'small' },
  { name: 'Chililabombwe', province: 'Copperbelt', population: 'small' },
  { name: 'Kalulushi', province: 'Copperbelt', population: 'small' },
  { name: 'Mpika', province: 'Muchinga', population: 'small' },
  { name: 'Nakonde', province: 'Muchinga', population: 'small' },
  { name: 'Mbala', province: 'Northern', population: 'small' },
  { name: 'Mpulungu', province: 'Northern', population: 'small' },
  { name: 'Kawambwa', province: 'Luapula', population: 'small' },
  { name: 'Nchelenge', province: 'Luapula', population: 'small' },
  { name: 'Mwinilunga', province: 'North-Western', population: 'small' },
  { name: 'Zambezi', province: 'North-Western', population: 'small' },
  { name: 'Kaoma', province: 'Western', population: 'small' },
  { name: 'Senanga', province: 'Western', population: 'small' },
  { name: 'Sesheke', province: 'Western', population: 'small' },
  { name: 'Kazungula', province: 'Southern', population: 'small' },
  { name: 'Kalomo', province: 'Southern', population: 'small' },
  { name: 'Namwala', province: 'Southern', population: 'small' },
  { name: 'Monze', province: 'Southern', population: 'small' },
  { name: 'Siavonga', province: 'Southern', population: 'small' },
  { name: 'Petauke', province: 'Eastern', population: 'small' },
  { name: 'Katete', province: 'Eastern', population: 'small' },
  { name: 'Lundazi', province: 'Eastern', population: 'small' },
  { name: 'Chama', province: 'Muchinga', population: 'small' },
  { name: 'Isoka', province: 'Muchinga', population: 'small' },
  { name: 'Serenje', province: 'Central', population: 'small' },
  { name: 'Mkushi', province: 'Central', population: 'small' },
  { name: 'Mumbwa', province: 'Central', population: 'small' },
];

// Get city names only for dropdowns
export const cityNames = zambianCities.map(city => city.name).sort();

// Popular routes with estimated travel times and distances
export const popularRoutes = [
  // From Lusaka
  { from: 'Lusaka', to: 'Ndola', distance: 320, duration: '5-6 hours', price: 150 },
  { from: 'Lusaka', to: 'Kitwe', distance: 340, duration: '5-6 hours', price: 180 },
  { from: 'Lusaka', to: 'Livingstone', distance: 470, duration: '6-7 hours', price: 200 },
  { from: 'Lusaka', to: 'Chipata', distance: 550, duration: '8-9 hours', price: 250 },
  { from: 'Lusaka', to: 'Solwezi', distance: 740, duration: '10-11 hours', price: 300 },
  { from: 'Lusaka', to: 'Kasama', distance: 850, duration: '12-13 hours', price: 350 },
  { from: 'Lusaka', to: 'Mongu', distance: 580, duration: '8-9 hours', price: 280 },
  { from: 'Lusaka', to: 'Kabwe', distance: 140, duration: '2-3 hours', price: 80 },
  { from: 'Lusaka', to: 'Choma', distance: 280, duration: '4-5 hours', price: 120 },
  { from: 'Lusaka', to: 'Mazabuka', distance: 130, duration: '2 hours', price: 70 },
  
  // Copperbelt Routes
  { from: 'Ndola', to: 'Kitwe', distance: 50, duration: '1 hour', price: 50 },
  { from: 'Ndola', to: 'Chingola', distance: 80, duration: '1.5 hours', price: 60 },
  { from: 'Ndola', to: 'Mufulira', distance: 60, duration: '1 hour', price: 50 },
  { from: 'Kitwe', to: 'Chingola', distance: 45, duration: '1 hour', price: 50 },
  { from: 'Kitwe', to: 'Luanshya', distance: 35, duration: '45 minutes', price: 40 },
  
  // Southern Province Routes
  { from: 'Livingstone', to: 'Choma', distance: 200, duration: '3 hours', price: 100 },
  { from: 'Livingstone', to: 'Kazungula', distance: 70, duration: '1.5 hours', price: 50 },
  { from: 'Livingstone', to: 'Sesheke', distance: 200, duration: '3-4 hours', price: 120 },
  { from: 'Choma', to: 'Monze', distance: 60, duration: '1 hour', price: 50 },
  
  // Eastern Province Routes
  { from: 'Chipata', to: 'Petauke', distance: 180, duration: '3 hours', price: 90 },
  { from: 'Chipata', to: 'Lundazi', distance: 120, duration: '2 hours', price: 70 },
  
  // Northern Routes
  { from: 'Kasama', to: 'Mbala', distance: 150, duration: '2-3 hours', price: 80 },
  { from: 'Kasama', to: 'Mpika', distance: 220, duration: '3-4 hours', price: 110 },
  
  // Cross-country Routes
  { from: 'Ndola', to: 'Livingstone', distance: 650, duration: '9-10 hours', price: 280 },
  { from: 'Kitwe', to: 'Chipata', distance: 720, duration: '10-11 hours', price: 320 },
  { from: 'Solwezi', to: 'Mongu', distance: 450, duration: '7-8 hours', price: 220 },
];

// Bus amenities
export const busAmenities = [
  { id: 'ac', name: 'Air Conditioning', icon: '❄️' },
  { id: 'wifi', name: 'WiFi', icon: '📶' },
  { id: 'charging', name: 'Phone Charging', icon: '🔌' },
  { id: 'tv', name: 'TV/Entertainment', icon: '📺' },
  { id: 'reclining', name: 'Reclining Seats', icon: '💺' },
  { id: 'toilet', name: 'Onboard Toilet', icon: '🚻' },
  { id: 'refreshments', name: 'Refreshments', icon: '☕' },
  { id: 'luggage', name: 'Luggage Space', icon: '🧳' },
];

// Payment methods available in Zambia
export const paymentMethods = [
  { id: 'mtn', name: 'MTN Mobile Money', icon: '📱', type: 'mobile_money' },
  { id: 'airtel', name: 'Airtel Money', icon: '📱', type: 'mobile_money' },
  { id: 'zamtel', name: 'Zamtel Kwacha', icon: '📱', type: 'mobile_money' },
  { id: 'visa', name: 'Visa Card', icon: '💳', type: 'card' },
  { id: 'mastercard', name: 'Mastercard', icon: '💳', type: 'card' },
  { id: 'cash', name: 'Cash on Pickup', icon: '💵', type: 'cash' },
];

// Zambian provinces
export const provinces = [
  'Central',
  'Copperbelt',
  'Eastern',
  'Luapula',
  'Lusaka',
  'Muchinga',
  'Northern',
  'North-Western',
  'Southern',
  'Western',
];

// Helper function to get cities by province
export function getCitiesByProvince(province: string) {
  return zambianCities.filter(city => city.province === province);
}

// Helper function to find route info
export function getRouteInfo(from: string, to: string) {
  return popularRoutes.find(
    route => route.from === from && route.to === to
  ) || popularRoutes.find(
    route => route.from === to && route.to === from
  );
}

// Helper function to calculate estimated price based on distance
export function estimatePrice(distance: number): number {
  // Base price: K0.50 per km
  const basePrice = distance * 0.5;
  // Round to nearest 10
  return Math.round(basePrice / 10) * 10;
}