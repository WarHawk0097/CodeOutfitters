# CodeOutfitters — Finalized Reference Handoff

Source of truth: `reference/desktop.png`.

Important: all measurements, colors, spacing, typography sizes, shadows, glows, and dimensions are estimated from the provided reference image unless explicitly marked otherwise.

Non-negotiable: do not redesign, do not invent sections, do not flatten editable UI into full-section images, and do not drift from the approved visual reference.


# ASSET_PROMPTS.md

## Global generation rules for every asset
Use `reference/desktop.png` as the only source of truth. Generate or recreate only the requested asset. Do not create a full card, full section, full homepage, random variants, extra icons, or generic replacements. Preserve the warm ivory, teal, and gold system. Use transparent background unless the asset is explicitly a texture.

---

## 1. Logo mark
**Filename:** `logos/codeoutfitters-mark.svg`  
**Prompt:**
Create the CodeOutfitters logo mark from the finalized reference as an editable SVG. It is a teal code-bracket/slash style mark, simple geometric line form, approx 32×32. Use clean rounded strokes, no text, no wordmark, no background. Export as SVG with a clean viewBox and currentColor or teal fill/stroke. Avoid pixel rasterization, emoji style, or extra shapes.

## 2. Hero pedestal base
**Filename:** `hero/hero-pedestal-base-light.png`  
**Prompt:**
Create only the hero pedestal/base from the finalized reference. Isolated PNG/WebP with true transparent alpha. Include the layered ivory rounded platform, isometric perspective, subtle bevels, warm gold edge light, teal center glow reflected on the platform, and soft floor shadow. Do not include floating glass panels, icons, labels, headline text, buttons, or page background. Match the exact perspective, proportions, corner radius, gold edge strip, shadow softness, and premium 3D material from the reference.

## 3. Hero center glow beam
**Filename:** `hero/hero-center-glow-beam.png`  
**Prompt:**
Create only the teal vertical center glow beam from the hero platform. Transparent PNG, no platform, no panels, no text. It should be a soft volumetric teal/aqua glow with transparent falloff, strongest at bottom center and fading upward. It must layer cleanly above the pedestal and behind floating panels.

## 4. Hero AI agent glass panel
**Filename:** `hero/hero-panel-ai-agent-glass.png`  
**Prompt:**
Create only the tall rear hero glass panel from the finalized reference. Transparent PNG/WebP. Include translucent warm-ivory glass, rounded corners, inner glow, subtle teal tint, soft edge highlight, and correct perspective. Do not include robot icon or label text unless explicitly exported separately. No pedestal, no other panels, no background.

## 5. Hero workflow glass panel
**Filename:** `hero/hero-panel-workflow-glass.png`  
**Prompt:**
Create only the front-left workflow glass panel from the hero visual. Transparent PNG/WebP. Include translucent warm glass material, rounded corners, subtle teal center glow, soft inner reflections, slight perspective tilt. No workflow icon, no label text, no pedestal, no other panels.

## 6. Hero data glass panel
**Filename:** `hero/hero-panel-data-glass.png`  
**Prompt:**
Create only the front-right data glass panel from the hero visual. Transparent PNG/WebP. Match the smaller rectangular panel with warm glass, rounded corners, edge highlights, slight perspective, and soft teal light. No database icon, no label text, no pedestal, no other panels.

## 7. Hero decorative light rods
**Filename:** `hero/hero-light-rods.svg`  
**Prompt:**
Create the sparse vertical decorative light rods/particles surrounding the hero visual as editable SVG. Use thin gold/cream lines with tiny circular nodes. No panels, no platform, no text. Keep subtle, sparse, elegant, and positioned like the reference. Export with transparent background and separate grouped layers for easy opacity adjustment.

## 8. Hero floor linework
**Filename:** `decorative/hero-floor-linework.svg`  
**Prompt:**
Create the subtle isometric floor/circuit linework around the hero platform. Use very thin warm beige/gold strokes with low opacity. Transparent SVG. No platform, no panels, no icons, no text. Must look like delicate technical linework under the hero visual.

## 9. AI agent face icon
**Filename:** `icons/icon-ai-agent-face.svg`  
**Prompt:**
Create the robot/AI agent face icon used inside the hero AI Agents panel. Editable SVG. Teal face screen with cream/gold headphone side forms, simple rounded robot expression, no text. Match reference proportions and friendly premium style. Transparent background.

## 10. Workflow nodes icon
**Filename:** `icons/icon-workflow-nodes.svg`  
**Prompt:**
Create the workflow nodes icon from the hero workflow panel. Editable SVG. Small connected square nodes in teal with a tiny gold top node/accent. No text. Rounded nodes and clean connector lines. Transparent background.

## 11. Database stack icon
**Filename:** `icons/icon-database-stack.svg`  
**Prompt:**
Create the database stack icon from the hero data panel. Editable SVG. Three stacked cylinder bands in warm gold/cream with subtle teal shadow. No text. Transparent background.

## 12. Hero feature icons
**Filename:** `icons/icon-automate.svg`, `icons/icon-orchestrate.svg`, `icons/icon-scale.svg`  
**Prompt:**
Create three separate small SVG icons matching the hero chips. Teal line style, 16–20px visual size, clean rounded strokes. Automate: sparkle/automation mark. Orchestrate: power/orchestration icon. Scale: diamond/scale mark. No text, no background.

