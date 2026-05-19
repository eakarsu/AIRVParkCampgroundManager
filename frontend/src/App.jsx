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
import AIOccupancyForecast from './pages/AIOccupancyForecast';
import AIUpsellRecommendations from './pages/AIUpsellRecommendations';
import AICancellationRisk from './pages/AICancellationRisk';
import AIGuestSegmentation from './pages/AIGuestSegmentation';
import AIStaffScheduling from './pages/AIStaffScheduling';
import AIAmenityDemandPrediction from './pages/AIAmenityDemandPrediction';

// === Batch 07 Gaps & Frontend Mounts ===
import CfDynamicPricingByOccupancyDemandSeason from './pages/CfDynamicPricingByOccupancyDemandSeason';
import CfGuestLifetimeValueMaximization from './pages/CfGuestLifetimeValueMaximization';
import CfOccupancyForecastingRecommendations from './pages/CfOccupancyForecastingRecommendations';
import CfMaintenanceRoutingOptimization from './pages/CfMaintenanceRoutingOptimization';
import CfAmenityDemandForecasting from './pages/CfAmenityDemandForecasting';
import CfReviewresponsiveMarketing from './pages/CfReviewresponsiveMarketing';
import GapNoCancellationriskNoshowPrediction from './pages/GapNoCancellationriskNoshowPrediction';
import GapNoUpsellrecommendations from './pages/GapNoUpsellrecommendations';
import GapNoGuestsegmentationClusterByBehavior from './pages/GapNoGuestsegmentationClusterByBehavior';
import GapNoOccupancyforecast from './pages/GapNoOccupancyforecast';
import GapNoStaffschedulingOptimization from './pages/GapNoStaffschedulingOptimization';
import GapNoAmenitydemandprediction from './pages/GapNoAmenitydemandprediction';
import GapNoReviewresponseAiSisterProduct from './pages/GapNoReviewresponseAiSisterProduct';
import GapNoOnlineBookingWidgetPublicApi from './pages/GapNoOnlineBookingWidgetPublicApi';
import GapNoAutomatedGuestCommunicationsConfirmati from './pages/GapNoAutomatedGuestCommunicationsConfirmati';
import GapNoPaymentProcessorIntegrationStripeSqua from './pages/GapNoPaymentProcessorIntegrationStripeSqua';
import GapLimitedHousekeepingmaintenanceTicketingOn from './pages/GapLimitedHousekeepingmaintenanceTicketingOn';
import GapNoNotificationssmsSystem from './pages/GapNoNotificationssmsSystem';
import GapNoPmsIntegrationOtherParkSystems from './pages/GapNoPmsIntegrationOtherParkSystems';
import GapNoReportingExportBeyondRevenueRoute from './pages/GapNoReportingExportBeyondRevenueRoute';
// === End Batch 07 ===
import CustomViewsPage from './pages/CustomViewsPage';


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
      <Route path="/ai/occupancy-forecast" element={<ProtectedRoute><AIOccupancyForecast /></ProtectedRoute>} />
      <Route path="/ai/upsell-recommendations" element={<ProtectedRoute><AIUpsellRecommendations /></ProtectedRoute>} />
      <Route path="/ai/cancellation-risk" element={<ProtectedRoute><AICancellationRisk /></ProtectedRoute>} />
      <Route path="/ai/guest-segmentation" element={<ProtectedRoute><AIGuestSegmentation /></ProtectedRoute>} />
      <Route path="/ai/staff-scheduling" element={<ProtectedRoute><AIStaffScheduling /></ProtectedRoute>} />
      <Route path="/ai/amenity-demand-prediction" element={<ProtectedRoute><AIAmenityDemandPrediction /></ProtectedRoute>} />
          // === Batch 07 Gaps & Frontend Mounts ===
          <Route path='/cf-dynamic-pricing-by-occupancy-demand-season' element={<CfDynamicPricingByOccupancyDemandSeason />} />
          <Route path='/cf-guest-lifetime-value-maximization' element={<CfGuestLifetimeValueMaximization />} />
          <Route path='/cf-occupancy-forecasting-recommendations' element={<CfOccupancyForecastingRecommendations />} />
          <Route path='/cf-maintenance-routing-optimization' element={<CfMaintenanceRoutingOptimization />} />
          <Route path='/cf-amenity-demand-forecasting' element={<CfAmenityDemandForecasting />} />
          <Route path='/cf-reviewresponsive-marketing' element={<CfReviewresponsiveMarketing />} />
          <Route path='/gap-no-cancellationrisk-noshow-prediction' element={<GapNoCancellationriskNoshowPrediction />} />
          <Route path='/gap-no-upsellrecommendations' element={<GapNoUpsellrecommendations />} />
          <Route path='/gap-no-guestsegmentation-cluster-by-behavior' element={<GapNoGuestsegmentationClusterByBehavior />} />
          <Route path='/gap-no-occupancyforecast' element={<GapNoOccupancyforecast />} />
          <Route path='/gap-no-staffscheduling-optimization' element={<GapNoStaffschedulingOptimization />} />
          <Route path='/gap-no-amenitydemandprediction' element={<GapNoAmenitydemandprediction />} />
          <Route path='/gap-no-reviewresponse-ai-sister-product' element={<GapNoReviewresponseAiSisterProduct />} />
          <Route path='/gap-no-online-booking-widget-public-api' element={<GapNoOnlineBookingWidgetPublicApi />} />
          <Route path='/gap-no-automated-guest-communications-confirmati' element={<GapNoAutomatedGuestCommunicationsConfirmati />} />
          <Route path='/gap-no-payment-processor-integration-stripe-squa' element={<GapNoPaymentProcessorIntegrationStripeSqua />} />
          <Route path='/gap-limited-housekeepingmaintenance-ticketing-on' element={<GapLimitedHousekeepingmaintenanceTicketingOn />} />
          <Route path='/gap-no-notificationssms-system' element={<GapNoNotificationssmsSystem />} />
          <Route path='/gap-no-pms-integration-other-park-systems' element={<GapNoPmsIntegrationOtherParkSystems />} />
          <Route path='/gap-no-reporting-export-beyond-revenue-route' element={<GapNoReportingExportBeyondRevenueRoute />} />
          // === End Batch 07 ===
      <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
