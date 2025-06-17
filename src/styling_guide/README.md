Here's a general styling guide extracted from the provided components, focusing on the "glassmorphism" aesthetic:

## Glassmorphism Styling Guide

The "glassmorphism" effect is achieved through a combination of translucency, blur, borders, and subtle shadows, often with gradients.

### Core Principles

* **Translucency with `backdrop-filter: blur()`**: This is the hallmark of glassmorphism, allowing the background to show through in a blurred fashion.
* **Subtle Borders**: Thin, semi-transparent borders (often `border-white/20` or `border-white/30`) provide definition without being opaque.
* **Light/White Accents**: Many elements use `bg-white/10`, `bg-white/20`, `bg-white/30`, or `bg-white/40` for their translucent backgrounds.
* **Gradients**: Used for backgrounds, icons, and some interactive elements to add depth and visual interest. Common gradients include `from-blue-500 to-purple-600` and `from-yellow-400 to-orange-500`.
* **Shadows**: Subtle shadows (e.g., `shadow-lg`, `shadow-black/20`) enhance the sense of depth and elevation.
* **Rounded Corners**: A consistent use of `rounded-full`, `rounded-sm`, `rounded-md`, or `rounded-l` contributes to a soft, modern look.
* **Text Colors**:
    * `glass-text-primary`: Often a brighter white or light color for main text.
    * `glass-text-secondary`: A more muted white or light color (e.g., `text-white/60`, `text-white/40`) for secondary information or less prominent text.

### Key Components & Their Styling

#### **1. `glass-panel` (Base Panel Style)**

This is the foundational style for most glassmorphic containers.

* `background`: A translucent background, often using `bg-white/10` or a gradient with an alpha channel (e.g., `bg-blue-500/80`).
* `backdrop-filter`: `backdrop-blur-xl` is frequently used to blur content behind the panel.
* `border`: `border border-white/20` or similar for a subtle edge.
* `shadow`: Can include `shadow-2xl shadow-black/20` for elevated panels.
* `border-radius`: Varies (`rounded-sm`, `rounded-md`, etc.) depending on the component, but gently rounded.

**Example Class Names:** `glass-panel`

#### **2. `glass-button`**

Buttons maintain the glassmorphic aesthetic while providing interactivity.

* `background`: Similar to `glass-panel`, often `bg-white/10` or `bg-blue-500/80` for active states.
* `backdrop-filter`: `backdrop-blur-sm`.
* `border`: `border border-white/20`.
* `text-color`: `glass-text-primary`.
* `padding`: Varies based on `size` and `variant` (e.g., `px-4 py-2`, `p-2` for icons).
* `border-radius`: `rounded-sm` or `rounded-md` (for icon buttons).
* `transition`: `transition-colors` for hover effects.

**Example Class Names:** `glass-button`, `glass-button-icon`, `glass-button-sm`, `glass-button-lg`

#### **3. `glass-input`**

Input fields are styled to blend with the glassmorphic theme.

* `background`: Translucent (e.g., `bg-white/10`).
* `backdrop-filter`: `backdrop-blur-sm`.
* `border`: `border border-white/20`.
* `text-color`: `glass-text-primary`.
* `placeholder-color`: `text-white/60`.
* `padding`: `pl-10` (if an icon is present), `px-4 py-2`.
* `border-radius`: `rounded-sm`.

**Example Class Names:** `glass-input`

#### **4. `glass-toggle`**

Toggle switches feature distinct active and inactive states.

* **Track:**
    * `checked`: `bg-blue-500/80 backdrop-blur-sm border border-blue-400/50`.
    * `unchecked`: `bg-white/10 backdrop-blur-sm border border-white/20`.
* **Thumb/Handle:**
    * `background`: `bg-white/90`.
    * `backdrop-filter`: `backdrop-blur-sm`.
    * `border`: `border border-white/30`.
    * `shadow`: `shadow-lg`.
    * `transition`: `transition-all duration-200` for smooth movement.

**Example Class Names:** `glass-toggle`

#### **5. `glass-slider`**

Sliders maintain the transparent, layered look.

* **Track (Background):** `bg-white/10 rounded-full backdrop-blur-sm border border-white/20`.
* **Track (Fill):** `bg-blue-500/80 rounded-full backdrop-blur-sm`.
* **Thumb:** `bg-white/90 rounded-full backdrop-blur-sm border border-white/30 shadow-lg`.

**Example Class Names:** `glass-slider`

#### **6. `glass-dropdown`**

Dropdowns integrate seamlessly into the UI.

* **Button:** Similar styling to `glass-button` (translucent background, border, text).
* **Dropdown Panel:** `glass-panel` style (translucent, blurred, bordered).
* **Dropdown Items:** `w-full text-left px-3 py-1.5 text-sm glass-text-primary hover:bg-white/10 transition-colors`.

**Example Class Names:** `glass-dropdown`

#### **7. Icons and Graphics**

* **Lucide Icons:** Used frequently for clear, concise iconography.
* **Gradient Icons/Shapes:** Many internal icons or decorative elements use vibrant gradients (e.g., `bg-gradient-to-br from-blue-400 to-purple-600`).
* **Inner Shadows/Glows:** Achieved with multiple layered elements, some with blur and opacity (e.g., in `GlassMainContent`).

### Font and Typography

* **Font Weights:** `font-semibold` for headings, `font-normal` for body text.
* **Text Sizes:** `text-xl` for main titles, `text-sm` for most labels and list items, `text-xs` for smaller details.

### Layout and Spacing

* **Flexbox (`flex`):** Heavily used for alignment and distribution of items (`items-center`, `justify-between`, `gap-x`).
* **Padding and Margins:** Consistent use of Tailwind's spacing classes (e.g., `p-4`, `px-6`, `mx-6`, `mb-4`, `space-y-x`, `gap-x`).

### General Utility Classes

* `w-X h-Y`: For fixed dimensions.
* `relative`, `absolute`, `inset-0`: For positioning elements, especially for overlays and shadows.
* `transform -translate-x-1/2 -translate-y-1/2`: For centering elements.
* `transition-all duration-X`: For smooth animations.

By adhering to these principles and utilizing the described class patterns, you can create new components that fit seamlessly into the existing "Glass UI" design language.

@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}


import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
