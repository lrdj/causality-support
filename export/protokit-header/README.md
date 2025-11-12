# Clarity Lab Header for GOV.UK Prototype Kit (Express)

This package adapts the Clarity Lab header for a standard GOV.UK Prototype Kit (Express, Nunjucks) project. It uses the GOV.UK Frontend ‘Service navigation’ component and minimal overrides.

## Files

- `views/includes/service-navigation.njk` – Nunjucks include containing the header markup
- `assets/sass/_clarity-header.scss` – Minimal Sass overrides (logo size, right-aligned nav, highlight)
- `assets/images/claritylab-lockup.svg` – Logo image

## Install into your Prototype Kit

Assuming a vanilla Prototype Kit (v13+):

1) Copy files into the kit
- Copy `views/includes/service-navigation.njk` → `app/views/includes/service-navigation.njk`
- Copy `assets/images/claritylab-lockup.svg` → `app/assets/images/claritylab-lockup.svg`
- Copy `assets/sass/_clarity-header.scss` → `app/assets/sass/_clarity-header.scss` (or into your components folder)

2) Import the Sass in your `application.scss`
Edit `app/assets/sass/application.scss` and append:
```scss
@import "clarity-header";
```
(If you placed it under a folder like `components/_clarity-header.scss`, use `@import "components/clarity-header";`.)

3) Include the header in your layout
Open `app/views/layouts/main.html` and insert the include after `<body>` and before your page content (and optionally remove the default GOV.UK header macro if you don’t want the crown header):
```njk
<body class="govuk-template__body">
  {# Optional: remove or comment out the default header #}
  {# {{ govukHeader({}) }} #}

  {% include "includes/service-navigation.njk" %}

  <main class="govuk-main-wrapper" id="main-content" role="main">
    {% block content %}{% endblock %}
  </main>
</body>
```

4) Run your kit
```bash
npm install
npm run dev
```
GOV.UK Frontend is already wired up and initialised by the Prototype Kit, so the service navigation toggle should work without custom JavaScript.

## Notes & Customisation

- Asset path: The logo is referenced as `/public/images/claritylab-lockup.svg` in the template. The kit copies `app/assets/images` → `/public/images` at runtime.
- Logo size: Adjust in `_clarity-header.scss` via `#cl-lockup { height: 2em; }`.
- Right-aligned desktop nav: Controlled by `.govuk-service-navigation__wrapper { margin-left: auto; }`.
- Highlight colour for the “Free” mark: Tweak `#globalDiscoCall mark`.
- If you keep the default GOV.UK crown header, place this service navigation below it or remove one to avoid duplication.

## Source

Derived from this repo’s `_includes/above-main.html` (header markup) and `_includes/head.html` (overrides), matching the header used on `/pod/index.html`.

