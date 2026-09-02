---
name: Modern Heritage
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1c19'
  on-tertiary-container: '#858480'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#e5e2dd'
  tertiary-fixed-dim: '#c9c6c2'
  on-tertiary-fixed: '#1c1c19'
  on-tertiary-fixed-variant: '#474743'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

This design system embodies the essence of "Quiet Luxury." It is curated for a discerning audience that values discretion, architectural precision, and the warmth of high-end hospitality. The visual narrative leans into a **Minimalist** aesthetic with a **Corporate/Modern** backbone, ensuring the interface feels like an editorial publication rather than a software tool.

The brand personality is sophisticated and composed. It avoids trends in favor of timelessness. The emotional response should be one of immediate serenity and absolute trust—evoking the feeling of stepping into a five-star private villa. 

Key stylistic pillars include:
- **Spatial Generosity:** Using whitespace as a functional element to denote prestige.
- **Architectural Alignment:** A rigorous adherence to grid structures to reflect structural integrity.
- **Micro-interactions:** Subtle, high-inertia transitions that mimic the slow, deliberate pace of premium travel.

## Colors

The palette is rooted in an "Organic Neutral" foundation. It uses high-contrast charcoal and blacks for structural elements, while soft beiges and crisp whites provide the "breathable" background required for a luxury feel.

- **Primary (Charcoal/Black):** Used for primary text and structural borders to provide weight and authority.
- **Secondary (Muted Bronze/Gold):** Reserved for high-value calls to action, active states, and premium accents. It should be used sparingly to maintain its impact.
- **Neutral/Backgrounds:** A tiered system of `Warm Beige (#F5F2ED)` and `Pure White (#FFFFFF)` creates depth without relying on shadows.
- **Functional Grays:** Used for secondary metadata and disabled states, ensuring the interface remains soft and accessible.

## Typography

The typography strategy employs a "High-Contrast Pairing" typical of luxury fashion and architecture journals.

- **Headlines:** Use *Bodoni Moda*. This serif provides the necessary "editorial" gravity. It should be set with tight tracking in larger sizes to emphasize its vertical stroke contrast.
- **Body & UI:** Use *Hanken Grotesk*. This typeface provides a clean, technical counterpoint to the serif. It offers exceptional legibility at small sizes for booking details and property descriptions.
- **Utility:** Small caps are used for labels and overlines (eyebrows) to provide clear hierarchy without adding visual bulk.

## Layout & Spacing

The design system utilizes a **Fixed Grid** model for desktop to ensure content remains centered and curated, transitioning to a **Fluid Grid** for mobile devices.

- **The 8px Rule:** All spacing between elements must be a multiple of 8px (8, 16, 24, 32, 48, 64, 80).
- **Vertical Rhythm:** A significant "Section Gap" (120px) is used to separate distinct content areas, reinforcing the feeling of an unhurried, spacious experience.
- **Desktop Grid:** 12 columns with a 24px gutter. Content should primarily occupy the center 8 or 10 columns for long-form reading.
- **Mobile Grid:** 4 columns with 20px side margins. Images should often bleed to the edge of the screen to create an immersive visual experience.

## Elevation & Depth

This design system prioritizes **Tonal Layers** and **Low-Contrast Outlines** over heavy shadows. Depth is achieved through the stacking of colors rather than artificial light sources.

- **Level 0 (Base):** Soft Beige (#F5F2ED).
- **Level 1 (Cards/Containers):** Pure White (#FFFFFF) with a 1px solid border in a very faint neutral (#E5E5E5).
- **Interactive States:** When an element is hovered, it does not "lift" with a shadow; instead, it may shift color (e.g., from beige to white) or the border color may darken to the Bronze primary.
- **Overlay/Modals:** Use a high-density Backdrop Blur (32px) with a 40% opacity black overlay to keep the focus on the foreground while maintaining the "Glassmorphism" of luxury high-end materials.

## Shapes

The shape language is strictly **Sharp (0px)**. 

Sharp corners evoke a sense of architectural precision and high-end tailoring. This applies to all primary UI components including buttons, input fields, and image containers. 

*Exception:* Only the user avatar and specific circular icon buttons may use a "Pill-shaped" radius to provide a soft human touch amongst the rigid architectural lines.

## Components

### Buttons
- **Primary:** Solid Charcoal background with White text. Sharp corners. No shadow.
- **Secondary:** Transparent background with 1px Charcoal or Bronze border.
- **Text Link:** Underlined serif text, using a 1px offset underline that disappears on hover.

### Input Fields
- Underline style preferred over boxed style for a more "concierge form" feel. 
- Active state: The underline transitions from light gray to the Muted Bronze.

### Cards
- Images must maintain a fixed aspect ratio (preferably 4:5 or 16:9).
- Information is placed below the image with generous padding. No borders around the card; the image and typography define the boundaries.

### Chips & Tags
- Used for property amenities (e.g., "Pool," "Chef Included").
- Small caps typography, background matches the section background for a "ghost" effect.

### Navigation
- A floating header that becomes semi-transparent on scroll. 
- The logo (from IMAGE_1) should be centered in the navigation on landing pages to establish brand authority.