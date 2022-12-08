const DEFAULT_SIZE = 14;
const DEFAULT_START_CORDINATE = {
    x: 1,
    y: 6,
};
const DEFAULT_DESTINATION_CORDINATE = {
    x: 12,
    y: 7,
};
const DEFAULT_WALL_CORDINATES: ICordinate[] = [
    { x: 4, y: 0 },
    { x: 5, y: 0 },
    { x: 5, y: 1 },
    { x: 5, y: 2 },
    { x: 5, y: 3 },
    { x: 5, y: 4 },
    { x: 5, y: 5 },
    { x: 5, y: 6 },
    { x: 5, y: 7 },
    { x: 5, y: 8 },
    { x: 5, y: 9 },
    { x: 5, y: 10 },
    { x: 5, y: 11 },
    { x: 5, y: 12 },
    { x: 4, y: 13 },
    // { x: 5, y: 13 },
];

const map = <HTMLDivElement>document.querySelector("#map");
map.style.setProperty("--size", DEFAULT_SIZE.toString());
const finderArea: FinderArea = new FinderArea(map, { size: DEFAULT_SIZE, destination: DEFAULT_DESTINATION_CORDINATE, start: DEFAULT_START_CORDINATE, walls: DEFAULT_WALL_CORDINATES });
const pathsArea = <HTMLElement>document.querySelector("[data-paths]");

finderArea.startFinder();
finderArea.pathing();
finderArea.showPath();

let paths = finderArea.paths.map(({ cordinate }) => `x: ${cordinate.x} - y: ${cordinate.y}`).join(" => ");
pathsArea.innerHTML = paths;
