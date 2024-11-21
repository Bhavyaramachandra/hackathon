(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const levelIndicator = document.getElementById('levelIndicator');

    const dots = [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 560 },
        { x: 100, y: 560 }
    ];

    const levels = [
        { duration: 1000, alertMessage: "Level 1 completed! Get ready for Level 2." },
        { duration: 2000, alertMessage: "Level 2 completed! Level 3 is coming up." },
        { duration: 3000, alertMessage: "Level 3 completed! Prepare for Level 4." },
        { duration: 4000, alertMessage: "Level 4 completed! Final level ahead!" },
        { duration: 5000, alertMessage: "Congratulations! 🎉 You've successfully completed all levels of the game!" }
    ];

    let currentDotIndex = 0;
    let currentLevel = 0;
    let timerInterval;
    let timeLeft;

    const socket = io.connect('http://' + document.domain + ':' + location.port);

    function drawDots() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (timeLeft !== undefined) {
            ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; 
    ctx.fill();

    
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;         
    ctx.fillText(`${timeLeft}s`, canvas.width / 2, canvas.height / 2);

    ctx.shadowBlur = 0;
        }
        
        dots.forEach((dot, index) => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 8, 0, Math.PI * 2);
            
            const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 8);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#8c6dfd');
            ctx.fillStyle = gradient;
            
            ctx.shadowColor = '#8c6dfd';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    function drawLine(dot1, dot2, progress) {
        ctx.beginPath();
        ctx.moveTo(dot1.x, dot1.y);
        const x = dot1.x + (dot2.x - dot1.x) * progress;
        const y = dot1.y + (dot2.y - dot1.y) * progress;
        ctx.lineTo(x, y);
        
        const gradient = ctx.createLinearGradient(dot1.x, dot1.y, x, y);
        gradient.addColorStop(0, '#ffffff');    
        gradient.addColorStop(0.5, '#f5f5f5'); 
        gradient.addColorStop(1, '#eaeaea');   
        ctx.strokeStyle = gradient;
        
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        ctx.shadowColor = '#00ffbb';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function updateLevelIndicator() {
        levelIndicator.textContent = `Level: ${currentLevel + 1}`;
    }

    function startGame() {
        socket.emit('stop_detection');
        socket.emit('reset_video_feed');
        
        drawDots();
        currentDotIndex = 0;
        currentLevel = 0;
        updateLevelIndicator();

        socket.emit('start_detection');
        startTimer();
    }

    function startTimer() {
        const levelDuration = levels[currentLevel].duration;
        let startTime = Date.now();

        timerInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = elapsedTime / levelDuration;
            timeLeft = Math.ceil((levelDuration - elapsedTime) / 1000);

            if (progress >= 1) {
                drawDots();
                drawLine(dots[currentDotIndex], dots[(currentDotIndex + 1) % dots.length], 1);
                currentDotIndex++;

                if (currentDotIndex >= dots.length) {
                    clearInterval(timerInterval);
                    nextLevel();
                } else {
                    startTime = Date.now();
                }
            } else {
                drawDots();
                for (let i = 0; i < currentDotIndex; i++) {
                    drawLine(dots[i], dots[(i + 1) % dots.length], 1);
                }
                drawLine(dots[currentDotIndex], dots[(currentDotIndex + 1) % dots.length], progress);
            }
        }, 30);
    }

    function nextLevel() {
        // Stop current level's detection
        socket.emit('stop_detection');

        // Show level completion alert
        if (currentLevel < levels.length) {
            const response = confirm(levels[currentLevel].alertMessage);
            
            // If user clicks OK, handle next level transition
            if (response) {
                // Reset video feed completely
                socket.emit('reset_video_feed');
                
                currentLevel++;
                if (currentLevel < levels.length) {
                    // Reset game state
                    currentDotIndex = 0;
                    updateLevelIndicator();
                    drawDots();
                    
                    // Small delay to ensure video feed resets
                    setTimeout(() => {
                        // Restart detection and timer
                        socket.emit('start_detection');
                        startTimer();
                    }, 500);
                } else {
                    // Final level completion
                    socket.emit('stop_detection');
                    drawDots();
                }
            }
        }
    }

    function stopGame() {
        clearInterval(timerInterval);
        socket.emit('stop_detection');
    }

    socket.on('motion_detected', function (data) {
        // Only stop the game if motion is detected during an active level
        if (currentLevel < levels.length) {
            stopGame();

            const errorMessage = document.getElementById('errorMessage');
            const errorMessageText = document.getElementById('errorMessageText');
            errorMessageText.textContent = data.message;
            errorMessage.style.display = 'block';
        }
    });

    document.getElementById('errorButton').addEventListener('click', function () {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'none';
        stopGame();
        drawDots();
    });

    document.getElementById('startButton').addEventListener('click', function () {
        startGame();
    });

    document.getElementById('stopButton').addEventListener('click', function () {
        stopGame();
    });

    document.getElementById('resetButton').addEventListener('click', function () {
        stopGame();
        socket.emit('stop_detection');
        socket.emit('reset_video_feed');
        currentLevel = 0;
        currentDotIndex = 0;
        updateLevelIndicator();
        drawDots();
    });

    document.getElementById('restartLevelButton').addEventListener('click', function () {
        stopGame();
        socket.emit('stop_detection');
        socket.emit('reset_video_feed');
        socket.emit('start_detection');
        currentDotIndex = 0;
        updateLevelIndicator();
        startTimer();
    });

    drawDots();
    updateLevelIndicator();
})();

