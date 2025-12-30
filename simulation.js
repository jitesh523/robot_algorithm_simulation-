// Grid simulation core functionality

// Terrain type definitions
const TERRAIN_TYPES = {
    normal: { name: 'Normal', cost: 1.0, color: '#1e293b' },
    grass: { name: 'Grass', cost: 1.5, color: '#22c55e' },
    mud: { name: 'Mud', cost: 2.0, color: '#92400e' },
    water: { name: 'Water', cost: 3.0, color: '#3b82f6' },
    sand: { name: 'Sand', cost: 1.8, color: '#fbbf24' }
};

class Grid {
    constructor(rows, cols, cellSize) {
        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;
        this.grid = [];
        this.start = null;
        this.end = null;
        this.initialize();
    }

    initialize() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    row,
                    col,
                    isObstacle: false,
                    isStart: false,
                    isEnd: false,
                    isVisited: false,
                    isExploring: false,
                    isPath: false,
                    distance: Infinity,
                    heuristic: 0,
                    parent: null,
                    terrainType: 'normal',
                    terrainCost: 1.0
                };
            }
        }
    }

    reset() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                cell.isVisited = false;
                cell.isExploring = false;
                cell.isPath = false;
                cell.distance = Infinity;
                cell.heuristic = 0;
                cell.parent = null;
            }
        }
    }

    clear() {
        this.initialize();
        this.start = null;
        this.end = null;
    }

    setCell(row, col, type) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return;
        }

        const cell = this.grid[row][col];

        // Clear previous states
        if (type === 'start' && this.start) {
            this.grid[this.start.row][this.start.col].isStart = false;
        }
        if (type === 'end' && this.end) {
            this.grid[this.end.row][this.end.col].isEnd = false;
        }

        switch (type) {
            case 'obstacle':
                if (!cell.isStart && !cell.isEnd) {
                    cell.isObstacle = true;
                }
                break;
            case 'start':
                cell.isStart = true;
                cell.isObstacle = false;
                this.start = { row, col };
                break;
            case 'end':
                cell.isEnd = true;
                cell.isObstacle = false;
                this.end = { row, col };
                break;
            case 'erase':
                if (!cell.isStart && !cell.isEnd) {
                    cell.isObstacle = false;
                    cell.terrainType = 'normal';
                    cell.terrainCost = 1.0;
                }
                break;
            case 'grass':
            case 'mud':
            case 'water':
            case 'sand':
                if (!cell.isStart && !cell.isEnd && !cell.isObstacle) {
                    cell.terrainType = type;
                    cell.terrainCost = TERRAIN_TYPES[type].cost;
                }
                break;
        }
    }

    getCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return null;
        }
        return this.grid[row][col];
    }

    getNeighbors(cell, allowDiagonal = false) {
        const neighbors = [];
        const directions = [
            { dr: -1, dc: 0, cost: 1 },   // up
            { dr: 1, dc: 0, cost: 1 },    // down
            { dr: 0, dc: -1, cost: 1 },   // left
            { dr: 0, dc: 1, cost: 1 }     // right
        ];

        if (allowDiagonal) {
            directions.push(
                { dr: -1, dc: -1, cost: 1.414 },  // up-left
                { dr: -1, dc: 1, cost: 1.414 },   // up-right
                { dr: 1, dc: -1, cost: 1.414 },   // down-left
                { dr: 1, dc: 1, cost: 1.414 }     // down-right
            );
        }

        for (const { dr, dc, cost } of directions) {
            const newRow = cell.row + dr;
            const newCol = cell.col + dc;
            const neighbor = this.getCell(newRow, newCol);

            if (neighbor && !neighbor.isObstacle) {
                // Total cost = movement cost * terrain cost
                const totalCost = cost * neighbor.terrainCost;
                neighbors.push({ cell: neighbor, cost: totalCost });
            }
        }

        return neighbors;
    }

    addRandomObstacles(density = 0.25) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                if (!cell.isStart && !cell.isEnd && Math.random() < density) {
                    cell.isObstacle = true;
                }
            }
        }
    }

    serializeGrid() {
        const config = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            gridSize: {
                rows: this.rows,
                cols: this.cols
            },
            start: this.start,
            end: this.end,
            cells: []
        };

        // Only store non-default cells to reduce JSON size
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                if (cell.isObstacle || cell.isStart || cell.isEnd || cell.terrainType !== 'normal') {
                    config.cells.push({
                        row,
                        col,
                        isObstacle: cell.isObstacle,
                        isStart: cell.isStart,
                        isEnd: cell.isEnd,
                        terrainType: cell.terrainType,
                        terrainCost: cell.terrainCost
                    });
                }
            }
        }

        return config;
    }

    loadGrid(config) {
        // Validate configuration
        if (!config || !config.gridSize) {
            throw new Error('Invalid grid configuration');
        }

        // Check if grid size matches
        if (config.gridSize.rows !== this.rows || config.gridSize.cols !== this.cols) {
            console.warn('Grid size mismatch. Reinitializing grid.');
            this.rows = config.gridSize.rows;
            this.cols = config.gridSize.cols;
            this.initialize();
        } else {
            // Clear current grid
            this.clear();
        }

        // Restore start and end
        this.start = config.start;
        this.end = config.end;

        // Restore cells
        for (const cellData of config.cells) {
            const cell = this.grid[cellData.row][cellData.col];
            cell.isObstacle = cellData.isObstacle || false;
            cell.isStart = cellData.isStart || false;
            cell.isEnd = cellData.isEnd || false;
            cell.terrainType = cellData.terrainType || 'normal';
            cell.terrainCost = cellData.terrainCost || 1.0;
        }
    }

    saveToFile(filename = 'grid-config') {
        const config = this.serializeGrid();
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    this.loadGrid(config);
                    resolve(config);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    clone() {
        const clonedGrid = new Grid(this.rows, this.cols, this.cellSize);
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const original = this.grid[row][col];
                const cloned = clonedGrid.grid[row][col];
                cloned.isObstacle = original.isObstacle;
                cloned.isStart = original.isStart;
                cloned.isEnd = original.isEnd;
            }
        }
        clonedGrid.start = this.start ? { ...this.start } : null;
        clonedGrid.end = this.end ? { ...this.end } : null;
        return clonedGrid;
    }
}

