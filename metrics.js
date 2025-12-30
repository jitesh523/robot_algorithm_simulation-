// Performance metrics tracking and display

class MetricsTracker {
    constructor() {
        this.results = [];
    }

    addResult(algorithmName, result) {
        this.results.push({
            algorithm: algorithmName,
            ...result,
            timestamp: new Date()
        });
    }

    clear() {
        this.results = [];
    }

    displayResults() {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = '';

        if (this.results.length === 0) {
            container.innerHTML = '<div class="result-card placeholder"><p>Run the simulation to see results</p></div>';
            return;
        }

        for (const result of this.results) {
            const card = this.createResultCard(result);
            container.appendChild(card);
        }
    }

    createResultCard(result) {
        const card = document.createElement('div');
        card.className = 'result-card';

        const statusClass = result.success ? 'status-success' : 'status-failed';
        const statusText = result.success ? 'Success' : 'Failed';

        card.innerHTML = `
            <h3>
                ${this.getAlgorithmIcon(result.algorithm)}
                ${result.algorithm}
            </h3>
            <div class="metric">
                <span class="metric-label">Status</span>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Path Length</span>
                <span class="metric-value">${result.pathLength} cells</span>
            </div>
            ${result.pathCost ? `
            <div class="metric">
                <span class="metric-label">Path Cost</span>
                <span class="metric-value">${result.pathCost.toFixed(2)} units</span>
            </div>
            ` : ''}
            <div class="metric">
                <span class="metric-label">Nodes Explored</span>
                <span class="metric-value">${result.nodesExplored.toLocaleString()}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Time Elapsed</span>
                <span class="metric-value">${result.timeElapsed.toFixed(2)} ms</span>
            </div>
            ${!result.success ? `<div class="metric"><span class="metric-label">Message</span><span class="metric-value">${result.message}</span></div>` : ''}
        `;

        return card;
    }

    getAlgorithmIcon(algorithmName) {
        const icons = {
            "Dijkstra's Algorithm": "🔵",
            "A* Pathfinding": "⭐",
            "Genetic Algorithm": "🧬",
            "Breadth-First Search": "🌊"
        };
        return icons[algorithmName] || "🤖";
    }

    getBestAlgorithm() {
        if (this.results.length === 0) {
            return null;
        }

        const successful = this.results.filter(r => r.success);
        if (successful.length === 0) {
            return null;
        }

        // Sort by path length (ascending), then by time (ascending)
        successful.sort((a, b) => {
            if (a.pathLength !== b.pathLength) {
                return a.pathLength - b.pathLength;
            }
            return a.timeElapsed - b.timeElapsed;
        });

        return successful[0];
    }
}
