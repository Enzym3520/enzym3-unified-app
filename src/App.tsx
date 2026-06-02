import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { RoleRouter } from '@/components/RoleRouter';
import HomePage from '@/pages/HomePage';
import { RequireRole } from '@/components/RequireRole';
import { ClientShell } from '@/layouts/ClientShell';
import { StaffShell } from '@/layouts/StaffShell';
import { VendorShell } from '@/layouts/VendorShell';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/client/Dashboard';
import VibeSheet from '@/pages/client/VibeSheet';
import Contract from '@/pages/client/Contract';
import Upgrades from '@/pages/client/Upgrades';
import Schedule from '@/pages/client/Schedule';
import Meeting from '@/pages/client/Meeting';
import Uploads from '@/pages/client/Uploads';
import Messages from '@/pages/client/Messages';
import Review from '@/pages/client/Review';
import Settings from '@/pages/client/Settings';
import { CartProvider } from '@/contexts/CartContext';
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext';
import { PortalTourProvider } from '@/contexts/PortalTourContext';
import { CoordinatorDashboard } from '@/pages/staff/CoordinatorDashboard';
import EventNotificationForm from '@/pages/staff/EventNotificationForm';
import NotificationHistory from '@/pages/staff/NotificationHistory';
import NotificationsPage from '@/pages/staff/NotificationsPage';
import RemindersPage from '@/pages/staff/RemindersPage';
import CalendarPage from '@/pages/staff/CalendarPage';
import ComprehensiveFormPage from '@/pages/staff/ComprehensiveFormPage';
import ContactsPage from '@/pages/staff/ContactsPage';
import EventDetailPage from '@/pages/staff/EventDetailPage';
import MessagesPage from '@/pages/staff/MessagesPage';
import VendorManagement from '@/pages/staff/VendorManagement';
import VendorInvites from '@/pages/staff/VendorInvites';
import SubmissionsDashboard from '@/pages/staff/SubmissionsDashboard';
import SettingsPage from '@/pages/staff/SettingsPage';
import UpgradesManagement from '@/pages/staff/UpgradesManagement';
import AdminDashboard from '@/pages/staff/AdminDashboard';
import ReportingDashboard from '@/pages/staff/ReportingDashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import VendorDashboard from '@/pages/vendor/DashboardPage';
import VendorCalendar from '@/pages/vendor/CalendarPage';
import VendorMeetings from '@/pages/vendor/MeetingsPage';
import VendorMessages from '@/pages/vendor/MessagesPage';
import VendorNotifications from '@/pages/vendor/NotificationsPage';
import VendorProfile from '@/pages/vendor/ProfilePage';
import VendorAvailability from '@/pages/vendor/AvailabilityPage';
import VendorClients from '@/pages/vendor/ClientsPage';
import VendorServices from '@/pages/vendor/ServicesPage';
import VendorEarnings from '@/pages/vendor/EarningsPage';
import VendorDocuments from '@/pages/vendor/DocumentsPage';
import VendorBookingRequests from '@/pages/vendor/BookingRequestsPage';
import VendorNewBooking from '@/pages/vendor/NewBookingPage';
import VendorContracts from '@/pages/vendor/ContractsPage';
import VendorEventHistory from '@/pages/vendor/EventHistoryPage';
import VendorEmailTemplate from '@/pages/vendor/EmailTemplatePage';
import VendorMyPage from '@/pages/vendor/MyPagePage';
import PublicVendorPage from '@/pages/vendor/PublicVendorPage';
import PublicSignPage from '@/pages/vendor/PublicSignPage';
import JoinByCode from '@/pages/JoinByCode';

const queryClient = new QueryClient();
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <CartProvider>
          <KeyboardShortcutsProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/join/:code" element={<JoinByCode />} />
                <Route path="/app" element={<RequireRole role="client"><PortalTourProvider><ClientShell /></PortalTourProvider></RequireRole>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="vibe-sheet" element={<VibeSheet />} />
                  <Route path="contract" element={<Contract />} />
                  <Route path="upgrades" element={<Upgrades />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="meeting" element={<Meeting />} />
                  <Route path="uploads" element={<Uploads />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="review" element={<Review />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="/staff" element={<RequireRole role="admin"><StaffShell /></RequireRole>}>
                  <Route index element={<Navigate to="coordinator-dashboard" replace />} />
                  <Route path="coordinator-dashboard" element={<CoordinatorDashboard />} />
                  <Route path="event-notification" element={<EventNotificationForm />} />
                  <Route path="event-notification/:stepParam" element={<EventNotificationForm />} />
                  <Route path="notification-history" element={<NotificationHistory />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="reminders" element={<RemindersPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="comprehensive-form" element={<ComprehensiveFormPage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="event/:id" element={<EventDetailPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="vendor-management" element={<VendorManagement />} />
                  <Route path="vendor-invites" element={<VendorInvites />} />
                  <Route path="submissions" element={<SubmissionsDashboard />} />
                  <Route path="upgrades" element={<UpgradesManagement />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="admin-dashboard" element={<AdminDashboard />} />
                  <Route path="reporting" element={<ReportingDashboard />} />
                </Route>
                <Route path="/v/:handle" element={<PublicVendorPage />} />
                <Route path="/sign/:id" element={<PublicSignPage />} />
                <Route path="/vendor" element={
                  <AuthProvider>
                    <RequireRole role="vendor"><VendorShell /></RequireRole>
                  </AuthProvider>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<VendorDashboard />} />
                  <Route path="calendar" element={<VendorCalendar />} />
                  <Route path="meetings" element={<VendorMeetings />} />
                  <Route path="messages" element={<VendorMessages />} />
                  <Route path="notifications" element={<VendorNotifications />} />
                  <Route path="profile" element={<VendorProfile />} />
                  <Route path="availability" element={<VendorAvailability />} />
                  <Route path="clients" element={<VendorClients />} />
                  <Route path="services" element={<VendorServices />} />
                  <Route path="earnings" element={<VendorEarnings />} />
                  <Route path="documents" element={<VendorDocuments />} />
                  <Route path="booking-requests" element={<VendorBookingRequests />} />
                  <Route path="new-booking" element={<VendorNewBooking />} />
                  <Route path="contracts" element={<VendorContracts />} />
                  <Route path="event-history" element={<VendorEventHistory />} />
                  <Route path="email-template" element={<VendorEmailTemplate />} />
                  <Route path="my-page" element={<VendorMyPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </KeyboardShortcutsProvider>
        </CartProvider>
      </ThemeProvider>
      <Toaster richColors />
    </QueryClientProvider>
  );
}
