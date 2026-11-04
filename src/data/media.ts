// Media on the homepage. Files live in public/static/media/; build their URLs with withBase()
// so the site works under any GitHub Pages path.

// Prefixes a site path with the deploy base ("/svg-website/" on GitHub Pages).
export const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export type Lighting = "on" | "off";

// One flight, recorded twice: once with the room lights on and once in the dark.
// Both files of a pair have the same length and are lined up on the moment the mission starts,
// so the light switch can swap them without losing the playback position.
// Files: public/static/media/videos/<name>-on.mp4 and <name>-off.mp4, each with a .jpg poster.
export type FlightPair = Record<Lighting, { video: string; poster: string }>;

export const flightPair = (name: string): FlightPair => ({
  on: {
    video: withBase(`/static/media/videos/${name}-on.mp4`),
    poster: withBase(`/static/media/videos/${name}-on.jpg`),
  },
  off: {
    video: withBase(`/static/media/videos/${name}-off.mp4`),
    poster: withBase(`/static/media/videos/${name}-off.jpg`),
  },
});

export const media = {
  // 12-second animation of the game and the system (also in the Airlab website_videos folder).
  heroAnimation: withBase("/static/media/figures/strike-vs-guard.gif"),
  basestation: withBase("/static/media/figures/basestation.jpg"),
  architecture: withBase("/static/media/figures/architecture.jpg"),
  starlings: withBase("/static/media/photos/starling.jpg"),
};

export type ReleaseResource = {
  id: string;
  label: string;
  href?: string;
};

// Hero buttons. A resource without an href shows as "coming soon".
export const releaseResources: ReleaseResource[] = [
  { id: "code", label: "Code", href: "https://github.com/castacks/AirStack/tree/yikuan/SVG_ground_control" },
  { id: "docs", label: "Documentation", href: withBase("/docs/") },
  { id: "paper", label: "Paper" },
];
