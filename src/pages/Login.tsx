import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import heroBg from "@/assets/hero-bg.png";

export default function Login() {
  const { toast } = useToast();
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Logged in", description: "Welcome back." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(email, password);
      toast({ title: "Account created", description: "Check your email to confirm, then log in." });
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 min-h-screen flex">
        {/* Left — Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Access PFSW</h1>
            <p className="text-muted-foreground mb-8">Log in or create an account.</p>

            <div className="rounded-2xl border border-border bg-card p-6">
              <Tabs defaultValue="login">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="login" className="flex-1">Log In</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                      <Input required type="email" placeholder="you@example.com" className="bg-background" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
                      <Input required type="password" placeholder="••••••••" className="bg-background" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full tracking-wide font-bold" disabled={loading}>
                      {loading ? "Logging in..." : "Log In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                      <Input required type="email" placeholder="you@example.com" className="bg-background" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
                      <Input required type="password" placeholder="Min 6 characters" className="bg-background" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full tracking-wide font-bold" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No account? <Link to="/apply" className="text-primary hover:underline">Apply first</Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Or <Link to="/waitlist" className="text-primary hover:underline">join the waitlist</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right — Image with overlay */}
        <div className="hidden lg:block flex-1 relative">
          <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight text-foreground mb-4">
                People Fail.<br />
                <span className="text-primary gold-text-glow">Systems Work.</span>
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                The execution-first platform for serious builders.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
