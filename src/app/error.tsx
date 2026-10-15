"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/Bits";
import { telHref, verified } from "@/lib/config/business";

/**
 * Error boundary. Deliberately honest: it says what failed, offers a retry, and
 * gives the phone number, because a customer who wants to eat should never be
 * stuck behind a broken page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[maitri] render error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="shell flex min-h-[80svh] flex-col justify-center gap-6 py-24">
      <MicroLabel tone="chili">Something broke</MicroLabel>
      <h1 className="max-w-[26ch] text-[length:var(--text-display-sm)] leading-tight text-ivory">
        This part of the experience did not load.
      </h1>
      <p className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
        Nothing you did caused this, and no order was placed or changed. Try again — or call the delivery line and
        the restaurant will take the order directly.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset} data-testid="error-retry">
          Try again
        </Button>
        <ButtonLink href={telHref} external variant="secondary" size="lg">
          Call {verified.deliveryPhone.display}
        </ButtonLink>
        <ButtonLink href="/" variant="quiet" size="lg">
          Back to the start
        </ButtonLink>
      </div>
      {error.digest ? <p className="micro text-ash/50">Reference: {error.digest}</p> : null}
    </div>
  );
}
