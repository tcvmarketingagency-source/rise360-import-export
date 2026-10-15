/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SITE CONTENT — every customer-facing string in one editable place.
 * Maitri's approved wording can be swapped in here without touching components.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * One numbering spine for the whole page — the chapters a visitor scrolls
 * through. These numbers are the same ones the sections print in their own
 * micro labels (storyCopy/menuSectionCopy/favouritesCopy/…), so the nav and the
 * page never disagree:
 *
 *   01 hero · 02 the kitchen · 03 the plate · 04 menu · 05 favourites
 *   06 ordering · 07 delivery · 08 beyond delivery
 *
 * The story section spans the film's 02–03 scenes, which is why the nav jumps
 * from 02 to 04: 03 is reached inside the story, not as its own stop.
 */
export const nav = [
  { id: "story", label: "The Story", href: "#story", micro: "02" },
  { id: "menu", label: "Menu", href: "#menu", micro: "04" },
  { id: "favourites", label: "Favourites", href: "#favourites", micro: "05" },
  { id: "order", label: "How Ordering Works", href: "#order", micro: "06" },
  { id: "delivery", label: "Delivery", href: "#delivery", micro: "07" },
  { id: "visit", label: "Visit / Hotel", href: "#visit", micro: "08" },
] as const;

export const heroCopy = {
  eyebrow: "Hotel Maitri · Karimnagar, Telangana",
  brand: "MAITRI RESIDENCY",
  headline: "A taste that feels closer.",
  support:
    "Discover the menu, enjoy your favourites, and explore a more convenient way to order from Hotel Maitri.",
  primaryCta: { label: "Explore the menu", href: "#menu" },
  secondaryCta: { label: "Call for delivery" },
  scrollHint: "Scroll to enter the kitchen",
  statusLine: "CONCEPT BUILD // SAMPLE MENU // NO ORDERS TRANSMITTED",
} as const;

export const introCopy = {
  sequence: ["INGREDIENTS", "KITCHEN CRAFT", "THE PLATE", "THE MENU", "THE ORDER", "YOUR DOORSTEP"],
  brand: "MAITRI RESIDENCY",
  location: "KARIMNAGAR · TELANGANA",
  skip: "Skip intro",
  entering: "Opening the kitchen",
} as const;

export interface StoryScene {
  id: string;
  index: string;
  act: string;
  headline: string;
  support: string;
  markers: { label: string; value: string }[];
  media: { src: string; alt: string; width: number; height: number; tone: string; caption: string };
}

/** Scenes 02–03 of the cinematic scroll story. Scene 01 is the hero. */
export const storyScenes: StoryScene[] = [
  {
    id: "kitchen",
    index: "02",
    act: "The Kitchen",
    headline: "Every plate starts\nbefore the plate.",
    support:
      "Curry leaves hitting hot oil. A masala coming together in the pan. Rice resting under a sealed lid. The part of a meal you never see is the part that decides how it tastes — and it is the part this concept cannot show you until Maitri opens the kitchen to a camera.",
    markers: [
      { label: "Where", value: "Mukaram Pura, Karimnagar" },
      { label: "Kitchen hours", value: "To be confirmed" },
      { label: "Fulfilment", value: "Delivered to your address" },
    ],
    media: {
      src: "/images/story/tandoor-fire.jpg",
      alt: "Close crop of spiced paneer tossed with curry leaves and dried chilli in a dark bowl, lit warmly from one side",
      width: 1400,
      height: 1750,
      tone: "#2a1a11",
      caption: "FRAME 02 — TEXTURE",
    },
  },
  {
    id: "plate",
    index: "03",
    act: "The Plate",
    headline: "Built to travel\nwithout losing itself.",
    support:
      "Delivered food should arrive the way it left the kitchen. That is a packaging problem as much as a cooking one — and it is why the delivery menu is being built around dishes that hold their texture on the way to you.",
    markers: [
      { label: "Menu status", value: "Sample — awaiting Maitri's list" },
      { label: "Prices", value: "Placeholder values" },
      { label: "Dietary marks", value: "To be confirmed" },
    ],
    media: {
      src: "/images/story/plating-hands.jpg",
      alt: "A thin dosa roasted to a lacy gold finish, resting on a dark slate plate beside chutney",
      width: 1400,
      height: 1750,
      tone: "#2c2118",
      caption: "FRAME 03 — THE DISH",
    },
  },
];

export const menuSectionCopy = {
  micro: "Section 04 // Discover the menu",
  headline: "Find your favourite.",
  support:
    "Search by dish, filter by category, and open any item for the full description. Everything marked SAMPLE is authored placeholder content for this concept build.",
  searchPlaceholder: "Search dishes — try “biryani”",
  emptyTitle: "Nothing matches that search.",
  emptyBody: "Try a shorter word, or clear the filters to see the full sample menu.",
  resetLabel: "Clear search & filters",
  resultLabel: "items shown",
} as const;

