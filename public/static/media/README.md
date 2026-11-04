# Homepage media

- `videos/`: flight recordings for the Flights section, in lights-on / lights-off pairs:
  `<name>-on.mp4` and `<name>-off.mp4` (1080p H.264, no audio, faststart), each with a `.jpg` poster
  of the same name. The two files of a pair have the same length and are lined up on the mission start,
  so the light switch keeps the playback position.
- `figures/`: the hero animation (`strike-vs-guard.gif`), the ground-station screenshot and the system diagram.
- `photos/`: photos of the drones and the flight room.

`src/data/media.ts` lists the images; `src/data/project.ts` points each scenario at its video pair with
`flightPair("<name>")`.
