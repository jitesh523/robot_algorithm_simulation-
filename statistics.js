// Statistics Tracker for multiple simulation runs

class StatisticsTracker {
    constructor() {
        this.history = {}; // algorithmName -> array of results
    }

    addRun(algorithmName, result) {
        if (!this.history[algorithmName]) {
            this.history[algorithmName] = [];
        }

        this.history[algorithmName].push({
            pathLength: result.pathLength || 0,
            pathCost: result.pathCost || 0,
            nodesExplored: result.nodesExplored || 0,
            timeElapsed: result.timeElapsed || 0,
            success: result.success || false,
            timestamp: new Date().toISOString()
        });
    }

    getStatistics(algorithmName) {
        const runs = this.history[algorithmName];
        if (!runs || runs.length === 0) {
            return null;
        }

        const successfulRuns = runs.filter(r => r.success);
        if (successfulRuns.length === 0) {
            return { runCount: runs.length, successRate: 0 };
        }

        return {
            runCount: runs.length,
            successRate: (successfulRuns.length / runs.length) * 100,
            pathLength: this.calculateStats(successfulRuns.map(r => r.pathLength)),
            pathCost: this.calculateStats(successfulRuns.map(r => r.pathCost)),
            nodesExplored: this.calculateStats(successfulRuns.map(r => r.nodesExplored)),
            timeElapsed: this.calculateStats(successfulRuns.map(r => r.timeElapsed))
        };
    }

    calculateStats(values) {
        if (values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;

        // Calculate standard deviation
        const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return {
            avg: avg,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            stdDev: stdDev
        };
    }

    getAllStatistics() {
        const stats = {};
        for (const algo in this.history) {
            stats[algo] = this.getStatistics(algo);
        }
        return stats;
    }

    clearHistory() {
        this.history = {};
    }

    hasData() {
        return Object.keys(this.history).length > 0;
    }
}
