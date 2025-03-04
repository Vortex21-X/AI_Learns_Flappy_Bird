// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add autoclicker function
    function autoClick() {
        // Get the screen dimensions
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        
        // Calculate a safe area (bottom right corner, far from game)
        const x = screenWidth - 50;  // 50px from right edge
        const y = screenHeight - 50; // 50px from bottom edge
        
        // Create and trigger click event
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            screenX: x,
            screenY: y,
            clientX: x,
            clientY: y
        });
        
        // Dispatch event at document level
        document.elementFromPoint(x, y)?.dispatchEvent(clickEvent);
    }

    // Start autoclicker with random interval (between 2-4 seconds)
    setInterval(() => {
        if (!gameOver) {
            autoClick();
        }
    }, 2000 + Math.random() * 2000);

    // Create containers first
    const networkContainer = document.createElement('div');
    networkContainer.className = 'canvas-container';
    document.body.appendChild(networkContainer);

    const gameContainer = document.createElement('div');
    gameContainer.className = 'canvas-container';
    document.body.appendChild(gameContainer);

    // Create all canvases
    const networkCanvas = document.createElement('canvas');
    networkCanvas.id = 'networkCanvas';
    networkCanvas.width = 520;
    networkCanvas.height = 200;
    const networkCtx = networkCanvas.getContext('2d');

    const populationCanvas = document.createElement('canvas');
    populationCanvas.id = 'populationCanvas';
    populationCanvas.width = 200;
    populationCanvas.height = 480;
    const populationCtx = populationCanvas.getContext('2d');

    const gameCanvas = document.createElement('canvas');
    gameCanvas.id = 'gameCanvas';
    gameCanvas.width = 320;  // Original game width
    gameCanvas.height = 480;
    const ctx = gameCanvas.getContext('2d');

    const statsCanvas = document.createElement('canvas');
    statsCanvas.id = 'statsCanvas';
    statsCanvas.width = 200;
    statsCanvas.height = 480;
    const statsCtx = statsCanvas.getContext('2d');

    // Add canvases to their containers
    networkContainer.appendChild(networkCanvas);
    gameContainer.appendChild(populationCanvas);
    gameContainer.appendChild(gameCanvas);
    gameContainer.appendChild(statsCanvas);

    // Style all canvases
    [networkCanvas, populationCanvas, gameCanvas, statsCanvas].forEach(canvas => {
        canvas.style.display = 'inline-block';
        canvas.style.margin = '10px';
        canvas.style.border = '2px solid black';
    });

    // Game state
    let bird = {
        x: 50,
        y: gameCanvas.height / 2,
        velocity: 0,
        width: 34,
        height: 24
    };

    let pipes = [];
    let score = 0;
    let bestScore = localStorage.getItem('flappyBestScore') || 0;
    let gameStarted = false;
    let gameOver = false;

    // Load images
    const sprites = new Image();
    sprites.src = 'assets/sprites.png';

    // Bird animation frames - updating to match the exact bird frames from the sprite sheet
    const birdFrames = [
        { x: 3, y: 491 },    // First frame of bird
        { x: 31, y: 491 },   // Second frame of bird
        { x: 59, y: 491 },   // Third frame of bird
        { x: 31, y: 491 }    // Back to second frame
    ];
    let currentFrame = 0;
    let frameCount = 0;

    // Background and ground scrolling
    let bgX = 0;
    let groundX = 0;

    // Create population
    let population = new Population(gameCanvas.width, gameCanvas.height);

    // Event listeners
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            handleFlap();
        }
    });

    gameCanvas.addEventListener('click', handleFlap);

    document.getElementById('restartButton').addEventListener('click', resetGame);

    function handleFlap() {
        if (gameOver) return;
        
        if (!gameStarted) {
            gameStarted = true;
            startGame();
        }
        
        bird.velocity = FLAP_SPEED;
    }

    function startGame() {
        gameLoop();
        setInterval(spawnPipe, PIPE_SPAWN_INTERVAL);
    }

    function spawnPipe() {
        if (gameOver) return;

        // Check if the last pipe is too close
        if (pipes.length > 0) {
            const lastPipe = pipes[pipes.length - 1];
            if (lastPipe.x > gameCanvas.width - PIPE_HORIZONTAL_GAP) {
                return;
            }
        }

        // More extreme height variation
        const minHeight = 60;  // Lower minimum height for more variation
        const maxHeight = gameCanvas.height - PIPE_GAP - 80 - GROUND_HEIGHT;  // Adjusted for smaller gap
        
        // Enhanced randomization for more varied heights
        let height;
        const randomFactor = Math.random();
        
        if (randomFactor < 0.4) {
            // 40% chance for extreme heights
            height = randomFactor < 0.2 ? 
                minHeight + Math.random() * 40 : // Very high pipes (20% chance)
                maxHeight - Math.random() * 40;  // Very low pipes (20% chance)
        } else {
            // 60% chance for middle range
            height = minHeight + Math.random() * (maxHeight - minHeight);
        }

        pipes.push({
            x: gameCanvas.width,
            height: Math.floor(height),
            gap: PIPE_GAP,
            scored: false
        });
    }

    function resetGame() {
        bird.y = gameCanvas.height / 2;
        bird.velocity = 0;
        pipes = [];
        score = 0;
        gameOver = false;
        gameStarted = false;
        document.getElementById('gameOver').classList.add('hidden');
    }

    function updateBird() {
        bird.velocity += GRAVITY;
        bird.y += bird.velocity;

        // Ground collision
        if (bird.y + bird.height > gameCanvas.height - GROUND_HEIGHT) {
            bird.y = gameCanvas.height - GROUND_HEIGHT - bird.height;
            gameOver = true;
        }

        // Ceiling collision
        if (bird.y < 0) {
            bird.y = 0;
            bird.velocity = 0;
        }

        // Bird animation
        if (frameCount % 5 === 0) {
            currentFrame = (currentFrame + 1) % birdFrames.length;
        }
        frameCount++;
    }

    function updatePipes() {
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= PIPE_SPEED;

            // Check collision
            if (checkCollision(pipes[i])) {
                gameOver = true;
            }

            // Score point
            if (!pipes[i].scored && pipes[i].x + 52 < bird.x) {
                score++;
                pipes[i].scored = true;
                if (score > bestScore) {
                    bestScore = score;
                    localStorage.setItem('flappyBestScore', bestScore);
                }
            }

            // Remove off-screen pipes
            if (pipes[i].x + 52 < 0) {
                pipes.splice(i, 1);
            }
        }
    }

    function checkCollision(pipe) {
        const birdBox = {
            x: bird.x + 5,
            y: bird.y + 5,
            width: bird.width - 10,
            height: bird.height - 10
        };

        // Top pipe collision
        if (birdBox.x < pipe.x + 52 &&
            birdBox.x + birdBox.width > pipe.x &&
            birdBox.y < pipe.height) {
            return true;
        }

        // Bottom pipe collision
        if (birdBox.x < pipe.x + 52 &&
            birdBox.x + birdBox.width > pipe.x &&
            birdBox.y + birdBox.height > pipe.height + pipe.gap) {
            return true;
        }

        return false;
    }

    function drawStats() {
        // Clear stats canvas
        statsCtx.clearRect(0, 0, statsCanvas.width, statsCanvas.height);
        
        // Fill background
        statsCtx.fillStyle = '#70c5ce';
        statsCtx.fillRect(0, 0, statsCanvas.width, statsCanvas.height);

        const startY = 50;
        const lineHeight = 25;
        let currentY = startY;

        statsCtx.fillStyle = 'black';
        statsCtx.font = '14px Arial';
        statsCtx.textAlign = 'left';

        // Find nearest pipe chain
        let nearestPipe = null;
        let minDistance = Infinity;
        for (const pipe of pipes) {
            if (pipe.x + 52 >= bird.x) {
                const distance = pipe.x - bird.x;
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPipe = pipe;
                }
            }
        }

        // Draw stats with 20px left padding
        const statsX = 20;
        
        // X-distance from nearest pipe
        statsCtx.fillText(`Distance to pipe: ${nearestPipe ? Math.max(0, Math.floor(minDistance)) : 'N/A'} px`, statsX, currentY);
        currentY += lineHeight;

        // Current y-position
        statsCtx.fillText(`Bird Y-pos: ${Math.floor(bird.y)} px`, statsX, currentY);
        currentY += lineHeight;

        if (nearestPipe) {
            // Distance from top pipe
            const distanceFromTop = Math.floor(bird.y - nearestPipe.height);
            statsCtx.fillText(`Gap to top pipe: ${distanceFromTop} px`, statsX, currentY);
            currentY += lineHeight;

            // Distance from bottom pipe
            const distanceFromBottom = Math.floor(nearestPipe.height + nearestPipe.gap - (bird.y + bird.height));
            statsCtx.fillText(`Gap to bottom pipe: ${distanceFromBottom} px`, statsX, currentY);
        } else {
            statsCtx.fillText(`Gap to top pipe: N/A`, statsX, currentY);
            currentY += lineHeight;
            statsCtx.fillText(`Gap to bottom pipe: N/A`, statsX, currentY);
        }
    }

    function draw() {
        // Clear game canvas
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Draw background (light blue sky)
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Draw pipes - draw bottom pipes first, then top pipes to prevent overlay issues
        for (const pipe of pipes) {
            // Bottom pipe
            ctx.drawImage(sprites, 84, 323, 26, 160, pipe.x, pipe.height + pipe.gap, 52, 400);
        }
        for (const pipe of pipes) {
            // Top pipe
            ctx.drawImage(sprites, 56, 323, 26, 160, pipe.x, pipe.height - 400, 52, 400);
        }

        // Draw ground (green ground) - Fixed ground scrolling by adding more segments
        for (let i = 0; i < 3; i++) {
            ctx.drawImage(sprites, 292, 0, 168, 56, groundX + (i * 224), gameCanvas.height - GROUND_HEIGHT, 224, 112);
        }

        // Draw birds from population
        population.draw(ctx, sprites, birdFrames, currentFrame);

        // Draw score with regular font
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(score, gameCanvas.width / 2, 50);
        ctx.fillText(score, gameCanvas.width / 2, 50);

        // Draw get ready message at start
        if (!gameStarted) {
            ctx.drawImage(sprites, 292, 91, 96, 22, gameCanvas.width / 2 - 48, gameCanvas.height / 2 - 100, 96, 22);
        }

        // Draw stats in separate canvas
        drawStats();
    }

    function updateBackground() {
        bgX -= 1;
        if (bgX <= -276) bgX = 0;

        groundX -= PIPE_SPEED;
        if (groundX <= -224) groundX = 0;  // Reset ground position earlier to prevent gaps
    }

    function drawNetwork() {
        networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
        networkCtx.fillStyle = '#fff';
        networkCtx.fillRect(0, 0, networkCanvas.width, networkCanvas.height);

        const bestBird = population.birds.find(b => b.alive) || population.bestBird;
        if (!bestBird) return;

        // Draw nodes
        const layers = [INPUT_NODES, 6, OUTPUT_NODES];
        const layerSpacing = networkCanvas.width / (layers.length + 1);
        const nodeSpacing = networkCanvas.height / (Math.max(...layers) + 1);

        // Draw connections with weights
        networkCtx.strokeStyle = '#000';
        const weights = bestBird.brain.getWeights();
        
        // Draw connections between layers
        for (let i = 0; i < layers.length - 1; i++) {
            const layerWeights = weights[i * 2].arraySync();
            for (let j = 0; j < layers[i]; j++) {
                for (let k = 0; k < layers[i + 1]; k++) {
                    const weight = layerWeights[j][k];
                    const x1 = layerSpacing * (i + 1);
                    const y1 = nodeSpacing * (j + 1);
                    const x2 = layerSpacing * (i + 2);
                    const y2 = nodeSpacing * (k + 1);
                    
                    networkCtx.beginPath();
                    networkCtx.strokeStyle = weight > 0 ? 'rgba(0,255,0,' + Math.abs(weight) + ')' 
                                                      : 'rgba(255,0,0,' + Math.abs(weight) + ')';
                    networkCtx.lineWidth = Math.abs(weight) * 2;
                    networkCtx.moveTo(x1, y1);
                    networkCtx.lineTo(x2, y2);
                    networkCtx.stroke();
                }
            }
        }

        // Draw nodes
        layers.forEach((nodeCount, layerIndex) => {
            for (let i = 0; i < nodeCount; i++) {
                const x = layerSpacing * (layerIndex + 1);
                const y = nodeSpacing * (i + 1);
                
                networkCtx.beginPath();
                networkCtx.arc(x, y, 10, 0, Math.PI * 2);
                networkCtx.fillStyle = '#70c5ce';
                networkCtx.fill();
                networkCtx.strokeStyle = '#000';
                networkCtx.lineWidth = 1;
                networkCtx.stroke();

                // Add labels
                networkCtx.fillStyle = '#000';
                networkCtx.font = '12px Arial';
                networkCtx.textAlign = 'center';
                if (layerIndex === 0) {
                    const labels = ['Dist', 'Y-pos', 'Top', 'Bottom'];
                    networkCtx.fillText(labels[i], x, y + 25);
                } else if (layerIndex === layers.length - 1) {
                    networkCtx.fillText('Flap', x, y + 25);
                }
            }
        });
    }

    function drawPopulationStats() {
        populationCtx.clearRect(0, 0, populationCanvas.width, populationCanvas.height);
        populationCtx.fillStyle = '#fff';
        populationCtx.fillRect(0, 0, populationCanvas.width, populationCanvas.height);

        const stats = {
            'Generation': population.generation,
            'Alive': population.birds.filter(b => b.alive).length,
            'Best Score': population.bestScore,
            'Current Score': score
        };

        populationCtx.fillStyle = '#000';
        populationCtx.font = '16px Arial';
        populationCtx.textAlign = 'left';
        
        let y = 50;
        Object.entries(stats).forEach(([key, value]) => {
            populationCtx.fillText(`${key}: ${value}`, 20, y);
            y += 30;
        });
    }

    function gameLoop() {
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        updateBackground();
        
        if (gameStarted && !gameOver) {
            // Update population first
            if (population.update(pipes)) {
                // Reset pipes and score when a new generation starts
                pipes = [];
                score = 0;
                // Spawn initial pipe for new generation
                spawnPipe();
            }
            
            // Update pipes
            for (let i = pipes.length - 1; i >= 0; i--) {
                pipes[i].x -= PIPE_SPEED;
                
                // Remove off-screen pipes
                if (pipes[i].x + 52 < 0) {
                    pipes.splice(i, 1);
                }
            }

            // Update score based on the best performing bird
            const aliveBirds = population.birds.filter(b => b.alive);
            if (aliveBirds.length > 0) {
                score = Math.max(...aliveBirds.map(b => b.score));
            }
        }

        draw();
        drawNetwork();
        drawPopulationStats();
        drawStats();

        if (!gameOver) {
            requestAnimationFrame(gameLoop);
        }
    }

    // Start initial draw
    sprites.onload = () => {
        draw();
    };

    // Update bird size to match sprite
    bird.width = 34;  // Doubled from sprite size for better visibility
    bird.height = 24; // Doubled from sprite size for better visibility 

    // Start game automatically
    gameStarted = true;
    startGame();
}); 