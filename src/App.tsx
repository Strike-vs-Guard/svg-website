import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { media, releaseResources, withBase, type FlightPair, type Lighting } from "./data/media";
import {
  affiliation,
  authors,
  basestationFeatures,
  capabilities,
  configUrl,
  flights,
  layers,
  news,
  overlayLegend,
  packagePath,
  phases,
  repoBase,
  rules,
  safetyLayers,
  stats,
} from "./data/project";
import { useUrlChoice } from "./hooks/useUrlChoice";

const navItems = [
  { id: "game", label: "The game" },
  { id: "controller", label: "Controller" },
  { id: "flights", label: "Flights" },
  { id: "ground-station", label: "Ground station" },
  { id: "news", label: "News" },
] as const;

function useInitialHashTarget() {
  useEffect(() => {
    let frame: number | null = null;
    const scrollToHash = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const hash = window.location.hash.slice(1);
        if (!hash) return;
        const target = document.getElementById(decodeURIComponent(hash));
        if (!target) return;
        const root = document.documentElement;
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        target.scrollIntoView({ block: "start" });
        root.style.scrollBehavior = previous;
      });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.removeEventListener("hashchange", scrollToHash);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);
}

function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isNear, setIsNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setIsNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, isNear };
}

// Arrow-key, Home and End navigation for tab lists and button groups.
function nextIndex(event: ReactKeyboardEvent<HTMLButtonElement>, current: number, count: number) {
  const direction =
    event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
  if (direction === 0 && event.key !== "Home" && event.key !== "End") return null;
  event.preventDefault();
  if (event.key === "Home") return 0;
  if (event.key === "End") return count - 1;
  return (current + direction + count) % count;
}

function SectionHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="section-head">
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      {children && <div className="section-lede">{children}</div>}
    </header>
  );
}

function LightSwitch({ light, onChange }: { light: Lighting; onChange: (light: Lighting) => void }) {
  const isOn = light === "on";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      className={`light-switch is-${light}`}
      onClick={() => onChange(isOn ? "off" : "on")}
    >
      <span className="light-switch-label">Lights</span>
      <span className="light-switch-track" aria-hidden="true">
        <span className="light-switch-thumb" />
      </span>
      <span className="light-switch-state">{isOn ? "On" : "Off"}</span>
    </button>
  );
}

