# Tropical Wonders — Explore Southeast Asia

A frontend travel guide and portfolio project exploring destinations in Thailand and Malaysia. It combines destination discovery, travel inspiration and a browser-based itinerary planner in a responsive single-page website.

## Features

- Twelve destination profiles, six each in Thailand and Malaysia.
- Search and combined country/category filtering.
- Destination detail dialogs with travel suggestions, related places, favorites and planner shortcuts.
- Six adventure themes and a 15-image, filterable gallery with keyboard-operated lightbox.
- Favorites and saved trips stored in the browser with `localStorage`.
- Trip planner supports a country, multiple destinations, start date and notes. It does not book travel.
- Client-side contact form validation. The demo does not send messages.
- Mobile navigation, reduced-motion support, keyboard-accessible dialogs and responsive layouts.

## Technology

- Semantic HTML5, CSS3 and vanilla JavaScript.
- Google Fonts (DM Sans and Outfit).
- Font Awesome Free icons via CDN.
- Unsplash image URLs delivered through `images.unsplash.com`.

## Project structure

```text
tropical-wonders/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── data.js
└── README.md
```

Destination and gallery content is maintained in `js/data.js`; UI behavior is in `js/app.js`. Styles are grouped in one stylesheet for this small static project.

## Run locally

The site uses no build step or package installation. Open `index.html` in a browser, or serve this folder over HTTP for a more representative local test:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Push the project files to a GitHub repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose the branch containing the site and the `/ (root)` folder, then save.
5. Open the published URL after the Pages deployment completes.

All local asset references are relative, so the page works both at a repository Pages path and at a custom domain. No server-side configuration is needed.

## Use the trip planner

Choose a country, select a destination and press **Add**; repeat to build a multi-stop list. Enter a trip name and start date, optionally add notes, and save. Saved itineraries appear below the form and remain in this browser on this device. The country selector keeps a draft itinerary within the selected country. The clear action asks for confirmation before removing saved plans and the current draft. The planner stores ideas only; it does not reserve or purchase anything.

## Use Favorites

Select a heart on any destination card or its detail dialog. Open **Favorites** in the navigation to review, view or remove saved places. Favorites persist in this browser using `localStorage`.

## Image sources and attribution

Destination and gallery photographs are served from Unsplash's image CDN (`images.unsplash.com`) using the photo IDs in `js/data.js`; the hero and about images use the same service. Unsplash's license permits use of its images without mandatory attribution, though credit is encouraged. See the [Unsplash License](https://unsplash.com/license) and [Unsplash Terms](https://unsplash.com/terms). Google Fonts are served by Google Fonts; icons use Font Awesome Free from cdnjs. These external assets need an internet connection. If replacing photos, confirm the applicable license and keep alt text accurate.

## Limitations

This is a static frontend demonstration. Contact messages are validated locally but not sent. Favorites and itineraries are stored only in local browser storage and are not synchronized across devices. The destination descriptions and practical tips are general inspiration, not official travel advice; check current official entry requirements, local rules, weather, site access and travel advisories before a trip. If a backend is added later, validate and protect data on the server as well.
