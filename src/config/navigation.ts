import type { NavDestination, NavGroup } from "@/types/navigation";
import { exploreGroup, lifeGroup } from "./navigation/campus";
import { studyGroup, workspaceGroup, toolsGroup } from "./navigation/student";
export const navigationGroups: readonly NavGroup[] = [
  exploreGroup,
  studyGroup,
  lifeGroup,
  workspaceGroup,
  toolsGroup,
];
export const destinations = navigationGroups.flatMap<NavDestination>((group) => group.destinations);
export const mobileDestinations = ["/home", "/discover", "/tasks", "/community"].map(
  (href) => destinations.find((item) => item.href === href)!,
);
export const isDestinationActive = (path: string, href: string) =>
  path === href || path.startsWith(`${href}/`);
export function currentDestination(path: string) {
  return destinations.find((item) => isDestinationActive(path, item.href));
}
