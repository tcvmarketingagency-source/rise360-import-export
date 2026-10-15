"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { ConfirmedChip, MicroLabel, PendingChip, SampleBadge } from "@/components/ui/Bits";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCart } from "@/components/cart/CartProvider";
import {
  checkoutFormSchema,
  orderPayloadSchema,
  toFieldErrors,
  type FieldErrors,
  type CheckoutFormValues,
} from "@/lib/validation/order";
import { formatPrice, pluralise } from "@/lib/format";
import {
  capabilities,
  deliveryNotes,
  isPreview,
  orderMode,
  orderModeMeta,
  previewBanner,
} from "@/lib/config/order";
import { telHref, verified } from "@/lib/config/business";
import { buildOrderMessage, buildWhatsAppHref, createOrderReference } from "@/lib/orders/message";
import { bezier } from "@/lib/motion/tokens";

type Step = "details" | "review" | "prepared" | "placed" | "failed";

const emptyForm: CheckoutFormValues = {
  customerName: "",
  phone: "",
  address: "",
  area: "",
  instructions: "",
  fulfilment: "delivery",
};

export function CheckoutFlow() {
  const { lines, count, totals, updateQuantity, remove } = useCart();
  const [form, setForm] = useState<CheckoutFormValues>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState<Step>("details");
  const [reference, setReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const message = useMemo(() => {
    if (!reference) return "";
    return buildOrderMessage({
      reference,
      customerName: form.customerName,
      phone: form.phone,
      address: form.address,
      area: form.area,
      instructions: form.instructions,
      lines,
      subtotalPaise: totals.subtotalPaise,
      deliveryPaise: totals.deliveryPaise,
      taxesPaise: totals.taxesPaise,
      totalPaise: totals.totalPaise,
      placedAt: new Date(),
    });
  }, [reference, form, lines, totals]);

  const update = (field: keyof CheckoutFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): boolean => {
    const result = checkoutFormSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    setErrors(toFieldErrors(result.error));
    // Move focus to the first invalid field for keyboard and screen-reader users.
    const firstField = result.error.issues[0]?.path[0];
    if (typeof firstField === "string") {
      document.getElementById(`field-${firstField}`)?.focus();
    }
    return false;
  };

  const goToReview = () => {
    if (!validate()) return;
    setReference(createOrderReference());
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    if (!reference) return;

    // Mode A / preview: nothing is transmitted by this page.
    if (orderMode !== "online") {
      setStep("prepared");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload = orderPayloadSchema.safeParse({
      ...form,
      lines,
      expectedSubtotalPaise: totals.subtotalPaise,
    });
    if (!payload.success) {
      setErrors(toFieldErrors(payload.error));
      setStep("details");
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      const data: { ok?: boolean; reference?: string; error?: string } = await response.json();
      if (!response.ok || !data.ok) {
        setServerError(data.error ?? "The order could not be saved. Please call the restaurant instead.");
        setStep("failed");
        return;
      }
      setReference(data.reference ?? reference);
      setStep("placed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError(
        "No connection to the order service. Nothing was saved — please call the delivery line instead.",
      );
      setStep("failed");
    } finally {
      setSubmitting(false);
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="shell flex min-h-[70svh] flex-col justify-center gap-6 py-20">
        <MicroLabel tone="amber">Checkout</MicroLabel>
        <h1 className="max-w-[20ch] text-[length:var(--text-display-sm)] leading-tight text-ivory">
          There is nothing to check out yet.
        </h1>
        <p className="max-w-lg text-[0.95rem] leading-relaxed text-ash">
          Your order is empty. Pick something from the sample menu and it will appear here with its choices and
          total.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/#menu" size="lg">
            Explore the menu
          </ButtonLink>
          <ButtonLink href={telHref} external variant="secondary" size="lg">
            Call {verified.deliveryPhone.display}
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="shell flex flex-col gap-10 py-28 sm:py-32">
      <header className="flex flex-col gap-5">
        <MicroLabel tone="amber">Checkout · {orderModeMeta[orderMode].label}</MicroLabel>
        <h1 className="max-w-[24ch] text-[length:var(--text-display-sm)] leading-[0.98] text-ivory">
          {step === "details"
            ? "Where should this arrive?"
            : step === "review"
              ? "Check the order before it leaves this page."
              : step === "placed"
                ? "Order received by the restaurant."
                : step === "prepared"
                  ? "Your order summary is ready."
                  : step === "failed"
                    ? "The order was not saved."
                    : ""}
        </h1>
        {isPreview && previewBanner.enabled ? (
          <p className="max-w-2xl rounded-sm border border-turmeric/30 bg-turmeric/8 px-4 py-3 text-[0.86rem] leading-relaxed text-turmeric/90">
            <strong className="font-medium">Concept preview.</strong> {previewBanner.message}
          </p>
        ) : null}
      </header>

      <StepRail step={step} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col gap-8">
          {step === "details" ? (
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                goToReview();
              }}
              noValidate
            >
              <TextField
                label="Name for the order"
                name="customerName"
                value={form.customerName}
                onChange={(event) => update("customerName", event.target.value)}
                error={errors.customerName}
                required
                autoComplete="name"
                micro
              />
              <TextField
                label="Mobile number"
                name="phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                error={errors.phone}
                required
                hint="The restaurant calls this number to confirm."
                autoComplete="tel"
                micro
              />
              <TextAreaField
                label="Delivery address"
                name="address"
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                error={errors.address}
                required
                hint="House or flat number, street, and a landmark that helps the rider."
                autoComplete="street-address"
                micro
              />
              <TextField
                label="Locality / area"
                name="area"
                value={form.area}
                onChange={(event) => update("area", event.target.value)}
                error={errors.area}
                required
                hint={deliveryNotes.areaPlaceholder}
                micro
              />
              <TextAreaField
                label="Delivery instructions"
                name="instructions"
                value={form.instructions ?? ""}
                onChange={(event) => update("instructions", event.target.value)}
                error={errors.instructions}
                maxLength={240}
                hint="Anything the kitchen or rider should know. Kept to 240 characters."
                micro
              />

              <div className="flex flex-col gap-3 rounded-sm border border-ivory/12 bg-char/50 px-4 py-4">
                <MicroLabel tone="ivory">Fulfilment</MicroLabel>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="micro rounded-full border border-amber/50 px-3 py-1.5 text-amber">
                    Doorstep delivery
                  </span>
                  <span className="flex items-center gap-2">
                    {capabilities.pickup ? <ConfirmedChip /> : <PendingChip label="Pickup not offered yet" />}
                  </span>
                </div>
                <p className="text-[0.8rem] leading-relaxed text-ash/85">
                  Pickup is not part of this concept build. It will be added only if Maitri offers counter
                  collection.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" size="lg" data-testid="checkout-review">
                  Review my order
                  <span aria-hidden="true">→</span>
                </Button>
                <p className="text-[0.78rem] text-ash/80">
                  Next you will see the exact summary before anything is sent anywhere.
                </p>
              </div>
            </form>
          ) : null}

          {step === "review" && reference ? (
            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-4 rounded-sm border border-ivory/12 bg-char/50 p-5">
                <MicroLabel tone="amber">Delivery details</MicroLabel>
                <dl className="flex flex-col gap-2 text-[0.92rem]">
                  <Row label="Name" value={form.customerName} />
                  <Row label="Phone" value={form.phone} />
                  <Row label="Address" value={form.address} />
                  <Row label="Area" value={form.area} />
                  {form.instructions ? <Row label="Instructions" value={form.instructions} /> : null}
                  <Row label="Reference" value={reference} />
                </dl>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => setStep("details")}
                    data-testid="checkout-edit-details"
                  >
                    Edit details
                  </Button>
                </div>
              </section>

              <section className="flex flex-col gap-4 rounded-sm border border-ivory/12 bg-char/50 p-5">
                <MicroLabel tone="amber">What leaves this page</MicroLabel>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-sm border border-ivory/10 bg-ink/60 p-4 text-[0.8rem] leading-relaxed text-ivory/85">
{message}
                </pre>
                <div className="flex flex-wrap gap-3">
                  <Button variant="quiet" size="sm" onClick={copyMessage} data-testid="checkout-copy">
                    {copied ? "Copied" : "Copy summary"}
                  </Button>
                </div>
              </section>

              <div className="flex flex-col gap-3">
                {orderMode === "whatsapp" ? (
                  <>
                    <ButtonLink href={buildWhatsAppHref(message)} external size="lg" data-testid="checkout-whatsapp">
                      Open WhatsApp with this order
                    </ButtonLink>
                    <p className="text-[0.8rem] leading-relaxed text-ash/85">
                      Opening WhatsApp does not place the order. Maitri confirms it once they reply on{" "}
                      {verified.deliveryPhone.display}.
                    </p>
                    <ButtonLink href={telHref} external variant="secondary" size="lg">
                      Or call {verified.deliveryPhone.display}
                    </ButtonLink>
                  </>
                ) : null}

                {orderMode === "online" ? (
                  <>
                    <Button
                      size="lg"
                      onClick={placeOrder}
                      disabled={submitting}
                      data-testid="checkout-place-order"
                    >
                      {submitting ? "Sending…" : "Place order"}
                    </Button>
                    <p className="text-[0.8rem] leading-relaxed text-ash/85">
                      Your order is stored with a reference and enters the restaurant&apos;s queue as{" "}
                      <span className="text-ivory/85">Pending</span>. Staff accept it from the admin dashboard.
                    </p>
                  </>
                ) : null}

                {isPreview ? (
                  <>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={placeOrder}
                      data-testid="checkout-finalise"
                    >
                      Finalise concept summary
                    </Button>
                    <p className="text-[0.8rem] leading-relaxed text-turmeric/85">
                      Preview mode: this is where a live order would be sent. No message is opened, no charge is
                      made and nothing reaches the restaurant.
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === "prepared" ? (
            <div className="flex flex-col gap-6" data-testid="checkout-prepared">
              <div className="flex flex-col gap-4 rounded-sm border border-amber/35 bg-amber/8 p-5">
                <MicroLabel tone="amber">Not sent — concept preview</MicroLabel>
                <p className="text-[0.95rem] leading-relaxed text-ivory/90">
                  Your order summary is complete and reviewed. Nothing has been transmitted: no order was placed,
                  no message was opened and no payment was taken.
                </p>
                <p className="text-[0.85rem] leading-relaxed text-ash">
                  In a live launch, this step hands the reviewed summary to{" "}
                  {verified.deliveryPhone.display}. Maitri accepts the order — this website never confirms it on
                  the restaurant&apos;s behalf.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" size="md" onClick={copyMessage} data-testid="checkout-copy-final">
                    {copied ? "Copied" : "Copy the order summary"}
                  </Button>
                  <ButtonLink href={telHref} external variant="primary" size="md">
                    Call {verified.deliveryPhone.display}
                  </ButtonLink>
                </div>
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-sm border border-ivory/10 bg-ink/60 p-4 text-[0.8rem] leading-relaxed text-ivory/85">
{message}
              </pre>
              <Link href="/#menu" className="micro text-ash hover:text-ivory">
                ← Back to the menu
              </Link>
            </div>
          ) : null}

          {step === "placed" ? (
            <div className="flex flex-col gap-5" data-testid="checkout-placed">
              <div className="flex flex-col gap-3 rounded-sm border border-herb/40 bg-herb/10 p-5">
                <MicroLabel tone="amber">Reference {reference}</MicroLabel>
                <p className="text-[1rem] leading-relaxed text-ivory">
                  Your order is with the restaurant and is marked <strong>Pending</strong>. Staff accept it from
                  the dashboard, and the delivery line calls the number you provided.
                </p>
                <p className="text-[0.85rem] text-ash">
                  Keep the reference handy. Payment is settled directly with the restaurant — this concept build
                  never charges anything.
                </p>
              </div>
              <Link href="/#menu" className="micro text-ash hover:text-ivory">
                ← Add something else
              </Link>
            </div>
          ) : null}

          {step === "failed" ? (
            <div className="flex flex-col gap-5" data-testid="checkout-failed">
              <div className="flex flex-col gap-3 rounded-sm border border-chili/45 bg-chili/10 p-5">
                <MicroLabel tone="chili">Not saved</MicroLabel>
                <p className="text-[0.95rem] leading-relaxed text-ivory">{serverError}</p>
                <p className="text-[0.85rem] text-ash">
                  Nothing was stored and nothing was charged. Calling the delivery line is the fastest way to
                  place this order.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="md" onClick={() => setStep("review")}>
                  Try again
                </Button>
                <ButtonLink href={telHref} external size="md">
                  Call {verified.deliveryPhone.display}
                </ButtonLink>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Persistent order summary ───────────────────────────────────────── */}
        <aside className="flex h-fit flex-col gap-5 rounded-sm border border-ivory/12 bg-char/50 p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <MicroLabel tone="amber">Your order</MicroLabel>
            <span className="micro text-ash">
              {count} {pluralise(count, "item")}
            </span>
          </div>

          <ul className="flex flex-col divide-y divide-ivory/8">
            {lines.map((line) => (
              <li key={line.key} className="flex flex-col gap-2 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.92rem] text-ivory/90">{line.name}</span>
                  <span className="tnum text-[0.9rem] text-ivory/85">
                    {formatPrice(line.lineTotalPaise)}
                  </span>
                </div>
                {line.selections.length > 0 ? (
                  <p className="text-[0.76rem] text-ash">
                    {line.selections.map((selection) => selection.choiceLabels.join(", ")).join(" · ")}
                  </p>
                ) : null}
                {step === "details" ? (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(value) => updateQuantity(line.key, value)}
                      itemName={line.name}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => remove(line.key)}
                      className="micro text-ash/70 transition-colors hover:text-chili"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="micro text-ash/70">Quantity {line.quantity}</p>
                )}
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-2 border-t border-ivory/12 pt-4">
            <Row label="Subtotal" value={formatPrice(totals.subtotalPaise)} strong />
            <Row label="Delivery charge" value="To be confirmed" muted />
            <Row label="Taxes" value="To be confirmed" muted />
          </dl>

          <div className="flex flex-col gap-2 rounded-sm border border-ivory/10 bg-ink/40 px-4 py-3">
            <p className="text-[0.78rem] leading-relaxed text-ash/85">{deliveryNotes.chargesNote}</p>
            <p className="text-[0.78rem] leading-relaxed text-ash/85">
              {capabilities.payments
                ? "Payment options are configured by the restaurant."
                : "No online payment is offered in this build — nothing is charged here."}
            </p>
            <span className="flex items-center gap-2 pt-1">
              <SampleBadge />
              <span className="micro text-ash/70">Sample menu · placeholder prices</span>
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? "text-[0.85rem] text-ash" : "text-[0.88rem] text-ash/85"}>{label}</dt>
      <dd
        className={`text-right ${
          strong ? "tnum text-[1.06rem] text-ivory" : muted ? "micro text-ash/80" : "text-[0.9rem] text-ivory/85"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function StepRail({ step }: { step: Step }) {
  const steps = [
    { id: "details", label: "Delivery details" },
    { id: "review", label: "Review" },
    { id: "submit", label: orderMode === "online" ? "Send to restaurant" : "Hand to Maitri" },
  ];
  const activeIndex = step === "details" ? 0 : step === "review" ? 1 : 2;

  return (
    <ol className="flex flex-wrap items-center gap-3" aria-label="Checkout progress">
      {steps.map((entry, index) => {
        const active = index <= activeIndex;
        return (
          <li key={entry.id} className="flex items-center gap-3">
            <span
              className={`micro flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                active ? "border-amber/60 text-amber" : "border-ivory/15 text-ash/70"
              }`}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {entry.label}
            </span>
            {index < steps.length - 1 ? (
              <motion.span
                aria-hidden="true"
                className="hidden h-px w-8 bg-ivory/15 sm:block"
                animate={{ backgroundColor: active ? "rgba(221,160,74,0.6)" : "rgba(246,241,231,0.12)" }}
                transition={{ duration: 0.3, ease: bezier.snap }}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
