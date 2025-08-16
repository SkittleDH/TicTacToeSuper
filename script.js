document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const cells = document.querySelectorAll(".cell");
  const resetButton = document.getElementById("reset-btn");
  const twoPlayerBtn = document.getElementById("two-player-btn");
  const botBtn = document.getElementById("bot-btn");
  const markerX = document.querySelector(".marker.x");
  const markerO = document.querySelector(".marker.o");
  const winScreen = document.getElementById("win-screen");
  const winnerText = document.getElementById("winner-text");
  const canvas = document.getElementById("network-background");

  // Game state
  let gameActive = true;
  let currentPlayer = "X";
  let gameMode = "2-player"; // "2-player" or "bot"
  let gameBoard = ["", "", "", "", "", "", "", "", ""];

  // Winning combinations
  const winningConditions = [
    [0, 1, 2], // Rows
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6], // Columns
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8], // Diagonals
    [2, 4, 6],
  ];

  // Initialize network background
  setupNetworkBackground();

  // Update the turn indicator
  function updateTurnIndicator() {
    if (currentPlayer === "X") {
      markerX.classList.add("active");
      markerO.classList.remove("active");
    } else {
      markerX.classList.remove("active");
      markerO.classList.add("active");
    }
  }

  // Handle a cell click
  function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute("data-index"));
    
    // Check if cell is already marked or game is inactive
    if (gameBoard[clickedCellIndex] !== "" || !gameActive) return;

    // Add tap effect with explosion
    addTapEffect(clickedCell);
    createCircleExplosion(clickedCell);
    
    // Place marker
    gameBoard[clickedCellIndex] = currentPlayer;
    clickedCell.classList.add(currentPlayer.toLowerCase(), "marked");

    if (checkWin()) {
      gameActive = false;
      highlightWinningCells();
      showWinScreen(`${currentPlayer} WINS!`, currentPlayer);
      // Add lose animation to non-winning cells
      cells.forEach((cell) => {
        if (!cell.classList.contains("win")) {
          cell.classList.add("lose");
        }
      });
      return;
    }

    if (checkDraw()) {
      gameActive = false;
      animateDraw();
      showWinScreen("DRAW!", "draw");
      return;
    }

    // Switch turn and update indicator
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateTurnIndicator();

    // Bot's turn if applicable
    if (gameMode === "bot" && currentPlayer === "O" && gameActive) {
      setTimeout(makeBotMove, 500);
    }
  }

  // Add tap effect to element
  function addTapEffect(element) {
    element.classList.add("tapped");
    setTimeout(() => {
      element.classList.remove("tapped");
    }, 300);
  }

  // Create circle explosion effect
  function createCircleExplosion(element) {
    const explosion = document.createElement('div');
    explosion.classList.add('circle-explosion');
    
    // Position the explosion
    const rect = element.getBoundingClientRect();
    explosion.style.left = rect.width / 2 + 'px';
    explosion.style.top = rect.height / 2 + 'px';
    
    // Add to element and remove after animation
    element.appendChild(explosion);
    setTimeout(() => {
      if (explosion.parentNode) {
        explosion.parentNode.removeChild(explosion);
      }
    }, 700); // Animation duration + a little extra
  }

  // Show full screen win/lose/draw
  function showWinScreen(message, winner) {
    winnerText.textContent = message;
    
    // Apply appropriate class based on winner
    if (winner === "X") {
      winScreen.classList.add("x-win");
    } else if (winner === "O") {
      winScreen.classList.add("o-win");
    } else {
      winScreen.classList.add("draw");
    }
    
    // Show the screen with delay for dramatic effect
    setTimeout(() => {
      winScreen.classList.add("visible");
      
      // Add click handler to dismiss
      winScreen.addEventListener('click', hideWinScreen, { once: true });
    }, 800);
  }

  // Hide the win screen
  function hideWinScreen() {
    winScreen.classList.remove("visible", "x-win", "o-win", "draw");
  }

  // Bot move
  function makeBotMove() {
    if (!gameActive) return;
    
    // Simple but effective bot strategy
    let bestMoveIndex = findBestMove();
    
    const cell = document.querySelector(`.cell[data-index="${bestMoveIndex}"]`);
    addTapEffect(cell);
    createCircleExplosion(cell);
    
    gameBoard[bestMoveIndex] = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase(), "marked");

    if (checkWin()) {
      gameActive = false;
      highlightWinningCells();
      showWinScreen("BOT WINS!", "O");
      cells.forEach((cell) => {
        if (!cell.classList.contains("win")) {
          cell.classList.add("lose");
        }
      });
      return;
    }

    if (checkDraw()) {
      gameActive = false;
      animateDraw();
      showWinScreen("DRAW!", "draw");
      return;
    }
    
    currentPlayer = "X";
    updateTurnIndicator();
  }

  // Find best move for bot (simplified for performance)
  function findBestMove() {
    // First check if bot can win in one move
    for (let i = 0; i < 9; i++) {
      if (gameBoard[i] === "") {
        gameBoard[i] = "O";
        if (checkWin()) {
          gameBoard[i] = "";
          return i; // Winning move found
        }
        gameBoard[i] = "";
      }
    }
    
    // Then check if player can win in one move and block it
    for (let i = 0; i < 9; i++) {
      if (gameBoard[i] === "") {
        gameBoard[i] = "X";
        if (checkWin()) {
          gameBoard[i] = "";
          return i; // Blocking move found
        }
        gameBoard[i] = "";
      }
    }
    
    // Take center if available
    if (gameBoard[4] === "") {
      return 4;
    }
    
    // Take corners if available
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => gameBoard[i] === "");
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Take any available edge
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(i => gameBoard[i] === "");
    if (availableEdges.length > 0) {
      return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }
    
    // If no good move found, find any empty cell
    const emptyIndices = gameBoard
      .map((val, idx) => val === "" ? idx : -1)
      .filter(idx => idx !== -1);
      
    if (emptyIndices.length > 0) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }
    
    return -1; // Board is full
  }

  function checkWin() {
    for (const condition of winningConditions) {
      const [a, b, c] = condition;
      if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c])
        return true;
    }
    return false;
  }

  function highlightWinningCells() {
    for (const condition of winningConditions) {
      const [a, b, c] = condition;
      if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
        // Sequential highlighting for a nice effect
        document.querySelector(`.cell[data-index="${a}"]`).classList.add("win");
        setTimeout(() => {
          document.querySelector(`.cell[data-index="${b}"]`).classList.add("win");
        }, 100);
        setTimeout(() => {
          document.querySelector(`.cell[data-index="${c}"]`).classList.add("win");
        }, 200);
        break;
      }
    }
  }

  function checkDraw() {
    return !gameBoard.includes("") && !checkWin();
  }

  function animateDraw() {
    cells.forEach((cell, index) => {
      // Staggered animation
      setTimeout(() => {
        cell.classList.add("draw");
      }, index * 70);
    });
    
    markerX.classList.remove("active");
    markerO.classList.remove("active");
    markerX.classList.add("draw-marker");
    markerO.classList.add("draw-marker");
  }

  // Setup network background
  function setupNetworkBackground() {
    const ctx = canvas.getContext('2d');
    let nodes = [];
    let connections = [];
    const nodeCount = 30;
    const connectionDistance = 150;
    
    // Resize canvas to window size
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Regenerate nodes after resize
      createNodes();
    }
    
    // Create network nodes
    function createNodes() {
      nodes = [];
      connections = [];
      
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5
        });
      }
    }
    
    // Update node positions
    function updateNodes() {
      nodes.forEach(node => {
        // Move nodes
        node.x += node.speedX;
        node.y += node.speedY;
        
        // Wrap around edges
        if (node.x < 0) node.x = canvas.width;
        if (node.x > canvas.width) node.x = 0;
        if (node.y < 0) node.y = canvas.height;
        if (node.y > canvas.height) node.y = 0;
      });
      
      // Find connections
      connections = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < connectionDistance) {
            // Calculate distance to center for fading
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const distToCenter = Math.sqrt(
              Math.pow((nodes[i].x + nodes[j].x) / 2 - centerX, 2) +
              Math.pow((nodes[i].y + nodes[j].y) / 2 - centerY, 2)
            );
            
            const maxDist = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2));
            const opacity = 1 - (distToCenter / maxDist);
            
            // Only show connections with some opacity
            if (opacity > 0.1) {
              connections.push({
                from: i,
                to: j,
                opacity: opacity * 0.5 * (1 - distance / connectionDistance)
              });
            }
          }
        }
      }
    }
    
    // Draw the network
    function drawNetwork() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      connections.forEach(conn => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${conn.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      
      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      });
    }
    
    // Animation loop
    function animate() {
      updateNodes();
      drawNetwork();
      requestAnimationFrame(animate);
    }
    
    // Initialize and start animation
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();
  }

  // Event Listeners
  cells.forEach((cell) => {
    cell.addEventListener("click", handleCellClick);
  });
  
  // FIXED: Reset button now refreshes the site
  resetButton.addEventListener("click", function() {
    console.log("Refreshing the page...");
    location.reload();
  });
  
  // FIXED: Bot mode selection
  botBtn.addEventListener("click", function() {
    console.log("Bot mode selected");
    gameMode = "bot";
    
    // Clear active class from both buttons first
    twoPlayerBtn.classList.remove("active");
    botBtn.classList.remove("active");
    
    // Add active class to bot button
    botBtn.classList.add("active");
    
    // Remove any inline styles that might interfere
    twoPlayerBtn.removeAttribute("style");
    botBtn.removeAttribute("style");
    
    // Apply button animation
    botBtn.classList.add("button-pulse");
    setTimeout(() => {
      botBtn.classList.remove("button-pulse");
    }, 600);
  });
  
  twoPlayerBtn.addEventListener("click", function() {
    console.log("2-Player mode selected");
    gameMode = "2-player";
    
    // Clear active class from both buttons first
    twoPlayerBtn.classList.remove("active");
    botBtn.classList.remove("active");
    
    // Add active class to 2-player button
    twoPlayerBtn.classList.add("active");
    
    // Remove any inline styles that might interfere
    twoPlayerBtn.removeAttribute("style");
    botBtn.removeAttribute("style");
    
    // Apply button animation
    twoPlayerBtn.classList.add("button-pulse");
    setTimeout(() => {
      twoPlayerBtn.classList.remove("button-pulse");
    }, 600);
  });
});