## 13. Trust logos
**Filename:** `logos/trust-logo-*.svg`  
**Prompt:**
Recreate the trust logo row as editable placeholder SVG/text combinations only if legally allowed. Use grayscale marks and editable text matching spacing/mood from reference. If real customer logos are not approved, use neutral placeholder brand names exactly as visible only for mockup/demo, with a note to replace before production. Do not rasterize the entire trust strip.

## 14. Ticket resolution gauge
**Filename:** `features/ticket-resolution-gauge.svg`  
**Prompt:**
Create the semicircle gauge from the AI Helpdesk card as editable SVG. Teal arc around 92% with light background arc. Center text should not be part of the SVG unless explicitly requested; keep number as editable text in UI. Transparent background. Animation-ready stroke path.

## 15. Status/live pill icon
**Filename:** `icons/icon-live-dot.svg`  
**Prompt:**
Create the small live status dot icon used in the AI Helpdesk card. Editable SVG, teal filled circle with subtle inner/outer ring. No text.

## 16. Calendar mini widget
**Filename:** `features/calendar-mini-widget.svg`  
**Prompt:**
Create the calendar grid visual from Booking Automation card as editable SVG or native design group. Include month layout, tiny day cells, selected teal day circle, and subtle arrows if needed. Do not bake card title/body. Calendar numerals may be editable text layers; prefer native design text, not raster.

## 17. Confirmed pill icon
**Filename:** `icons/icon-confirmed-dot.svg`  
**Prompt:**
Create small circular confirmation icon for the “Confirmed” pill. Teal/cream circle with check-like detail. No text.

## 18. CRM workflow icon set
**Filename:** `features/crm-workflow-icons.svg`  
**Prompt:**
Create the CRM workflow icon row as editable SVG groups: check square, arrow, check square, arrow, chat square, arrow, edit square. Use teal strokes, rounded square outlines, warm cream fill, subtle shadow if recreated as components. No text labels.

## 19. Lead capture user icon
**Filename:** `icons/icon-lead-capture-user.svg`  
**Prompt:**
Create small teal user/lead icon used in lead row. Editable SVG, rounded line style, no text.

## 20. Lead avatar placeholder
**Filename:** `avatars/lead-avatar-placeholder.webp`  
**Prompt:**
Create or select a generic non-identifiable business avatar similar to the tiny avatar in the Lead Capture card. Small circular crop, warm realistic style, not a real identifiable person, no name or text in image.

## 21. Chevron right
**Filename:** `icons/icon-chevron-right.svg`  
**Prompt:**
Create a simple right chevron icon used in lead rows and secondary CTA. Editable SVG, dark/teal stroke, rounded cap, no text.

## 22. Analytics line chart
**Filename:** `features/analytics-line-chart.svg`  
**Prompt:**
Create the line chart from Analytics Dashboard card as editable SVG. Use teal upward trending line, light green area fill, final circular data point at top right. No axes labels, no numbers, no card text. Animation-ready path for line draw.

## 23. Hermes radar visual
**Filename:** `features/hermes-radar-visual.png`  
**Prompt:**
Create only the circular radar visual from the Hermes Agent Deployment card. Transparent PNG/WebP. Include concentric teal rings, quadrant crosshair lines, central pulse, soft glassy radial gradients, and subtle depth. Include no card container, no heading, no body text. The shield/check badge can be separate unless asked to combine.

## 24. Hermes shield badge
**Filename:** `features/hermes-shield-check.svg`  
**Prompt:**
Create the small shield/check badge below the Hermes radar. Editable SVG. Warm ivory/gold shield with teal check mark, subtle border, no text.

## 25. Process line
**Filename:** `process/process-line.svg`  
**Prompt:**
Create the horizontal process timeline line as editable SVG/CSS asset. Thin gray-beige line with teal nodes over it. Prefer implementation as CSS line and circles, but export SVG guide if required. No text.

## 26. Process node
**Filename:** `process/process-node.svg`  
**Prompt:**
Create the teal circular process node with white number area style. Editable SVG/CSS, 34×34. Number should be editable text, not baked into icon unless explicitly requested.

## 27. CTA dotted radial pattern
**Filename:** `cta/cta-dotted-radial-pattern.svg`  
**Prompt:**
Create the dotted radial pattern visible at the right edge of the CTA panel. Transparent SVG. Use small warm gold/teal dots arranged in a subtle radial/halftone arc. Low opacity, soft, decorative. No text, no panel background.

## 28. CTA avatar cluster
**Filename:** `avatars/cta-avatar-cluster.webp`  
**Prompt:**
Create a small cluster of five generic professional avatar circles matching the CTA reference. Non-identifiable, diverse, clean business headshots, warm lighting, circular masks with slight overlap. Transparent background or separately exported circular images. No names, no initials, no text.

## 29. Star icon
**Filename:** `icons/icon-star-filled.svg`  
**Prompt:**
Create a filled gold star icon matching the CTA rating row. Editable SVG, no text.

## 30. Subtle warm noise
**Filename:** `backgrounds/subtle-warm-noise.webp`  
**Prompt:**
Create a very subtle warm ivory paper/noise texture for the page background. It must be nearly invisible, low contrast, seamless/tileable if possible. No visible shapes, no text.
