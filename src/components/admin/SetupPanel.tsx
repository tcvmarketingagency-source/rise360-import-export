import Link from "next/link";

/**
 * Shown wherever the admin area is requested without Supabase configuration.
 * The build never invents credentials or fakes a logged-in session — it explains
 * exactly what has to be supplied.
 */
export function SetupPanel({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="shell flex min-h-[70svh] flex-col justify-center gap-6 py-24">
      <span className="micro text-amber">Admin · setup required</span>
      <h1 className="max-w-[26ch] text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-ivory">{title}</h1>
      <p className="max-w-2xl text-[0.95rem] leading-relaxed text-ash">
        This concept build ships the full ordering architecture but no credentials. The admin area switches on
        the moment Maitri&apos;s Supabase project is connected.
      </p>
      <ol className="flex max-w-2xl flex-col gap-3 text-[0.9rem] leading-relaxed text-ash">
        <li>
          <span className="text-ivory/85">1.</span> Create a Supabase project and run{" "}
          <code className="rounded bg-ink/60 px-1.5 py-0.5 text-[0.8rem] text-amber/90">
            supabase/migrations/0001_init.sql
          </code>
          .
        </li>
        <li>
          <span className="text-ivory/85">2.</span> Set{" "}
          <code className="rounded bg-ink/60 px-1.5 py-0.5 text-[0.8rem] text-amber/90">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          ,{" "}
          <code className="rounded bg-ink/60 px-1.5 py-0.5 text-[0.8rem] text-amber/90">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          and the server-only{" "}
          <code className="rounded bg-ink/60 px-1.5 py-0.5 text-[0.8rem] text-amber/90">
            SUPABASE_SERVICE_ROLE_KEY
          </code>
          .
        </li>
        <li>
          <span className="text-ivory/85">3.</span> Invite staff users through Supabase Auth, then add each one
          to{" "}
          <code className="rounded bg-ink/60 px-1.5 py-0.5 text-[0.8rem] text-amber/90">staff_profiles</code>{" "}
          with the role <em>owner</em>, <em>manager</em> or <em>viewer</em>.
        </li>
        <li>
          <span className="text-ivory/85">4.</span> Keep{" "}
          <code className="rounded bg-ink/60 px-1.5 py-0.5 text-[0.8rem] text-amber/90">
            NEXT_PUBLIC_ORDER_MODE
          </code>{" "}
          on <em>preview</em> or <em>whatsapp</em> until the ordering flow is approved.
        </li>
      </ol>
      {children}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/" className="micro text-amber hover:underline">
          ← Back to the site
        </Link>
        <Link href="/handoff" className="micro text-ash hover:text-ivory">
          Handoff checklist
        </Link>
      </div>
    </div>
  );
}
