import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import ApplicationUnderReview from "./pages/ApplicationUnderReview";
import Waitlist from "./pages/Waitlist";
import Login from "./pages/Login";
import Status from "./pages/Status";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
