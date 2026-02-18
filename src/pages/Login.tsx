import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Login() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container max-w-md text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Log In</h1>
          <p className="text-muted-foreground">Member login coming soon.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
