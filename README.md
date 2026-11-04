# Strike vs Guard Website

The homepage and documentation for Strike vs Guard (SVG), the multi-drone ground controller in the
`svg_ground_control` package of [AirStack](https://github.com/castacks/AirStack/tree/yikuan/SVG_ground_control/robot/ros_ws/src/svg_ground_control).
The layout follows the [AM-Bench website](https://ambench.github.io/): a React/TypeScript homepage built with
Vite, and a `docs/` section built with Zensical and served at `/docs/`.

Every push to `main` deploys the site to https://strike-vs-guard.github.io/svg-website/ through
`.github/workflows/deploy.yml`. The workflow derives the site path from the repository name (`/svg-website/` here, `/` for a repo named `<owner>.github.io`), so the same code deploys from a renamed or copied repository; `base` in `vite.config.ts` only sets the local default.
In code, build site paths with `withBase()` from `src/data/media.ts` rather than writing `/static/...` directly.

## Run the homepage

```bash
npm ci
npm run dev            # http://localhost:5173/svg-website/, homepage only
npm run verify:build   # typecheck, build and check the page-size budgets
```

## Preview everything, docs included

```bash
npm run build
uv tool run --python 3.11 --from "zensical==0.0.58" zensical build --strict   # or: pip install "zensical==0.0.58"
rm -rf dist/docs && mv site dist/docs
npm run preview        # http://localhost:4173/svg-website/ and http://localhost:4173/svg-website/docs/
```

The dev server serves only the homepage, so use the full preview to check the docs and the links between the two.

## Add or replace flight videos

Each scenario on the homepage plays one flight recorded twice, with the room lights on and off. The light switch
swaps between the two at the same moment, so both files of a pair must have the same length and be lined up on the
mission start.

1. Put the pair in `public/static/media/videos/` as `<name>-on.mp4` and `<name>-off.mp4` (1080p H.264, no audio,
   `-movflags +faststart`), each with a poster `<name>-on.jpg` / `<name>-off.jpg` beside it.
2. In `src/data/project.ts`, point the scenario's variant at it with `flightPair("<name>")`. A scenario with more than
   one variant (like Figure eight) gets a version picker above the player.

Other images live in `public/static/media/figures/` and `photos/` and are listed in `src/data/media.ts`.
The hero animation is `figures/strike-vs-guard.gif`.

## Edit the content

- `src/data/project.ts`: all the text on the homepage: the game's rules, the system layers, the scenarios with their
  configs, the ground-station features and the lessons from flight. The page stays high level; technical detail
  belongs in `docs/`.
- `src/data/media.ts`: image paths, flight video pairs and the hero buttons. A button without an `href` shows
  "coming soon".
- `src/App.tsx`: page structure. `src/styles.css`: all homepage styles.

## Docs

Everything in `docs/` except `index.md` is generated from the SVG docs in AirStack: `experiment.md`, `README.md`,
`teleop.md`, the Basestation README and `docs/gcs/foxglove.md`. To pull in edits, run:

```bash
python3 scripts/sync-docs.py ../AirStack
```

Each page is a line range of a source file, listed in `PAGES` at the top of the script. If the source files gain
or lose sections, update those ranges and rebuild with `--strict`. Links to sections move to the page that now
holds them. Links to other repository files open on GitHub.
