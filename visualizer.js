// Visualization controller for algorithm animations

class Visualizer {
    constructor(renderer) {
        this.renderer = renderer;
        this.isRunning = false;
    }

    render() {
        this.renderer.render();
    }

    async animatePath(path, delay) {
        for (const cell of path) {
            if (!cell.isStart && !cell.isEnd) {
                cell.isPath = true;
                this.render();
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    stop() {
        this.isRunning = false;
    }
}
