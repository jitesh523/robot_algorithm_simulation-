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

// Comparison Dashboard - Store all algorithm results
let allAlgorithmResults = [];
let algorithmReplays = {}; // Store recordings for each algorithm

// Algorithm color mapping for path overlay
const ALGORITHM_COLORS = {
    "Dijkstra's Algorithm": '#3b82f6',  // Blue
    'A* Pathfinding': '#22c55e',        // Green
    'Genetic Algorithm': '#a855f7',     // Purple
    'Breadth-First Search': '#f97316'   // Orange
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    setupEventListeners();
    metricsTracker = new MetricsTracker();
});

function initializeGrid() {
    // Load saved grid size from localStorage
    let rows = GRID_ROWS;
    let cols = GRID_COLS;

    const savedSize = localStorage.getItem('gridSize');
    if (savedSize) {
        const { rows: savedRows, cols: savedCols } = JSON.parse(savedSize);
        rows = savedRows;
        cols = savedCols;
        document.getElementById('gridRows').value = rows;
        document.getElementById('gridCols').value = cols;
    }

    const canvas = document.getElementById('gridCanvas');
    grid = new Grid(rows, cols, CELL_SIZE);
    renderer = new GridRenderer(canvas, grid);
    visualizer = new Visualizer(renderer);

    // Set default start and end
    grid.setCell(5, 5, 'start');
    grid.setCell(rows - 6, cols - 6, 'end');

    renderer.render();
}

