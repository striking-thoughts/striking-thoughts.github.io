# Striking Thoughts

The Hugo source for [www.strikingthoughts.io](https://www.strikingthoughts.io), Tiago Sommer Damasceno's game-development portfolio and creative outlet.

## Striking Thoughts Creative Deck

The active custom theme lives at `themes/striking-thoughts-lab`. It presents games, prototypes, shaders, VR work, and game-jam experiments as signals from the cyan-and-purple Creative Deck aboard TIAGO.DEV.

The theme includes:

- responsive home, project archive, project detail, About, tag, and error pages;
- project search and tag filters;
- touch-friendly project galleries;
- animated navigation, arrival sequence, project cards, and ambient thought field;
- reduced-motion support and keyboard-friendly controls.

## Run locally

Hugo Extended 0.120 or newer is required.

```sh
hugo server
```

Open <http://localhost:1313>.

## Build

```sh
hugo --cleanDestinationDir --minify
```

The generated site is written to `docs/` for GitHub Pages. The custom domain is preserved from `static/CNAME`.
