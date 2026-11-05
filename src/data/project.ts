import { flightPair, withBase, type FlightPair } from "./media";

// Everything the homepage says. Technical detail lives in the docs (/docs/) and in the
// svg_ground_control package of AirStack; this page explains the project at a high level.

export const repoBase = "https://github.com/castacks/AirStack/tree/yikuan/SVG_ground_control";
export const packagePath = "robot/ros_ws/src/svg_ground_control";
export const configUrl = (file: string) => `${repoBase}/${packagePath}/config/${file}`;

export const affiliation = "AirLab, Robotics Institute, Carnegie Mellon University";

// Shown under the title, in this order. A name with an href links to that person's AirLab page.
export const authors: { name: string; href?: string }[] = [
  { name: "Yikuan Fang", href: "https://theairlab.org/team/yikuan_fang/" },
  { name: "Younkyung (Cindy) Woo", href: "https://theairlab.org/team/younkyung/" },
  { name: "Henry Tung" },
  { name: "Neelay Joglekar", href: "https://theairlab.org/team/neelay_joglekar/" },
  { name: "Sebastian Scherer", href: "https://theairlab.org/team/sebastian/" },
];

export const stats = [
  { value: "20×/s", label: "every drone's command checked by the safety filter" },
  { value: "5", label: "scenarios flown on real drones" },
  { value: "3", label: "Starling drones in the flight room" },
  { value: "2", label: "lighting conditions for every flight" },
];

export const rules = [
  {
    id: "teams",
    title: "Two identical teams",
    text: "Strikers and guards fly the same drones, so neither side has an edge in speed or hardware. The guards protect one target.",
  },
  {
    id: "touch",
    title: "Touch, and both are lost",
    text: "If a striker and a guard collide, both drones are out. The strikers win if enough of them reach the target in time.",
  },
  {
    id: "geometry",
    title: "Same speed, closer wins",
    text: "With equal drones, position decides. The line halfway between a striker and a guard splits the arena: whoever has the target on their side gets there first.",
  },
];

// The four layers of the system, top to bottom. `owner` says who provides each layer.
export const layers = [
  { id: "strategy", title: "Strategy", text: "Who engages whom", owner: "Partner teams" },
  { id: "maneuver", title: "Maneuver", text: "Intercept and evade paths", owner: "Partner teams · scripted scenarios today" },
  { id: "safety", title: "Safety", text: "A filter on every command", owner: "SVG ground controller" },
  { id: "execution", title: "Execution", text: "Flight control from motion-capture positions", owner: "SVG ground controller + each drone's autopilot" },
];

export const capabilities = [
  {
    id: "see",
    title: "Sees every drone",
    text: "Motion-capture cameras track each drone, and the controller puts them all into one shared picture of the room.",
  },
  {
    id: "decide",
    title: "Decides each move",
    text: "A drone's next move comes from the running scenario, from a goal the operator sets, or from a pilot's gamepad.",
  },
  {
    id: "separate",
    title: "Keeps them apart",
    text: "Before anything is sent, a safety filter looks at all the moves together and nudges any drone that would get too close to another. Its LEDs turn red while it is being nudged.",
  },
  {
    id: "mix",
    title: "Flies real and simulated drones together",
    text: "The same controller flies drones in simulation and in the flight room, even in the same run, so an idea can be tried in simulation before anything takes off.",
  },
];

export const phases = [
  { id: "sim", title: "Simulation", text: "Every drone simulated in Isaac Sim" },
  { id: "hybrid", title: "Hybrid sim-real", text: "Real drones dodge simulated ones under the same filter" },
  { id: "flight", title: "Flight tests", text: "All real, in CMU's motion-capture room" },
];