export const favouritesCopy = {
  micro: "Section 05 // Choose your favourites",
  headline: "Start with these.",
  support:
    "A curated strip of the sample menu, laid out the way a table fills up — a few plates, then a few more. Add anything straight to your order from here.",
} as const;

export const orderCopy = {
  micro: "Section 06 // Your order, your way",
  headline: "Review it first.\nThen send it.",
  support:
    "Fill your cart, add your delivery details, and read the final summary before anything leaves this page. In this concept build, nothing is transmitted at all.",
  steps: [
    {
      index: "01",
      title: "Pick from the menu",
      body: "Browse categories or search for a dish. Quantities and any options are set on the item itself.",
    },
    {
      index: "02",
      title: "Check your order",
      body: "The cart shows every item, every choice and the running subtotal. Change anything, any time.",
    },
    {
      index: "03",
      title: "Add delivery details",
      body: "Name, phone, address and locality. Validated as you go, so the kitchen never calls about a typo.",
    },
    {
      index: "04",
      title: "Review, then send",
      body: "You read the final order, then it goes to the delivery line. The restaurant confirms it — not this website.",
    },
  ],
  ctaPrimary: "Open the menu",
  ctaSecondary: "View current order",
} as const;

export const deliveryCopy = {
  micro: "Section 07 // Delivery",
  headline: "Closer than you think.",
  support:
    "Hotel Maitri announced doorstep delivery for Karimnagar and posted a dedicated ordering number. The number below is live; the delivery zone map, charges and timings still need the restaurant's confirmation.",
  unconfirmedNote:
    "Placeholders below are clearly marked. Nothing here is presented as a confirmed service promise.",
  confirmedLabel: "Confirmed public detail",
  pendingLabel: "Awaiting confirmation",
  items: [
    {
      id: "phone",
      label: "Order line",
      value: "+91 89850 51111",
      status: "confirmed" as const,
      note: "Publicly posted for food-delivery orders.",
    },
    {
      id: "address",
      label: "Kitchen",
      value: "H.No. 2-8-266 & 267, beside Circus Grounds, Mukaram Pura, Karimnagar – 505001",
      status: "confirmed" as const,
      note: "Published address of Maitri Residency.",
    },
    {
      id: "areas",
      label: "Delivery areas",
      value: "To be confirmed",
      status: "pending" as const,
      note: "Which localities, how far, and whether any area is excluded.",
    },
    {
      id: "charges",
      label: "Charges & minimums",
      value: "To be confirmed",
      status: "pending" as const,
      note: "Delivery fee, free-delivery threshold and minimum order value.",
    },
    {
      id: "hours",
      label: "Delivery hours",
      value: "To be confirmed",
      status: "pending" as const,
      note: "Service window, last order time and holiday closures.",
    },
    {
      id: "payment",
      label: "Payment methods",
      value: "To be confirmed",
      status: "pending" as const,
      note: "Cash on delivery, UPI or online payment — none are assumed here.",
    },
  ],
} as const;

export const beyondCopy = {
  micro: "Section 08 // Beyond delivery",
  headline: "More than a kitchen.",
  support:
    "Maitri Residency is a hotel as well as a kitchen — rooms, dining and celebration spaces sit alongside food delivery. Those services have their own enquiry routes, so they never compete with your order here.",
  cards: [
    {
      id: "stay",
      title: "Stays",
      body: "Rooms for travellers and family visits in Karimnagar.",
      action: "Enquire on the hotel site",
    },
    {
      id: "dine",
      title: "Dine in",
      body: "Eat at the restaurant, with the full kitchen menu.",
      action: "Enquire on the hotel site",
    },
    {
      id: "celebrate",
      title: "Functions",
      body: "Celebrations and group dining — subject to availability.",
      action: "Enquire on the hotel site",
    },
  ],
  note: "These links leave this concept site and open Maitri's existing public pages.",
} as const;

export const finalCopy = {
  micro: "Final sequence",
  headline: "Your next favourite meal is closer.",
  support:
    "The menu is open, the delivery line is answered by the restaurant, and the ordering journey on this page is the one being proposed for launch.",
  primaryCta: "Explore the menu",
  secondaryCta: "Call the delivery line",
  conceptLine: "From Maitri's kitchen to your doorstep.",
} as const;

export const footerCopy = {
  columns: [
    { id: "experience", title: "Experience", links: ["The Story", "Menu", "How Ordering Works", "Delivery"] },
    { id: "visit", title: "Visit", links: ["Address & Contact", "Stays & Functions", "Instagram"] },
    { id: "legal", title: "Information", links: ["Handoff & Disclaimers", "Privacy (draft)", "Order & Delivery Policy (draft)"] },
  ],
  disclaimer:
    "Concept experience prepared for Maitri Residency / Hotel Maitri. Not the restaurant's official website. Menu, prices, delivery areas, charges and timings shown are placeholders pending approval.",
} as const;
