# 🤖 Robot Pathfinding Algorithm Simulation

An interactive web-based simulation comparing pathfinding algorithms for autonomous grass-cutting robots. This project visualizes and benchmarks four different pathfinding algorithms on a customizable grid environment.

![Robot Pathfinding Simulation](https://img.shields.io/badge/Status-Active-success)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

- **Interactive Grid-Based Environment**
  - Drag-and-drop obstacle placement
  - Customizable start and end points
  - Random obstacle generation
  - Real-time grid editing

- **Four Pathfinding Algorithms**
  - **Dijkstra's Algorithm**: Classic shortest path algorithm
  - **A* (A-Star)**: Heuristic-based pathfinding
  - **Genetic Algorithm**: Evolutionary approach to pathfinding
  - **Breadth-First Search (BFS)**: Graph traversal algorithm

- **Visual Comparison**
  - Real-time algorithm visualization
  - Color-coded exploration and path states
  - Adjustable visualization speed (1-100ms)
  - Side-by-side performance metrics

- **Performance Metrics**
  - Path length comparison
  - Nodes explored count
  - Execution time analysis
  - Success/failure status
  - Best algorithm recommendation

## 🎮 Demo

Simply open `index.html` in your web browser to start using the simulation!

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No additional dependencies required!

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jitesh523/robot_algorithm_simulation-.git
   cd robot_algorithm_simulation-
   ```

2. **Open in browser**
   ```bash
   # Option 1: Double-click index.html
   # Option 2: Use a local server (recommended)
   python -m http.server 8000
   # Then navigate to http://localhost:8000
   ```

## 📖 How to Use

### 1. Set Up Your Grid

- **Place Start Point** 🟢: Click the "Start" button and click on the grid
- **Place End Point** 🎯: Click the "End" button and click on the grid
- **Draw Obstacles** 🧱: Select "Obstacle" and draw walls on the grid
- **Erase** 🧹: Remove obstacles or reset cells
- **Random Obstacles**: Generate random obstacles with one click

### 2. Configure Algorithms

Select one or more algorithms to compare:
- ✅ Dijkstra's Algorithm
- ✅ A* Pathfinding
- ✅ Genetic Algorithm
- ✅ Breadth-First Search

### 3. Adjust Visualization Speed

Use the speed slider to control the animation speed (1-100ms per step)

### 4. Run Simulation

Click **▶ Run Simulation** to watch the algorithms find paths in real-time!

### 5. View Results

Performance metrics are displayed in cards showing:
- **Path Length**: Number of steps in the path
- **Nodes Explored**: Total cells examined
- **Time Elapsed**: Algorithm execution time
- **Status**: Success or failure indicator

## 🧠 Algorithms Explained

### Dijkstra's Algorithm
A classic graph search algorithm that guarantees the shortest path. It explores all nodes in order of distance from the start, making it reliable but potentially slower for large grids.

**Best for**: Guaranteed shortest path, uniform cost grids

### A* (A-Star) Pathfinding
An informed search algorithm that uses heuristics (Manhattan distance) to guide the search. Generally faster than Dijkstra while still finding optimal paths.

**Best for**: Optimal path with improved performance, most common in robotics

### Genetic Algorithm
An evolutionary approach that generates multiple random paths and evolves them over generations through crossover and mutation. Offers a unique meta-heuristic approach.

**Best for**: Complex environments, when approximate solutions are acceptable

### Breadth-First Search (BFS)
Explores the graph level by level, guaranteeing the shortest path in unweighted graphs. Simple and effective for grid-based environments.

**Best for**: Unweighted graphs, simple grid navigation

## 📁 Project Structure

```
robot_algorithm_simulation-/
│
├── index.html              # Main HTML structure
├── styles.css              # Modern UI styling
├── app.js                  # Main application controller
├── simulation.js           # Grid and rendering logic
├── visualizer.js           # Animation and visualization
├── metrics.js              # Performance tracking
│
├── dijkstra.js            # Dijkstra's algorithm implementation
├── astar.js               # A* algorithm implementation
├── genetic.js             # Genetic algorithm implementation
├── bfs.js                 # BFS algorithm implementation
│
├── extract_pdf.py         # PDF text extraction utility
└── Jitesh_ResearchPaper_Latest.pdf  # Research paper reference
```

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Graphics**: HTML5 Canvas API
- **Styling**: CSS3 with custom properties
- **Typography**: Google Fonts (Inter)
- **Architecture**: Modular JavaScript design

## 🎨 Key Components

### Grid System
```javascript
const GRID_ROWS = 40;
const GRID_COLS = 50;
const CELL_SIZE = 15;
```

### Cell States
- **Start**: Green (starting position)
- **End**: Red (target position)
- **Obstacle**: Dark gray (walls/barriers)
- **Exploring**: Blue (currently being examined)
- **Visited**: Purple (already examined)
- **Path**: Gold (final solution path)

## 📊 Performance Comparison

The simulation provides real-time metrics to help you understand the trade-offs between algorithms:

| Algorithm | Speed | Optimality | Memory | Use Case |
|-----------|-------|------------|--------|----------|
| Dijkstra | Medium | Optimal | High | Guaranteed shortest path |
| A* | Fast | Optimal | Medium | Best overall performance |
| Genetic | Slow | Approximate | High | Complex environments |
| BFS | Fast | Optimal (unweighted) | High | Simple grids |

## 🔬 Research Background

This project is based on research comparing pathfinding algorithms for autonomous lawn mowers and grass-cutting robots. The simulation allows for practical comparison of different approaches to robot navigation in obstacle-rich environments.

See `Jitesh_ResearchPaper_Latest.pdf` for detailed research findings.

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- Add new pathfinding algorithms (Jump Point Search, Theta*, etc.)
- Implement weighted cells for terrain costs
- Add diagonal movement support
- Create preset challenging maps
- Improve mobile responsiveness
- Add algorithm parameter tuning

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Jitesh**
- GitHub: [@jitesh523](https://github.com/jitesh523)

## 🙏 Acknowledgments

- Research on autonomous lawn mower pathfinding
- Modern web design patterns and best practices
- Canvas API for high-performance rendering
- Community feedback and testing

## 🐛 Known Issues

- Performance may degrade on very large grids (>100x100)
- Genetic algorithm may not always find optimal path
- Mobile touch interactions could be improved

## 🔮 Future Enhancements

- [ ] 3D visualization option
- [ ] Diagonal movement support
- [ ] Weighted terrain/cost map
- [ ] Save/load grid configurations
- [ ] Export results as CSV/JSON
- [ ] Multi-robot pathfinding
- [ ] Real-time obstacle updates
- [ ] Algorithm parameter customization

---

**⭐ If you find this project helpful, please consider giving it a star!**

For questions or feedback, please open an issue on GitHub.
