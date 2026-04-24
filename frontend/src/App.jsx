import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SiteInventory from './pages/SiteInventory';
import Reservations from './pages/Reservations';
import CheckInOut from './pages/CheckInOut';
import Utilities from './pages/Utilities';
import Guests from './pages/Guests';
import Rates from './pages/Rates';
import LongTermResidents from './pages/LongTermResidents';
import Amenities from './pages/Amenities';
import AmenityBookings from './pages/AmenityBookings';
import Store from './pages/Store';
import StoreTransactions from './pages/StoreTransactions';
import Maintenance from './pages/Maintenance';
import Loyalty from './pages/Loyalty';
import Revenue from './pages/Revenue';
import Security from './pages/Security';
import MailPackages from './pages/MailPackages';
import Propane from './pages/Propane';
import Firewood from './pages/Firewood';
import DumpStation from './pages/DumpStation';
import AIDynamicPricing from './pages/AIDynamicPricing';
import AIReviewResponse from './pages/AIReviewResponse';
import AIActivityRecommendations from './pages/AIActivityRecommendations';
import AISiteMatching from './pages/AISiteMatching';
import AIMarketingContent from './pages/AIMarketingContent';
import AIMaintenancePrediction from './pages/AIMaintenancePrediction';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/sites" element={<ProtectedRoute><SiteInventory /></ProtectedRoute>} />
      <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
      <Route path="/checkinout" element={<ProtectedRoute><CheckInOut /></ProtectedRoute>} />
      <Route path="/utilities" element={<ProtectedRoute><Utilities /></ProtectedRoute>} />
      <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
      <Route path="/rates" element={<ProtectedRoute><Rates /></ProtectedRoute>} />
      <Route path="/longterm" element={<ProtectedRoute><LongTermResidents /></ProtectedRoute>} />
      <Route path="/amenities" element={<ProtectedRoute><Amenities /></ProtectedRoute>} />
      <Route path="/amenity-bookings" element={<ProtectedRoute><AmenityBookings /></ProtectedRoute>} />
      <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><StoreTransactions /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
      <Route path="/loyalty" element={<ProtectedRoute><Loyalty /></ProtectedRoute>} />
      <Route path="/revenue" element={<ProtectedRoute><Revenue /></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
      <Route path="/mail" element={<ProtectedRoute><MailPackages /></ProtectedRoute>} />
      <Route path="/propane" element={<ProtectedRoute><Propane /></ProtectedRoute>} />
      <Route path="/firewood" element={<ProtectedRoute><Firewood /></ProtectedRoute>} />
      <Route path="/dump-station" element={<ProtectedRoute><DumpStation /></ProtectedRoute>} />
      <Route path="/ai/dynamic-pricing" element={<ProtectedRoute><AIDynamicPricing /></ProtectedRoute>} />
      <Route path="/ai/review-response" element={<ProtectedRoute><AIReviewResponse /></ProtectedRoute>} />
      <Route path="/ai/activity-recommendations" element={<ProtectedRoute><AIActivityRecommendations /></ProtectedRoute>} />
      <Route path="/ai/site-matching" element={<ProtectedRoute><AISiteMatching /></ProtectedRoute>} />
      <Route path="/ai/marketing-content" element={<ProtectedRoute><AIMarketingContent /></ProtectedRoute>} />
      <Route path="/ai/maintenance-prediction" element={<ProtectedRoute><AIMaintenancePrediction /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
