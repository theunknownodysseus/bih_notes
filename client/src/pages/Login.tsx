import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Users, Share2, Zap } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center min-h-[80vh]">
          {/* Left side - Hero content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                <span className="text-primary">N</span>otes Edu Mamae
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-lg">
                Collaborate on notes in real-time. Share ideas, organize thoughts, and work together seamlessly.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Rich Notes</h3>
                  <p className="text-sm text-muted-foreground">Create and organize your notes effortlessly</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Collaborate</h3>
                  <p className="text-sm text-muted-foreground">Work together in real-time</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Share Easily</h3>
                  <p className="text-sm text-muted-foreground">Share notes with a simple link</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Instant Sync</h3>
                  <p className="text-sm text-muted-foreground">Changes sync across all devices</p>
                </div>
              </div>
            </div>

            {/* Sign in card */}
            <Card className="max-w-md border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Get Started</h2>
                    <p className="text-muted-foreground">Sign in to start creating and sharing notes</p>
                  </div>
                  <Button
                    onClick={signInWithGoogle}
                    size="lg"
                    className="w-full gap-3 font-semibold"
                    data-testid="button-google-signin"
                  >
                    <SiGoogle className="w-5 h-5" />
                    Continue with Google
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Illustration/Visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              {/* Abstract note cards illustration */}
              <div className="absolute -top-8 -left-8 w-64 h-48 bg-primary/5 rounded-2xl transform rotate-6 border border-primary/10" />
              <div className="absolute -bottom-8 -right-8 w-64 h-48 bg-primary/10 rounded-2xl transform -rotate-6 border border-primary/20" />
              <Card className="relative z-10 shadow-xl border-0">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Meeting Notes</h3>
                      <p className="text-sm text-muted-foreground">3 collaborators</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded w-3/5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary/30 border-2 border-background" />
                      <div className="w-8 h-8 rounded-full bg-primary/50 border-2 border-background" />
                      <div className="w-8 h-8 rounded-full bg-primary/70 border-2 border-background" />
                    </div>
                    <span className="text-sm text-muted-foreground">Editing now...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
