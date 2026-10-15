"use client";

import { useLineDraw, useSectionEntrance } from "@/lib/motion/gsap";

/**
 * A motion scope for sections that have no other reason to be client
 * components.
 *
 * The section's markup — copy, headings, links — stays in its original server
 * component; only this wrapper runs in the browser. That keeps the page's
 * client boundary local instead of turning the whole document into a client
 * application, and it means the wrapper's children are still rendered on the
 * server exactly as before.
 */
export function RevealSection({
  children,
  className,
  drawLines = false,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  /** Enables the line-draw treatment for `[data-line-draw]` elements inside. */
  drawLines?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  const entranceRef = useSectionEntrance<HTMLElement>();
  const lineRef = useLineDraw<HTMLElement>({ start: "top 86%" });

  return (
    <section
      ref={(node) => {
        entranceRef.current = node;
        lineRef.current = node;
      }}
      className={className}
      {...rest}
    >
      {children}
    </section>
  );
}
