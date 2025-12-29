// A* Pathfinding Algorithm Implementation

async function astar(grid, visualizer, delay, allowDiagonal = false) {
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

    // Initialize
    startCell.distance = 0; // g(n)
    // Use Octile distance for diagonal, Manhattan for straight
    startCell.heuristic = allowDiagonal ?
        octileDistance(startCell, endCell) :
        manhattanDistance(startCell, endCell); // h(n)

    const openSet = [startCell];
    const closedSet = new Set();
    let nodesExplored = 0;

    while (openSet.length > 0) {
        // Sort by f(n) = g(n) + h(n)
        openSet.sort((a, b) => {
            const fA = a.distance + a.heuristic;
            const fB = b.distance + b.heuristic;
            return fA - fB;
        });

        const current = openSet.shift();

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
                nodesExplored,
                timeElapsed: endTime - startTime,
                path
            };
        }

        closedSet.add(current);
        current.isVisited = true;
        nodesExplored++;

        // Visualize
        if (visualizer && !current.isStart && !current.isEnd) {
            current.isExploring = true;
            visualizer.render();
            await new Promise(resolve => setTimeout(resolve, delay));
            current.isExploring = false;
        }

        // Check neighbors with costs
        const neighbors = grid.getNeighbors(current, allowDiagonal);
        for (const { cell: neighbor, cost } of neighbors) {
            if (closedSet.has(neighbor)) {
                continue;
            }

            const tentativeG = current.distance + cost;

            if (!openSet.includes(neighbor)) {
                openSet.push(neighbor);
            } else if (tentativeG >= neighbor.distance) {
                continue;
            }

            // This path is the best so far
            neighbor.parent = current;
            neighbor.distance = tentativeG;
            neighbor.heuristic = allowDiagonal ?
                octileDistance(neighbor, endCell) :
                manhattanDistance(neighbor, endCell);
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
