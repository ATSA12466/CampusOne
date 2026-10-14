export const nativeSuites = Object.freeze({
  server: "server-tests.mjs",
  foundation: "foundation-tests.mjs",
  shell: "phase3-tests.mjs",
  home: "phase4-tests.mjs",
  auth: "phase5-tests.mjs",
  clubs: "phase6-clubs-tests.mjs",
  events: "phase6-events-tests.mjs",
  discover: "phase6-discover-tests.mjs",
  life: "phase6-life-tests.mjs",
  profile: "phase6-profile-tests.mjs",
  social: "phase6-social-tests.mjs",
  study: "phase6-study-tests.mjs",
  secondary: "phase6-secondary-tests.mjs",
  polish: "phase7-tests.mjs",
  release: "release-tests.mjs",
  mobile: "mobile-tests.mjs",
});
export function selectedNativeSuites(requested) {
  const keys = requested.length ? requested : Object.keys(nativeSuites);
  if (
    new Set(keys).size !== keys.length ||
    keys.some((key) => !Object.hasOwn(nativeSuites, key))
  )
    throw new Error("Select valid unique native suite names.");
  return keys.map((key) => ({
    name: key,
    file: new URL(`../${nativeSuites[key]}`, import.meta.url),
  }));
}
