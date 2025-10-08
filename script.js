document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('scoreEl');
    const powerUpsStatusEl = document.getElementById('powerUpsStatus');
    const enemyCountEl = document.getElementById('enemyCount');
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScore = document.getElementById('finalScore');
    const restartButton = document.getElementById('restartButton');
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const closeHelpButton = document.getElementById('closeHelpButton');
    const leaderboardButton = document.getElementById('leaderboardButton');
    const leaderboardModal = document.getElementById('leaderboardModal');
    const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
    const nameInputModal = document.getElementById('nameInputModal');
    const playerNameInput = document.getElementById('playerNameInput');
    const nextToDifficultyButton = document.getElementById('nextToDifficultyButton');
    const difficultyModal = document.getElementById('difficultyModal');
    const easyModeButton = document.getElementById('easyModeButton');
    const hardModeButton = document.getElementById('hardModeButton');
    const insaneModeButton = document.getElementById('insaneModeButton');
    const backToNameButton = document.getElementById('backToNameButton');
    const saveScoreButton = document.getElementById('saveScoreButton');
    const leaderboardList = document.getElementById('leaderboardList');

    // Firebase configuration
    const firebaseConfig = {
        databaseURL: "https://space-54f01-default-rtdb.firebaseio.com/"
    };
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    
    let playerName = '';
    let currentScore = 0;
    let gameMode = 'easy'; // 'easy', 'hard', 'insane'
    let difficultyMultiplier = 1;
    let scoreMultiplier = 1;

    // Set canvas size to match container width and increase height
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth - 40; // Account for padding
    const canvasHeight = 500; // Fixed height for better gameplay
    
    canvas.width = containerWidth;
    canvas.height = canvasHeight;

    let animationId;
    let score = 0;
    let player;
    let projectiles = [];
    let enemies = [];
    let particles = [];
    let powerUps = [];
    let orbitingMoons = [];
    let bombs = [];
    let enemyInterval, powerUpInterval, bombInterval;
    let powerUpTimers = {};
    let gameStartTime = Date.now();
    let playerHealth = 3;
    let difficultyLevel = 1;
    let lastHitTime = 0;
    const hitCooldown = 1000; // 1 second cooldown between hits

    const keys = { w: { pressed: false }, a: { pressed: false }, s: { pressed: false }, d: { pressed: false } };

    // --- CLASSES ---
    class Player {
        constructor(x, y, radius, color) {
            this.x = x; this.y = y; this.radius = radius; this.color = color; this.speed = 5;
            this.isInvincible = false;
            this.ricochetActive = false;
            this.doubleShot = false;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            // Draw shield if invincible
            if (this.isInvincible) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2, false);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }
        update() {
            this.draw();
            if (keys.w.pressed && this.y - this.radius > 0) this.y -= this.speed;
            if (keys.s.pressed && this.y + this.radius < canvas.height) this.y += this.speed;
            if (keys.a.pressed && this.x - this.radius > 0) this.x -= this.speed;
            if (keys.d.pressed && this.x + this.radius < canvas.width) this.x += this.speed;
        }
    }
    
    // --- NEW CLASSES ---
    class PowerUp {
        constructor(x, y, radius, emoji, type) {
            this.x = x; this.y = y; this.radius = radius; this.emoji = emoji; this.type = type;
        }
        draw() {
            ctx.font = `${this.radius * 2}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, this.x, this.y);
        }
    }

    class OrbitingMoon {
        constructor(player, radius, distance, speed) {
            this.player = player; this.radius = radius; this.distance = distance; this.speed = speed;
            this.angle = Math.random() * Math.PI * 2;
        }
        draw() {
            ctx.font = '24px serif';
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle + Math.PI/2);
            ctx.fillText('🌙', 0, 0);
            ctx.restore();
        }
        update() {
            this.angle += this.speed;
            this.x = this.player.x + Math.cos(this.angle) * this.distance;
            this.y = this.player.y + Math.sin(this.angle) * this.distance;
            this.draw();
        }
    }

    class Bomb {
        constructor(x, y, radius) {
            this.x = x; this.y = y; this.radius = radius;
            this.lifetime = 5000; // 5 seconds
            this.startTime = Date.now();
            this.pulsePhase = 0;
        }
        draw() {
            // Pulsing effect
            this.pulsePhase += 0.1;
            const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
            const currentRadius = this.radius * pulse;
            
            // Draw bomb with warning effect
            ctx.font = `${currentRadius * 2}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', this.x, this.y);
            
            // Warning circle
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius + 10, 0, Math.PI * 2, false);
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(this.pulsePhase * 2) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        update() {
            this.draw();
            const elapsed = Date.now() - this.startTime;
            this.lifetime -= 16; // Approximate frame time
        }
        isExpired() {
            return this.lifetime <= 0;
        }
    }
    
    class Projectile {
        constructor(x, y, radius, color, velocity) {
            this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        update() {
            this.draw();
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }
    }
    class Enemy {
        constructor(x, y, radius, color, velocity) {
            this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity;
            this.maxHealth = Math.ceil(radius / 5) * difficultyMultiplier; // Health based on size and difficulty
            this.health = this.maxHealth;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            
            // Draw health bar for enemies with multiple health
            if (this.maxHealth > 1) {
                const barWidth = this.radius * 2;
                const barHeight = 4;
                const barX = this.x - barWidth / 2;
                const barY = this.y - this.radius - 10;
                
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Health
                const healthPercent = this.health / this.maxHealth;
                ctx.fillStyle = healthPercent > 0.5 ? 'green' : healthPercent > 0.25 ? 'yellow' : 'red';
                ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            }
        }
        update() {
            this.draw();
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            
            // Bounce off edges
            if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
                this.velocity.x = -this.velocity.x;
                this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
                // Create bounce effect
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(this.x, this.y, Math.random() * 2, this.color, 
                        { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 }));
                }
            }
            if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
                this.velocity.y = -this.velocity.y;
                this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
                // Create bounce effect
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(this.x, this.y, Math.random() * 2, this.color, 
                        { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 }));
                }
            }
        }
        takeDamage(damage = 1) {
            this.health -= damage;
            return this.health <= 0;
        }
    }
    const friction = 0.99;
    class Particle {
         constructor(x, y, radius, color, velocity) {
            this.x = x; this.y = y; this.radius = radius; this.color = color; this.velocity = velocity; this.alpha = 1;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
        update() {
            this.draw();
            this.velocity.x *= friction; this.velocity.y *= friction;
            this.x += this.velocity.x; this.y += this.velocity.y;
            this.alpha -= 0.01;
        }
    }


    // --- SPAWNERS ---
    function updateHealthDisplay() {
        const healthDisplay = document.getElementById('healthDisplay');
        if (healthDisplay) {
            healthDisplay.innerHTML = '❤️'.repeat(playerHealth);
        }
    }

    function updateEnemyCount() {
        if (enemyCountEl) {
            enemyCountEl.innerHTML = enemies.length;
            // Change color based on enemy count
            if (enemies.length >= 8) {
                enemyCountEl.style.color = '#ef4444'; // red
            } else if (enemies.length >= 5) {
                enemyCountEl.style.color = '#f59e0b'; // orange
            } else {
                enemyCountEl.style.color = '#10b981'; // green
            }
        }
    }

    function spawnEnemies() {
        enemyInterval = setInterval(() => {
            // Limit maximum enemies to 10
            if (enemies.length >= 10) {
                return;
            }
            
            const difficulty = updateDifficulty();
            const radius = Math.random() * (30 - 8) + 8;
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
            }
            
            const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
            const angle = Math.atan2(player.y - y, player.x - x);
            const baseSpeed = 2 + (difficulty * 0.5);
            const speed = baseSpeed * difficultyMultiplier; // Apply difficulty multiplier
            const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
            
            enemies.push(new Enemy(x, y, radius, color, velocity));
        }, Math.max(500, 1000 - (difficultyLevel * 100))); // Faster spawn with difficulty
    }
    
    function spawnPowerUps() {
        powerUpInterval = setInterval(() => {
            const powerUpTypes = [
                { emoji: '⭐', type: 'star' },
                { emoji: '🌙', type: 'moon' },
                { emoji: '🌕', type: 'redmoon' },
                { emoji: '🛡️', type: 'shield', weight: 0.3 } // Reduced chance for shield
            ];
            
            // Weighted random selection
            const totalWeight = 1 + 1 + 1 + 0.3; // star, moon, redmoon, shield
            let random = Math.random() * totalWeight;
            let choice;
            
            if (random < 1) choice = powerUpTypes[0]; // star
            else if (random < 2) choice = powerUpTypes[1]; // moon  
            else if (random < 3) choice = powerUpTypes[2]; // redmoon
            else choice = powerUpTypes[3]; // shield (reduced chance)
            
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            console.log('Spawning powerup:', choice.type, 'at', x, y); // Debug log
            powerUps.push(new PowerUp(x, y, 15, choice.emoji, choice.type));
        }, 8000); // Spawn every 8 seconds
    }

    function spawnBombs() {
        bombInterval = setInterval(() => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            console.log('Spawning bomb at', x, y);
            bombs.push(new Bomb(x, y, 20));
        }, 15000); // Spawn every 15 seconds
    }

    function updateDifficulty() {
        const gameTime = (Date.now() - gameStartTime) / 1000; // seconds
        difficultyLevel = Math.floor(gameTime / 30) + 1; // Increase every 30 seconds
        return difficultyLevel;
    }

    // Firebase functions
    function saveScore(name, score) {
        const timestamp = Date.now();
        const scoreData = {
            name: name,
            score: score,
            mode: gameMode,
            difficultyMultiplier: difficultyMultiplier,
            scoreMultiplier: scoreMultiplier,
            timestamp: timestamp,
            date: new Date().toLocaleDateString('vi-VN')
        };
        
        return database.ref('scores').push(scoreData);
    }

    function getLeaderboard() {
        return database.ref('scores').orderByChild('score').once('value');
    }

    function displayLeaderboard() {
        getLeaderboard().then((snapshot) => {
            const scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push(childSnapshot.val());
            });
            
            // Sort by score (highest first)
            scores.sort((a, b) => b.score - a.score);
            
            // Take only top 10
            const topScores = scores.slice(0, 10);
            
            leaderboardList.innerHTML = '';
            
            if (topScores.length === 0) {
                leaderboardList.innerHTML = '<p class="text-center text-gray-400">Chưa có điểm số nào!</p>';
                return;
            }
            
            topScores.forEach((scoreData, index) => {
                const rank = index + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                
                const scoreElement = document.createElement('div');
                scoreElement.className = `flex justify-between items-center p-3 rounded-lg ${
                    rank <= 3 ? 'bg-gradient-to-r from-yellow-900 to-yellow-800 border-2 border-yellow-500' : 'bg-gray-800'
                }`;
                const modeIcon = scoreData.mode === 'easy' ? '🟢' : scoreData.mode === 'hard' ? '🟠' : '🔴';
                const modeText = scoreData.mode === 'easy' ? 'DỄ' : scoreData.mode === 'hard' ? 'KHÓ' : 'SIÊU KHÓ';
                
                scoreElement.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${medal}</span>
                        <div>
                            <div class="font-bold ${rank <= 3 ? 'text-yellow-300' : 'text-sky-300'}">${scoreData.name}</div>
                            <div class="text-sm text-gray-400">${scoreData.date}</div>
                            <div class="text-xs ${scoreData.mode === 'easy' ? 'text-green-400' : scoreData.mode === 'hard' ? 'text-orange-400' : 'text-red-400'}">${modeIcon} ${modeText}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold ${rank <= 3 ? 'text-yellow-400' : 'text-green-400'}">${scoreData.score.toLocaleString()}</div>
                        ${rank <= 3 ? '<div class="text-xs text-yellow-300">TOP ' + rank + '</div>' : ''}
                    </div>
                `;
                leaderboardList.appendChild(scoreElement);
            });
        }).catch((error) => {
            console.error('Error loading leaderboard:', error);
            leaderboardList.innerHTML = '<p class="text-center text-red-400">Lỗi tải bảng xếp hạng!</p>';
        });
    }

    // --- GAME STATE ---
    function init() {
        player = new Player(canvas.width / 2, canvas.height / 2, 15, 'white');
        projectiles = []; enemies = []; particles = []; powerUps = []; orbitingMoons = []; bombs = [];
        score = 0; scoreEl.innerHTML = score;
        powerUpsStatusEl.innerHTML = '';
        gameOverModal.style.display = 'none';
        nameInputModal.style.display = 'none';
        playerHealth = 3;
        gameStartTime = Date.now();
        difficultyLevel = 1;
        lastHitTime = 0;
        updateHealthDisplay();

        if (enemyInterval) clearInterval(enemyInterval);
        if (powerUpInterval) clearInterval(powerUpInterval);
        if (bombInterval) clearInterval(bombInterval);
        Object.values(powerUpTimers).forEach(timer => clearTimeout(timer));
        powerUpTimers = {};
    }

    function activatePowerUp(powerUp) {
        switch(powerUp.type) {
            case 'shield':
                player.isInvincible = true;
                updatePowerUpUI('shield', 7);
                if (powerUpTimers.shield) clearTimeout(powerUpTimers.shield);
                powerUpTimers.shield = setTimeout(() => {
                    player.isInvincible = false;
                    updatePowerUpUI('shield', 0);
                }, 7000);
                break;
            case 'moon':
                orbitingMoons = []; // Reset existing moons
                orbitingMoons.push(new OrbitingMoon(player, 12, 50, 0.05));
                orbitingMoons.push(new OrbitingMoon(player, 12, 50, 0.05, Math.PI));
                updatePowerUpUI('moon', 20);
                if (powerUpTimers.moon) clearTimeout(powerUpTimers.moon);
                powerUpTimers.moon = setTimeout(() => {
                    orbitingMoons = [];
                    updatePowerUpUI('moon', 0);
                }, 20000);
                break;
            case 'redmoon':
                player.doubleShot = true;
                updatePowerUpUI('redmoon', 15);
                if (powerUpTimers.redmoon) clearTimeout(powerUpTimers.redmoon);
                powerUpTimers.redmoon = setTimeout(() => {
                    player.doubleShot = false;
                    updatePowerUpUI('redmoon', 0);
                }, 15000);
                break;
            case 'star':
                player.ricochetActive = true;
                updatePowerUpUI('star', 30);
                if (powerUpTimers.star) clearTimeout(powerUpTimers.star);
                powerUpTimers.star = setTimeout(() => {
                    player.ricochetActive = false;
                    updatePowerUpUI('star', 0);
                }, 30000);
                break;
        }
    }

    function updatePowerUpUI(type, duration) {
        let icon;
        switch (type) {
            case 'shield': icon = '🛡️'; break;
            case 'moon': icon = '🌙'; break;
            case 'redmoon': icon = '🌕'; break;
            case 'star': icon = '⭐'; break;
        }
        let existingEl = document.getElementById(`powerup-${type}`);
        if (duration > 0) {
            if (!existingEl) {
                existingEl = document.createElement('div');
                existingEl.id = `powerup-${type}`;
                existingEl.className = 'power-up-status';
                powerUpsStatusEl.appendChild(existingEl);
            }
            existingEl.innerHTML = `${icon} <span class="text-base">${duration}s</span>`;
            
            let secondsLeft = duration - 1;
            const interval = setInterval(() => {
                if (secondsLeft > 0) {
                    existingEl.innerHTML = `${icon} <span class="text-base">${secondsLeft}s</span>`;
                    secondsLeft--;
                } else {
                    clearInterval(interval);
                }
            }, 1000);
             if (powerUpTimers[type]) {
                 existingEl.dataset.intervalId = interval;
             }
        } else {
            if (existingEl) {
                clearInterval(existingEl.dataset.intervalId);
                existingEl.remove();
            }
        }
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        ctx.fillStyle = 'rgba(12, 12, 23, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        player.update();

        // Update & draw powerups, check for collection
        powerUps.forEach((powerUp, index) => {
            powerUp.draw();
            const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y);
            if (dist - player.radius - powerUp.radius < 1) {
                activatePowerUp(powerUp);
                powerUps.splice(index, 1);
            }
        });
        
        // Update orbiting moons
        orbitingMoons.forEach(moon => moon.update());

        // Update bombs
        bombs.forEach((bomb, index) => {
            bomb.update();
            if (bomb.isExpired()) {
                bombs.splice(index, 1);
            }
        });

        // Update enemy count display
        updateEnemyCount();

        // Update particles (limit to prevent lag)
        if (particles.length > 50) {
            particles = particles.slice(-50); // Keep only last 50 particles
        }
        particles.forEach((particle, index) => {
            if (particle.alpha <= 0) particles.splice(index, 1);
            else particle.update();
        });

        // Update projectiles
        projectiles.forEach((p, pIndex) => {
            p.update();
            if (p.x + p.radius < 0 || p.x - p.radius > canvas.width || p.y + p.radius < 0 || p.y - p.radius > canvas.height) {
                setTimeout(() => projectiles.splice(pIndex, 1), 0);
            }
        });

        enemies.forEach((enemy, eIndex) => {
            enemy.update();
            
            // Player collision with cooldown
            const distPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            const currentTime = Date.now();
            if (distPlayer - enemy.radius - player.radius < 1 && !player.isInvincible && 
                currentTime - lastHitTime > hitCooldown) {
                playerHealth--;
                lastHitTime = currentTime;
                updateHealthDisplay();
                
                // Create hit effect
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(player.x, player.y, Math.random() * 3, 'red', 
                        { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 }));
                }
                
                if (playerHealth <= 0) {
                    cancelAnimationFrame(animationId);
                    clearInterval(enemyInterval);
                    clearInterval(powerUpInterval);
                    clearInterval(bombInterval);
                    currentScore = score;
                    finalScore.textContent = score;
                    gameOverModal.style.display = 'flex';
                }
            }
            
            // Moon collision
            orbitingMoons.forEach(moon => {
                const distMoon = Math.hypot(moon.x - enemy.x, moon.y - enemy.y);
                if (distMoon - enemy.radius - moon.radius < 1) {
                    // Similar to projectile hit but no ricochet (reduced particles)
                    for (let i = 0; i < Math.min(enemy.radius, 6); i++) {
                        particles.push(new Particle(enemy.x, enemy.y, Math.random() * 2, enemy.color, { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 }));
                    }
                    if (enemy.takeDamage()) {
                        const points = Math.ceil(enemy.radius) * 10 * scoreMultiplier;
                        score += points; 
                        scoreEl.innerHTML = score;
                        setTimeout(() => enemies.splice(eIndex, 1), 0);
                    }
                }
            });

            // Projectile collision
            projectiles.forEach((projectile, pIndex) => {
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                if (dist - enemy.radius - projectile.radius < 1) {
                    // --- RICOCHET LOGIC ---
                    if (player.ricochetActive) {
                        const targets = enemies
                            .filter((e, i) => i !== eIndex)
                            .sort((a, b) => Math.hypot(a.x - enemy.x, a.y - enemy.y) - Math.hypot(b.x - enemy.x, b.y - enemy.y))
                            .slice(0, 3);
                        
                        targets.forEach(target => {
                            const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
                            const speed = 7;
                            const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
                            projectiles.push(new Projectile(enemy.x, enemy.y, 5, '#f5d442', velocity));
                        });
                    }
                    
                    // Create explosions (reduced particles for performance)
                    for(let i = 0; i < Math.min(enemy.radius, 8); i++){
                        particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4}));
                    }

                    if (enemy.takeDamage()) {
                        const points = Math.ceil(enemy.radius) * 20 * scoreMultiplier;
                        score += points; 
                        scoreEl.innerHTML = score;
                        setTimeout(() => {
                            enemies.splice(eIndex, 1);
                            projectiles.splice(pIndex, 1);
                        }, 0);
                    } else {
                        setTimeout(() => projectiles.splice(pIndex, 1), 0);
                    }
                }
            });
        });

        // Bomb collision detection with cooldown
        bombs.forEach((bomb, bIndex) => {
            const distBomb = Math.hypot(player.x - bomb.x, player.y - bomb.y);
            const currentTime = Date.now();
            if (distBomb - bomb.radius - player.radius < 1 && 
                currentTime - lastHitTime > hitCooldown) {
                playerHealth--;
                lastHitTime = currentTime;
                updateHealthDisplay();
                bombs.splice(bIndex, 1);
                
                // Create explosion effect
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(player.x, player.y, Math.random() * 4, 'orange', 
                        { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 }));
                }
                
                if (playerHealth <= 0) {
                    cancelAnimationFrame(animationId);
                    clearInterval(enemyInterval);
                    clearInterval(powerUpInterval);
                    clearInterval(bombInterval);
                    currentScore = score;
                    finalScore.textContent = score;
                    gameOverModal.style.display = 'flex';
                }
            }
        });
    }

    // --- EVENT LISTENERS ---
    window.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
        const speed = 7;
        const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
        
        // Normal shot
        projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity));
        
        // Double shot if redmoon active
        if (player.doubleShot) {
            const offsetAngle = 0.2; // Small angle offset
            const velocity1 = { 
                x: Math.cos(angle + offsetAngle) * speed, 
                y: Math.sin(angle + offsetAngle) * speed 
            };
            const velocity2 = { 
                x: Math.cos(angle - offsetAngle) * speed, 
                y: Math.sin(angle - offsetAngle) * speed 
            };
            projectiles.push(new Projectile(player.x, player.y, 5, 'red', velocity1));
            projectiles.push(new Projectile(player.x, player.y, 5, 'red', velocity2));
        }
    });

    window.addEventListener('keydown', (event) => {
        switch(event.key.toLowerCase()) {
            case 'w': keys.w.pressed = true; break; case 'a': keys.a.pressed = true; break;
            case 's': keys.s.pressed = true; break; case 'd': keys.d.pressed = true; break;
        }
    });

    window.addEventListener('keyup', (event) => {
         switch(event.key.toLowerCase()) {
            case 'w': keys.w.pressed = false; break; case 'a': keys.a.pressed = false; break;
            case 's': keys.s.pressed = false; break; case 'd': keys.d.pressed = false; break;
        }
    });

    restartButton.addEventListener('click', () => {
        init();
        animate();
        spawnEnemies();
        spawnPowerUps();
        spawnBombs();
    });

    // Help modal event listeners
    helpButton.addEventListener('click', () => {
        helpModal.style.display = 'flex';
    });

    closeHelpButton.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    // Close help modal when clicking outside
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });

    // Leaderboard modal event listeners
    leaderboardButton.addEventListener('click', () => {
        displayLeaderboard();
        leaderboardModal.style.display = 'flex';
    });

    closeLeaderboardButton.addEventListener('click', () => {
        leaderboardModal.style.display = 'none';
    });

    // Close leaderboard modal when clicking outside
    leaderboardModal.addEventListener('click', (e) => {
        if (e.target === leaderboardModal) {
            leaderboardModal.style.display = 'none';
        }
    });

    // Name input modal event listeners
    nextToDifficultyButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name.length === 0) {
            alert('Vui lòng nhập tên của bạn!');
            return;
        }
        playerName = name;
        nameInputModal.style.display = 'none';
        difficultyModal.style.display = 'flex';
    });

    // Difficulty selection event listeners
    easyModeButton.addEventListener('click', () => {
        gameMode = 'easy';
        difficultyMultiplier = 1;
        scoreMultiplier = 1;
        startGame();
    });

    hardModeButton.addEventListener('click', () => {
        gameMode = 'hard';
        difficultyMultiplier = 2;
        scoreMultiplier = 2;
        startGame();
    });

    insaneModeButton.addEventListener('click', () => {
        gameMode = 'insane';
        difficultyMultiplier = 3;
        scoreMultiplier = 3;
        startGame();
    });

    backToNameButton.addEventListener('click', () => {
        difficultyModal.style.display = 'none';
        nameInputModal.style.display = 'flex';
    });

    function startGame() {
        difficultyModal.style.display = 'none';
        init();
        animate();
        spawnEnemies();
        spawnPowerUps();
        spawnBombs();
    }

    // Save score button
    saveScoreButton.addEventListener('click', () => {
        if (playerName && currentScore > 0) {
            saveScore(playerName, currentScore).then(() => {
                alert('Điểm số đã được lưu!');
                displayLeaderboard();
            }).catch((error) => {
                console.error('Error saving score:', error);
                alert('Lỗi khi lưu điểm số!');
            });
        } else {
            alert('Không có điểm số để lưu!');
        }
    });

    // Enter key to start game
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGameButton.click();
        }
    });

    // Show name input modal on page load
    nameInputModal.style.display = 'flex';
    playerNameInput.focus();
});
