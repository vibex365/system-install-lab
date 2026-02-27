import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { PlanGate } from "@/components/PlanGate";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Upgrade from "./pages/Upgrade";

// Gated member routes
import Dashboard from "./pages/Dashboard";
import Workflows from "./pages/Workflows";
import WorkflowDetail from "./pages/WorkflowDetail";
import Engine from "./pages/Engine";
import CRM from "./pages/CRM";
import Analytics from "./pages/Analytics";
import Funnels from "./pages/Funnels";
import CalendarPage from "./pages/CalendarPage";
import Agents from "./pages/Agents";
import Library from "./pages/Library";
import Submit from "./pages/Submit";
import BoardFeed from "./pages/BoardFeed";
import PostDetail from "./pages/PostDetail";
import MagazineInside from "./pages/MagazineInside";
import ChooseCohort from "./pages/ChooseCohort";

// Public routes
import BookingPage from "./pages/BookingPage";
import IntakeFunnel from "./pages/IntakeFunnel";
import PublicFunnel from "./pages/PublicFunnel";
import DemoFunnel from "./pages/DemoFunnel";

// Lead routes
import LeadDashboard from "./pages/lead/LeadDashboard";
import LeadAttendance from "./pages/lead/LeadAttendance";

// Admin routes
import AdminOverview from "./pages/admin/AdminOverview";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminCohorts from "./pages/admin/AdminCohorts";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminCallLog from "./pages/admin/AdminCallLog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />

            {/* Plan selection (accessible to all logged-in users) */}
            <Route path="/upgrade" element={<Upgrade />} />

            {/* Dashboard is visible to all logged-in users (shows limited view for non-subscribed) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Gated member routes — require active subscription */}
            <Route path="/dashboard/workflows" element={<PlanGate><Workflows /></PlanGate>} />
            <Route path="/dashboard/workflows/:id" element={<PlanGate><WorkflowDetail /></PlanGate>} />
            <Route path="/engine" element={<PlanGate><Engine /></PlanGate>} />
            <Route path="/crm" element={<PlanGate><CRM /></PlanGate>} />
            <Route path="/analytics" element={<PlanGate><Analytics /></PlanGate>} />
            <Route path="/funnels" element={<PlanGate><Funnels /></PlanGate>} />
            <Route path="/calendar" element={<PlanGate><CalendarPage /></PlanGate>} />
            {/* Agents marketplace hidden — pivoting to workflow bundles */}
            <Route path="/library" element={<PlanGate><Library /></PlanGate>} />
            <Route path="/submit" element={<PlanGate><Submit /></PlanGate>} />
            <Route path="/magazine/inside" element={<PlanGate><MagazineInside /></PlanGate>} />
            <Route path="/choose-cohort" element={<PlanGate><ChooseCohort /></PlanGate>} />
            <Route path="/board" element={<Navigate to="/board/main" replace />} />
            <Route path="/board/:slug" element={<PlanGate><BoardFeed /></PlanGate>} />
            <Route path="/post/:id" element={<PlanGate><PostDetail /></PlanGate>} />

            {/* Public booking & funnel */}
            <Route path="/book/:slug" element={<BookingPage />} />
            <Route path="/intake-funnel" element={<IntakeFunnel />} />
            <Route path="/f/:slug" element={<PublicFunnel />} />

            {/* Lead routes */}
            <Route path="/lead/dashboard" element={<LeadDashboard />} />
            <Route path="/lead/attendance" element={<LeadAttendance />} />

            {/* Admin routes (gated by AuthGate requireChiefArchitect in AdminShell) */}
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/members" element={<AdminMembers />} />
            <Route path="/admin/cohorts" element={<AdminCohorts />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/agents" element={<AdminAgents />} />
            <Route path="/admin/marketing" element={<AdminMarketing />} />
            <Route path="/admin/calls" element={<AdminCallLog />} />

            {/* Demo funnels */}
            <Route path="/demo/:niche" element={<DemoFunnel />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
