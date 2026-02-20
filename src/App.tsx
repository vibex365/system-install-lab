import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import ApplicationUnderReview from "./pages/ApplicationUnderReview";
import Waitlist from "./pages/Waitlist";
import Login from "./pages/Login";
import Status from "./pages/Status";
import Accepted from "./pages/Accepted";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Engine from "./pages/Engine";
import Library from "./pages/Library";
import Submit from "./pages/Submit";
import MagazineInside from "./pages/MagazineInside";
import ChooseCohort from "./pages/ChooseCohort";
import BoardFeed from "./pages/BoardFeed";
import PostDetail from "./pages/PostDetail";
import LeadDashboard from "./pages/lead/LeadDashboard";
import LeadAttendance from "./pages/lead/LeadAttendance";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminCohorts from "./pages/admin/AdminCohorts";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminModLog from "./pages/admin/AdminModLog";
import AdminAgents from "./pages/admin/AdminAgents";
import Agents from "./pages/Agents";
import Upgrade from "./pages/Upgrade";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/application-under-review" element={<ApplicationUnderReview />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/status" element={<Status />} />
            <Route path="/accepted" element={<Accepted />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />

            <Route path="/upgrade" element={<Upgrade />} />

            {/* Member routes */}
            <Route path="/engine" element={<Engine />} />
            <Route path="/library" element={<Library />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/magazine/inside" element={<MagazineInside />} />
            <Route path="/choose-cohort" element={<ChooseCohort />} />

            {/* Legacy board routes (still functional) */}
            <Route path="/board" element={<Navigate to="/board/main" replace />} />
            <Route path="/board/:slug" element={<BoardFeed />} />
            <Route path="/post/:id" element={<PostDetail />} />

            {/* Lead routes */}
            <Route path="/lead/dashboard" element={<LeadDashboard />} />
            <Route path="/lead/attendance" element={<LeadAttendance />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/members" element={<AdminMembers />} />
            <Route path="/admin/cohorts" element={<AdminCohorts />} />
            <Route path="/admin/submissions" element={<AdminSubmissions />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/modlog" element={<AdminModLog />} />
            <Route path="/admin/agents" element={<AdminAgents />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
