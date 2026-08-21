# Minato Studio website

The public site for Minato Studio: what the apps are, what they do, and what
they deliberately don't do. It is an *informational* site. It doesn't sign
anyone up, sell anything, or hand out the apps.

Plain static HTML, CSS and JavaScript. **No build step, no dependencies, no
package.json.** What's in this folder is what gets deployed.

## Run it locally

```bash
node tools/dev-server.js
```

Then open <http://localhost:4180>. The server exists only for previewing:
it serves `404.html` for unknown paths and maps extensionless URLs to `.html`
so `/about` works the same as `/about.html`, matching what most static hosts do.

## What's here

| Path | What it is |
|---|---|
| `index.html` | Studio home: the premise, the three apps, the principles |
| `tabilog.html` | TabiLog product page: features, screenshot gallery, FAQ |
| `tabipace.html` | TabiPace: how it works, scope, current status |
| `tabiplanner.html` | TabiPlanner: the research findings it's built on |
| `about.html` | The studio, its commitments, and the name |
| `updates.html` | Running changelog across all three apps |
| `support.html` | How to report a bug, export or delete data, get in touch |
| `privacy.html`, `terms.html` | Legal pages |
| `404.html` | Not-found page |
| `assets/css/site.css` | The entire design system, one file |
| `assets/js/site.js` | Theme toggle, mobile nav, lightbox, scroll reveal |
| `assets/fonts/` | Poppins, self-hosted (subset woff2, ~8KB each) |
| `assets/img/shots/` | Imagery used on the site |
| `assets/img/concepts/` | Superseded hand-drawn mock-ups, see below |
| `tools/dev-server.js` | Local preview server. Never ships. |

There is no template engine, so **the header and footer are duplicated in every
page**. That's the deliberate trade for having no build step: if you change a nav
link, change it in all ten files. `grep -l 'site-nav' *.html` finds them.

## Before this goes public

1. **Have the legal pages reviewed.** `privacy.html` and `terms.html` are
   written to describe how the apps actually behave, and both carry a visible
   note saying they aren't legal advice. They aren't a substitute for someone
   qualified reading them.
2. **Check the ads section stays true.** `privacy.html` states plainly that the
   TabiLog Android build serves Google AdMob banners, and that nothing a
   household enters is shared with the ad network. If AdMob is removed or its
   configuration changes, that section, the `about.html` commitment and the
   TabiLog FAQ entry all have to change with it.

The contact address is `minatostudio26@gmail.com`, used on the support page and
in the contact section of both legal pages. To change it:

```bash
grep -rln "minatostudio26@gmail.com" *.html
```

## Imagery

Everything in `assets/img/shots/` is a **real screenshot** from the Android
build of the app in question, captured on an emulator, cropped to remove the
system status and gesture bars, and resized to 540px wide.

| Prefix | App | Screens |
|---|---|---|
| `app-*.webp` | TabiLog | dashboard, budgets, shopping, history |
| `pace-*.webp` | TabiPace | day verdict, people, plan, trip |
| `planner-*.webp` | TabiPlanner | whole trip, journey, day by day |

To retake any of them:

```bash
adb exec-out screencap -p > raw.png
magick raw.png -crop 1080x2226+0+120 +repage -resize 540x -quality 82 name.webp
```

Keep the 540×1113 aspect, the `.phone` frame in the CSS is built around it.
Package names are `com.tabilog.app`, `com.tabipace.app`, `com.tabiplanner.app`;
launch with `adb shell monkey -p <pkg> -c android.intent.category.LAUNCHER 1`.

Two gotchas when recapturing:

- **TabiLog's backdrop follows the household's currency theme**, so a shot from
  a different household won't match the rest of the set.
- **The AdMob banner shifts TabiLog's layout** and shouldn't appear in marketing
  images. Turn the emulator's wifi off before capturing.

TabiPlanner's shots are of an in-development beta and will date quickly; its
gallery caption says so.

### Concept illustrations

`assets/img/concepts/` holds all eight original hand-drawn SVG mock-ups, made
before any app had been seen running. They're kept deliberately as a design
source to review later, nothing on the site references them. See
[`assets/img/concepts/README.md`](assets/img/concepts/README.md), which lists
what each one depicts and exactly where it diverges from the real interface.

## Adding a changelog entry

Entries live directly in `updates.html`, there's no data file or generator.
Copy one `<article class="entry">` block, put it at the top of `.timeline`, and
change the date, badge and text. A comment in the file says the same thing.

Badge classes: `badge-studio`, `badge-tabilog`, `badge-tabipace`,
`badge-tabiplanner`.

## Design system notes

Everything lives in `assets/css/site.css`, tokens first.

- **Brand.** 港 (*minato*) = harbour. Deep navy water, a warm horizon. Each app
  has its own accent (`--tabilog`, `--tabipace`, `--tabiplanner`) used for card
  tones and changelog badges.
- **Theming.** Light by default; dark via `prefers-color-scheme` *and* an
  explicit `data-theme` toggle. The dark palette is declared twice on purpose,
  once for system-dark visitors with no attribute set, once for the toggle, so
  both directions win. A tiny inline script in each `<head>` applies the stored
  choice before first paint, which is what stops the flash of the wrong theme.
- **Text-on-tint tokens.** `--tabilog-ink` and friends exist because the accent
  hues are too light for 11 to 12px bold badge text on their own tints. Use the
  `-ink` variant for small text, the plain one for accents and fills.
- **Deep bands.** `.hero-deep`, `.section-deep` and `.cta-band` all paint the
  same dark gradient, so their descendant rules are grouped as
  `:is(.section-deep,.hero-deep,.cta-band)`. If you add a component that appears
  inside one, give it a rule in that group or it will inherit light-surface ink
  and disappear.
- **Reveal animations** are opt-in via a `js` class set in `<head>`, so content
  is visible when JavaScript doesn't run rather than stuck at `opacity: 0`.

All text was checked against WCAG AA (4.5:1) across every page in both themes.

## Deploying

Any static host works, upload the folder. No build, no environment variables,
no server-side anything.

- Netlify / Cloudflare Pages / GitHub Pages: point at the repo root, no build
  command, publish directory `.`.
- The site makes **zero external requests**: fonts, images, CSS and JS are all
  same-origin, so it works behind a captive portal and leaks nothing to a CDN.
