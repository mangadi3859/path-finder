type CellType = "normal" | "destination" | "start" | "current" | "visited" | "wall" | "dead" | "path" | "visitedPath" | "finalPath";
interface ICordinate {
    x: number;
    y: number;
}
type Distance = [number, number];

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function compareDistance(a: Distance, b: Distance): number {
    return Math.abs(a[0]) + Math.abs(a[1]) - (Math.abs(b[0]) + Math.abs(b[1]));
}

class Cell {
    private _type: CellType;
    public distance: Distance = [-1, -1];
    public step?: number;

    get type() {
        return this._type;
    }

    set type(type: CellType) {
        this.element.dataset.cellType = type;
        this._type = type;
    }

    constructor(public cordinate: ICordinate, public element: HTMLElement, type: CellType = "normal") {
        this._type = type;
    }
}

interface IFinderAreaConfig {
    start: ICordinate;
    destination: ICordinate;
    size: number;
    walls: ICordinate[];
}

class FinderArea {
    public cells: Cell[][] = [];
    public start: Cell;
    public destination: Cell;
    private _size: number;
    private _finalPath: boolean = false;
    private _finalNodePath?: PathNode;
    public paths: Cell[] = [];
    public possiblePaths: PathNode;

    constructor(private _element: HTMLElement, private _conf: IFinderAreaConfig) {
        this._size = _conf.size;
        this.init();

        this.start = this.getCell(_conf.start);
        this.destination = this.getCell(_conf.destination);
        this.possiblePaths = new PathNode(this.start);
    }

    getCell(cordinate: ICordinate): Cell {
        return this.cells[cordinate.x][cordinate.y];
    }

    private showDistance(distance: Distance, span: HTMLElement): void {
        span.innerHTML = `x: ${distance[0].toString()}<br/>y: ${distance[1].toString()}`;
    }

    private finder(cell: Cell): void {
        let { x, y } = cell.cordinate;

        xLoop: for (let _x = x - 1; _x <= x + 1; _x++) {
            if (_x < 0 || _x >= this._size) continue;

            for (let _y = y - 1; _y <= y + 1; _y++) {
                if (_y < 0 || _y >= this._size) continue;

                let neightborCell = this.getCell({ x: _x, y: _y });
                let type = neightborCell.type;

                if (type == "wall" || type == "visited" || type == "start" || type == "current" || type == "dead") continue;

                let dis = this.destination.cordinate;
                let cur = neightborCell.cordinate;

                neightborCell.distance = [dis.x - cur.x, dis.y - cur.y];
                let span = <HTMLSpanElement>this._element.querySelector(`[data-x="${cur.x}"][data-y="${cur.y}"]`);
                span.dataset.distanceX = neightborCell.distance[0].toString();
                span.dataset.distanceY = neightborCell.distance[1].toString();

                if (type == "destination") {
                    this._finalPath = true;
                    break xLoop;
                }
                // this.showDistance(neightborCell.distance, span);

                neightborCell.type = "current";
            }
        }

        if (cell.type == "destination" || cell.type == "start") return;
        cell.type = "visited";
    }

    // startFinder(time: number): Promise<void>;
    // startFinder(): void;
    startFinder(time?: number): void | Promise<void> {
        if (time) {
            return new Promise<void>(async (res, rej) => {});
        }

        this.finder(this.start);

        while (!this._finalPath) this.cells.reduce((pre, now, i) => [...pre, ...now.filter((e) => e.type == "current")], []).forEach((e) => this.finder(e));
    }

    private getShortestDistancePath(nodes: PathNode[]): PathNode {
        let node = nodes.sort((a, b) => compareDistance(<Distance>a.value?.distance, <Distance>b.value?.distance)).filter((e) => e.isAlive && e.value?.type !== "visitedPath");
        return node[0];
    }

    private generateStep(): void {
        if (!this._finalNodePath) throw new Error("The path is not created yet");
        let node = this._finalNodePath;
        let i = 0;

        while (node.parent) {
            if (i > 1e4) {
                throw new RangeError("Reached the maximum amount of iteration");
            }
            if (!node.value) break;
            let value = node.value;
            // this.paths.push(node.value.cordinate);

            value.step = i++;

            if (value.type == "destination" || value.type == "start") {
                node = node.parent;
                continue;
            }

            node = node.parent;
        }
    }

