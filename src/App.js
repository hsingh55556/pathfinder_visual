import './App.css';
import { useState } from 'react';

// Helper to get neighbors
function getNeighbors(node, grid, numRows, numCols) {
  const { row, col } = node;
  const neighbors = [];
  if (row > 0 && !grid[row - 1][col].isBlocked) neighbors.push(grid[row - 1][col]);
  if (row < numRows - 1 && !grid[row + 1][col].isBlocked) neighbors.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].isBlocked) neighbors.push(grid[row][col - 1]);
  if (col < numCols - 1 && !grid[row][col + 1].isBlocked) neighbors.push(grid[row][col + 1]);
  return neighbors;
}

// Dijkstra's algorithm implementation
function dijkstra(grid, startNode, endNode, numRows, numCols) {
  const visitedNodesInOrder = [];
  const distances = Array.from({ length: numRows }, () =>
    Array(numCols).fill(Infinity)
  );
  const prev = Array.from({ length: numRows }, () =>
    Array(numCols).fill(null)
  );
  distances[startNode.row][startNode.col] = 0;

  const unvisited = [];
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      if (!grid[row][col].isBlocked) {
        unvisited.push(grid[row][col]);
      }
    }
  }

  while (unvisited.length) {
    // Sort by distance
    unvisited.sort(
      (a, b) =>
        distances[a.row][a.col] - distances[b.row][b.col]
    );
    const closest = unvisited.shift();
    if (distances[closest.row][closest.col] === Infinity) break;
    visitedNodesInOrder.push(closest);
    if (closest.row === endNode.row && closest.col === endNode.col) break;

    const neighbors = getNeighbors(closest, grid, numRows, numCols);
    for (const neighbor of neighbors) {
      const alt = distances[closest.row][closest.col] + 1;
      if (alt < distances[neighbor.row][neighbor.col]) {
        distances[neighbor.row][neighbor.col] = alt;
        prev[neighbor.row][neighbor.col] = closest;
      }
    }
  }

  // Build shortest path
  const path = [];
  let curr = grid[endNode.row][endNode.col];
  while (curr && prev[curr.row][curr.col]) {
    path.unshift(curr);
    curr = prev[curr.row][curr.col];
  }
  if (curr && (curr.row !== startNode.row || curr.col !== startNode.col)) {
    // No path found
    return { visitedNodesInOrder, path: [] };
  }
  path.unshift(grid[startNode.row][startNode.col]);
  return { visitedNodesInOrder, path };
}

