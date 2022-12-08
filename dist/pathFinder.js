"use strict";
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function compareDistance(a, b) {
    return Math.abs(a[0]) + Math.abs(a[1]) - (Math.abs(b[0]) + Math.abs(b[1]));
}
class Cell {
    cordinate;
    element;
    _type;
    distance = [-1, -1];
    step;
    get type() {
        return this._type;
    }
    set type(type) {
        this.element.dataset.cellType = type;
        this._type = type;
    }
    constructor(cordinate, element, type = "normal") {
        this.cordinate = cordinate;
        this.element = element;
        this._type = type;
    }
}
class FinderArea {
    _element;
    _conf;
    cells = [];
    start;
    destination;
    _size;
    _finalPath = false;
    _finalNodePath;
    paths = [];
    possiblePaths;
    constructor(_element, _conf) {
        this._element = _element;
        this._conf = _conf;
        this._size = _conf.size;
        this.init();
        this.start = this.getCell(_conf.start);
        this.destination = this.getCell(_conf.destination);
        this.possiblePaths = new PathNode(this.start);
    }
    getCell(cordinate) {
        return this.cells[cordinate.x][cordinate.y];
    }
    showDistance(distance, span) {
        span.innerHTML = `x: ${distance[0].toString()}<br/>y: ${distance[1].toString()}`;
    }
    finder(cell) {
        let { x, y } = cell.cordinate;
        xLoop: for (let _x = x - 1; _x <= x + 1; _x++) {
            if (_x < 0 || _x >= this._size)
                continue;
            for (let _y = y - 1; _y <= y + 1; _y++) {
                if (_y < 0 || _y >= this._size)
                    continue;
                let neightborCell = this.getCell({ x: _x, y: _y });
                let type = neightborCell.type;
                if (type == "wall" || type == "visited" || type == "start" || type == "current" || type == "dead")
                    continue;
                let dis = this.destination.cordinate;
                let cur = neightborCell.cordinate;
                neightborCell.distance = [dis.x - cur.x, dis.y - cur.y];
                let span = this._element.querySelector(`[data-x="${cur.x}"][data-y="${cur.y}"]`);
                span.dataset.distanceX = neightborCell.distance[0].toString();
                span.dataset.distanceY = neightborCell.distance[1].toString();
                if (type == "destination") {
                    this._finalPath = true;
                    break xLoop;
                }
                neightborCell.type = "current";
            }
        }
        if (cell.type == "destination" || cell.type == "start")
            return;
        cell.type = "visited";
    }
    startFinder(time) {
        if (time) {
            return new Promise(async (res, rej) => { });
        }
        this.finder(this.start);
        while (!this._finalPath)
            this.cells.reduce((pre, now, i) => [...pre, ...now.filter((e) => e.type == "current")], []).forEach((e) => this.finder(e));
    }
    getShortestDistancePath(nodes) {
        let node = nodes.sort((a, b) => compareDistance(a.value?.distance, b.value?.distance)).filter((e) => e.isAlive && e.value?.type !== "visitedPath");
        return node[0];
    }
    generateStep() {
        if (!this._finalNodePath)
            throw new Error("The path is not created yet");
        let node = this._finalNodePath;
        let i = 0;
        while (node.parent) {
            if (i > 1e4) {
                throw new RangeError("Reached the maximum amount of iteration");
            }
            if (!node.value)
                break;
            let value = node.value;
            value.step = i++;
            if (value.type == "destination" || value.type == "start") {
                node = node.parent;
                continue;
            }
            node = node.parent;
        }
    }
    showPath() {
        if (!this._finalNodePath)
            throw new Error("The path is not created yet");
        this.generateStep();
        let node = this._finalNodePath.value;
        let isFoundStart = false;
        let i = 0;
        while (true) {
            if (i++ > 1e4)
                throw new RangeError("Reached the maximum iteration count");
            let value = node;
            let neightborCell = [];
            let { x: cellX, y: cellY } = value.cordinate;
            xLoop: for (let _x = cellX - 1; _x <= cellX + 1; _x++) {
                if (_x < 0 || _x >= this._size)
                    continue;
                for (let _y = cellY - 1; _y <= cellY + 1; _y++) {
                    if (_y < 0 || _y >= this._size)
                        continue;
                    let neightbor = this.getCell({ x: _x, y: _y });
                    if (neightbor.type == "start") {
                        isFoundStart = true;
                        break xLoop;
                    }
                    if (neightbor.step == null || neightbor.type == "visited" || neightbor.type == "destination")
                        continue;
                    neightborCell.push(neightbor);
                }
            }
            if (isFoundStart)
                break;
            let biggestStep = neightborCell.sort((a, b) => b.step - a.step)[0];
            biggestStep.type = "path";
            this.paths.push(biggestStep);
            node = biggestStep;
        }
    }
    generatePath(cell, node) {
        let { x: cellX, y: cellY } = cell.cordinate;
        if (!node.isAlive)
            return;
        for (let _x = cellX - 1; _x <= cellX + 1; _x++) {
            if (_x < 0 || _x >= this._size)
                continue;
            for (let _y = cellY - 1; _y <= cellY + 1; _y++) {
                if (_y < 0 || _y >= this._size)
                    continue;
                let neightborCell = this.getCell({ x: _x, y: _y });
                let type = neightborCell.type;
                if (type == "wall" || type == "start" || type == "dead" || type == "visitedPath")
                    continue;
                node.appendNode(new PathNode(neightborCell));
            }
        }
    }
    pathing() {
        this.generatePath(this.start, this.possiblePaths);
        let _shortestPath = this.getShortestDistancePath(this.possiblePaths.nodes);
        let _pathNode = _shortestPath.value;
        if (!_pathNode)
            return;
        _pathNode.type = "visitedPath";
        let iteration = 0;
        while (true) {
            if (iteration++ > 1e5) {
                throw new RangeError("Reached the maximum amount of iteration");
            }
            this.generatePath(_pathNode, _shortestPath);
            let shortestPath = this.getShortestDistancePath(_shortestPath.nodes);
            if (!shortestPath) {
                if (!_shortestPath?.parent?.parent || !_shortestPath.value)
                    throw new Error("Impossible case");
                _shortestPath.isAlive = false;
                _shortestPath.value.type = "visitedPath";
                _shortestPath = _shortestPath.parent?.parent;
                _shortestPath.nodes = [];
                _pathNode = _shortestPath.value;
                continue;
            }
            let pathNode = shortestPath.value;
            if (!pathNode || pathNode.type == "visitedPath")
                continue;
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
    init() {
        this._element.innerHTML = "";
        for (let x = 0; x < this._size; x++) {
            this.cells[x] = new Array();
            for (let y = 0; y < this._size; y++) {
                let span = document.createElement("span");
                span.dataset.x = x.toString();
                span.dataset.y = y.toString();
                if (this._conf.start.x === x && this._conf.start.y === y) {
                    span.dataset.start = "";
                    this.cells[x][y] = new Cell({ x, y }, span, "start");
                }
                else if (this._conf.destination.x === x && this._conf.destination.y === y) {
                    span.dataset.destination = "";
                    this.cells[x][y] = new Cell({ x, y }, span, "destination");
                }
                else
                    this.cells[x][y] = new Cell({ x, y }, span);
                span.classList.add("cell");
                this._element.appendChild(span);
            }
            this.cells.reduce((pre, now, i) => [...pre, ...now.filter(({ cordinate: e }) => this._conf.walls.some((el) => el.x == e.x && el.y == e.y))], []).forEach((e) => (e.type = "wall"));
        }
    }
}
class PathNode {
    parent;
    nodes = [];
    value;
    isAlive = true;
    constructor(value, parent) {
        this.value = value;
        this.parent = parent;
    }
    appendNode(node) {
        if (this.nodes.length >= 8)
            throw RangeError("Max length exceeded");
        if (this.nodes.some((e) => e == node))
            return;
        node.parent = this;
        this.nodes.push(node);
    }
    getNode(cordinate) {
        if (this.value?.cordinate.x == cordinate.x && this.value?.cordinate.y == cordinate.y)
            return this;
        return this.nodes.find((e) => e.value?.cordinate.x == cordinate.x && e.value?.cordinate.y == cordinate.y) || null;
    }
}
//# sourceMappingURL=pathFinder.js.map