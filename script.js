document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Create animated stars background
    function createStars() {
        const starsContainer = document.getElementById('stars');
        const numStars = 100;
        
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.width = Math.random() * 3 + 1 + 'px';
            star.style.height = star.style.width;
            star.style.animationDelay = Math.random() * 2 + 's';
            starsContainer.appendChild(star);
        }
    }
    
    createStars();
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
    
    // Upgrade modal elements
    const upgradeModal = document.getElementById('upgradeModal');
    const upgradeDamageButton = document.getElementById('upgradeDamage');
    const upgradePierceButton = document.getElementById('upgradePierce');
    const upgradeSizeButton = document.getElementById('upgradeSize');

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
    let pinkMonsters = [];
    let boss = null;
    let bossSpawned = false;
    let enemyInterval, powerUpInterval, bombInterval;
    let powerUpTimers = {};
    let gameStartTime = Date.now();
    let playerHealth = 3;
    let difficultyLevel = 1;
    let lastHitTime = 0;
    const hitCooldown = 1000; // 1 second cooldown between hits
    
    // Upgrade system
    let upgradePoints = 0;
    let lastUpgradeScore = 0;
    const UPGRADE_INTERVAL = 30000; // Every 30,000 points

    const keys = { w: { pressed: false }, a: { pressed: false }, s: { pressed: false }, d: { pressed: false } };

    // --- CLASSES ---
    class Player {
        constructor(x, y, radius, color) {
            this.x = x; this.y = y; this.radius = radius; this.color = color; this.speed = 5;
            this.isInvincible = false;
            this.ricochetActive = false;
            this.doubleShot = false;
            // Upgrade stats
            this.damage = 1;
            this.pierce = 0; // Number of enemies projectile can pierce through
            this.projectileSize = 5;
            this.projectileSpeed = 7;
        }
        draw() {
            // Enhanced player drawing with gradient and glow
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#0ea5e9');
            gradient.addColorStop(1, '#1e40af');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = '#0ea5e9';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.shadowBlur = 0;
            
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
            this.trail = [];
        }
        draw() {
            // Draw trail
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const alpha = (i / this.trail.length) * 0.5;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.radius * (i / this.trail.length), 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            
            // Enhanced projectile with glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        update() {
            // Update trail
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 5) {
                this.trail.shift();
            }
            
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

    class PinkMonster {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 25; // Medium size
            this.color = '#ff69b4'; // Pink color
            this.speed = 3; // Fast speed to chase player
            this.lifetime = 5000; // 5 seconds lifetime
            this.startTime = Date.now();
            this.isChasing = true;
            this.explosionRadius = 60; // Explosion radius when it explodes
            this.pulsePhase = 0;
        }

        draw() {
            // Pulsing effect
            this.pulsePhase += 0.15;
            const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
            const currentRadius = this.radius * pulse;
            
            // Draw pink monster with gradient
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius);
            gradient.addColorStop(0, '#ffb6c1');
            gradient.addColorStop(0.7, '#ff69b4');
            gradient.addColorStop(1, '#ff1493');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2, false);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = '#ff69b4';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw warning circle when about to explode
            const timeLeft = this.lifetime - (Date.now() - this.startTime);
            if (timeLeft < 1000) { // Last second
                const warningAlpha = 0.5 + Math.sin(this.pulsePhase * 4) * 0.3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2, false);
                ctx.strokeStyle = `rgba(255, 20, 147, ${warningAlpha})`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        update() {
            this.draw();
            
            if (this.isChasing && player) {
                // Chase the player
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const moveX = (dx / distance) * this.speed;
                    const moveY = (dy / distance) * this.speed;
                    
                    this.x += moveX;
                    this.y += moveY;
                }
            }
            
            // Check if lifetime expired
            const elapsed = Date.now() - this.startTime;
            if (elapsed >= this.lifetime) {
                this.explode();
                return true; // Signal to remove from array
            }
            
            return false;
        }

        explode() {
            // Create explosion effect
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const speed = 3 + Math.random() * 3;
                particles.push(new Particle(
                    this.x, this.y, 
                    Math.random() * 3 + 2, 
                    this.color, 
                    { 
                        x: Math.cos(angle) * speed, 
                        y: Math.sin(angle) * speed 
                    }
                ));
            }
            
            // Check if player is in explosion radius
            if (player) {
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist < this.explosionRadius + player.radius) {
                    // Player takes damage from explosion
                    if (!player.isInvincible) {
                        playerHealth--;
                        updateHealthDisplay();
                        
                        // Create hit effect
                        for (let i = 0; i < 15; i++) {
                            particles.push(new Particle(player.x, player.y, Math.random() * 4, 'red', 
                                { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 }));
                        }
                        
                        if (playerHealth <= 0) {
                            gameOver();
                        }
                    }
                }
            }
        }

        takeDamage(damage = 1) {
            // Pink monster can be destroyed by projectiles
            return true; // Always destroyed by one hit
        }
    }

    class Boss {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 60; // Huge boss
            this.maxHealth = 1000; // Super tanky
            this.health = this.maxHealth;
            this.speed = 2; // Slow but persistent
            this.color = '#ff0000'; // Red boss
            this.lastAttack = 0;
            this.attackCooldown = 2000; // Attack every 2 seconds
            this.rage = false; // Rage mode when low health
        }

        draw() {
            // Boss body with gradient
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, '#ff4444');
            gradient.addColorStop(0.7, '#cc0000');
            gradient.addColorStop(1, '#880000');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Boss glow effect
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Health bar
            const barWidth = this.radius * 2;
            const barHeight = 8;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 20;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Boss text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', this.x, this.y + 5);
        }

        update() {
            this.draw();
            
            // Move towards player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const moveX = (dx / distance) * this.speed;
                const moveY = (dy / distance) * this.speed;
                
                this.x += moveX;
                this.y += moveY;
            }
            
            // Rage mode when low health
            if (this.health < this.maxHealth * 0.3) {
                this.rage = true;
                this.speed = 4; // Faster when enraged
                this.color = '#ff6600'; // Orange when enraged
            }
            
            // Attack player if close enough
            if (distance < this.radius + player.radius + 10) {
                const currentTime = Date.now();
                if (currentTime - this.lastAttack > this.attackCooldown) {
                    this.attackPlayer();
                    this.lastAttack = currentTime;
                }
            }
        }

        attackPlayer() {
            if (!player.isInvincible) {
                playerHealth--;
                updateHealthDisplay();
                
                // Create hit effect
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(player.x, player.y, Math.random() * 4, 'red', 
                        { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 }));
                }
                
                if (playerHealth <= 0) {
                    gameOver();
                }
            }
        }

        takeDamage(damage) {
            this.health -= damage;
            return this.health <= 0;
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
                { emoji: '🛡️', type: 'shield', weight: 0.3 }, // Reduced chance for shield
                { emoji: '❤️', type: 'heart', weight: 0.1 } // Very rare heart powerup
            ];
            
            // Weighted random selection
            const totalWeight = 1 + 1 + 1 + 0.3 + 0.1; // star, moon, redmoon, shield, heart
            let random = Math.random() * totalWeight;
            let choice;
            
            if (random < 1) choice = powerUpTypes[0]; // star
            else if (random < 2) choice = powerUpTypes[1]; // moon  
            else if (random < 3) choice = powerUpTypes[2]; // redmoon
            else if (random < 3.3) choice = powerUpTypes[3]; // shield (reduced chance)
            else choice = powerUpTypes[4]; // heart (very rare)
            
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

    function spawnPinkMonsters() {
        setInterval(() => {
            // 30% chance to spawn pink monster
            if (Math.random() < 0.3) {
                // Spawn at random edge
                let x, y;
                const edge = Math.random();
                if (edge < 0.25) {
                    x = -25;
                    y = Math.random() * canvas.height;
                } else if (edge < 0.5) {
                    x = canvas.width + 25;
                    y = Math.random() * canvas.height;
                } else if (edge < 0.75) {
                    x = Math.random() * canvas.width;
                    y = -25;
                } else {
                    x = Math.random() * canvas.width;
                    y = canvas.height + 25;
                }
                
                console.log('Spawning pink monster at', x, y);
                pinkMonsters.push(new PinkMonster(x, y));
            }
        }, 8000); // Check every 8 seconds
    }

    function spawnHeartAtScore() {
        // Spawn heart every 25k points
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        console.log('Spawning heart at', x, y);
        powerUps.push(new PowerUp(x, y, 15, '❤️', 'heart'));
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
        projectiles = []; enemies = []; particles = []; powerUps = []; orbitingMoons = []; bombs = []; pinkMonsters = [];
        boss = null; bossSpawned = false; // Reset boss
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
            case 'heart':
                // Heal player by 1 heart
                if (playerHealth < 3) {
                    playerHealth++;
                    updateHealthDisplay();
                    
                    // Create healing effect
                    for (let i = 0; i < 10; i++) {
                        particles.push(new Particle(player.x, player.y, Math.random() * 3, 'red', 
                            { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 }));
                    }
                    console.log('Player healed! Health:', playerHealth);
                } else {
                    console.log('Player already at full health');
                }
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

        // Update pink monsters
        pinkMonsters.forEach((pinkMonster, index) => {
            if (pinkMonster.update()) {
                // Monster exploded, remove it
                pinkMonsters.splice(index, 1);
            }
        });

        // Update boss
        if (boss) {
            boss.update();
            
            // Boss collision with projectiles
            projectiles.forEach((projectile, pIndex) => {
                const dist = Math.hypot(projectile.x - boss.x, projectile.y - boss.y);
                if (dist - projectile.radius - boss.radius < 1) {
                    // Create explosion effect
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(boss.x, boss.y, Math.random() * 4, boss.color, 
                            { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 }));
                    }
                    
                    if (boss.takeDamage(player.damage)) {
                        // Boss defeated!
                        const points = 50000; // Huge bonus for defeating boss
                        score += points;
                        updateScore();
                        boss = null;
                        console.log('BOSS DEFEATED! +50,000 points!');
                    }
                    
                    // Remove projectile
                    projectiles.splice(pIndex, 1);
                }
            });
        }

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
                    if (enemy.takeDamage(player.damage)) {
                        const points = Math.ceil(enemy.radius) * 10 * scoreMultiplier;
                        score += points; 
                        updateScore();
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
                            .slice(0, 1);
                        
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

                    if (enemy.takeDamage(player.damage)) {
                        const points = Math.ceil(enemy.radius) * 20 * scoreMultiplier;
                        score += points; 
                        updateScore();
                        setTimeout(() => {
                            enemies.splice(eIndex, 1);
                            // Reduce pierce count and remove projectile if pierce is exhausted
                            if (player.pierce > 0) {
                                player.pierce--;
                            }
                            if (player.pierce <= 0) {
                                projectiles.splice(pIndex, 1);
                            }
                        }, 0);
                    } else {
                        // Reduce pierce count and remove projectile if pierce is exhausted
                        if (player.pierce > 0) {
                            player.pierce--;
                        }
                        if (player.pierce <= 0) {
                            setTimeout(() => projectiles.splice(pIndex, 1), 0);
                        }
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

        // Pink monster collision detection
        pinkMonsters.forEach((pinkMonster, pmIndex) => {
            // Player collision with pink monster
            const distPlayer = Math.hypot(player.x - pinkMonster.x, player.y - pinkMonster.y);
            const currentTime = Date.now();
            if (distPlayer - pinkMonster.radius - player.radius < 1 && 
                currentTime - lastHitTime > hitCooldown) {
                playerHealth--;
                lastHitTime = currentTime;
                updateHealthDisplay();
                
                // Create hit effect
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(player.x, player.y, Math.random() * 3, 'pink', 
                        { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 }));
                }
                
                // Remove pink monster after collision
                pinkMonsters.splice(pmIndex, 1);
                
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

        // Pink monster collision with projectiles
        pinkMonsters.forEach((pinkMonster, pmIndex) => {
            projectiles.forEach((projectile, pIndex) => {
                const dist = Math.hypot(projectile.x - pinkMonster.x, projectile.y - pinkMonster.y);
                if (dist - projectile.radius - pinkMonster.radius < 1) {
                    // Create explosion effect
                    for (let i = 0; i < 10; i++) {
                        particles.push(new Particle(pinkMonster.x, pinkMonster.y, Math.random() * 3, pinkMonster.color, 
                            { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 }));
                    }
                    
                    // Pink monster destroyed
                    const points = 100; // Points for destroying pink monster
                    score += points;
                    updateScore();
                    
                    // Remove both projectile and pink monster
                    projectiles.splice(pIndex, 1);
                    pinkMonsters.splice(pmIndex, 1);
                }
            });
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
        
        // Normal shot with upgraded stats
        projectiles.push(new Projectile(player.x, player.y, player.projectileSize, 'white', velocity));
        
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
            projectiles.push(new Projectile(player.x, player.y, player.projectileSize, 'red', velocity1));
            projectiles.push(new Projectile(player.x, player.y, player.projectileSize, 'red', velocity2));
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
        spawnPinkMonsters();
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
        spawnPinkMonsters();
    }
    
    // Upgrade system functions
    function updateScore() {
        scoreEl.textContent = score;
        
        // Check for upgrade opportunity
        if (score >= lastUpgradeScore + UPGRADE_INTERVAL) {
            showUpgradeModal();
            lastUpgradeScore = score;
        }
        
        // Spawn heart every 25k points
        if (score > 0 && score % 25000 === 0) {
            spawnHeartAtScore();
        }
        
        // Spawn boss at 100,000 points
        if (score >= 100000 && !bossSpawned) {
            spawnBoss();
            bossSpawned = true;
        }
    }
    
    function spawnBoss() {
        // Spawn boss at random edge
        const edges = [
            { x: -60, y: Math.random() * canvas.height },
            { x: canvas.width + 60, y: Math.random() * canvas.height },
            { x: Math.random() * canvas.width, y: -60 },
            { x: Math.random() * canvas.width, y: canvas.height + 60 }
        ];
        const spawnPoint = edges[Math.floor(Math.random() * edges.length)];
        
        boss = new Boss(spawnPoint.x, spawnPoint.y);
        console.log('BOSS SPAWNED!');
    }
    
    function showUpgradeModal() {
        upgradeModal.style.display = 'flex';
        // Pause the game
        cancelAnimationFrame(animationId);
    }
    
    function hideUpgradeModal() {
        upgradeModal.style.display = 'none';
        // Resume the game
        animate();
    }
    
    function applyUpgrade(upgradeType) {
        switch(upgradeType) {
            case 'damage':
                player.damage *= 2;
                console.log('Damage upgraded to:', player.damage);
                break;
            case 'pierce':
                player.pierce += 1;
                console.log('Pierce upgraded to:', player.pierce);
                break;
            case 'size':
                player.projectileSize *= 1.5;
                console.log('Projectile size upgraded to:', player.projectileSize);
                break;
        }
        hideUpgradeModal();
    }
    
    // Upgrade button event listeners
    upgradeDamageButton.addEventListener('click', () => applyUpgrade('damage'));
    upgradePierceButton.addEventListener('click', () => applyUpgrade('pierce'));
    upgradeSizeButton.addEventListener('click', () => applyUpgrade('size'));

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

    // Game over function
    function gameOver() {
        cancelAnimationFrame(animationId);
        clearInterval(enemyInterval);
        clearInterval(powerUpInterval);
        clearInterval(bombInterval);
        currentScore = score;
        finalScore.textContent = score;
        gameOverModal.style.display = 'flex';
    }
});
