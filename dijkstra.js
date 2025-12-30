// Dijkstra's Algorithm Implementation

async function dijkstra(grid, visualizer, delay, allowDiagonal = false) {
    const startTime = performance.now();

    if (!grid.start || !grid.end) {
        return {
            success: false,
            message: "Start or end point not set",
            pathLength: 0,
            nodesExplored: 0,
            timeElapsed: 0
        };
    }

    const startCell = grid.getCell(grid.start.row, grid.start.col);
    const endCell = grid.getCell(grid.end.row, grid.end.col);

    // Initialize distances
    startCell.distance = 0;

    const unvisited = [];
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            unvisited.push(grid.grid[row][col]);
        }
    }

    let nodesExplored = 0;

    while (unvisited.length > 0) {
        // Sort by distance (priority queue simulation)
        unvisited.sort((a, b) => a.distance - b.distance);

        const current = unvisited.shift();

        // If we reach infinity, no path exists
        if (current.distance === Infinity) {
            const endTime = performance.now();
            return {
                success: false,
                message: "No path found",
                pathLength: 0,
                nodesExplored,
                timeElapsed: endTime - startTime
            };
        }

        current.isVisited = true;
        nodesExplored++;

        // Visualize
        if (visualizer && !current.isStart && !current.isEnd) {
            current.isExploring = true;
            visualizer.render();
            await new Promise(resolve => setTimeout(resolve, delay));
            current.isExploring = false;
        }

        // Found the end
        if (current === endCell) {
            const path = reconstructPath(endCell);

            // Mark path
            for (const cell of path) {
                if (!cell.isStart && !cell.isEnd) {
                    cell.isPath = true;
                }
            }

            if (visualizer) {
                visualizer.render();
            }

            const endTime = performance.now();
            return {
                success: true,
                message: "Path found",
                pathLength: path.length - 1,
                pathCost: calculatePathCost(path, allowDiagonal),
                nodesExplored,
                timeElapsed: endTime - startTime,
                path
            };
        }

        // Check neighbors with costs
        const neighbors = grid.getNeighbors(current, allowDiagonal);
        for (const { cell: neighbor, cost } of neighbors) {
            if (!neighbor.isVisited) {
                const newDistance = current.distance + cost;

                if (newDistance < neighbor.distance) {
                    neighbor.distance = newDistance;
                    neighbor.parent = current;
                }
            }
        }

        if (visualizer) {
            visualizer.render();
        }
    }

    const endTime = performance.now();
    return {
        success: false,
        message: "No path found",
        pathLength: 0,
        nodesExplored,
        timeElapsed: endTime - startTime
    };
}
