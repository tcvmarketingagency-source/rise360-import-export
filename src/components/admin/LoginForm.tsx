"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return null;
    return createBrowserClient(url, anon);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured for this deployment.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      // Deliberately generic: never reveal whether an account exists.
      setError("Those credentials were not accepted.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5" noValidate>
      <TextField
        label="Staff email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        micro
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        micro
      />
      {error ? (
        <p role="alert" className="text-[0.82rem] text-chili">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={busy} data-testid="admin-login-submit">
        {busy ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-[0.76rem] leading-relaxed text-ash/75">
        Staff accounts are created in Supabase Auth and enabled per person in the{" "}
        <code className="text-amber/80">staff_profiles</code> table. There is no public sign-up.
      </p>
    </form>
  );
}