function App() {
  const numRows = 20;
  const numCols = 40;

  const [startNode, setStartNode] = useState({ row: 10, col: 5 });
  const [endNode, setEndNode] = useState({ row: 10, col: 35 });
  const [selecting, setSelecting] = useState(null);
  const [algorithm, setAlgorithm] = useState("dijkstra");
  const [visited, setVisited] = useState([]);
  const [shortestPath, setShortestPath] = useState([]);
  const [blockMode, setBlockMode] = useState(false);
  const [blockages, setBlockages] = useState(new Set());

  // Create a 2D array for grid data
  const gridData = [];
  for (let row = 0; row < numRows; row++) {
    const currentRow = [];
    for (let col = 0; col < numCols; col++) {
      const isBlocked = blockages.has(`${row},${col}`);
      currentRow.push({ row, col, isBlocked });
    }
    gridData.push(currentRow);
  }

  // Handle cell click to set start, end, or block node
  const handleCellClick = (row, col) => {
    if (selecting === "start") {
      setStartNode({ row, col });
      setSelecting(null);
    } else if (selecting === "end") {
      setEndNode({ row, col });
      setSelecting(null);
    } else if (blockMode) {
      setBlockages(prev => {
        const newSet = new Set(prev);
        const key = `${row},${col}`;
        if (
          (row === startNode.row && col === startNode.col) ||
          (row === endNode.row && col === endNode.col)
        ) {
          return newSet; // Don't block start or end node
        }
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        return newSet;
      });
    }
  };

  // Visualize algorithm
  const visualize = () => {
    // Always use the latest gridData and clear previous visualization
    setVisited([]);
    setShortestPath([]);
    setTimeout(() => {
      let result;
      if (algorithm === "dijkstra") {
        result = dijkstra(gridData, startNode, endNode, numRows, numCols);
      } else {
        alert("Only Dijkstra's Algorithm is implemented in this demo.");
        return;
      }
      animate(result.visitedNodesInOrder, result.path);
    }, 0);
  };

  // Animate the algorithm
  function animate(visitedNodes, path) {
    for (let i = 0; i <= visitedNodes.length; i++) {
      if (i === visitedNodes.length) {
        setTimeout(() => {
          animatePath(path);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        setVisited((prev) => [...prev, visitedNodes[i]]);
      }, 10 * i);
    }
  }

  function animatePath(path) {
    for (let i = 0; i < path.length; i++) {
      setTimeout(() => {
        setShortestPath((prev) => [...prev, path[i]]);
      }, 40 * i);
    }
  }

  // Render grid with start, end, visited, path, and blocked nodes
  const grid = gridData.map((row, rowIdx) => (
    <div key={rowIdx} className="grid-row">
      {row.map(cell => {
        let cellClass = "grid-cell";
        if (cell.row === startNode.row && cell.col === startNode.col) {
          cellClass += " start-node";
        } else if (cell.row === endNode.row && cell.col === endNode.col) {
          cellClass += " end-node";
        } else if (cell.isBlocked) {
          cellClass += " blocked-node";
        } else if (shortestPath.some(n => n.row === cell.row && n.col === cell.col)) {
          cellClass += " path-node";
        } else if (visited.some(n => n.row === cell.row && n.col === cell.col)) {
          cellClass += " visited-node";
        }
        return (
          <div
            key={`${cell.row}-${cell.col}`}
            className={cellClass}
            onClick={() => handleCellClick(cell.row, cell.col)}
            style={{ cursor: selecting || blockMode ? "pointer" : "default" }}
          ></div>
        );
      })}
    </div>
  ));

  return (
    <div className="App">
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setSelecting("start")}>
          Select Start Node
        </button>
        <button onClick={() => setSelecting("end")} style={{ marginLeft: 8 }}>
          Select End Node
        </button>
        <button
          onClick={() => setBlockMode(b => !b)}
          style={{
            marginLeft: 8,
            background: blockMode ? "#333" : undefined,
            color: blockMode ? "#fff" : undefined,
          }}
        >
          {blockMode ? "Block Mode: ON" : "Block Mode: OFF"}
        </button>
        <select
          value={algorithm}
          onChange={e => setAlgorithm(e.target.value)}
          style={{ marginLeft: 16 }}
        >
          <option value="dijkstra">Dijkstra's Algorithm</option>
          <option value="bfs" disabled>Breadth-First Search (BFS)</option>
          <option value="dfs" disabled>Depth-First Search (DFS)</option>
          <option value="astar" disabled>A* Search</option>
        </select>
        <button onClick={visualize} style={{ marginLeft: 16 }}>
          Visualize
        </button>
        <button onClick={() => {
          setVisited([]);
          setShortestPath([]);
          setBlockages(new Set());
        }} style={{ marginLeft: 8 }}>
          Reset
        </button>
        <span style={{ marginLeft: 8 }}>
          Algorithm: <b>{algorithm}</b>
        </span>
        {selecting && (
          <span style={{ marginLeft: 16 }}>
            Click a cell to set the {selecting} node
          </span>
        )}
        {blockMode && (
          <span style={{ marginLeft: 16, color: "#333" }}>
            Click cells to toggle blockages
          </span>
        )}
      </div>
      <div className="grid-container">
        {grid}
      </div>
    </div>
  );
}

export default App;
