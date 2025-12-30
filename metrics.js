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

    exportToCSV() {
        if (this.results.length === 0) {
            alert('No results to export');
            return;
        }

        const headers = ['Algorithm', 'Status', 'Path Length', 'Path Cost', 'Nodes Explored', 'Time (ms)', 'Timestamp'];
        const rows = this.results.map(r => [
            r.algorithm,
            r.success ? 'Success' : 'Failed',
            r.pathLength || 'N/A',
            r.pathCost ? r.pathCost.toFixed(2) : 'N/A',
            r.nodesExplored || 0,
            r.timeElapsed.toFixed(2),
            r.timestamp.toISOString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pathfinding-results-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportToJSON() {
        if (this.results.length === 0) {
            alert('No results to export');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            totalResults: this.results.length,
            results: this.results.map(r => ({
                ...r,
                timestamp: r.timestamp.toISOString()
            }))
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pathfinding-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