class GridRenderer {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
        this.setupCanvas();
    }

    setupCanvas() {
        const width = this.grid.cols * this.grid.cellSize;
        const height = this.grid.rows * this.grid.cellSize;

        // Set canvas resolution
        this.canvas.width = width;
        this.canvas.height = height;

        // Set display size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw cells
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const cell = this.grid.grid[row][col];
                this.drawCell(cell);
            }
        }

        // Draw grid lines
        this.drawGridLines();
    }

    drawCell(cell) {
        const x = cell.col * this.grid.cellSize;
        const y = cell.row * this.grid.cellSize;
        const size = this.grid.cellSize;

        // Determine cell color with terrain as base layer
        let color = TERRAIN_TYPES[cell.terrainType].color; // terrain color as default

        if (cell.isStart) {
            color = '#4ade80'; // green
        } else if (cell.isEnd) {
            color = '#f87171'; // red
        } else if (cell.isObstacle) {
            color = '#334155'; // dark gray
        } else if (cell.isPath) {
            color = '#fbbf24'; // yellow/gold
        } else if (cell.isExploring) {
            color = '#60a5fa'; // blue
        } else if (cell.isVisited) {
            color = '#a78bfa'; // purple
        }

        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, size, size);
    }

    drawGridLines() {
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 0.5;

        // Vertical lines
        for (let col = 0; col <= this.grid.cols; col++) {
            const x = col * this.grid.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let row = 0; row <= this.grid.rows; row++) {
            const y = row * this.grid.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    getCellFromMouseEvent(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        const col = Math.floor(x / this.grid.cellSize);
        const row = Math.floor(y / this.grid.cellSize);

        return { row, col };
    }
}

// Utility functions
function manhattanDistance(cell1, cell2) {
    return Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col);
}

function euclideanDistance(cell1, cell2) {
    const dx = cell1.row - cell2.row;
    const dy = cell1.col - cell2.col;
    return Math.sqrt(dx * dx + dy * dy);
}

function octileDistance(cell1, cell2) {
    const dx = Math.abs(cell1.row - cell2.row);
    const dy = Math.abs(cell1.col - cell2.col);
    const D = 1;      // straight move cost
    const D2 = 1.414; // diagonal move cost
    return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
}

function reconstructPath(endCell) {
    const path = [];
    let current = endCell;

    while (current !== null) {
        path.unshift(current);
        current = current.parent;
    }

    return path;
}

function calculatePathCost(path, allowDiagonal = false) {
    if (!path || path.length < 2) {
        return 0;
    }

    let totalCost = 0;
    for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1];
        const curr = path[i];

        // Calculate movement cost (straight or diagonal)
        const dx = Math.abs(curr.row - prev.row);
        const dy = Math.abs(curr.col - prev.col);
        const isDiagonal = dx > 0 && dy > 0;
        const movementCost = isDiagonal ? 1.414 : 1.0;

        // Apply terrain cost
        const terrainCost = curr.terrainCost || 1.0;
        totalCost += movementCost * terrainCost;
    }

    return totalCost;
}