export const safetyLayers = [
  { title: "Safety filter", text: "Checks every command 20 times a second and nudges drones that would get too close." },
  { title: "Virtual walls", text: "A geofence brakes any drone before it reaches the edge of the room." },
  { title: "Pilot box", text: "A smaller box keeps hand-flown drones well inside the walls." },
  { title: "Hold and land", text: "Hold All freezes the team in place; LAND ALL brings every drone down." },
  { title: "Lost signal", text: "If a drone's position or the gamepad stops updating, that drone holds still." },
  { title: "Kill switch", text: "The safety pilot's radio cutoff always has the final say." },
];

// What the labels burned into the flight videos mean.
export const overlayLegend = [
  { id: "prompt", label: "TAKEOFF · START · LANDING", text: "the moment each command is sent" },
  { id: "panel", label: "Mission panel", text: "the operator's screen during takeoff and landing" },
  { id: "position", label: "Live positions", text: "every drone and its safety bubble, lower right" },
  { id: "filter", label: "Safety-filter card", text: "turns amber and names the drones it is correcting" },
  { id: "clock", label: "Mission clock", text: "time since takeoff, with the current phase" },
];

export type FlightVariant = {
  id: string;
  label: string;
  text?: string;
  pair: FlightPair;
  // Anything about this pair of recordings a viewer should know.
  note?: string;
};

export type Flight = {
  id: string;
  title: string;
  summary: string;
  watch: string[];
  // The config the flight was launched with (a file in svg_ground_control/config), or a launch argument.
  config: { file?: string; launch?: string };
  drones: { who: string; what: string }[];
  // Other configs that run the same scenario.
  alsoRuns?: { file: string; text: string }[];
  variants: FlightVariant[];
};

const autonomousTeam = [{ who: "Drones 1–3", what: "Real · fly on their own · checked by the safety filter" }];

export const flights: Flight[] = [
  {
    id: "goal-tracking",
    title: "Goal tracking",
    summary:
      "The operator sends the whole team to a named formation with one click, and can still move any single drone on its own.",
    watch: [
      "The formation name appears on screen as each one is sent: home, line, triangle, diagonal.",
      "Where two paths cross, a drone's LEDs turn red as the filter eases it aside.",
    ],
    config: { file: "goal_tracking.yaml" },
    drones: autonomousTeam,
    alsoRuns: [{ file: "goal_single.yaml", text: "the same scenario with one drone" }],
    variants: [{ id: "main", label: "Goal tracking", pair: flightPair("goal-tracking") }],
  },
  {
    id: "goal-sequence",
    title: "Goal sequence",
    summary:
      "A script plays a series of layouts on its own: a line, the ends swapping places, all three crossing through the centre, a triangle, then the triangle rotating. Each step starts once every drone has arrived.",
    watch: [
      "The layouts are chosen so the straight-line paths cross head-on. The safety filter sorts out every crossing by itself.",
      "No operator input after Start.",
    ],
    config: { file: "goal_sequence.yaml" },
    drones: autonomousTeam,
    variants: [
      {
        id: "main",
        label: "Goal sequence",
        pair: flightPair("goal-sequence"),
        note: "There is no telemetry recording for the lights-on run, so it shows the labels but no panels. The lights-off run lands about 12 s earlier and holds its last frame to the end.",
      },
    ],
  },
  {
    id: "random-goals",
    title: "Random goals",
    summary: "Each drone flies to a random point in the room, then picks another, so the paths cross all the time.",
    watch: [
      "The safety-filter card is often correcting two or three drones at once.",
      "This is the long-running stress test for the filter.",
    ],
    config: { launch: "scenario:=random_goals" },
    drones: autonomousTeam,
    variants: [{ id: "main", label: "Random goals", pair: flightPair("random-goals") }],
  },
  {
    id: "squeeze",
    title: "Squeeze",
    summary:
      "Two guards hold their posts while a pilot flies a striker straight through the gap between them on a gamepad.",
    watch: [
      "The guards start moving before the striker arrives, step aside, and return to their posts once it has passed.",
      "The striker is never corrected, so the guards do all the yielding.",
    ],
    config: { file: "squeeze_rc_intruder.yaml" },
    drones: [
      { who: "Drones 1–2", what: "Real guards · fly on their own · checked by the safety filter" },
      { who: "Drone 3", what: "Real striker · flown by a pilot · never corrected" },
    ],
    alsoRuns: [
      { file: "squeeze_3drone.yaml", text: "all three simulated, for rehearsal" },
      { file: "hybrid_squeeze.yaml", text: "two real guards and a simulated striker" },
    ],
    variants: [{ id: "main", label: "Squeeze", pair: flightPair("squeeze") }],
  },
  {
    id: "figure-eight",
    title: "Figure eight",
    summary:
      "Two drones fly the same figure eight while a pilot steers a third drone into their path. Pick a version below.",
    watch: [
      "The pilot's drone is never corrected, so the two on the eight make room for it and then catch up with their path.",
      "Compare the versions: head-on, the pair would collide at every crossing without the filter; offset, they never meet there.",
    ],
    config: { file: "figure_eight_rc_intruder.yaml" },
    drones: [
      { who: "Drones 1–2", what: "Real · fly the figure eight · checked by the safety filter" },
      { who: "Drone 3", what: "Real · flown by a pilot · never corrected" },
    ],
    variants: [
      {
        id: "head-on",
        label: "Head-on",
        text: "The two drones reach the crossing together, head-on, every half lap. Nothing in their path avoids the other; the safety filter alone keeps them apart.",
        pair: flightPair("figure-eight-head-on"),
        note: "The lights-on camera stopped before landing; the lights-off run shows it.",
      },
      {
        id: "half-lap",
        label: "Half-lap offset",
        text: "The two drones are offset by half a lap, so they never reach the crossing at the same time. Corrections come from the pilot's drone.",
        pair: flightPair("figure-eight-half-lap"),
      },
      {
        id: "quarter-lap",
        label: "Quarter-lap offset",
        text: "The two drones are offset by a quarter lap, so they never reach the crossing at the same time. Corrections come from the pilot's drone.",
        pair: flightPair("figure-eight-quarter-lap"),
        note: "Both videos end mid-flight, where the lights-on camera stopped.",
      },
    ],
  },
];

