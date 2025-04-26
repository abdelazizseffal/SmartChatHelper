import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  
  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Redirect to="/dashboard" />;
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
            Welcome to PipeNest
          </h1>
          <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-300">
            Pipe cutting optimization made simple
          </p>
        </div>
      </main>
    </div>
  );
}
