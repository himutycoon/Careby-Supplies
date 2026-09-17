# Image generation prompts — CareBy Canada

Five slots, matching `data/site-images.ts`. Sizes come from the actual
CSS aspect ratios, doubled for retina.

## Rules that apply to every image

Append this to every prompt:

> Photorealistic architectural photography. Natural daylight, no HDR
> look, no lens flare. Muted realistic colour — warm concrete greys,
> timber tones, deep greens. No text, no signage, no lettering, no
> logos, no watermarks, no brand names anywhere in the frame. No faces
> visible. Shot on a full-frame camera, 35mm, f/5.6, sharp throughout.
> Clean composition with uncluttered negative space.

**Why those constraints**

- **No text/logos** — generators reliably produce garbled lettering, and
  invented brand names on products would be a real problem on a
  commercial supplier's site.
- **No visible faces** — avoids likeness issues on a page selling to the
  public. Workers from behind, mid-distance, or hands-only is fine.
- **Muted colour** — the palette is forest green, navy and warm
  concrete. Saturated stock-photo orange fights it.

---

## 1. `homeHero` — home page, large right panel

**Export 1600 × 1200 px (4:3).**

> A modern Canadian residential build in progress on a clear day. Timber
> frame partially sheathed, clean job site, stacked lumber and material
> neatly organised in the foreground. Low-contrast overcast daylight.
> Shot slightly from below to feel substantial.

**Composition constraint:** UI cards overlap the **bottom-left** and
**top-right** corners. Keep the subject centred and those corners
visually quiet, or the cards will sit on top of detail.

---

## 2. `productsHero` — /products full-width background

**Export 2400 × 1000 px (wide banner).**

> A well-organised building-materials warehouse aisle. Racked lumber,
> sheet goods and supplies receding into depth. Even indoor lighting,
> wide angle, strong one-point perspective down the aisle.

**Important:** this sits under an **80% navy overlay** so the headline
stays readable. Pick something with simple large shapes and clear depth —
fine detail disappears completely. Anything busy turns to mud.

If you would rather not fight the overlay, leave this slot empty; the
warm concrete ground it falls back to looks deliberate.

---

## 3–5. Category cards

**Export 1200 × 750 px each (16:10).** Shot as a consistent set — same
light, same treatment — or the three cards will not sit together.

### `categoryRepair`

> Close crop of a plumbing repair under a sink. Copper pipe, wrench,
> hands only, no face. Shallow depth of field, warm domestic interior
> light.

### `categoryRenovation`

> A renovated Canadian kitchen or bathroom, freshly finished. Clean
> lines, quartz counter, matte fixtures, soft natural window light.
> Calm and uncluttered.

### `categoryNewConstruction`

> A two-storey Canadian house at framing stage against an open sky.
> Exposed timber framing, roof trusses set. Wide shot, late afternoon
> light, no people.

---

## Before you use them

1. **Zoom to 100% and check the details.** Generators mangle hands,
   tool heads, and anything text-like on packaging. A warped wrench is
   obvious to a contractor even if it reads fine at thumbnail size.
2. **Check structural plausibility.** Framing that could not stand up
   undermines a builder's trust faster than a plain background would.
3. **Export as `.webp` if your tool offers it**, otherwise `.jpg` at
   quality 80. Keep each file under ~400 KB — these load on first paint.
4. Name them lowercase with hyphens, drop them in this folder, and set
   the matching `src` in `data/site-images.ts`.

## A note on AI imagery

For a supplier's own site, AI photos carry a real risk: a trade customer
who spots an impossible joist or a floating fixture reads the whole site
as unserious. They work well as atmospheric backgrounds — the hero and
the products banner, especially under the overlay — and less well the
closer the camera gets to actual construction detail.

Real photos of real CareBy work beat these every time, even phone
photos. Worth asking the client whether they have any.

---

# Slideshow sets

Add these to `SITE_SLIDESHOWS` in `data/site-images.ts`. Two or more
entries crossfade; one renders as a still.

Shoot each set consistently — same light, same treatment. A crossfade
between mismatched images reads as a glitch, not a transition.

## `homeHero` — DONE (3 slides)

Foundation → framing → finished. Keep that order if you swap any; the
sequence is what makes it read as progress rather than three unrelated
photos.

## `premium` — currently reusing the finished-house shot

The premium pitch is coordination: design, permits, materials, trades.
Finished-house photos say "nice home", not "we managed it for you".
**1600 × 1200 px each.**

1. > Architectural drawings and a material sample board laid out on a
   > timber table. Tape measure and pencil resting on the plans.
   > Natural window light from the left. No faces, no text on the
   > drawings.

2. > Material selections arranged flat on a neutral surface — quartz
   > offcut, tile samples, hardwood flooring, matte black hardware.
   > Directly overhead, soft even light, generous spacing.

3. > A finished high-end kitchen or living space, freshly completed and
   > unstyled. Soft daylight, calm, uncluttered, no people.

Order them 1 → 2 → 3 so the sequence runs plan → selection → result,
mirroring how the service actually works.
