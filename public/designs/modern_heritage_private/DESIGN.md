---
name: Modern Heritage Private
colors:
  surface: '#151310'
  surface-dim: '#151310'
  surface-bright: '#3c3935'
  surface-container-lowest: '#100e0b'
  surface-container-low: '#1e1b18'
  surface-container: '#221f1c'
  surface-container-high: '#2c2926'
  surface-container-highest: '#373431'
  on-surface: '#e8e1dc'
  on-surface-variant: '#d1c5b7'
  inverse-surface: '#e8e1dc'
  inverse-on-surface: '#33302c'
  outline: '#998f83'
  outline-variant: '#4d463c'
  surface-tint: '#e1c296'
  primary: '#e1c296'
  on-primary: '#402d0d'
  primary-container: '#b89b72'
  on-primary-container: '#473313'
  inverse-primary: '#725a37'
  secondary: '#c7c6c6'
  on-secondary: '#303031'
  secondary-container: '#464747'
  on-secondary-container: '#b6b5b5'
  tertiary: '#b8c7e3'
  on-tertiary: '#223146'
  tertiary-container: '#91a0ba'
  on-tertiary-container: '#28374d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb0'
  primary-fixed-dim: '#e1c296'
  on-primary-fixed: '#281800'
  on-primary-fixed-variant: '#594321'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#b8c7e3'
  on-tertiary-fixed: '#0c1c30'
  on-tertiary-fixed-variant: '#39475e'
  background: '#151310'
  on-background: '#e8e1dc'
  surface-variant: '#373431'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 64px
    fontWeight: '600'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: Bodoni Moda
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style
The design system embodies the atmosphere of an exclusive, members-only digital sanctum. It transitions the brand identity into a "Private Club" aesthetic, prioritizing privacy, prestige, and high-end curation. 

The style is **Minimalist-Luxury**, characterized by expansive dark space, high-contrast serif typography, and a "Night Mode" elegance that feels both quiet and powerful. The UI should evoke the sensation of tactile materials—heavy paper, brushed metal, and dark velvet—through the use of subtle gradients and meticulous spacing. 

Visual weight is concentrated on imagery and typography, with UI chrome receding into the deep charcoal background to ensure a focused, premium experience for an elite audience.

## Colors
The palette is rooted in a "Noir-Luxe" spectrum. 
- **Main Surface (#121212):** A deep charcoal that serves as the canvas for all content, providing a softer, more premium feel than pure black.
- **Depth (#0a0a0a):** Used for background recessed areas, navigation bars, or footer sections to create a sense of infinite scale.
- **Primary Text (#f5f3f3):** A soft ivory that provides high legibility without the harshness of pure white, maintaining a vintage editorial feel.
- **Bronze Accent (#b89b72):** A muted, metallic bronze used sparingly for calls to action, active states, and premium highlights. 

Avoid vibrant or neon colors; all functional states (success, error) should be desaturated to maintain the prestigious tone.

## Typography
The typography pairing balances historical authority with modern precision. 
- **Bodoni Moda** is used for all headlines. Its high-contrast strokes reflect the heritage aspect of the brand. For large display sizes, use a slightly tighter letter spacing to increase the sense of "editorial" tension.
- **Hanken Grotesk** provides a clean, contemporary contrast for body text and functional labels. Its geometric but warm construction ensures readability across long-form content.
- Use **Label-Caps** for category tags and small navigation items to reinforce the "private club" archival feel.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to create a centered, curated "stage" for content. On mobile, it transitions to a fluid model with generous margins.

- **Rhythm:** Use an 8px base unit. Spacing should be intentional and "wasteful"—wide margins and large gaps between sections (120px+) convey luxury and a lack of urgency.
- **Grid:** A 12-column grid for desktop with wide 24px gutters. 
- **Alignment:** Centralize key content to evoke the feeling of an invitation or a high-end publication.

## Elevation & Depth
In this dark environment, depth is achieved through **Tonal layering** and **Subtle Inner Glows** rather than traditional drop shadows.

- **Surface Tiers:** Elevated elements (like cards) use a slightly lighter charcoal (#1c1c1c) than the background.
- **Outlines:** Use "Ghost Borders"—1px solid strokes in low-opacity Ivory (10-15%) to define boundaries without adding visual noise.
- **Shadows:** If used, shadows must be ultra-diffused, using a deep black color with a large blur radius (30px+) to create a soft "lift" effect rather than a hard edge.

## Shapes
The shape language is **Soft (Level 1)**. This system avoids the "friendliness" of round pills and the "aggression" of sharp 90-degree corners. 

A 4px (0.25rem) radius is the standard for buttons and inputs, providing a precise, tailored appearance. Imagery may remain sharp (0px radius) to maintain a classic photography-first feel, while interactive containers use the soft radius for a tactile, modern touch.

## Components
- **Buttons:** Primary buttons feature a Bronze (#b89b72) background with off-black text. Secondary buttons use a transparent background with a 1px soft ivory border. Transition effects should be slow and elegant (300ms ease-out).
- **Cards:** Cards should have no background by default, defined only by a 1px border or a subtle tonal shift on hover.
- **Inputs:** Underline-style inputs are preferred over boxed inputs to mirror architectural lines. The active state should highlight the underline in Bronze.
- **Chips:** Small, rectangular tags with the `label-caps` typography, using a dark-gray fill and ivory text.
- **Lists:** Use wide spacing between list items, separated by a 1px line at 5% opacity ivory.
- **Exclusive Elements:** Incorporate a custom "Member Badge" or "Seal" component—a small, sophisticated graphic element used to mark verified or premium content.