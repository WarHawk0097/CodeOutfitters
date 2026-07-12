# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# TOKENS.md

## Color tokens

All values are estimated from the reference image.

### Primary
| Token | Hex | Usage |
|---|---:|---|
| `--color-primary-900` | `#045B52` | deep teal text/accent |
| `--color-primary-800` | `#05766B` | button dark edge |
| `--color-primary-700` | `#078A7B` | primary teal |
| `--color-primary-600` | `#0E9D8B` | active teal accents |
| `--color-primary-500` | `#13B6A2` | glowing teal highlight |
| `--color-primary-100` | `#DDF3EE` | pale teal backgrounds |
| `--color-primary-050` | `#EEF9F6` | chip/card tint |

### Warm neutral / background
| Token | Hex | Usage |
|---|---:|---|
| `--color-bg-page` | `#FBF8EF` | main page background |
| `--color-bg-card` | `#FFFDF8` | cards |
| `--color-bg-soft` | `#F8F2E6` | subtle panel tint |
| `--color-bg-cream` | `#FFF8EC` | hero illustration glass warmth |
| `--color-border-warm` | `#E7DBC5` | section dividers/card borders |

### Gold accent
| Token | Hex | Usage |
|---|---:|---|
| `--color-gold-700` | `#B9791F` | dark gold edge |
| `--color-gold-500` | `#D9A441` | accent line/star |
| `--color-gold-300` | `#F1D087` | soft glow |
| `--color-gold-100` | `#FFF0C8` | pale highlight |

### Text
| Token | Hex | Usage |
|---|---:|---|
| `--color-text-strong` | `#10100E` | headings |
| `--color-text-body` | `#26231E` | body |
| `--color-text-muted` | `#68645D` | secondary text |
| `--color-text-soft` | `#8A857B` | captions |
| `--color-text-inverse` | `#FFFFFF` | button text |

### Trust/logo gray
| Token | Hex | Usage |
|---|---:|---|
| `--color-logo-gray` | `#5A5D61` | trust logos |
| `--color-line-gray` | `#DAD4C8` | process line |

## Gradients

### Primary button gradient
```css
background: linear-gradient(180deg, #0C8F80 0%, #06796E 100%);
```

### Hero teal glow
```css
background: radial-gradient(circle, rgba(19,182,162,.42) 0%, rgba(19,182,162,.14) 36%, rgba(19,182,162,0) 72%);
```

### Gold edge glow
```css
box-shadow: 0 0 18px rgba(217,164,65,.35), inset 0 1px 0 rgba(255,255,255,.7);
```

### Card surface
```css
background: linear-gradient(180deg, #FFFDF8 0%, #FBF7EE 100%);
```

## Shadows

```css
--shadow-xs: 0 1px 2px rgba(32, 24, 12, 0.05);
--shadow-sm: 0 4px 12px rgba(32, 24, 12, 0.07);
--shadow-card: 0 12px 28px rgba(32, 24, 12, 0.09);
--shadow-hero: 0 22px 50px rgba(32, 24, 12, 0.13);
--shadow-button: 0 8px 18px rgba(7, 138, 123, 0.20);
```

## Glow tokens

```css
--glow-teal-soft: 0 0 28px rgba(19, 182, 162, 0.20);
--glow-teal-medium: 0 0 48px rgba(19, 182, 162, 0.32);
--glow-gold-soft: 0 0 24px rgba(217, 164, 65, 0.20);
```

## Blur / opacity
```css
--blur-glass: 18px;
--blur-soft: 32px;
--opacity-glass-panel: 0.72;
--opacity-border-subtle: 0.56;
--opacity-decoration: 0.55;
```

## Typography recommendations

### Heading font
Recommended: `Cormorant Garamond`, `Playfair Display`, or `Fraunces`.
Use for hero headline and major section headlines.

### Body/UI font
Recommended: `Inter`, `Manrope`, or `Satoshi`.
Use for body, nav, cards, labels, buttons.

## Desktop font sizes

| Role | Size | Line height | Weight |
|---|---:|---:|---:|
| Hero headline | 54–60px | 1.03 | 600–700 |
| Section headline | 30–34px | 1.14 | 600–700 |
| Card title | 17–20px | 1.25 | 600 |
| Body | 16–18px | 1.55 | 400 |
| Nav | 14–15px | 1.2 | 500 |
| Button | 15–16px | 1.2 | 600 |
| Label | 11–12px | 1.1 | 700 |

## Tablet font sizes
Hero 42–48px, section headlines 28–32px, body 15–17px, cards 15–18px.

## Mobile font sizes
Hero 36–42px, section headlines 26–30px, body 15–16px, cards 15–17px, labels 10–12px.

## Letter spacing
```css
--tracking-label: 0.08em;
--tracking-logo-row: 0.14em;
--tracking-normal: 0em;
```

## Spacing scale
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

## Section padding
Desktop: 56–72px horizontal inside page shell, 42–72px vertical.
Mobile: 20–24px horizontal, 36–48px vertical.

## Card padding
Small cards: 20–24px. Large cards/CTA: 32–48px.

## Button padding
Primary: 16px 28px. Secondary: 15px 24px plus icon circle.

## Radius scale
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-2xl: 32px;
--radius-page: 16px;
--radius-pill: 999px;
```

## Border rules
Warm border: 1px solid rgba(231,219,197,.75).
Teal border for active/chips: 1px solid rgba(7,138,123,.35).

## Z-index/layering
- Base background: 0
- Decorative patterns/glows: 1
- Cards/panels: 2
- Hero floating panels: 4
- Buttons/nav: 5
- Mobile overlay menu: 20
