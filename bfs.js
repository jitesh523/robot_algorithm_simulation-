// Breadth-First Search Algorithm Implementation

async function bfs(grid, visualizer, delay) {
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

    const queue = [startCell];
    startCell.isVisited = true;
    let nodesExplored = 0;

    while (queue.length > 0) {
        const current = queue.shift();
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
                nodesExplored,
                timeElapsed: endTime - startTime,
                path
            };
        }

        // Explore neighbors
        const neighbors = grid.getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited) {
                neighbor.isVisited = true;
                neighbor.parent = current;
                queue.push(neighbor);
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
