"use client";

/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Mail, Lock, User, AtSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Sign-in form state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // Sign-up form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupDisplayName, setSignupDisplayName] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email: signinEmail,
      password: signinPassword,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast({
        title: "Sign in failed",
        description: "Check your email and password.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Welcome back ✨", description: "You're signed in." });
    onOpenChange(false);
    onSuccess();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: signupEmail,
        password: signupPassword,
        username: signupUsername,
        displayName: signupDisplayName,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast({
        title: "Sign up failed",
        description: data.error || "Something went wrong.",
        variant: "destructive",
      });
      return;
    }
    // Auto sign-in after signup
    const result = await signIn("credentials", {
      email: signupEmail,
      password: signupPassword,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast({
        title: "Account created — please sign in",
        description: "Your account is ready. Sign in with your email and password.",
      });
      setMode("signin");
      setSigninEmail(signupEmail);
      return;
    }
    toast({
      title: "Welcome to ReelWrite ✨",
      description: "Your writer account is ready.",
    });
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <span className="text-2xl">✒️</span>
            <span className="font-serif text-amber-400">ReelWrite</span>
          </DialogTitle>
          <DialogDescription className="text-center text-white/60">
            {mode === "signin"
              ? "Sign in to create and share your 7-second reels."
              : "Create your writer account in seconds."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
            <TabsTrigger
              value="signin"
              className="data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white/70"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white/70"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* SIGN IN */}
          <TabsContent value="signin" className="mt-4">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email" className="text-xs font-semibold">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/35 pl-9 focus-visible:ring-amber-400/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signin-password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/35 pl-9 focus-visible:ring-amber-400/50"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 text-black hover:bg-amber-300 font-bold py-2.5"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Sign In</>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* SIGN UP */}
          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-displayname" className="text-xs font-semibold">Display name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="signup-displayname"
                    type="text"
                    required
                    value={signupDisplayName}
                    onChange={(e) => setSignupDisplayName(e.target.value)}
                    placeholder="Marina Eclipse"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/35 pl-9 focus-visible:ring-amber-400/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-username" className="text-xs font-semibold">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="signup-username"
                    type="text"
                    required
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="marina.eclipse"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/35 pl-9 focus-visible:ring-amber-400/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="text-xs font-semibold">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/35 pl-9 focus-visible:ring-amber-400/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-xs font-semibold">Password <span className="text-white/40 font-normal">(min 6 chars)</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/35 pl-9 focus-visible:ring-amber-400/50"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 text-black hover:bg-amber-300 font-bold py-2.5"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Create Writer Account</>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-[10px] text-white/40 text-center pt-2">
          By continuing, you agree to ReelWrite&apos;s Terms of Service and
          acknowledge our Privacy Policy. Your stories stay yours.
        </p>
      </DialogContent>
    </Dialog>
  );
}
