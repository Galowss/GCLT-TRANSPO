---
name: GCLT Transport Design System
colors:
  surface: '#f6fbf3'
  surface-dim: '#d7dbd4'
  surface-bright: '#f6fbf3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f5ee'
  surface-container: '#ebefe8'
  surface-container-high: '#e5e9e2'
  surface-container-highest: '#dfe4dd'
  on-surface: '#181d19'
  on-surface-variant: '#3f4941'
  inverse-surface: '#2d322d'
  inverse-on-surface: '#eef2eb'
  outline: '#6f7a70'
  outline-variant: '#bec9be'
  surface-tint: '#006d3c'
  primary: '#00522c'
  on-primary: '#ffffff'
  primary-container: '#006d3c'
  on-primary-container: '#92ecae'
  inverse-primary: '#80d99d'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#7c2b33'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a4249'
  on-tertiary-container: '#ffcccd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9bf6b7'
  primary-fixed-dim: '#80d99d'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#00522c'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b5'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#7c2b33'
  background: '#f6fbf3'
  on-background: '#181d19'
  surface-variant: '#dfe4dd'
  success-bg: '#EBF9F1'
  status-transit: '#005EB8'
  status-delayed: '#D32F2F'
  status-pending: '#F59E0B'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style

The design system is built on the pillars of **reliability, efficiency, and industrial strength**. Tailored for the logistics and trucking sector, the UI evokes a sense of "moving parts in perfect sync." It targets business owners, fleet managers, and logistics coordinators who require speed and precision.

The visual style is **Corporate / Modern** with a lean toward functional utility. It uses a clean, structured layout to reduce cognitive load during complex tasks like multi-step bookings or inventory management. The aesthetic is "Heavy-Duty Professional"—using solid blocks of color, precise alignment, and clear data visualization to establish trust.

## Colors

The palette is anchored by **Forest Green** (Primary), symbolizing growth and the "go" signal of logistics, and **Deep Carbon** (Secondary), representing the industrial nature of the trucking fleet.

- **Primary (#006D3C):** Used for main CTAs, active progress indicators, and primary branding.
- **Secondary (#1A1A1A):** Used for high-level headers, heavy typography, and deep-background sections.
- **Surface Neutrals:** A pale mint-tinted white (#EBF9F1) is used as a background wash for dashboards to reduce eye strain compared to pure white, while pure white (#FFFFFF) is reserved for cards and input fields to pop against the background.
- **Status Colors:** Functional colors are used strictly for shipment tracking—Blue for "In Transit," Amber for "Pending/Idle," and Red for "Critical/Delayed."

## Typography

This design system uses a dual-font approach to balance personality with readability.

- **Manrope** is used for headlines. Its geometric yet slightly condensed nature feels modern and architectural, perfect for professional service headers.
- **Inter** is used for all body text, UI labels, and data entry. Its high legibility at small sizes makes it ideal for complex inventory tables and multi-step forms.

**Usage Note:** Bold labels (`label-bold`) should be used for metadata in truck cards (e.g., "VIN NUMBER," "PAYLOAD CAPACITY") to ensure quick scanning.

## Layout & Spacing

The system employs a **12-column fixed grid** for desktop and a **4-column fluid grid** for mobile. 

The spacing rhythm is based on a **4px base unit**. All padding and margins should be multiples of 4 (e.g., 8, 16, 24, 32, 48, 64). 

- **Density:** Use generous spacing (32px+) between major sections to maintain a "premium/professional" feel. 
- **Inventory Grids:** Truck inventory cards should be laid out in a responsive grid that shifts from 3 columns (Desktop) to 2 columns (Tablet) to 1 column (Mobile).
- **Form Layouts:** Multi-step forms should be centered within an 8-column span on desktop to keep input fields at an optimal reading width.

## Elevation & Depth

The design system uses **Tonal Layering** with very subtle **Ambient Shadows** to define hierarchy.

- **Level 0 (Base):** Background wash (#EBF9F1).
- **Level 1 (Cards/Inputs):** White (#FFFFFF) surfaces with a 1px border (#D1D5DB) or a very soft, diffused shadow (0px 2px 4px rgba(0,0,0,0.05)).
- **Level 2 (Dropdowns/Modals):** Pure white with a more pronounced elevation shadow (0px 10px 15px rgba(0,0,0,0.1)) to indicate temporary interaction layers.

Avoid heavy gradients. Depth is primarily communicated through the contrast between the off-white background and crisp white functional elements.

## Shapes

The shape language is **Soft (0.25rem / 4px)**. 

This minimal rounding provides a modern touch without sacrificing the "industrial" and "sturdy" feel of a logistics company. 
- **Buttons and Inputs:** Use 4px corner radius.
- **Inventory Cards:** Use 8px (`rounded-lg`) to differentiate larger containers from smaller UI elements.
- **Status Pills:** Use a fully rounded pill shape (100px) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid Forest Green (#006D3C) with white text. High emphasis.
- **Secondary:** Transparent with a 2px Carbon (#1A1A1A) border.
- **Action:** For "Book Now," use a high-contrast combination of primary green and white text.

### Status Indicators
- Use the pill-shaped badges with a light background and dark text of the same hue (e.g., Light Blue background with Dark Blue text for "In Transit").

### Truck Inventory Cards
- **Structure:** Large truck image at top, followed by a headline (Model Name), a grid of 4 metadata points (Payload, Year, Fuel, Transmission), and a primary action button at the bottom.
- **Hover State:** Lift the card slightly (increase shadow) and shift the border color to Primary Green.

### Multi-step Forms
- **Progress Tracker:** A horizontal line with numbered circles at the top. Completed steps show a checkmark in Primary Green.
- **Navigation:** "Back" should be a ghost button; "Continue/Next" should be a solid Primary button.

### Input Fields
- Use clear top-aligned labels in `label-bold`.
- 1px border (#D1D5DB) that turns Forest Green on focus with a 2px outer glow.