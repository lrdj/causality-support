# Clarity Lab Header (Standalone)

This directory contains a standalone, portable copy of the Clarity Lab header extracted from the `/pod` page. It reproduces the GOV.UK-style service navigation (logo + top nav) using a minimal CSS subset and a small, dependency-free JS toggle for mobile.

## Contents

- `header.html` – Markup for the header (logo + nav + toggle)
- `header.css` – Minimal styles for layout, service navigation, and site overrides
- `header.js` – Lightweight menu toggle for mobile
- `assets/claritylab-lockup.svg` – Logo used in the header

## Quick Start

1. Copy the `header` directory to your new project.
2. In your page `<head>`, include the stylesheet:
   ```html
   <link rel="stylesheet" href="/path/to/header/header.css">
   ```
3. Place the header markup where you want it to appear (ideally before main content):
   ```html
   <!-- include or paste the contents of header/header.html here -->
   ```
4. Ensure the script is loaded (already referenced inside `header.html`):
   ```html
   <script src="/path/to/header/header.js" defer></script>
   ```
5. Make sure the logo path is correct. The HTML expects the logo at `./assets/claritylab-lockup.svg` relative to `header.html`. If you move files around, update the `src` on the `<img>` tag accordingly.

## What’s Included (and why)

- GOV.UK service navigation look and behavior without pulling the full framework.
- Responsive layout: mobile shows a "Menu" button, desktop shows the nav inline.
- Small, accessible toggle: updates `aria-expanded` and uses the `hidden` attribute on the list.
- Minimal overrides to match the current site: right-aligned desktop nav, logo sizing, and the highlighted "Free" mark.

## Customisation

- Logo size: adjust `#cl-lockup { height: 2em; }` in `header.css`.
- Right-align desktop nav: tweak `.govuk-service-navigation__wrapper { margin-left: auto; }`.
- Highlight colour for the discovery call: edit `#globalDiscoCall mark` in `header.css`.
- Spacing/typography: the CSS sets conservative defaults to avoid conflicts. You can fine-tune fonts and spacing if your base styles differ.

## Accessibility Notes

- The toggle button controls the `ul` via `aria-controls` and `aria-expanded`.
- The menu list uses the `hidden` attribute for visibility on small screens.
- Links have hover and focus states; the toggle gets a visible outline on focus.

## Using Without JavaScript

If you prefer not to ship `header.js`:
- Remove the `<button class="govuk-service-navigation__toggle">` from the HTML, and
- Ensure the list is always visible by removing the `hidden` attribute and keeping the desktop rule:
  ```css
  .govuk-service-navigation__list { display: flex; }
  ```

## File Paths Summary

- HTML references the logo as `./assets/claritylab-lockup.svg`.
- HTML references the script as `./header.js`.
- CSS is not path-dependent except for the logo size rule.

## Known Limitations

- This does not pull in the full GOV.UK CSS/JS. It includes only what’s necessary for this header, so visual differences may appear if your site has strong global styles.
- Class names are prefixed with `govuk-` to reduce collisions, but confirm with your project’s CSS.

---

Origin: extracted from `_includes/above-main.html` and `_includes/head.html` in this repo, mirroring the header used by `/pod/index.html`.

