// Main application controller

// Global state
let grid;
let renderer;
let visualizer;
let metricsTracker;
let currentMode = 'obstacle';
let isDrawing = false;
let isRunning = false;

// Configuration
const GRID_ROWS = 40;
const GRID_COLS = 50;
const CELL_SIZE = 15;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    setupEventListeners();
    metricsTracker = new MetricsTracker();
});

function initializeGrid() {
    const canvas = document.getElementById('gridCanvas');
    grid = new Grid(GRID_ROWS, GRID_COLS, CELL_SIZE);
    renderer = new GridRenderer(canvas, grid);
    visualizer = new Visualizer(renderer);

    // Set default start and end
    grid.setCell(5, 5, 'start');
    grid.setCell(GRID_ROWS - 6, GRID_COLS - 6, 'end');

    renderer.render();
}

function setupEventListeners() {
    const canvas = document.getElementById('gridCanvas');

    // Canvas drawing
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        handleCanvasClick(e);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            handleCanvasClick(e);
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });

    // Mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
        });
    });

    // Control buttons
    document.getElementById('clearBtn').addEventListener('click', () => {
        grid.clear();
        grid.setCell(5, 5, 'start');
        grid.setCell(GRID_ROWS - 6, GRID_COLS - 6, 'end');
        renderer.render();
        metricsTracker.clear();
        metricsTracker.displayResults();
    });

    document.getElementById('randomObstaclesBtn').addEventListener('click', () => {
        grid.clear();
        grid.setCell(5, 5, 'start');
        grid.setCell(GRID_ROWS - 6, GRID_COLS - 6, 'end');
        grid.addRandomObstacles(0.25);
        renderer.render();
    });

    // Save/Load Grid Configuration
    document.getElementById('saveGridBtn').addEventListener('click', () => {
        grid.saveToFile('grid-config');
    });

    document.getElementById('loadGridBtn').addEventListener('click', () => {
        document.getElementById('gridFileInput').click();
    });

    document.getElementById('gridFileInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await grid.loadFromFile(file);
                renderer.render();
                console.log('Grid configuration loaded successfully');
            } catch (error) {
                console.error('Error loading grid configuration:', error);
                alert('Failed to load grid configuration. Please check the file format.');
            }
            // Reset file input
            e.target.value = '';
        }
    });

    document.getElementById('runBtn').addEventListener('click', runSimulation);
    document.getElementById('stopBtn').addEventListener('click', stopSimulation);

    // Speed slider
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    speedSlider.addEventListener('input', (e) => {
        speedValue.textContent = `${e.target.value}ms`;
    });
}

function handleCanvasClick(event) {
    if (isRunning) return;

    const { row, col } = renderer.getCellFromMouseEvent(event);

    if (row >= 0 && row < grid.rows && col >= 0 && col < grid.cols) {
        grid.setCell(row, col, currentMode);
        renderer.render();
    }
}

async function runSimulation() {
    if (isRunning) return;

    if (!grid.start || !grid.end) {
        alert('Please set both start and end points!');
        return;
    }

    isRunning = true;
    document.getElementById('runBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;

    metricsTracker.clear();

    const delay = parseInt(document.getElementById('speedSlider').value);
    const allowDiagonal = document.getElementById('diagonalCheck').checked;

    const algorithms = [];
    if (document.getElementById('dijkstraCheck').checked) {
        algorithms.push({ name: "Dijkstra's Algorithm", func: dijkstra });
    }
    if (document.getElementById('astarCheck').checked) {
        algorithms.push({ name: "A* Pathfinding", func: astar });
    }
    if (document.getElementById('geneticCheck').checked) {
        algorithms.push({ name: "Genetic Algorithm", func: genetic });
    }
    if (document.getElementById('bfsCheck').checked) {
        algorithms.push({ name: "Breadth-First Search", func: bfs });
    }

    if (algorithms.length === 0) {
        alert('Please select at least one algorithm!');
        isRunning = false;
        document.getElementById('runBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        return;
    }

    for (const algo of algorithms) {
        if (!isRunning) break;

        // Clone grid for each algorithm
        const gridClone = grid.clone();
        const rendererClone = new GridRenderer(document.getElementById('gridCanvas'), gridClone);
        const visualizerClone = new Visualizer(rendererClone);

        console.log(`Running ${algo.name}...`);

        const result = await algo.func(gridClone, visualizerClone, delay, allowDiagonal);
        metricsTracker.addResult(algo.name, result);
        metricsTracker.displayResults();

        // Wait a bit before next algorithm
        await new Promise(resolve => setTimeout(resolve, 500));

        // Reset grid visualization
        grid.reset();
        renderer.render();
    }

    // Show best result
    const best = metricsTracker.getBestAlgorithm();
    if (best && best.path) {
        grid.reset();
        for (const cell of best.path) {
            const gridCell = grid.getCell(cell.row, cell.col);
            if (gridCell && !gridCell.isStart && !gridCell.isEnd) {
                gridCell.isPath = true;
            }
        }
        renderer.render();
    }

    isRunning = false;
    document.getElementById('runBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}

function stopSimulation() {
    isRunning = false;
    visualizer.stop();
    document.getElementById('runBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}