// Two stacked videos of the same flight, one per lighting. Flipping the switch pauses the shown
// video, seeks the other to the same moment and shows it, playing on if the first was playing.
function FlightPlayer({ pair, light, title }: { pair: FlightPair; light: Lighting; title: string }) {
  const { ref, isNear } = useNearViewport<HTMLDivElement>();
  const onRef = useRef<HTMLVideoElement>(null);
  const offRef = useRef<HTMLVideoElement>(null);
  const [shown, setShown] = useState<Lighting>(light);
  const shownRef = useRef<Lighting>(shown);
  shownRef.current = shown;
  const videoFor = (lighting: Lighting) => (lighting === "on" ? onRef.current : offRef.current);

  // A new flight starts from the beginning in whatever lighting is selected.
  useEffect(() => {
    setShown(light);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.on.video]);

  useEffect(() => {
    const from = videoFor(shownRef.current);
    const to = videoFor(light);
    if (shownRef.current === light) return;
    if (!from || !to) {
      setShown(light);
      return;
    }
    const time = from.currentTime;
    const wasPlaying = !from.paused && !from.ended;
    from.pause();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setShown(light);
      if (wasPlaying) to.play().catch(() => undefined);
    };
    const seek = () => {
      if (Math.abs(to.currentTime - time) < 0.02) {
        finish();
        return;
      }
      to.addEventListener("seeked", finish, { once: true });
      to.currentTime = time;
    };
    if (to.readyState >= 1) seek();
    else to.addEventListener("loadedmetadata", seek, { once: true });
    const timer = window.setTimeout(finish, 1500);
    return () => {
      window.clearTimeout(timer);
      to.removeEventListener("seeked", finish);
      to.removeEventListener("loadedmetadata", seek);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [light]);

  return (
    <div ref={ref} className={`flight-player is-${shown}`}>
      {isNear ? (
        (["on", "off"] as const).map((lighting) => {
          const isShown = lighting === shown;
          return (
            <video
              key={pair[lighting].video}
              ref={lighting === "on" ? onRef : offRef}
              className={isShown ? "is-shown" : ""}
              src={pair[lighting].video}
              poster={pair[lighting].poster}
              controls={isShown}
              muted
              playsInline
              preload="metadata"
              aria-hidden={!isShown}
              tabIndex={isShown ? undefined : -1}
              aria-label={`${title}, lights ${lighting}`}
            />
          );
        })
      ) : (
        <img className="is-shown" src={pair[light].poster} alt="" />
      )}
    </div>
  );
}

const flightIds = flights.map((flight) => flight.id);
const eight = flights.find((flight) => flight.variants.length > 1)!;
const eightIds = eight.variants.map((variant) => variant.id);

function FlightExplorer() {
  const [flightId, setFlightId] = useUrlChoice("flight", flightIds, flightIds[0]);
  const [versionId, setVersionId] = useUrlChoice("version", eightIds, eightIds[0]);
  const [light, setLight] = useUrlChoice("lights", ["on", "off"] as const, "on");
  const flightIndex = Math.max(0, flightIds.indexOf(flightId));
  const flight = flights[flightIndex];
  const hasVersions = flight.variants.length > 1;
  const variant = hasVersions ? flight.variants.find((item) => item.id === versionId) ?? flight.variants[0] : flight.variants[0];
  const variantIndex = flight.variants.indexOf(variant);

  const onTabKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const next = nextIndex(event, flightIndex, flights.length);
    if (next === null) return;
    setFlightId(flightIds[next]);
    window.requestAnimationFrame(() => document.getElementById(`flight-tab-${flightIds[next]}`)?.focus());
  };
  const onVersionKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const next = nextIndex(event, variantIndex, flight.variants.length);
    if (next === null) return;
    setVersionId(flight.variants[next].id);
    window.requestAnimationFrame(() => document.getElementById(`version-${flight.variants[next].id}`)?.focus());
  };

  return (
    <div className="flight-explorer">
      <div className="flight-tabs" role="tablist" aria-label="Scenario">
        {flights.map((candidate, index) => (
          <button
            id={`flight-tab-${candidate.id}`}
            className={candidate.id === flight.id ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={candidate.id === flight.id}
            aria-controls="flight-panel"
            tabIndex={candidate.id === flight.id ? 0 : -1}
            onClick={() => setFlightId(candidate.id)}
            onKeyDown={onTabKey}
            key={candidate.id}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {candidate.title}
          </button>
        ))}
      </div>

      <div className="flight-panel" id="flight-panel" role="tabpanel" aria-labelledby={`flight-tab-${flight.id}`}>
        <div className="flight-stage">
          <div className="flight-toolbar">
            {hasVersions ? (
              <div className="version-picker" role="radiogroup" aria-label={`${flight.title} version`}>
                {flight.variants.map((candidate) => (
                  <button
                    id={`version-${candidate.id}`}
                    type="button"
                    role="radio"
                    aria-checked={candidate.id === variant.id}
                    tabIndex={candidate.id === variant.id ? 0 : -1}
                    className={candidate.id === variant.id ? "is-active" : ""}
                    onClick={() => setVersionId(candidate.id)}
                    onKeyDown={onVersionKey}
                    key={candidate.id}
                  >
                    {candidate.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="flight-toolbar-hint">Same flight, two lighting conditions</p>
            )}
            <LightSwitch light={light} onChange={setLight} />
          </div>
          <FlightPlayer pair={variant.pair} light={light} title={hasVersions ? `${flight.title}, ${variant.label}` : flight.title} />
          {variant.note && <p className="flight-note">{variant.note}</p>}
        </div>

        <div className="flight-info">
          <h3>
            {flight.title}
            {hasVersions && <span> · {variant.label}</span>}
          </h3>
          <p>{flight.summary}</p>
          {variant.text && <p className="flight-variant-text">{variant.text}</p>}
          <h4>What to watch</h4>
          <ul className="watch-list">
            {flight.watch.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h4>Setup</h4>
          <dl className="setup-list">
            <div>
              <dt>Config</dt>
              <dd>
                {flight.config.file ? (
                  <a href={configUrl(flight.config.file)}>
                    <code>{flight.config.file}</code>
                  </a>
                ) : (
                  <code>{flight.config.launch}</code>
                )}
              </dd>
            </div>
            {flight.drones.map((drone) => (
              <div key={drone.who}>
                <dt>{drone.who}</dt>
                <dd>{drone.what}</dd>
              </div>
            ))}
          </dl>
          {flight.alsoRuns && (
            <p className="also-runs">
              Same scenario, other setups:{" "}
              {flight.alsoRuns.map((other, index) => (
                <span key={other.file}>
                  {index > 0 && "; "}
                  <a href={configUrl(other.file)}>
                    <code>{other.file}</code>
                  </a>{" "}
                  ({other.text})
                </span>
              ))}
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// A small slideshow: the photo on the left, its title and text on the right.
function NewsSlides() {
  const [index, setIndex] = useState(0);
  const item = news[index];
  const go = (step: number) => setIndex((current) => (current + step + news.length) % news.length);

  return (
    <div className="news-panel" role="region" aria-roledescription="carousel" aria-label="News">
      <div className="news-stage">
        <div className="news-frame">
          {news.map((candidate, candidateIndex) => (
            <img
              key={candidate.image}
              src={candidate.image}
              alt={candidate.alt}
              loading="lazy"
              className={candidateIndex === index ? "is-shown" : ""}
              aria-hidden={candidateIndex !== index}
            />
          ))}
          <button className="news-arrow is-prev" type="button" aria-label="Previous news item" onClick={() => go(-1)}>
            <span aria-hidden="true">‹</span>
          </button>
          <button className="news-arrow is-next" type="button" aria-label="Next news item" onClick={() => go(1)}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <div className="news-dots">
          {news.map((candidate, candidateIndex) => (
            <button
              type="button"
              className={candidateIndex === index ? "is-active" : ""}
              aria-label={`News item ${candidateIndex + 1} of ${news.length}`}
              aria-current={candidateIndex === index}
              onClick={() => setIndex(candidateIndex)}
              key={candidate.image}
            />
          ))}
        </div>
      </div>
      <div className="news-info" aria-live="polite">
        <p className="news-count">
          {String(index + 1).padStart(2, "0")} / {String(news.length).padStart(2, "0")}
        </p>
        <h3>{item.title}</h3>
        <p>{item.text}</p>
      </div>
    </div>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -68%", threshold: [0, 0.1, 0.4] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="nav-shell">
        <a className="wordmark" href="#top" onClick={() => setMenuOpen(false)}>
          <img src={withBase("/static/images/svg-logo.svg")} alt="" width="32" height="32" />
          <span>Strike vs Guard</span>
        </a>
        <button
          ref={menuButtonRef}
          className="menu-toggle"
          type="button"
          aria-label={`${menuOpen ? "Close" : "Open"} navigation`}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        <nav id="primary-navigation" className={menuOpen ? "is-open" : ""} aria-label="Primary navigation">
          {navItems.map((item) => (
            <a className={activeSection === item.id ? "is-active" : ""} href={`#${item.id}`} onClick={() => setMenuOpen(false)} key={item.id}>
              {item.label}
            </a>
          ))}
          <a className="nav-docs" href={withBase("/docs/")}>
            Docs ↗
          </a>
        </nav>
      </div>
    </header>
  );
}

function App() {
  useInitialHashTarget();

  return (
    <>
      <Header />
      <main id="main-content">
        <section className="hero" id="top">
          <div className="page-shell hero-grid">
            <div className="hero-copy">
              <p className="kicker">
                <span className="hero-badge">SVG</span> {affiliation}
              </p>
              <h1>Strike vs Guard</h1>
              <ul className="author-list" aria-label="Authors">
                {authors.map((author) => (
                  <li key={author.name}>{author.href ? <a href={author.href}>{author.name}</a> : author.name}</li>
                ))}
              </ul>
              <p className="hero-lede">
                Two identical drone teams, one protected target. The SVG ground controller is the part that actually flies
                them: it turns each team's plan into safe flight, for real drones, simulated drones, or both at once.
              </p>
              <div className="button-row">
                <a className="button button-primary" href="#flights">
                  Watch the flights
                </a>
                {releaseResources.map((resource) =>
                  resource.href ? (
                    <a className="button" href={resource.href} key={resource.id}>
                      {resource.label} <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span className="button is-pending" aria-disabled="true" key={resource.id}>
                      {resource.label} <small>coming soon</small>
                    </span>
                  ),
                )}
              </div>
            </div>
            <figure className="hero-figure">
              <img src={media.heroAnimation} alt="Animation: two identical drone teams and a protected target; the game's rules; the four layers of the system; and the path from simulation to flight tests." width="640" height="360" />
              <figcaption>The game and the system, in 12 seconds.</figcaption>
            </figure>
          </div>
          <div className="page-shell">
            <dl className="stat-row">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="section" id="game">
          <div className="page-shell">
            <SectionHead kicker="01 · The game" title="A playground for teams of drones">
              <p>
                Strike vs Guard is a game we use to test how drone teams coordinate, adapt and stay safe when every drone is
                fast and close to the others.
              </p>
            </SectionHead>
            <div className="rule-grid">
              {rules.map((rule, index) => (
                <article className={`rule-card is-${rule.id}`} key={rule.id}>
                  <span className="rule-index">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{rule.title}</h3>
                  <p>{rule.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-tint" id="controller">
          <div className="page-shell">
            <SectionHead kicker="02 · The ground controller" title="Strategy decides who goes where. SVG makes it fly, safely.">
              <p>
                The system has four layers. Decisions flow down and the drones' positions flow back up. The SVG ground
                controller is the bottom two: it runs on one computer on the ground and flies every drone in the room.
              </p>
            </SectionHead>
            <div className="controller-grid">
              <ol className="layer-stack" aria-label="System layers, top to bottom">
                {layers.map((layer) => (
                  <li className={`layer is-${layer.id}`} key={layer.id}>
                    <strong>{layer.title}</strong>
                    <span>{layer.text}</span>
                    <small>{layer.owner}</small>
                  </li>
                ))}
              </ol>
              <div className="capability-grid">
                {capabilities.map((capability) => (
                  <article key={capability.id}>
                    <h3>{capability.title}</h3>
                    <p>{capability.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <ol className="phase-track" aria-label="From simulation to flight tests">
              {phases.map((phase, index) => (
                <li key={phase.id}>
                  <span>Phase {index + 1}</span>
                  <strong>{phase.title}</strong>
                  <p>{phase.text}</p>
                </li>
              ))}
            </ol>

            <h3 className="subhead">Safety, layer by layer</h3>
            <ul className="safety-grid">
              {safetyLayers.map((layer) => (
                <li key={layer.title}>
                  <strong>{layer.title}</strong>
                  <span>{layer.text}</span>
                </li>
              ))}
            </ul>

            <details className="diagram">
              <summary>Show the system diagram</summary>
              <figure>
                <a href={media.architecture} target="_blank" rel="noreferrer">
                  <img src={media.architecture} alt="System diagram of the SVG ground controller" loading="lazy" width="1882" height="996" />
                </a>
                <figcaption>
                  Each drone's command comes from the scenario or a gamepad, passes the safety filter, and goes to a real or a
                  simulated drone. More in the <a href={withBase("/docs/")}>documentation</a>.
                </figcaption>
              </figure>
            </details>
          </div>
        </section>

        <section className="section" id="flights">
          <div className="page-shell">
            <div className="flights-intro">
              <SectionHead kicker="03 · Flights" title="Five scenarios, with the lights on and off">
                <p>
                  Every flight here was flown with three real drones in CMU's motion-capture room, once with the lights on and
                  once in the dark. Flip the light switch to compare: the two recordings are lined up on the moment the mission
                  starts, and the video keeps its place.
                </p>
                <p>
                  In the dark you only see the LEDs. A drone glows green while it flies its own path and red while the safety
                  filter is steering it.
                </p>
              </SectionHead>
              <figure className="flights-photo">
                <img src={media.starlings} alt="Three Starling drones with green LED strips on the flight-room floor" loading="lazy" width="2000" height="1125" />
                <figcaption>The three Starling drones, lights on, before a run.</figcaption>
              </figure>
            </div>
            <FlightExplorer />
            <div className="legend">
              <p className="legend-title">Reading the videos</p>
              <ul>
                {overlayLegend.map((item) => (
                  <li className={`is-${item.id}`} key={item.id}>
                    <strong>{item.label}</strong> {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section section-tint" id="ground-station">
          <div className="page-shell">
            <SectionHead kicker="04 · Ground station" title="One screen for the operator">
              <p>
                The SVG Basestation runs in Foxglove beside a live 3D view of every drone. It is built for the person
                responsible for the flight: deliberate controls and a clear answer to "did that command actually happen?"
              </p>
            </SectionHead>
            <figure className="wide-figure">
              <a href={media.basestation} target="_blank" rel="noreferrer">
                <img src={media.basestation} alt="The SVG Basestation panel next to a 3D view of three drones and their battery status" loading="lazy" width="1600" height="817" />
              </a>
              <figcaption>The Basestation during the goal-tracking flight.</figcaption>
            </figure>
            <div className="feature-grid">
              {basestationFeatures.map((feature) => (
                <article key={feature.title}>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="news">
          <div className="page-shell">
            <SectionHead kicker="05 · News" title="Recent news" />
            <NewsSlides />
          </div>
        </section>

        <section className="section section-dark" id="next">
          <div className="page-shell next-grid">
            <SectionHead kicker="06 · What's next" title="Bigger games" />
            <div className="next-copy">
              <p>
                Next is a larger game: about six guards against three strikers. The guards will use the strikers' own
                collision avoidance to steer them off course, either by herding them or by holding a line in front of the
                target.
              </p>
              <p>
                Strategies from partner teams will plug in through the same interfaces, and the ground controller will keep
                turning them into safe flight for every drone. The same cooperative control carries over to search and rescue,
                environmental monitoring and inspection.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="citation">
          <div className="page-shell citation-grid">
            <div>
              <h2>Citation</h2>
              <p>A citation will be added here once the paper is available.</p>
              <p>
                <a href={`${repoBase}/${packagePath}`}>Browse the source on GitHub ↗</a>
              </p>
            </div>
            <pre>
              <code>{"@misc{svg2026,\n  title  = {Strike vs Guard},\n  author = {Fang, Yikuan and Woo, Younkyung and Tung, Henry and\n            Joglekar, Neelay and Scherer, Sebastian},\n  note   = {Citation coming soon}\n}"}</code>
            </pre>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-grid">
          <div className="footer-brand">
            <img src={withBase("/static/images/svg-logo.svg")} alt="" width="32" height="32" />
            <div>
              <strong>Strike vs Guard</strong>
              <p>Safe multi-drone ground control on AirStack.</p>
            </div>
          </div>
          <div className="footer-links">
            <a href={`${repoBase}/${packagePath}`}>svg_ground_control on GitHub ↗</a>
            <a href={withBase("/docs/")}>Documentation ↗</a>
          </div>
        </div>
        <div className="page-shell footer-base">
          <span>© 2026 AirLab, Carnegie Mellon University</span>
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
        </div>
      </footer>
    </>
  );
}

export default App;
