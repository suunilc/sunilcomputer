import { AppState, BusinessInfo, User } from '../types';

export const INITIAL_BUSINESS_INFO: BusinessInfo = {
  name: 'Sunshine Computer Institute And Service Center - Photo And Framing House',
  location: 'Sudhhodhan-1, Pargatinagar',
  founder: 'Sunil Sharma',
  contact: '9746370578',
  email: 'sunshinecomputer2080@gmail.com',
  logoUrl: '/sunshine-logo.svg',
  showLogoOnInvoice: true,
  showLogoInHeader: true,
  panVatNo: '304958612',
  invoiceNotice: 'Thank you for visiting Sunshine Computer Institute & Framing House!',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    username: 'Sunil',
    password: 'Sunil369@',
    name: 'Sunil Sharma (Founder)',
    role: 'admin',
    phone: '9746370578',
  },
  {
    id: 'user-2',
    username: 'staff',
    password: '1234',
    name: 'Counter Billing Staff',
    role: 'staff',
    phone: '9801234567',
  },
];

const getTodayStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_STATE: AppState = {
  currentUser: INITIAL_USERS[0],
  businessInfo: INITIAL_BUSINESS_INFO,
  users: INITIAL_USERS,
  products: [],
  suppliers: [],
  purchases: [],
  customers: [],
  sales: [],
  expenses: [],
};
