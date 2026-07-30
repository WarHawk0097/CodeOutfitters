// Guards the bespoke-web-application repositioning of the public site.
//
// Three things are protected here, in order of how much damage a regression would do:
//
//  1. Safety. VoiceDesk's owner-supplied route is an unauthenticated operational
//     dashboard holding phone-number-shaped records, so it must not appear anywhere
//     in the repository — not in portfolio data, markup, metadata, structured data,
//     the sitemap or alt text. Pro Photo Systems publishes on the `www` host only,
//     so the apex form must never be linked. These are absence assertions across
//     the whole tracked source tree, which is stricter than checking one render.
//  2. Positioning. Bespoke web applications lead the hero, the service hierarchy
//     and the navigation; WhatsApp is one integration inside service 03 and never a
//     service, a hero reference or a primary call to action.
//  3. Portfolio accuracy. Owner-approved facts only: no invented metrics, no
//     testimonials, no delivery timelines, no technology-stack claims, and a link
//     rendered only where a public URL is appropriate for a public visitor.
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FEATURED_PROJECT,
  SELECTED_WORK,
  SELECTED_WORK_IMAGE_HEIGHT,
  SELECTED_WORK_IMAGE_WIDTH,
  SUPPORTING_PROJECTS,
} from "@/lib/marketing/selected-work";
import { PRIMARY_SERVICES, SUPPORTING_SERVICE } from "@/lib/marketing/services";

const repo = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(join(repo, path), "utf8");

const hero = read("components/hero.tsx");
const capabilities = read("components/capabilities.tsx");
const selectedWorkComponent = read("components/selected-work.tsx");
const homepage = read("app/(public)/page.tsx");
const servicesPage = read("app/(public)/services/page.tsx");
const caseStudies = read("app/(public)/case-studies/case-studies-page-client.tsx");
const caseStudiesRoute = read("app/(public)/case-studies/page.tsx");
const navbar = read("components/navbar.tsx");
const footer = read("components/footer.tsx");
const rootLayout = read("app/layout.tsx");
const publicLayout = read("app/(public)/layout.tsx");
const sitemap = read("app/sitemap.ts");
const contact = read("app/(public)/contact/contact-page-client.tsx");