    public showPath(): void {
        if (!this._finalNodePath) throw new Error("The path is not created yet");
        this.generateStep();

        let node = this._finalNodePath.value;
        let isFoundStart: boolean = false;
        let i = 0;

        while (true) {
            if (i++ > 1e4) throw new RangeError("Reached the maximum iteration count");

            let value = <Cell>node;
            let neightborCell: Cell[] = [];
            let { x: cellX, y: cellY } = value.cordinate;

            xLoop: for (let _x = cellX - 1; _x <= cellX + 1; _x++) {
                if (_x < 0 || _x >= this._size) continue;
                for (let _y = cellY - 1; _y <= cellY + 1; _y++) {
                    if (_y < 0 || _y >= this._size) continue;

                    let neightbor = this.getCell({ x: _x, y: _y });
                    if (neightbor.type == "start") {
                        isFoundStart = true;
                        break xLoop;
                    }
                    if (neightbor.step == null || neightbor.type == "visited" || neightbor.type == "destination") continue;

                    neightborCell.push(neightbor);
                }
            }

            if (isFoundStart) break;

            let biggestStep = neightborCell.sort((a, b) => <number>b.step - <number>a.step)[0];
            biggestStep.type = "path";
            this.paths.push(biggestStep);
            node = biggestStep;
        }
    }

    private generatePath(cell: Cell, node: PathNode): void {
        let { x: cellX, y: cellY } = cell.cordinate;

        if (!node.isAlive) return;

        for (let _x = cellX - 1; _x <= cellX + 1; _x++) {
            if (_x < 0 || _x >= this._size) continue;
            for (let _y = cellY - 1; _y <= cellY + 1; _y++) {
                if (_y < 0 || _y >= this._size) continue;

                let neightborCell = this.getCell({ x: _x, y: _y });
                let type = neightborCell.type;

                if (type == "wall" || type == "start" || type == "dead" || type == "visitedPath") continue;
                // console.log("heh", neightborCell);

                node.appendNode(new PathNode(neightborCell));
            }
        }
    }

    public pathing(): void {
        this.generatePath(this.start, this.possiblePaths);
        let _shortestPath = this.getShortestDistancePath(this.possiblePaths.nodes);
        let _pathNode = _shortestPath.value;

        if (!_pathNode) return;
        _pathNode.type = "visitedPath";

        let iteration = 0;

        while (true) {
            if (iteration++ > 1e5) {
                throw new RangeError("Reached the maximum amount of iteration");
            }

            // if (!_shortestPath.isAlive) {
            //     console.log(_shortestPath, _pathNode);
            //     _shortestPath = <PathNode>_shortestPath.parent?.parent;
            //     _pathNode = _shortestPath.value;
            //     _shortestPath.nodes = [];
            // }

            this.generatePath(<Cell>_pathNode, _shortestPath);
            let shortestPath = this.getShortestDistancePath(_shortestPath.nodes);
            // if (!shortestPath) continue;
            if (!shortestPath) {
                if (!_shortestPath?.parent?.parent || !_shortestPath.value) throw new Error("Impossible case");
                _shortestPath.isAlive = false;
                _shortestPath.value.type = "visitedPath";
                _shortestPath = _shortestPath.parent?.parent;
                _shortestPath.nodes = [];
                _pathNode = _shortestPath.value;
                continue;
            }

            let pathNode = shortestPath.value;

            if (!pathNode || pathNode.type == "visitedPath") continue;
            if (pathNode?.type == "destination") {
                this._finalNodePath = shortestPath;
                break;
            }
            pathNode.type = "visitedPath";

            _shortestPath = shortestPath;
            _pathNode = pathNode;

            iteration++;
        }
    }

    init(): void {
        this._element.innerHTML = "";

        for (let x = 0; x < this._size; x++) {
            this.cells[x] = <any>new Array<Cell>();

            for (let y = 0; y < this._size; y++) {
                let span = document.createElement("span");
                span.dataset.x = x.toString();
                span.dataset.y = y.toString();

                if (this._conf.start.x === x && this._conf.start.y === y) {
                    span.dataset.start = "";
                    this.cells[x][y] = new Cell({ x, y }, span, "start");
                } else if (this._conf.destination.x === x && this._conf.destination.y === y) {
                    span.dataset.destination = "";
                    this.cells[x][y] = new Cell({ x, y }, span, "destination");
                } else this.cells[x][y] = new Cell({ x, y }, span);

                span.classList.add("cell");
                this._element.appendChild(span);
            }

            this.cells.reduce((pre, now, i) => [...pre, ...now.filter(({ cordinate: e }) => this._conf.walls.some((el) => el.x == e.x && el.y == e.y))], []).forEach((e) => (e.type = "wall"));
        }
    }
}

class PathNode {
    public parent?: PathNode;
    public nodes: PathNode[] = [];
    public value?: Cell;
    public isAlive: boolean = true;

    constructor(value?: Cell, parent?: PathNode) {
        this.value = value;
        this.parent = parent;
    }

    appendNode(node: PathNode): void {
        if (this.nodes.length >= 8) throw RangeError("Max length exceeded");
        if (this.nodes.some((e) => e == node)) return;
        node.parent = this;
        this.nodes.push(node);
    }

    getNode(cordinate: ICordinate): PathNode | null {
        if (this.value?.cordinate.x == cordinate.x && this.value?.cordinate.y == cordinate.y) return this;
        return this.nodes.find((e) => e.value?.cordinate.x == cordinate.x && e.value?.cordinate.y == cordinate.y) || null;
    }
}
