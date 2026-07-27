# Orienta Brand Assets

This folder contains Orienta brand assets. The approved raster assets in `approved/` are the source of truth for the current app integration.

## Primary assets

- `orienta-logo-symbol.svg`: main route-and-sun symbol.
- `orienta-logo-lockup.svg`: symbol plus Orienta wordmark and tagline.
- `orienta-logo-symbol-mono.svg`: monochrome version for single-color use.
- `approved/orienta-app-icon.png`: approved app icon / primary symbol image.
- `approved/orienta-brand-lockup-transparent.png`: approved horizontal Home brand lockup image with transparent background.
- `approved/orienta-brand-lockup-removebg.png`: cleaned transparent Home brand lockup used on the Home screen.
- `approved/orienta-brand-lockup.jpg`: original approved horizontal Home brand lockup source.
- `approved/orienta-corner-stamp.jpg`: approved small corner stamp image.
- `approved/orienta-bottom-landscape-transparent.png`: approved wide bottom landscape illustration with transparent background.
- `approved/orienta-bottom-landscape.jpg`: original approved wide bottom landscape source.

## App icon adaptations

- `orienta-app-icon.svg`: normal app icon.
- `orienta-app-icon-maskable.svg`: maskable PWA icon with extra safe area.

## Brand hierarchy

- Primary brand name: `Orienta`
- Primary tagline: `Travel in China with confidence`
- Secondary stamp phrase: `Find your next step`

Do not replace the primary tagline with the stamp phrase. `Find your next step` is reserved for stamps, selected footers, and completion moments.

## Travel stamp assets

- `orienta-stamp-small.svg`: small decorative page stamp.
- `orienta-stamp-footer.svg`: larger landing/footer stamp.
- `orienta-stamp-success.svg`: success-state stamp.

## Current integration

1. Point `index.html` and `manifest.webmanifest` to `/brand/approved/orienta-app-icon.png`.
2. Update `public/manifest.webmanifest`:
   - `name`: `Orienta`
   - `short_name`: `Orienta`
   - icon source: `/brand/approved/orienta-app-icon.png`
3. Replace the Home text-only brand treatment with `/brand/approved/orienta-brand-lockup-removebg.png`.
4. Use `/brand/approved/orienta-bottom-landscape-transparent.png` only on Restaurant, Address Helper, High-speed Rail, and Shopping landing screens.
5. Keep `/brand/approved/orienta-corner-stamp.jpg` available for selected non-urgent pages, but leave it unused if there is no natural uncluttered placement.
6. Do not use travel stamps on Emergency.
7. Use at most one stamp per page.
