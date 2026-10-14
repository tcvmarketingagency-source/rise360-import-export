import { z } from "zod";

/**
 * Shared validation. The exact same schema runs in the browser (instant field
 * feedback) and on the server (authoritative check) — a request that skips the
 * client still cannot store an invalid order.
 */

const phonePattern = /^(\+?\d{1,3}[\s-]?)?[6-9]\d{9}$/;

export const customerNameSchema = z
  .string()
  .trim()
  .min(2, "Please enter the name for this order.")
  .max(60, "That name is too long — please shorten it.");

export const phoneSchema = z
  .string()
  .trim()
  .min(10, "A 10-digit mobile number is needed so the restaurant can call you back.")
  .max(16, "That number looks too long.")
  .regex(phonePattern, "Enter a valid Indian mobile number, e.g. 98765 43210.");

export const addressSchema = z
  .string()
  .trim()
  .min(12, "Please include house/flat number, street and a nearby landmark.")
  .max(240, "Please shorten the address to 240 characters.");

export const areaSchema = z
  .string()
  .trim()
  .min(2, "Which locality should the delivery reach?")
  .max(60, "That locality name is too long.");

export const instructionsSchema = z
  .string()
  .trim()
  .max(240, "Please keep delivery instructions under 240 characters.")
  .optional()
  .or(z.literal(""));

export const fulfilmentSchema = z.enum(["delivery", "pickup"]);

export const cartSelectionSchema = z.object({
  groupId: z.string().min(1),
  groupLabel: z.string().min(1),
  choiceIds: z.array(z.string().min(1)).min(1),
  choiceLabels: z.array(z.string().min(1)).min(1),
  priceDeltaPaise: z.number().int(),
});

export const cartLineSchema = z.object({
  key: z.string().min(1),
  itemId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  imageSrc: z.string().min(1),
  basePricePaise: z.number().int().nonnegative(),
  quantity: z.number().int().min(1).max(20),
  selections: z.array(cartSelectionSchema),
  selectionsDeltaPaise: z.number().int(),
  unitPricePaise: z.number().int().nonnegative(),
  lineTotalPaise: z.number().int().nonnegative(),
});

export const orderPayloadSchema = z.object({
  customerName: customerNameSchema,
  phone: phoneSchema,
  address: addressSchema,
  area: areaSchema,
  instructions: instructionsSchema.optional(),
  fulfilment: fulfilmentSchema,
  lines: z.array(cartLineSchema).min(1, "Add at least one item before placing an order."),
  /** Server re-validates totals; the client value is treated as untrusted input. */
  expectedSubtotalPaise: z.number().int().nonnegative(),
});

export type OrderPayload = z.infer<typeof orderPayloadSchema>;

export const checkoutFormSchema = z.object({
  customerName: customerNameSchema,
  phone: phoneSchema,
  address: addressSchema,
  area: areaSchema,
  instructions: instructionsSchema,
  fulfilment: fulfilmentSchema,
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export type FieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

/** Maps a ZodError to per-field messages for accessible inline errors. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as keyof CheckoutFormValues] = issue.message;
    }
  }
  return errors;
}
