// Genetic Algorithm Implementation for Pathfinding

class Individual {
    constructor(path, fitness = 0) {
        this.path = path;
        this.fitness = fitness;
    }
}

async function genetic(grid, visualizer, delay, allowDiagonal = false) {
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

    // Genetic Algorithm Parameters
    const POPULATION_SIZE = 50;
    const GENERATIONS = 100;
    const MUTATION_RATE = 0.1;
    const ELITE_SIZE = 5;

    let population = initializePopulation(grid, startCell, endCell, POPULATION_SIZE, allowDiagonal);
    let bestIndividual = null;
    let nodesExplored = 0;

    for (let gen = 0; gen < GENERATIONS; gen++) {
        // Evaluate fitness
        for (const individual of population) {
            individual.fitness = evaluateFitness(individual.path, grid, endCell);
        }

        // Sort by fitness (higher is better)
        population.sort((a, b) => b.fitness - a.fitness);

        // Track best
        if (!bestIndividual || population[0].fitness > bestIndividual.fitness) {
            bestIndividual = { ...population[0], path: [...population[0].path] };
        }

        // Visualize best path every few generations
        if (visualizer && gen % 10 === 0) {
            visualizePath(grid, bestIndividual.path);
            visualizer.render();
            await new Promise(resolve => setTimeout(resolve, delay * 5));
        }

        // Create new generation
        const newPopulation = [];

        // Elitism - keep best individuals
        for (let i = 0; i < ELITE_SIZE; i++) {
            newPopulation.push(population[i]);
        }

        // Crossover and mutation
        while (newPopulation.length < POPULATION_SIZE) {
            const parent1 = selectParent(population);
            const parent2 = selectParent(population);

            let child = crossover(parent1, parent2);

            if (Math.random() < MUTATION_RATE) {
                child = mutate(child, grid, allowDiagonal);
            }

            newPopulation.push(child);
        }

        population = newPopulation;
        nodesExplored += POPULATION_SIZE;
    }

    // Final evaluation
    if (bestIndividual && isValidPath(bestIndividual.path, grid, endCell)) {
        // Mark final path
        for (const cell of bestIndividual.path) {
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
            pathLength: bestIndividual.path.length - 1,
            nodesExplored,
            timeElapsed: endTime - startTime,
            path: bestIndividual.path
        };
    }

    const endTime = performance.now();
    return {
        success: false,
        message: "No valid path found",
        pathLength: 0,
        nodesExplored,
        timeElapsed: endTime - startTime
    };
}

function initializePopulation(grid, startCell, endCell, size, allowDiagonal) {
    const population = [];

    for (let i = 0; i < size; i++) {
        const path = generateRandomPath(grid, startCell, endCell, allowDiagonal);
        population.push(new Individual(path));
    }

    return population;
}

function generateRandomPath(grid, startCell, endCell, allowDiagonal = false, maxLength = 100) {
    const path = [startCell];
    let current = startCell;

    for (let i = 0; i < maxLength; i++) {
        if (current === endCell) {
            break;
        }

        const neighbors = grid.getNeighbors(current, allowDiagonal);
        if (neighbors.length === 0) {
            break;
        }

        // Extract just cells from neighbor objects
        const neighborCells = neighbors.map(n => n.cell);

        // Bias towards end cell
        if (Math.random() < 0.7) {
            neighborCells.sort((a, b) =>
                manhattanDistance(a, endCell) - manhattanDistance(b, endCell)
            );
        }

        const next = neighborCells[Math.floor(Math.random() * Math.min(3, neighborCells.length))];
        path.push(next);
        current = next;
    }

    return path;
}

function evaluateFitness(path, grid, endCell) {
    if (path.length === 0) {
        return 0;
    }

    const lastCell = path[path.length - 1];
    const distanceToEnd = manhattanDistance(lastCell, endCell);

    // Fitness components
    let fitness = 1000;

    // Reward reaching the end
    if (lastCell === endCell) {
        fitness += 5000;
    }

    // Penalize distance from end
    fitness -= distanceToEnd * 10;

    // Penalize path length
    fitness -= path.length * 2;

    // Penalize invalid moves (obstacles)
    for (const cell of path) {
        if (cell.isObstacle) {
            fitness -= 1000;
        }
    }

    return Math.max(0, fitness);
}

function selectParent(population) {
    // Tournament selection
    const tournamentSize = 5;
    const tournament = [];

    for (let i = 0; i < tournamentSize; i++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        tournament.push(population[randomIndex]);
    }

    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
}

function crossover(parent1, parent2) {
    const minLength = Math.min(parent1.path.length, parent2.path.length);
    const crossoverPoint = Math.floor(Math.random() * minLength);

    const childPath = [
        ...parent1.path.slice(0, crossoverPoint),
        ...parent2.path.slice(crossoverPoint)
    ];

    return new Individual(childPath);
}

function mutate(individual, grid, allowDiagonal = false) {
    const path = [...individual.path];

    if (path.length < 2) {
        return individual;
    }

    const mutationPoint = Math.floor(Math.random() * (path.length - 1)) + 1;
    const cell = path[mutationPoint];
    const neighbors = grid.getNeighbors(cell, allowDiagonal);

    if (neighbors.length > 0) {
        const newCell = neighbors[Math.floor(Math.random() * neighbors.length)].cell;
        path[mutationPoint] = newCell;
    }

    return new Individual(path);
}

function isValidPath(path, grid, endCell) {
    if (path.length === 0) {
        return false;
    }

    const lastCell = path[path.length - 1];
    return lastCell === endCell;
}

function visualizePath(grid, path) {
    // Clear previous visualization
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            const cell = grid.grid[row][col];
            if (!cell.isStart && !cell.isEnd && !cell.isObstacle) {
                cell.isPath = false;
                cell.isExploring = false;
                cell.isVisited = false;
            }
        }
    }

    // Mark current path
    for (const cell of path) {
        if (!cell.isStart && !cell.isEnd) {
            cell.isExploring = true;
        }
    }
}
