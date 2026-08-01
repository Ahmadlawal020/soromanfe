/**
 * The app's own card idiom — not part of shadcn, and nothing looks right
 * without it.
 *
 * The system runs two surface treatments and mixing them looks wrong:
 *
 *   Card (the shadcn primitive)  ring-1 ring-foreground/10
 *   PANEL (this)                 border-foreground/15
 *
 * There are no drop shadows anywhere in this system. Separation comes from
 * hairline borders alone, so surfaces sit flat on the page rather than
 * floating above it.
 *
 * PANEL is the dominant surface across the dashboard. Its anatomy is fixed:
 * a header rail, a body, and an optional bg-muted/40 footer rail.
 *
 *   <section className={PANEL}>
 *     <div className="flex items-center justify-between border-b border-foreground/15 px-6 py-4">
 *       <span className={MICRO}>Wallet balance</span>
 *     </div>
 *     <div className="px-6 pt-5 pb-6"> … </div>
 *     <div className="flex items-center justify-end bg-muted/40 px-6 py-3"> … </div>
 *   </section>
 *
 * Hairlines are border-foreground/15, never border-border — that one is for
 * the primitives. Padding is px-6, wider than the shadcn Card's spacing(4).
 *
 * State-tinted panels swap only the border colour and keep everything else:
 * cn(PANEL, "border-warning/40") with the header rail at border-warning/25.
 */
export const PANEL =
  "overflow-hidden rounded-xl border border-foreground/15 bg-background";

/**
 * Wide-tracked uppercase micro-label — the single most recognisable trait of
 * the design. Letter-spacing scales inversely with size; this is the panel
 * header rung of that ladder.
 *
 *   0.3em   text-xs          hero eyebrow
 *   0.25em  text-xs          MICRO — panel header labels
 *   0.22em  text-xs/0.65rem  product codes, sidebar group labels
 *   0.2em   text-[0.65rem]   stepper labels, sub-headings inside panels
 *   0.14em  text-[0.6rem]    status chips
 *   0.12em  text-[0.6rem]    smallest meta lines
 *
 * Always uppercase at >= 0.12em. Never track body copy.
 */
export const MICRO = "text-xs tracking-[0.25em] uppercase";

/** Panel header rail — the standard hairline + padding pairing for PANEL. */
export const PANEL_RAIL =
  "flex items-center justify-between border-b border-foreground/15 px-6 py-4";

/** Panel body padding. */
export const PANEL_BODY = "px-6 pt-5 pb-6";

/** Panel footer rail — the quiet ground that closes a panel. */
export const PANEL_FOOTER = "flex items-center bg-muted/40 px-6 py-3";
