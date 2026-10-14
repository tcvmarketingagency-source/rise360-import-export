"use client";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  itemName: string;
  size?: "sm" | "md";
}

/** 44px touch targets on both buttons, per the accessibility brief. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  itemName,
  size = "md",
}: QuantityStepperProps) {
  const buttonSize = size === "sm" ? "h-11 w-9" : "h-11 w-11";
  return (
    <div className="flex items-center rounded-full border border-ivory/18">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`${buttonSize} flex items-center justify-center text-ivory/80 transition-colors hover:text-amber disabled:opacity-35`}
        aria-label={`Decrease quantity of ${itemName}`}
      >
        −
      </button>
      <span className="tnum w-8 text-center text-[0.92rem]" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${buttonSize} flex items-center justify-center text-ivory/80 transition-colors hover:text-amber disabled:opacity-35`}
        aria-label={`Increase quantity of ${itemName}`}
      >
        +
      </button>
    </div>
  );
}
