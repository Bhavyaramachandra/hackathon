(function() {

    // Get canvas context
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Define dots on the rectangle's sides
    const dots = [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 500 },
        { x: 100, y: 500 }
    ];
    
    // Define levels and corresponding timer durations (in milliseconds)
    const levels = [
        { duration: 5000 }, // Level 1: 5 seconds
        { duration: 7000 }, // Level 2: 7 seconds
        { duration: 9000 }, // Level 3: 9 seconds
        { duration: 11000 }, // Level 4: 11 seconds
        { duration: 13000 }, // Level 5: 13 seconds
        { duration: 15000 } // Level 6: 15 seconds
    ];
    
    // Variables
    let currentDotIndex = 0;
    let currentLevel = 0;
    let timerInterval;
    let timeLeft;
    
    // Function to draw dots on the canvas
    function drawDots() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function drawLines() {
        for (let i = 0; i <= dots.length; i++) {
            const dot1 = dots[i];
            const dot2 = i === dots.length - 1 ? dots[0] : dots[i + 1]; // If last dot, connect to the first dot
            drawLine(dot1, dot2, 1);
        }
    }
    
    
    // Function to draw a line between two dots
    function drawLine(dot1, dot2, progress) {
        ctx.beginPath();
        ctx.moveTo(dot1.x, dot1.y);
        const x = dot1.x + (dot2.x - dot1.x) * progress;
        const y = dot1.y + (dot2.y - dot1.y) * progress;
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    // Function to display the countdown timer
    function displayTimer() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 - 30, 100, 60);
    
        ctx.fillStyle = '#000';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeLeft, canvas.width / 2, canvas.height / 2 + 10);
    }
    
    // Function to create level indicators
    function createLevelIndicators() {
        const levelIndicator = document.getElementById('levelIndicator');
        levels.forEach((level, index) => {
            const levelElement = document.createElement('div');
            levelElement.classList.add('level');
            if (index < currentLevel) {
                levelElement.classList.add('completed');
            } else if (index === currentLevel) {
                levelElement.classList.add('ongoing');
            }
            levelElement.textContent = `Level ${index + 1}`;
            levelIndicator.appendChild(levelElement);
        });
    }
    
    // Function to update level indicators
    // Function to update the level indicators
    function updateLevelIndicators() {
        const levelIndicator = document.getElementById('levelIndicator');
        levelIndicator.innerHTML = '';
        levels.forEach((level, index) => {
            const levelDiv = document.createElement('div');
            levelDiv.classList.add('level');
            levelDiv.textContent = `Level ${index + 1}`;
            if (index==currentLevel-1) {
                levelDiv.style.backgroundColor = 'green';
            } else if (index==currentLevel) {
                levelDiv.style.backgroundColor = 'orange';
            } else {
                levelDiv.style.backgroundColor = 'white';
            }
            levelIndicator.appendChild(levelDiv);
        });
    }
    
    
    // Function to start the game
    // Modified startGame function to clear level indicators before creating them
    function startGame() {
        // Clear level indicators
        const levelIndicator = document.getElementById('levelIndicator');
        levelIndicator.innerHTML = '';
    
        // Clear canvas and draw dots
        drawDots();
    
        // Reset current dot index and current level
        currentDotIndex = 0;
        currentLevel = 0;
    
        // Create level indicators
        createLevelIndicators();
        updateLevelIndicators();
        // Start timer for current level
        startTimer();
        drawLines();
    }
    
    
    // Function to start the timer for the current level
    // Function to start the timer for the current level
    function startTimer() {
        const levelDuration = levels[currentLevel].duration;
        const segmentDuration = levelDuration; // Time per line segment
        let startTime = Date.now();
    
        timerInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = elapsedTime / segmentDuration;
            timeLeft = Math.ceil((levelDuration - elapsedTime) / 1000);
    
            if (progress >= 1) {
                drawDots();
                if (currentDotIndex === dots.length - 1) {
                    drawLine(dots[currentDotIndex], dots[0], 1); // Connect last dot to first dot
                    alert('Level Completed!');
                    clearInterval(timerInterval);
                    nextLevel();
                } else {
                    drawLine(dots[currentDotIndex], dots[currentDotIndex +1], 1);
                    currentDotIndex++;
                    startTime = Date.now();
                }
                if (currentDotIndex === dots.length - 1) {
                    drawLine(dots[currentDotIndex], dots[0], progress); // Draw line from 4th dot to 1st dot
                }
            } else {
                drawDots();
                for (let i = 0; i < currentDotIndex; i++) {
                    drawLine(dots[i], dots[i + 1], 1);
                }
                drawLine(dots[currentDotIndex], dots[currentDotIndex + 1], progress);
            }
    
            // Display the countdown timer
            displayTimer();
        }, 30); // Update line and timer every 30 milliseconds
    }
    
    
    // Function to move to the next level
    function nextLevel() {
        currentLevel++;
        if (currentLevel < levels.length) {
            // Update level indicators
            updateLevelIndicators();
            currentDotIndex = 0; // Reset dot index for the new level
            alert(`Congratulations! You've completed Level ${currentLevel}. Starting Level ${currentLevel + 1}`);
            startTimer();
        } else {
            // All levels completed
            alert('Congratulations! You\'ve completed all levels.');
            drawDots();
        }
    }
    
    // Function to stop the game
    function stopGame() {
        clearInterval(timerInterval);
    }
    
    // Function to reset the game
    // Modified resetGame function to reset level indicators
    function resetGame() {
        stopGame();
        drawDots();
        currentDotIndex = 0;
        currentLevel = 0;
        // Clear level indicators and create new ones
        const levelIndicator = document.getElementById('levelIndicator');
        levelIndicator.innerHTML = '';
        createLevelIndicators();
    }
    
    
    // Function to restart the current level
    function restartLevel() {
        stopGame();
        drawDots();
        currentDotIndex = 0;
        startTimer();
    }
    
    // Event listeners for buttons
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('stopButton').addEventListener('click', stopGame);
    document.getElementById('resetButton').addEventListener('click', resetGame);
    document.getElementById('restartLevelButton').addEventListener('click', restartLevel);
    
    // Initial draw
    drawDots();
    const socket = io.connect('http://' + document.domain + ':' + location.port);
    
    // Listen for the 'motion_detected' event
    socket.on('motion_detected', function(data) {
        // Display the error message
        stopGame();
    
        // Display the error message
        const errorMessage = document.getElementById('errorMessage');
        const errorMessageText = document.getElementById('errorMessageText');
        errorMessageText.textContent = data.message;
        errorMessage.style.display = 'block';
    });
    
    // Event listener for error button to reset the game
    document.getElementById('errorButton').addEventListener('click', function() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'none';
        resetGame();
    });
    
    
    })();