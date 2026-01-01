// Visualization controller for algorithm animations

class Visualizer {
    constructor(renderer) {
        this.renderer = renderer;
        this.isRunning = false;
        this.recording = [];
        this.isRecording = false;
    }

    startRecording() {
        this.recording = [];
        this.isRecording = true;
    }

    stopRecording() {
        this.isRecording = false;
        return this.recording;
    }

    recordStep(cells, state) {
        if (!this.isRecording) return;

        // Record cell states
        const step = {
            cells: cells.map(cell => ({
                row: cell.row,
                col: cell.col,
                state: state // 'exploring', 'visited', 'path'
            })),
            timestamp: Date.now()
        };
        this.recording.push(step);
    }

    render() {
        this.renderer.render();
    }

    async animatePath(path, delay) {
        for (const cell of path) {
            if (!cell.isStart && !cell.isEnd) {
                cell.isPath = true;
                this.recordStep([cell], 'path');
                this.render();
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    stop() {
        this.isRunning = false;
    }

    async replay(recording, grid, speed = 1.0) {
        grid.reset();
        this.renderer.render();

        for (const step of recording) {
            for (const cellData of step.cells) {
                const cell = grid.getCell(cellData.row, cellData.col);
                if (!cell || cell.isStart || cell.isEnd || cell.isObstacle) continue;

                if (cellData.state === 'exploring') {
                    cell.isExploring = true;
                } else if (cellData.state === 'visited') {
                    cell.isExploring = false;
                    cell.isVisited = true;
                } else if (cellData.state === 'path') {
                    cell.isPath = true;
                }
            }

            this.renderer.render();
            await new Promise(resolve => setTimeout(resolve, 50 / speed));
        }
    }
}
