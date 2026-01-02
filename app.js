// Main application controller

// Global state
let grid;
let renderer;
let visualizer;
let metricsTracker;
let statisticsTracker;
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

// Undo/Redo System
const actionHistory = {
    past: [],
    future: [],
    maxSize: 50,

    record(snapshot) {
        this.past.push(snapshot);
        this.future = []; // Clear future when new action is made
        if (this.past.length > this.maxSize) {
            this.past.shift(); // Remove oldest
        }
    },

    canUndo() {
        return this.past.length > 0;
    },

    canRedo() {
        return this.future.length > 0;
    },

    undo() {
        if (this.canUndo()) {
            const snapshot = this.past.pop();
            const current = grid.serializeGrid();
            this.future.push(current);
            return snapshot;
        }
        return null;
    },

    redo() {
        if (this.canRedo()) {
            const snapshot = this.future.pop();
            const current = grid.serializeGrid();
            this.past.push(current);
            return snapshot;
        }
        return null;
    },

    clear() {
        this.past = [];
        this.future = [];
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    setupEventListeners();
    metricsTracker = new MetricsTracker();
    statisticsTracker = new StatisticsTracker();
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
    // Clear Grid
    document.getElementById('clearBtn').addEventListener('click', () => {
        actionHistory.record(grid.serializeGrid());
        grid.clear();
        grid.setCell(5, 5, 'start');
        grid.setCell(grid.rows - 6, grid.cols - 6, 'end');
        renderer.render();
        metricsTracker.clear();
        metricsTracker.displayResults();
    });

    // Undo/Redo buttons
    document.getElementById('undoBtn').addEventListener('click', () => {
        performUndo();
    });

    document.getElementById('redoBtn').addEventListener('click', () => {
        performRedo();
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
        const cell = renderer.getCellFromMouseEvent(event);

        if (cell) {
            // Record state before change for undo
            if (currentMode !== 'start' && currentMode !== 'end') {
                actionHistory.record(grid.serializeGrid());
            }

            grid.setCell(cell.row, cell.col, currentMode);
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

            // Track statistics
            statisticsTracker.addRun(algo.name, result);

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

        // Show and update statistics
        if (statisticsTracker.hasData()) {
            document.getElementById('statisticsSection').style.display = 'block';
            displayStatistics();
        }

        isRunning = false;
        document.getElementById('runBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
    }
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

    // Undo/Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
        return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        performRedo();
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

function performUndo() {
    const snapshot = actionHistory.undo();
    if (snapshot) {
        grid.loadGrid(snapshot);
        renderer.render();
        console.log('Undo - History:', actionHistory.past.length, 'steps');
    }
}

function performRedo() {
    const snapshot = actionHistory.redo();
    if (snapshot) {
        grid.loadGrid(snapshot);
        renderer.render();
        console.log('Redo - Future:', actionHistory.future.length, 'steps');
    }
}

// Statistics Dashboard
document.getElementById('clearStatsBtn').addEventListener('click', () => {
    if (confirm('Clear all statistics history?')) {
        statisticsTracker.clearHistory();
        document.getElementById('statisticsSection').style.display = 'none';
    }
});

function displayStatistics() {
    const stats = statisticsTracker.getAllStatistics();
    const container = document.getElementById('statisticsContainer');
    const totalRuns = Object.values(stats).reduce((sum, s) => sum + (s?.runCount || 0), 0);

    document.getElementById('statsInfo').textContent = `Total Runs: ${totalRuns}`;

    let html = '<div style="overflow-x: auto;">';
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">';
    html += '<thead><tr style="background: #1e293b;">';
    html += '<th style="padding: 8px; text-align: left; border-bottom: 2px solid #475569;">Algorithm</th>';
    html += '<th style="padding: 8px; text-align: center; border-bottom: 2px solid #475569;">Runs</th>';
    html += '<th style="padding: 8px; text-align: center; border-bottom: 2px solid #475569;">Success</th>';
    html += '<th colspan="4" style="padding: 8px; text-align: center; border-bottom: 2px solid #475569;">Path Length</th>';
    html += '<th colspan="4" style="padding: 8px; text-align: center; border-bottom: 2px solid #475569;">Time (ms)</th>';
    html += '</tr>';
    html += '<tr style="background: #0f172a; font-size: 0.75rem; color: #94a3b8;">';
    html += '<th></th><th></th><th></th>';
    html += '<th style="padding: 4px;">Avg</th><th style="padding: 4px;">Min</th><th style="padding: 4px;">Max</th><th style="padding: 4px;">±SD</th>';
    html += '<th style="padding: 4px;">Avg</th><th style="padding: 4px;">Min</th><th style="padding: 4px;">Max</th><th style="padding: 4px;">±SD</th>';
    html += '</tr></thead><tbody>';

    for (const [algo, stat] of Object.entries(stats)) {
        if (!stat) continue;

        const color = ALGORITHM_COLORS[algo] || '#888888';
        html += '<tr style="border-bottom: 1px solid #334155;">';
        html += `<td style="padding: 8px;"><span style="display: inline-block; width: 12px; height: 12px; background: ${color}; border-radius: 2px; margin-right: 8px;"></span>${algo}</td>`;
        html += `<td style="padding: 8px; text-align: center;">${stat.runCount}</td>`;
        html += `<td style="padding: 8px; text-align: center; color: ${stat.successRate === 100 ? '#22c55e' : '#fbbf24'};">${stat.successRate.toFixed(0)}%</td>`;

        if (stat.pathLength) {
            html += `<td style="padding: 8px; text-align: center;">${stat.pathLength.avg.toFixed(1)}</td>`;
            html += `<td style="padding: 8px; text-align: center; color: #22c55e;">${stat.pathLength.min}</td>`;
            html += `<td style="padding: 8px; text-align: center; color: #ef4444;">${stat.pathLength.max}</td>`;
            html += `<td style="padding: 8px; text-align: center; color: #94a3b8;">${stat.pathLength.stdDev.toFixed(1)}</td>`;
        } else {
            html += '<td colspan="4" style="padding: 8px; text-align: center; color: #64748b;">N/A</td>';
        }

        if (stat.timeElapsed) {
            html += `<td style="padding: 8px; text-align: center;">${stat.timeElapsed.avg.toFixed(2)}</td>`;
            html += `<td style="padding: 8px; text-align: center; color: #22c55e;">${stat.timeElapsed.min.toFixed(2)}</td>`;
            html += `<td style="padding: 8px; text-align: center; color: #ef4444;">${stat.timeElapsed.max.toFixed(2)}</td>`;
            html += `<td style="padding: 8px; text-align: center; color: #94a3b8;">${stat.timeElapsed.stdDev.toFixed(2)}</td>`;
        } else {
            html += '<td colspan="4" style="padding: 8px; text-align: center; color: #64748b;">N/A</td>';
        }

        html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}
