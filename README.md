# 🤖 Robot Pathfinding Algorithm Simulation

An interactive web-based simulation comparing pathfinding algorithms for autonomous grass-cutting robots. Features diagonal movement, weighted terrain, customizable parameters, preset scenarios, and comprehensive analytics.

![Status](https://img.shields.io/badge/Status-Active-success) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow) ![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

### Core Functionality
- **Interactive Grid** (40×50 cells) with drag-and-drop interface
- **Four Algorithms**: Dijkstra, A*, Genetic, BFS
- **Real-time Visualization** with adjustable speed

### Advanced Features (Phases 1-8)
- ✅ **Diagonal Movement**: 8-directional pathfinding with √2 cost
- ✅ **Weighted Terrain**: 5 types (Normal, Grass, Mud, Water, Sand) with varying costs
- ✅ **Save/Load**: JSON export/import of grid configurations
- ✅ **Results Export**: CSV and JSON downloads
- ✅ **Parameter Tuning**: A* weight, GA population/generations/mutation
- ✅ **5 Preset Scenarios**: Maze, Terrain, Narrow, Scattered, Mixed
- ✅ **Keyboard Shortcuts**: Space, Esc, C, S, L, R

## 🚀 Quick Start

```bash
git clone https://github.com/jitesh523/robot_algorithm_simulation-.git
cd robot_algorithm_simulation-
python -m http.server 8000  # Navigate to http://localhost:8000
```

## 📖 Usage

1. **Setup**: Choose preset or draw obstacles/terrain
2. **Configure**: Select algorithms, adjust parameters, toggle diagonal
3. **Run**: Press Space or click Run Simulation
4. **Analyze**: View metrics, export results

### Keyboard Shortcuts
- **Space**: Run | **Esc**: Stop | **C**: Clear | **S**: Save | **L**: Load | **R**: Random

## 🧠 Algorithm Comparison

| Algorithm | Speed | Optimality | Best For |
|-----------|-------|------------|----------|
| Dijkstra | Medium | ✅ Optimal | Guaranteed shortest path |
| A* | ⚡ Fast | ✅ Optimal | Best overall (robotics standard) |
| Genetic | Slow | ≈ Approximate | Complex environments |
| BFS | Fast | ✅ Optimal* | Simple unweighted grids |

## 📁 Files

- `index.html` - UI
- `app.js` - Controller
- `simulation.js` - Grid & terrain
- `metrics.js` - Performance tracking
- `dijkstra.js`, `astar.js`, `genetic.js`, `bfs.js` - Algorithms

## 👨‍💻 Author

**Jitesh** - [@jitesh523](https://github.com/jitesh523)

## 📝 License

MIT License

---

⭐ **Star this project if you find it useful!**