function resizeGrid() {
    const rows = parseInt(document.getElementById('gridRows').value);
    const cols = parseInt(document.getElementById('gridCols').value);

    if (rows < 10 || rows > 80 || cols < 10 || cols > 100) {
        alert('Rows must be 10-80, Columns must be 10-100');
        return;
    }

    // Save to localStorage
    localStorage.setItem('gridSize', JSON.stringify({ rows, cols }));

    // Recreate grid
    const canvas = document.getElementById('gridCanvas');
    grid = new Grid(rows, cols, CELL_SIZE);
    renderer = new GridRenderer(canvas, grid);
    visualizer = new Visualizer(renderer);

    // Set default start and end for the new grid
    grid.setCell(5, 5, 'start');
    grid.setCell(rows - 6, cols - 6, 'end');

    renderer.render();

    // Clear any ongoing simulations
    if (isRunning) {
        stopSimulation();
    }
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
        // Show tooltip
        showCellTooltip(e);
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
        // Hide tooltip
        document.getElementById('cellTooltip').style.display = 'none';
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

    // Random Obstacles
    document.getElementById('randomObstaclesBtn').addEventListener('click', () => {
        grid.addRandomObstacles();
        renderer.render();
    });

    // Grid Size
    document.getElementById('applyGridSizeBtn').addEventListener('click', () => {
        resizeGrid();
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

function showCellTooltip(event) {
    const tooltip = document.getElementById('cellTooltip');
    const cell = renderer.getCellFromMouseEvent(event);

    if (!cell) {
        tooltip.style.display = 'none';
        return;
    }

    // Build tooltip content
    let content = `<div style="line-height: 1.5;">`;
    content += `<strong>Cell (${cell.row}, ${cell.col})</strong><br>`;

    // Terrain info
    const terrainNames = {
        'normal': 'Normal',
        'grass': 'Grass',
        'mud': 'Mud',
        'water': 'Water',
        'sand': 'Sand'
    };
    content += `Terrain: ${terrainNames[cell.terrainType] || 'Normal'} (${cell.terrainCost.toFixed(1)}×)<br>`;

    // Cell state
    if (cell.isStart) content += `<span style="color: #22c55e;">● Start Point</span><br>`;
    if (cell.isEnd) content += `<span style="color: #ef4444;">● End Point</span><br>`;
    if (cell.isObstacle) content += `<span style="color: #94a3b8;">● Obstacle</span><br>`;
    if (cell.isPath) content += `<span style="color: #fbbf24;">● On Path</span><br>`;
    if (cell.isVisited) content += `<span style="color: #a78bfa;">● Visited</span><br>`;
    if (cell.isExploring) content += `<span style="color: #60a5fa;">● Exploring</span><br>`;

    // Distance (if calculated)
    if (cell.distance && cell.distance !== Infinity) {
        content += `Distance: ${cell.distance.toFixed(2)}`;
    }

    content += `</div>`;

    tooltip.innerHTML = content;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY + 15) + 'px';
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
    allAlgorithmResults = []; // Clear previous results

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

        // Start recording
        visualizerClone.startRecording();

        console.log(`Running ${algo.name}...`);

        const result = await algo.func(gridClone, visualizerClone, delay, allowDiagonal);

        // Stop recording and store
        const recording = visualizerClone.stopRecording();
        algorithmReplays[algo.name] = recording;

        metricsTracker.addResult(algo.name, result);
        metricsTracker.displayResults();

        // Store result for comparison dashboard
        if (result.success && result.path) {
            // Apply path smoothing
            const smoothedPath = smoothPath(result.path, gridClone);
            const smoothedCost = calculatePathCost(smoothedPath, allowDiagonal);

            allAlgorithmResults.push({
                name: algo.name,
                path: result.path,
                smoothedPath: smoothedPath,
                color: ALGORITHM_COLORS[algo.name] || '#888888',
                metrics: {
                    pathLength: result.pathLength,
                    pathCost: result.pathCost,
                    smoothedLength: smoothedPath.length - 1,
                    smoothedCost: smoothedCost,
                    nodesExplored: result.nodesExplored,
                    timeElapsed: result.timeElapsed
                }
            });
        }

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

    // Show comparison section if multiple results
    if (allAlgorithmResults.length > 1) {
        document.getElementById('comparisonSection').style.display = 'block';
    }

    // Show replay section if we have recordings
    if (Object.keys(algorithmReplays).length > 0) {
        document.getElementById('replaySection').style.display = 'block';
        populateReplaySelect();
    }

    isRunning = false;
    document.getElementById('runBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}

function populateReplaySelect() {
    const select = document.getElementById('replayAlgorithmSelect');
    select.innerHTML = '<option value="">-- Choose --</option>';

    for (const algoName in algorithmReplays) {
        const option = document.createElement('option');
        option.value = algoName;
        option.textContent = algoName;
        select.appendChild(option);
    }
}

// Replay Controls
document.getElementById('replayAlgorithmSelect').addEventListener('change', (e) => {
    document.getElementById('replayBtn').disabled = !e.target.value;
});

document.getElementById('replaySpeed').addEventListener('input', (e) => {
    document.getElementById('replaySpeedLabel').textContent = e.target.value + '×';
});

document.getElementById('replayBtn').addEventListener('click', async () => {
    const algoName = document.getElementById('replayAlgorithmSelect').value;
    const speed = parseFloat(document.getElementById('replaySpeed').value);

    if (!algoName || !algorithmReplays[algoName]) return;

    document.getElementById('replayBtn').disabled = true;
    document.getElementById('replayBtn').textContent = '⏸ Playing...';

    await visualizer.replay(algorithmReplays[algoName], grid, speed);

    document.getElementById('replayBtn').disabled = false;
    document.getElementById('replayBtn').textContent = '▶ Play Replay';
});

function stopSimulation() {
    isRunning = false;
    visualizer.stop();
    document.getElementById('runBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}

// Export Results
document.getElementById('exportCSVBtn').addEventListener('click', () => {
    metricsTracker.exportToCSV();
});

document.getElementById('exportJSONBtn').addEventListener('click', () => {
    metricsTracker.exportToJSON();
});

// Reset Parameters
document.getElementById('resetParamsBtn').addEventListener('click', () => {
    document.getElementById('astarWeight').value = 1.0;
    document.getElementById('gaPopulation').value = 50;
    document.getElementById('gaGenerations').value = 100;
    document.getElementById('gaMutationRate').value = 0.1;
});

// Preset Scenarios
document.getElementById('presetSelector').addEventListener('change', (e) => {
    const preset = e.target.value;
    if (preset) {
        grid.loadPreset(preset);
        renderer.render();
        e.target.value = ''; // Reset selector
    }
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore if typing in input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch (e.key.toLowerCase()) {
        case ' ': // Space - Run simulation
            e.preventDefault();
            if (!isRunning) {
                document.getElementById('runBtn').click();
            }
            break;
        case 'escape': // Esc - Stop simulation
            if (isRunning) {
                document.getElementById('stopBtn').click();
            }
            break;
        case 'c': // C - Clear grid
            document.getElementById('clearBtn').click();
            break;
        case 's': // S - Save grid
            document.getElementById('saveGridBtn').click();
            break;
        case 'l': // L - Load grid
            document.getElementById('loadGridBtn').click();
            break;
        case 'r': // R - Random obstacles
            document.getElementById('randomObstaclesBtn').click();
            break;
    }
});