/** Every tracked source file that can reach a public visitor's browser or a crawler. */
const trackedFiles = execFileSync("git", ["ls-files"], { cwd: repo, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const publicSurfaceFiles = trackedFiles.filter(
  (path) =>
    /^(app|components|lib|public)\//.test(path) &&
    /\.(ts|tsx|js|jsx|css|json|md|html|svg|txt|xml)$/.test(path),
);

const publicSurfaceSources = publicSurfaceFiles.map((path) => [path, read(path)] as const);

/** Files that describe the public marketing site — the surfaces this task repositioned. */
const marketingFiles = trackedFiles.filter(
  (path) =>
    (path.startsWith("app/(public)/") || path.startsWith("components/")) &&
    path.endsWith(".tsx") &&
    !path.includes("/dashboard") &&
    !path.includes("/command-center") &&
    !path.includes("/admin/") &&
    !path.includes("/demo/"),
);

const projectText = (project: (typeof SELECTED_WORK)[number]) =>
  [project.name, project.summary, project.category, project.imageAlt, project.accessNote ?? "", ...project.tags].join(
    " ",
  );

// ---------------------------------------------------------------- 1. positioning

describe("homepage positioning", () => {
  it("leads with bespoke web application development", () => {
    expect(hero).toContain("export const HERO_EYEBROW = 'Bespoke web application development'");
    expect(hero).toContain(
      "export const HERO_HEADLINE = 'Web applications built around how your business actually works.'",
    );
    expect(hero).toContain("export const HERO_BODY =");
    expect(hero).toMatch(
      /custom platforms, portals, dashboards and workflow systems for businesses that have outgrown off-the-shelf software/,
    );
  });

  it("routes the hero calls to action at /contact and /case-studies", () => {
    expect(hero).toContain("HERO_PRIMARY_CTA = { label: 'Discuss application', href: '/contact' }");
    expect(hero).toContain("HERO_SECONDARY_CTA = { label: 'View selected work', href: '/case-studies' }");
  });

  it("keeps WhatsApp out of the hero and the primary calls to action", () => {
    expect(hero).not.toMatch(/whatsapp/i);
    expect(capabilities).not.toMatch(/whatsapp/i);
    expect(selectedWorkComponent).not.toMatch(/whatsapp/i);
  });

  it("composes the homepage from the repositioned sections only", () => {
    for (const section of ["<Hero />", "<Capabilities />", "<ProcessPreview />", "<SelectedWork />", "<CTABanner />"]) {
      expect(homepage).toContain(section);
    }
    for (const removed of ["StatsStrip", "ToolsMarquee", "ServicesBento", "ROICalculator", "Testimonials", "CaseStudiesPreview"]) {
      expect(homepage).not.toContain(removed);
    }
  });

  it("does not ship the superseded automation-era marketing components", () => {
    for (const path of [
      "components/stats-strip.tsx",
      "components/tools-marquee.tsx",
      "components/services-bento.tsx",
      "components/roi-calculator.tsx",
      "components/testimonials.tsx",
      "components/case-studies-preview.tsx",
      "components/tools-strip.tsx",
      "components/portfolio.tsx",
    ]) {
      expect(existsSync(join(repo, path))).toBe(false);
    }
  });

  it("points the header and footer at the application-first routes", () => {
    expect(navbar).toContain("['Services','/services'],['Selected Work','/case-studies']");
    expect(navbar).toContain('href="/contact">Discuss application</Link>');
    expect(footer).toContain("['Bespoke Web Applications','/services#applications']");
    expect(footer).not.toMatch(/whatsapp/i);
  });
});

describe("service hierarchy", () => {
  it("orders the four primary services with bespoke applications first", () => {
    expect(PRIMARY_SERVICES.map((service) => service.id)).toEqual([
      "applications",
      "platforms",
      "automation",
      "modernization",
    ]);
    expect(PRIMARY_SERVICES[0].name).toBe("Bespoke web applications");
    expect(SUPPORTING_SERVICE.name).toBe("Product strategy, UX and technical architecture");
  });

  it("has no standalone WhatsApp service", () => {
    for (const service of PRIMARY_SERVICES) {
      expect(service.name).not.toMatch(/whatsapp/i);
      expect(service.summary).not.toMatch(/whatsapp/i);
    }
    const whatsappServices = PRIMARY_SERVICES.filter((service) =>
      service.includes.some((item) => /whatsapp/i.test(item)),
    );
    expect(whatsappServices.map((service) => service.id)).toEqual(["automation"]);
  });

  it("never lists WhatsApp first inside the integration service", () => {
    const automation = PRIMARY_SERVICES.find((service) => service.id === "automation")!;
    expect(automation.includes[0]).not.toMatch(/whatsapp/i);
    // Same rule for the rendered integration marquee on /services.
    const firstRow = servicesPage.split("\n").find((line) => line.includes("['Stripe','stripe']"))!;
    expect(firstRow).not.toMatch(/whatsapp/i);
  });

  it("renders /services from the shared hierarchy, without invented metrics", () => {
    expect(servicesPage).toContain("const services = PRIMARY_SERVICES");
    expect(servicesPage).not.toMatch(/26s avg reply|68% open rate|214 FAQs|90% fewer calls|97% time saved|120\+ shipped/);
    expect(servicesPage).not.toMatch(/build slots left/);
  });

  it("keeps day-count delivery promises off the public site", () => {
    for (const path of marketingFiles) {
      expect(read(path), path).not.toMatch(/7[- ]day (delivery|build|setup)|live in 7 days|ships in 7 days/i);
    }
  });
});

// ------------------------------------------------------------------ 2. portfolio

describe("selected work data", () => {
  it("holds the five owner-approved projects with SP Photo Station featured", () => {
    expect(SELECTED_WORK.map((project) => project.id)).toEqual([
      "sp-photo-station",
      "pro-photo-systems",
      "endurance-pics",
      "damagemetric-ai",
      "voicedesk",
    ]);
    expect(FEATURED_PROJECT.id).toBe("sp-photo-station");
    expect(SUPPORTING_PROJECTS).toHaveLength(4);
  });

  it("publishes only the approved URL form for each project", () => {
    const byId = Object.fromEntries(SELECTED_WORK.map((project) => [project.id, project]));

    expect(byId["sp-photo-station"].url).toBe("https://spphotostation.com");
    expect(byId["pro-photo-systems"].url).toBe("https://www.prophotosystems.com");
    expect(byId["damagemetric-ai"].url).toBe("https://damagemetric.ai");

    // Endurance Pics is recorded but not linked: the host did not respond at publishing time.
    expect(byId["endurance-pics"].url).toBeNull();
    expect(byId["endurance-pics"].domain).toBe("endurancepics.com");

    // VoiceDesk carries no public URL, no domain and no link label at all.
    expect(byId["voicedesk"].url).toBeNull();
    expect(byId["voicedesk"].domain).toBeNull();
    expect(byId["voicedesk"].externalLinkLabel).toBeNull();
    expect(byId["voicedesk"].accessNote).toBe(
      "Private operational application. No public demonstration environment.",
    );
  });

  it("marks DamageMetric AI as pre-launch and does not call it a live application", () => {
    const project = SELECTED_WORK.find((entry) => entry.id === "damagemetric-ai")!;
    expect(project.category).toMatch(/pre-launch/i);
    expect(project.accessNote).toMatch(/pre-launch/i);
    expect(project.externalLinkLabel).toBe("Visit project site");
    expect(project.externalLinkLabel).not.toMatch(/live application/i);
  });

  it("renders a link only where a public URL exists", () => {
    for (const project of SELECTED_WORK) {
      if (project.url === null) {
        expect(project.externalLinkLabel, project.id).toBeNull();
        expect(project.accessNote, project.id).toBeTruthy();
      } else {
        expect(project.externalLinkLabel, project.id).toBeTruthy();
        // Project-specific, never a generic "click here".
        expect(project.externalLinkLabel, project.id).not.toMatch(/^(here|link|read more)$/i);
      }
    }
  });

  it("claims no technology stack, metrics, outcomes or timelines", () => {
    for (const project of SELECTED_WORK) {
      const text = projectText(project);
      expect(text, project.id).not.toMatch(/react|next\.js|typescript|node\.js|supabase|postgres|aws|vercel|tailwind/i);
      expect(text, project.id).not.toMatch(/\b\d+\s?%|\bROI\b|revenue|conversion|weeks to (build|launch)|\bteam of \d/i);
    }
  });

  it("carries no phone-number-shaped data", () => {
    const data = read("lib/marketing/selected-work.ts");
    expect(data).not.toMatch(/\+?\d[\d ().-]{8,}\d/);
  });
});

describe("selected work assets", () => {
  it("declares one shared intrinsic size for every card image", () => {
    expect(SELECTED_WORK_IMAGE_WIDTH).toBe(1280);
    expect(SELECTED_WORK_IMAGE_HEIGHT).toBe(800);
    expect(selectedWorkComponent).toContain("width={SELECTED_WORK_IMAGE_WIDTH}");
    expect(selectedWorkComponent).toContain("height={SELECTED_WORK_IMAGE_HEIGHT}");
    expect(selectedWorkComponent).toContain("from 'next/image'");
  });

  it("ships every image locally, as WebP under 250 KB", () => {
    for (const project of SELECTED_WORK) {
      expect(project.image, project.id).toMatch(/^\/images\/selected-work\/[a-z0-9-]+\.webp$/);
      const file = join(repo, "public", project.image);
      expect(existsSync(file), project.image).toBe(true);
      expect(statSync(file).size, project.image).toBeLessThanOrEqual(250 * 1024);
    }
  });

  it("describes fallback graphics as CodeOutfitters graphics, never as product screenshots", () => {
    for (const project of SELECTED_WORK) {
      if (project.visualType === "screenshot") {
        expect(project.imageAlt, project.id).toMatch(/public product website/);
      } else {
        expect(project.imageAlt, project.id).toMatch(/^CodeOutfitters presentation graphic for /);
        expect(project.imageAlt, project.id).not.toMatch(/screenshot|dashboard/i);
      }
    }
    expect(SELECTED_WORK.find((project) => project.id === "sp-photo-station")!.imageAlt).toBe(
      "SP Photo Station public product website",
    );
  });
});

describe("portfolio rendering", () => {
  it("shows all five projects on /case-studies as projects, not case studies", () => {
    expect(caseStudies).toContain("SELECTED_WORK.map");
    expect(caseStudies).toContain("Projects and applications");
    expect(caseStudies).not.toMatch(/case stud(y|ies)/i);
    expect(caseStudiesRoute).toContain("title: 'Selected Work — CodeOutfitters'");
  });

  it("carries no testimonials, ratings or outcome metrics on the portfolio", () => {
    for (const source of [caseStudies, selectedWorkComponent]) {
      // Case-sensitive on purpose: the module docstring explains why testimonials are
      // absent, and that sentence must not be mistaken for rendered markup.
      expect(source).not.toMatch(/Testimonial|aggregateRating|reviewCount|ratingValue/);
    }
  });

  it("opens external project links safely and describes where they go", () => {
    expect(selectedWorkComponent).toContain('target="_blank"');
    expect(selectedWorkComponent).toContain('rel="noopener noreferrer"');
    expect(selectedWorkComponent).toContain("(opens in a new tab)");
    // The label comes from the project, so it names the destination.
    expect(selectedWorkComponent).toContain("{project.externalLinkLabel}");
    // A card is an <article>, never an anchor wrapping other interactive controls.
    expect(selectedWorkComponent).not.toMatch(/<a[^>]*>\s*<article/);
  });

  it("gives project links a 44px touch target and a visible focus ring", () => {
    expect(selectedWorkComponent).toMatch(/\.sw-link\{[^}]*min-height:44px/);
    expect(selectedWorkComponent).toMatch(/\.sw-link:focus-visible\{[^}]*outline:2px solid var\(--brand-focus\)/);
  });

  it("never embeds a project or fetches the portfolio at runtime", () => {
    for (const source of [caseStudies, selectedWorkComponent, read("lib/marketing/selected-work.ts")]) {
      expect(source).not.toMatch(/<iframe/i);
      expect(source).not.toMatch(/\bfetch\(/);
      expect(source).not.toMatch(/src=\{?["'`]https?:/);
    }
  });
});

// --------------------------------------------------------------------- 3. safety

describe("publication safety", () => {
  it("keeps VoiceDesk's private route out of the entire tracked source tree", () => {
    const offenders = publicSurfaceSources
      .filter(([, source]) => /voicedesk\.aboolography\.workers\.dev/i.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it("never links the Pro Photo Systems apex host", () => {
    const offenders = publicSurfaceSources
      .filter(([, source]) => /https:\/\/prophotosystems\.com/i.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it("keeps capture artefacts and private screenshots out of the repository", () => {
    const offenders = trackedFiles.filter(
      (path) => path.includes(".playwright-mcp") || /voicedesk.*\.(png|jpe?g)$/i.test(path),
    );
    expect(offenders).toEqual([]);
  });

  it("keeps VoiceDesk out of metadata, structured data and the sitemap", () => {
    for (const source of [rootLayout, publicLayout, sitemap, caseStudiesRoute]) {
      expect(source).not.toMatch(/voicedesk/i);
    }
  });

  it("keeps dashboard routes and private routes out of public marketing schema", () => {
    // Assert on the emitted URLs, not the file's own comments.
    const sitemapUrls = [...sitemap.matchAll(/\$\{CANONICAL_ORIGIN\}([^`]*)`/g)].map((match) => match[1]);
    expect(sitemapUrls.length).toBeGreaterThan(0);
    for (const url of sitemapUrls) {
      expect(url, url).not.toMatch(/dashboard|forgot-password|proposal|login/);
    }
    expect(publicLayout).not.toMatch(/dashboard/);
  });

  it("claims no reviews, ratings, or operation of client products", () => {
    expect(publicLayout).not.toMatch(/aggregateRating|reviewCount|ratingValue/);
    expect(publicLayout).toContain("serviceType: 'Bespoke web application development'");
  });

  it("ships no Anthropic client, dependency or route", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).filter((name) => /anthropic/i.test(name))).toEqual([]);
    // Scoped to the marketing surfaces this task owns: the Dashboard's own proposal
    // tooling is out of scope here and is covered by its own suites.
    const offenders = publicSurfaceSources
      .filter(([path]) => marketingFiles.includes(path) || path.startsWith("lib/marketing/"))
      .filter(([, source]) => /api\.anthropic\.com|NEXT_PUBLIC_ANTHROPIC|@anthropic-ai/i.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});

// -------------------------------------------------------------- 4. accessibility

/** WCAG 2.1 relative luminance, from sRGB hex. */
function luminance(hex: string) {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((pair) => {
    const c = parseInt(pair, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("selected work accessibility", () => {
  it("meets 4.5:1 for the card text colours", () => {
    // Card body copy and the summary text sit on the card gradient's lightest and
    // darkest stops; both ends have to pass, not just the average.
    expect(contrast("#5B6355", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#5B6355", "#F6F1E4")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#0A120E", "#F6F1E4")).toBeGreaterThanOrEqual(4.5);
    // Category eyebrow and tag pills.
    expect(contrast("#0E7A4E", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#0E7A4E", "#EAF6EF")).toBeGreaterThanOrEqual(4.5);
    // The lighter #128A54 fails on white, so the cards must not use it.
    for (const source of [selectedWorkComponent, read("components/capabilities.tsx")]) {
      expect(source).not.toContain("#128A54");
    }
    // Link label on the card.
    expect(contrast("#0E2A1D", "#F6F1E4")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the public enquiry controls off the sub-AA foregrounds", () => {
    // Rendered QA of the preview measured gold #D9B36A at 1.98:1 and
    // --brand-placeholder #8A857B at 3.29:1, both on enabled controls. Neither
    // token may dress an enabled control's label.
    const upload = read("components/inquiry/inquiry-file-upload.tsx");
    expect(upload).toContain("text-[var(--brand-green-ink)]");
    expect(upload).not.toContain("font-semibold text-[var(--brand-accent)]");
    const popup = read("components/inquiry/workflow-audit-popup.tsx");
    expect(popup).toContain('text-xs font-medium text-[var(--brand-muted)]');
    expect(popup).not.toContain("text-xs font-medium text-[var(--brand-placeholder)]");
  });

  it("lets the contact reach sub-labels wrap instead of truncating", () => {
    // "How discovery leads to a written scope" needed 221px in a 189px box, so the
    // ellipsis was eating the sentence at every viewport.
    expect(contact).not.toContain(".con-reach a small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
  });

  it("uses a valid heading hierarchy on the portfolio page", () => {
    // h1 in the hero, h2 for the list section and the CTA, h3 per project card.
    expect(caseStudies.match(/<h1>/g) ?? []).toHaveLength(1);
    expect(caseStudies).toContain("<h2>Projects and applications</h2>");
    expect(selectedWorkComponent).toContain("headingLevel = 'h3'");
  });

  it("marks decorative imagery as decorative", () => {
    expect(capabilities).toContain('alt=""');
  });

  it("gives the WhatsApp contact channel an accessible external-link label", () => {
    expect(contact).toContain('href="https://wa.me/15550123456"');
    expect(contact).toContain('rel="noopener noreferrer"');
    expect(contact).toContain('aria-label="Message CodeOutfitters on WhatsApp (opens in a new tab)"');
  });

  it("keeps WhatsApp behind the primary contact routes", () => {
    // The email card and the process link both precede the WhatsApp card in the DOM.
    const reach = contact.slice(contact.indexOf("con-reach"));
    expect(reach.indexOf("mailto:hello@codeoutfitters.ai")).toBeLessThan(reach.indexOf("wa.me"));
    expect(reach.indexOf('href="/process"')).toBeLessThan(reach.indexOf("wa.me"));
  });
});
