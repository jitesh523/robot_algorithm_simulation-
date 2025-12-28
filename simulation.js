// Grid simulation core functionality

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
                    parent: null
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

    getNeighbors(cell) {
        const neighbors = [];
        const directions = [
            [-1, 0],  // up
            [1, 0],   // down
            [0, -1],  // left
            [0, 1]    // right
        ];

        for (const [dRow, dCol] of directions) {
            const newRow = cell.row + dRow;
            const newCol = cell.col + dCol;
            const neighbor = this.getCell(newRow, newCol);

            if (neighbor && !neighbor.isObstacle) {
                neighbors.push(neighbor);
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

        // Determine cell color
        let color = '#1e293b'; // default background

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

function reconstructPath(endCell) {
    const path = [];
    let current = endCell;

    while (current !== null) {
        path.unshift(current);
        current = current.parent;
    }

    return path;
}
