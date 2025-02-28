import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBcAsupGNfgh1JUg2VPJ31DUVK8KNDOVjo",
  authDomain: "b2c-car-4c084.firebaseapp.com",
  projectId: "b2c-car-4c084",
  storageBucket: "b2c-car-4c084.appspot.com",
  messagingSenderId: "702189199418",
  appId: "1:702189199418:web:3d3773bf1d033b602cd503"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth, Firestore and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
  SERVICES: 'services',
  SERVICE_CATEGORIES: 'service_categories',
  APPOINTMENTS: 'appointments',
  VENDORS: 'vendors',
  FEEDBACK: 'feedback',
  OFFERS: 'offers',
  SUPPORT_TICKETS: 'support_tickets'
} as const;
