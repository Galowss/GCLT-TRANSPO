---
name: Industrial Excellence System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#3f4940'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#6f7a70'
  outline-variant: '#bec9be'
  surface-tint: '#0b6d3b'
  primary: '#004d27'
  on-primary: '#ffffff'
  primary-container: '#006837'
  on-primary-container: '#8ee4a6'
  inverse-primary: '#83d99c'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#37463e'
  on-tertiary: '#ffffff'
  tertiary-container: '#4e5d55'
  on-tertiary-container: '#c4d5cb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ef6b6'
  primary-fixed-dim: '#83d99c'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#00522a'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#d6e7dc'
  tertiary-fixed-dim: '#bacac0'
  on-tertiary-fixed: '#101e18'
  on-tertiary-fixed-variant: '#3b4a42'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
  safety-green: '#006837'
  industrial-black: '#111827'
  surface-mint: '#E8F9EE'
  alert-red: '#DC2626'
  caution-amber: '#F59E0B'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
---

## Brand & Style

This design system is built for the high-stakes world of trucking and logistics, where reliability and efficiency are paramount. The brand personality is **rugged, authoritative, and precise**, mirroring the physical strength of heavy-duty transport and the digital accuracy of modern supply chain management.

The visual style is **Corporate/Modern with a High-Contrast Industrial edge**. It utilizes wide layouts, substantial structural elements, and a "function-over-form" aesthetic that remains sophisticated. The design emphasizes clarity and trust through disciplined alignment, heavy typography, and a "Safety-First" color logic. It avoids unnecessary decoration in favor of clear data visualization and high-impact photography of the fleet in motion.

## Colors

The color palette is anchored by **Deep Forest Green**, symbolizing stability, safety, and the "green light" of efficient logistics. This is paired with **Industrial Black** for primary text and structural elements, providing a heavy, grounded feel.

- **Primary (Deep Green):** Used for primary actions, branding elements, and success states. It represents the professional authority of the company.
- **Secondary (Industrial Black):** Used for navigation bars, headings, and high-impact backgrounds to evoke the ruggedness of the road.
- **Tertiary (Surface Mint):** A soft, low-saturation background color used to distinguish content blocks and dashboard widgets without overwhelming the eye.
- **Functional Accents:** High-visibility Red and Amber are reserved strictly for status alerts, delays, and critical maintenance notifications.

## Typography

The typography strategy balances character with utility. **Manrope** is used for headlines to provide a modern, geometric, and technical appearance that feels engineered. **Inter** is used for all functional UI text, data tables, and body copy to ensure maximum legibility across all device types and lighting conditions.

Heavy weights (700+) should be used for primary headings to reinforce the "rugged" brand persona. Letter spacing is tightened on large headlines for a more compact, impactful look, while labels utilize increased tracking and uppercase styling to mimic industrial signage and wayfinding.

## Layout & Spacing

The layout utilizes a **12-column fixed grid** for desktop applications to maintain a structured, organized feel essential for logistics planning. Mobile views transition to a single-column fluid layout with generous 16px side margins.

Spacing follows a strict **8px base unit** to ensure mathematical harmony. Dashboards should prioritize "Information Density" without sacrificing clarity, using 24px gutters to allow complex data sets to breathe. 

**Breakpoints:**
- **Mobile:** 0px - 767px (4 columns)
- **Tablet:** 768px - 1023px (8 columns)
- **Desktop:** 1024px+ (12 columns, 1280px max-width container)

## Elevation & Depth

This design system avoids excessive shadows to maintain a "flat and sturdy" industrial look. Instead, depth is conveyed through **Tonal Layers** and **Low-contrast outlines**.

- **Level 0 (Surface):** The main background using #FFFFFF or #F9FAFB.
- **Level 1 (Card/Container):** Raised using a 1px border (#E5E7EB) or the Tertiary #E8F9EE color to separate content.
- **Interaction Depth:** Only active elements (like primary buttons or hovered cards) receive a subtle, crisp shadow (4px blur, 10% opacity black) to indicate interactivity.
- **Overlay:** Full-screen modals use a high-opacity backdrop (#111827 at 60%) to pull focus entirely to the task at hand.

## Shapes

The shape language is **Soft (0.25rem)**. The design favors structural rigidity over playfulness. This subtle rounding provides a modern touch that prevents the UI from feeling dated or harsh, while maintaining the "blocky," strong silhouettes associated with heavy machinery and freight containers.

- **Buttons & Inputs:** 4px (0.25rem) radius.
- **Cards & Modals:** 8px (0.5rem) radius for larger structural containers.
- **Data Badges:** 2px radius for a sharper, more technical appearance.

## Components

### Buttons
Primary buttons use the **Primary Green** with white text. They are large (min-height 48px) and feature bold Inter typography. Secondary buttons use a heavy 2px Industrial Black border with no fill.

### Cards
Cards are the primary container for shipment details and driver data. They must feature a clear header section using #F3F4F6 and a 1px bottom border to separate titles from metadata.

### Input Fields
Fields must be robust with clearly defined borders. Focus states utilize a 2px Primary Green ring. "Rugged" styling dictates that labels always sit above the input field, never as floating placeholders, to ensure visibility at all times.

### Status Chips
Status indicators for "In Transit," "Delivered," or "Delayed" use high-contrast pill shapes. They utilize a background-tint method (e.g., #006837 at 10% opacity for the background, 100% opacity for the text) to ensure they are legible but not distracting.

### Data Tables
Tables are central to the logistics experience. They should use Zebra-striping (#F9FAFB) and sticky headers. Font sizes in tables can drop to 14px (Label-bold) to maximize information density for dispatchers.