export const basestationFeatures = [
  {
    title: "Start, hold and land",
    text: "Takeoff, Start and Hold All take one click. LAND ALL takes two, so it is quick under pressure but never an accident.",
  },
  {
    title: "Did it happen?",
    text: "Every command shows as confirmed, rejected or timed out, read back from the controller itself rather than assumed.",
  },
  {
    title: "Tune safety in flight",
    text: "A slider sets how early drones yield to each other. The new value is confirmed live.",
  },
  {
    title: "Health at a glance",
    text: "Link quality, motion-capture age and battery for each drone, with a warning when it is time to return to the pad.",
  },
];

// News slides, newest first. Photos live in public/static/media/photos/.
export type NewsItem = { title: string; text: string; image: string; alt: string };

export const news: NewsItem[] = [
  {
    title: "IROS 2026",
    text: "We are happy to present our uncrashable system to about 200 visitors during the IROS RIC Open Day!",
    image: withBase("/static/media/photos/iros-team.jpg"),
    alt: "Three team members standing beside the Strike vs Guard screen at the IROS 2026 RIC Open Day",
  },
  {
    title: "IROS 2026",
    text: "The team from ST Engineering liked our demo during the IROS RIC Open Day!",
    image: withBase("/static/media/photos/iros-ste.jpg"),
    alt: "Visitors from ST Engineering with the team at the Strike vs Guard demo booth",
  },
  {
    title: "IROS 2026",
    text: "We are happy to welcome all the teams from HTX, ST Engineering, NUS and UPenn!",
    image: withBase("/static/media/photos/iros-all.jpg"),
    alt: "Members of all the partner teams standing together in CMU's flight room",
  },
];
