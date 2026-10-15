"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Overlay, OverlayHeader } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { AvailabilityPill, DietaryRow, MicroLabel, SampleBadge, SpiceMeter } from "@/components/ui/Bits";
import { useCart } from "@/components/cart/CartProvider";
import { defaultSelection, type DraftSelection } from "@/lib/cart/line";
import { formatDelta, formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/menu/types";

interface ItemDialogProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

export function ItemDialog({ item, open, onClose }: ItemDialogProps) {
  const { addItem } = useCart();
  // The parent keys this component per dish, so initial state belongs to one item.
  const [draft, setDraft] = useState<DraftSelection>(() => (item ? defaultSelection(item) : {}));
  const [quantity, setQuantity] = useState(1);
  const [touched, setTouched] = useState(false);

  const missingRequired = useMemo(() => {
    if (!item) return [];
    return item.optionGroups.filter((group) => group.required && (draft[group.id] ?? []).length === 0);
  }, [item, draft]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const delta = item.optionGroups.reduce((sum, group) => {
      const picked = draft[group.id] ?? [];
      return (
        sum +
        group.choices
          .filter((choice) => picked.includes(choice.id))
          .reduce((groupSum, choice) => groupSum + choice.priceDeltaPaise, 0)
      );
    }, 0);
    return item.pricePaise + delta;
  }, [item, draft]);

  if (!item) return null;

  const unavailable = !item.availability.available;

  const toggleChoice = (groupId: string, choiceId: string, type: "single" | "multi") => {
    setTouched(true);
    setDraft((current) => {
      const picked = current[groupId] ?? [];
      if (type === "single") return { ...current, [groupId]: [choiceId] };
      return {
        ...current,
        [groupId]: picked.includes(choiceId)
          ? picked.filter((id) => id !== choiceId)
          : [...picked, choiceId],
      };
    });
  };

  const addToOrder = () => {
    setTouched(true);
    if (missingRequired.length > 0 || unavailable) return;
    addItem(item, draft, quantity);
    onClose();
  };

  return (
    <Overlay open={open} onClose={onClose} kind="dialog" label={item.name} testId="item-dialog">
      <div className="flex max-h-[88dvh] flex-col overflow-y-auto">
        <OverlayHeader title={item.name} micro="Item detail" onClose={onClose} closeLabel={`Close ${item.name}`} />

        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-ivory/10">
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            sizes="(max-width: 768px) 100vw, 46rem"
            quality={80}
            className="object-cover"
            style={{ backgroundColor: item.image.tone }}
          />
          <span className="absolute left-4 top-4 flex gap-2">
            <SampleBadge />
          </span>
        </div>

        <div className="flex flex-col gap-6 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <DietaryRow marks={item.dietary} />
              <SpiceMeter level={item.spice} />
            </div>
            <AvailabilityPill available={item.availability.available} reason={item.availability.reason} />
          </div>

          <p className="text-[0.94rem] leading-relaxed text-ivory/80">{item.description}</p>

          {unavailable ? (
            <p className="rounded-sm border border-chili/35 bg-chili/8 px-4 py-3 text-[0.86rem] text-chili/90">
              {item.availability.reason ??
                "This dish is not available at the moment. The restaurant can confirm the closest alternative when you call."}
            </p>
          ) : null}

          {item.optionGroups.length > 0 ? (
            <div className="flex flex-col gap-6">
              {item.optionGroups.map((group) => {
                const picked = draft[group.id] ?? [];
                const isMissing = touched && group.required && picked.length === 0;
                return (
                  <fieldset key={group.id} className="flex flex-col gap-3">
                    <legend className="flex items-center gap-2">
                      <MicroLabel tone={isMissing ? "chili" : "ivory"}>
                        {group.label}
                        {group.required ? " · required" : " · optional"}
                      </MicroLabel>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {group.choices.map((choice) => {
                        const active = picked.includes(choice.id);
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => toggleChoice(group.id, choice.id, group.type)}
                            aria-pressed={active}
                            className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-[0.82rem] transition-colors ${
                              active
                                ? "border-amber/70 bg-amber/12 text-amber"
                                : "border-ivory/15 text-ivory/75 hover:border-ivory/35"
                            }`}
                            data-testid={`option-${group.id}-${choice.id}`}
                          >
                            {choice.label}
                            <span className="micro text-ash/80">{formatDelta(choice.priceDeltaPaise)}</span>
                          </button>
                        );
                      })}
                    </div>
                    {isMissing ? (
                      <p role="alert" className="text-[0.78rem] text-chili">
                        Please choose {group.label.toLowerCase()} before adding this item.
                      </p>
                    ) : null}
                  </fieldset>
                );
              })}
            </div>
          ) : null}

          <p className="micro text-ash/70">
            Options shown are sample configuration — Maitri&apos;s approved choices will replace them.
          </p>
        </div>

        <div className="sticky bottom-0 mt-auto border-t border-ivory/10 bg-char/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="micro text-ash">Quantity</span>
              <div className="flex items-center rounded-full border border-ivory/18">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="flex h-11 w-11 items-center justify-center text-ivory/80 disabled:opacity-40"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="tnum w-8 text-center text-[0.95rem]" data-testid="item-quantity">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(20, value + 1))}
                  className="flex h-11 w-11 items-center justify-center text-ivory/80 disabled:opacity-40"
                  disabled={quantity >= 20}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <Button
              onClick={addToOrder}
              size="lg"
              disabled={unavailable}
              data-testid="item-add-to-cart"
              aria-describedby={missingRequired.length > 0 ? "item-required-hint" : undefined}
            >
              Add · {formatPrice(unitPrice * quantity)}
            </Button>
          </div>
          {missingRequired.length > 0 && touched ? (
            <p id="item-required-hint" className="mt-2 text-[0.78rem] text-chili">
              Choose {missingRequired.map((group) => group.label.toLowerCase()).join(", ")} to continue.
            </p>
          ) : null}
        </div>
      </div>
    </Overlay>
  );
}
