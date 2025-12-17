export const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', phone: '+55', currency: 'BRL', currencySymbol: 'R$' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', phone: '+1', currency: 'USD', currencySymbol: '$' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵', phone: '+81', currency: 'JPY', currencySymbol: '¥' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', phone: '+351', currency: 'EUR', currencySymbol: '€' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸', phone: '+34', currency: 'EUR', currencySymbol: '€' },
  { code: 'FR', name: 'França', flag: '🇫🇷', phone: '+33', currency: 'EUR', currencySymbol: '€' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪', phone: '+49', currency: 'EUR', currencySymbol: '€' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹', phone: '+39', currency: 'EUR', currencySymbol: '€' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', phone: '+44', currency: 'GBP', currencySymbol: '£' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', phone: '+1', currency: 'CAD', currencySymbol: 'C$' },
  { code: 'AU', name: 'Austrália', flag: '🇦🇺', phone: '+61', currency: 'AUD', currencySymbol: 'A$' },
  { code: 'MX', name: 'México', flag: '🇲🇽', phone: '+52', currency: 'MXN', currencySymbol: 'MX$' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', phone: '+54', currency: 'ARS', currencySymbol: 'AR$' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', phone: '+56', currency: 'CLP', currencySymbol: 'CL$' },
  { code: 'CO', name: 'Colômbia', flag: '🇨🇴', phone: '+57', currency: 'COP', currencySymbol: 'CO$' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', phone: '+51', currency: 'PEN', currencySymbol: 'S/' },
  { code: 'CH', name: 'Suíça', flag: '🇨🇭', phone: '+41', currency: 'CHF', currencySymbol: 'CHF' },
  { code: 'CN', name: 'China', flag: '🇨🇳', phone: '+86', currency: 'CNY', currencySymbol: '¥' },
  { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷', phone: '+82', currency: 'KRW', currencySymbol: '₩' },
  { code: 'IN', name: 'Índia', flag: '🇮🇳', phone: '+91', currency: 'INR', currencySymbol: '₹' },
];

export const CURRENCIES = [
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Iene Japonês', symbol: '¥' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
  { code: 'CAD', name: 'Dólar Canadense', symbol: 'C$' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$' },
  { code: 'CHF', name: 'Franco Suíço', symbol: 'CHF' },
];

export const getCountryByCode = (code) => COUNTRIES.find(c => c.code === code);
export const getCurrencyByCode = (code) => CURRENCIES.find(c => c.code === code);
