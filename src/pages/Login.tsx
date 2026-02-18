import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login();
    toast({ title: "Logged in (demo)", description: "Welcome to your dashboard." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 text-center">Log In</h1>
          <p className="text-muted-foreground text-center mb-8">Access your PFSW dashboard.</p>

          <div className="rounded-2xl border border-border bg-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                <Input required type="email" placeholder="you@example.com" className="bg-background" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
                <Input required type="password" placeholder="••••••••" className="bg-background" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full tracking-wide font-bold">Log In</Button>
            </form>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              No account? <Link to="/apply" className="text-primary hover:underline">Apply instead</Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Or <Link to="/waitlist" className="text-primary hover:underline">join the waitlist</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
