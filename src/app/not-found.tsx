import { ButtonLink } from "@/components/ui/Button";
import { MicroLabel } from "@/components/ui/Bits";
import { telHref, verified } from "@/lib/config/business";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[80svh] flex-col justify-center gap-6 py-24">
      <MicroLabel tone="amber">404</MicroLabel>
      <h1 className="max-w-[24ch] text-[length:var(--text-display-sm)] leading-tight text-ivory">
        This page is not on the menu.
      </h1>
      <p className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
        The link you followed does not exist on this concept build. The menu, the order builder and the delivery
        details are all one click away.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/" size="lg">
          Back to the experience
        </ButtonLink>
        <ButtonLink href="/#menu" variant="secondary" size="lg">
          Explore the menu
        </ButtonLink>
        <ButtonLink href={telHref} external variant="quiet" size="lg">
          Call {verified.deliveryPhone.display}
        </ButtonLink>
      </div>
    </div>
  );
}
