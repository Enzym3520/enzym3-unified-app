import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { RoleRouter } from '@/components/RoleRouter';
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
const queryClient = new QueryClient();
function JoinByCodeStub() { return <div className="p-8 text-muted-foreground">Loading…</div>; }
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <KeyboardShortcutsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RoleRouter />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/join/:code" element={<JoinByCodeStub />} />
              <Route path="/app" element={<RequireRole role="client"><ClientShell /></RequireRole>}>
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
              <Route path="/staff/*" element={<RequireRole role="admin"><StaffShell /></RequireRole>} />
              <Route path="/vendor/*" element={<RequireRole role="vendor"><VendorShell /></RequireRole>} />
            </Routes>
          </BrowserRouter>
        </KeyboardShortcutsProvider>
      </CartProvider>
      <Toaster richColors />
    </QueryClientProvider>
  );
}
