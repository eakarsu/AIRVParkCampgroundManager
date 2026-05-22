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
import GapFeaturesIndex from './pages/GapFeaturesIndex';


import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Routes>
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

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
      {/* === Batch 07 Gaps & Frontend Mounts === */}
      <Route path='/cf-dynamic-pricing-by-occupancy-demand-season' element={<ProtectedRoute><CfDynamicPricingByOccupancyDemandSeason /></ProtectedRoute>} />
      <Route path='/cf-guest-lifetime-value-maximization' element={<ProtectedRoute><CfGuestLifetimeValueMaximization /></ProtectedRoute>} />
      <Route path='/cf-occupancy-forecasting-recommendations' element={<ProtectedRoute><CfOccupancyForecastingRecommendations /></ProtectedRoute>} />
      <Route path='/cf-maintenance-routing-optimization' element={<ProtectedRoute><CfMaintenanceRoutingOptimization /></ProtectedRoute>} />
      <Route path='/cf-amenity-demand-forecasting' element={<ProtectedRoute><CfAmenityDemandForecasting /></ProtectedRoute>} />
      <Route path='/cf-reviewresponsive-marketing' element={<ProtectedRoute><CfReviewresponsiveMarketing /></ProtectedRoute>} />
      <Route path='/gap-no-cancellationrisk-noshow-prediction' element={<ProtectedRoute><GapNoCancellationriskNoshowPrediction /></ProtectedRoute>} />
      <Route path='/gap-no-upsellrecommendations' element={<ProtectedRoute><GapNoUpsellrecommendations /></ProtectedRoute>} />
      <Route path='/gap-no-guestsegmentation-cluster-by-behavior' element={<ProtectedRoute><GapNoGuestsegmentationClusterByBehavior /></ProtectedRoute>} />
      <Route path='/gap-no-occupancyforecast' element={<ProtectedRoute><GapNoOccupancyforecast /></ProtectedRoute>} />
      <Route path='/gap-no-staffscheduling-optimization' element={<ProtectedRoute><GapNoStaffschedulingOptimization /></ProtectedRoute>} />
      <Route path='/gap-no-amenitydemandprediction' element={<ProtectedRoute><GapNoAmenitydemandprediction /></ProtectedRoute>} />
      <Route path='/gap-no-reviewresponse-ai-sister-product' element={<ProtectedRoute><GapNoReviewresponseAiSisterProduct /></ProtectedRoute>} />
      <Route path='/gap-no-online-booking-widget-public-api' element={<ProtectedRoute><GapNoOnlineBookingWidgetPublicApi /></ProtectedRoute>} />
      <Route path='/gap-no-automated-guest-communications-confirmati' element={<ProtectedRoute><GapNoAutomatedGuestCommunicationsConfirmati /></ProtectedRoute>} />
      <Route path='/gap-no-payment-processor-integration-stripe-squa' element={<ProtectedRoute><GapNoPaymentProcessorIntegrationStripeSqua /></ProtectedRoute>} />
      <Route path='/gap-limited-housekeepingmaintenance-ticketing-on' element={<ProtectedRoute><GapLimitedHousekeepingmaintenanceTicketingOn /></ProtectedRoute>} />
      <Route path='/gap-no-notificationssms-system' element={<ProtectedRoute><GapNoNotificationssmsSystem /></ProtectedRoute>} />
      <Route path='/gap-no-pms-integration-other-park-systems' element={<ProtectedRoute><GapNoPmsIntegrationOtherParkSystems /></ProtectedRoute>} />
      <Route path='/gap-no-reporting-export-beyond-revenue-route' element={<ProtectedRoute><GapNoReportingExportBeyondRevenueRoute /></ProtectedRoute>} />
      {/* === End Batch 07 === */}
      <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
      <Route path="/gap-features" element={<ProtectedRoute><GapFeaturesIndex /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
