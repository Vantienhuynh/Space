// ===== GAME LOGIC =====

// Game variables
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

// Keys object
const keys = { w: { pressed: false }, a: { pressed: false }, s: { pressed: false }, d: { pressed: false } };

// Game mode variables
let playerName = '';
let currentScore = 0;
let gameMode = 'easy'; // 'easy', 'hard', 'insane'
let difficultyMultiplier = 1;
let scoreMultiplier = 1;

// Canvas setup
function setupCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth - 40; // Account for padding
    const canvasHeight = 500; // Fixed height for better gameplay
    
    canvas.width = containerWidth;
    canvas.height = canvasHeight;
}

// Health display functions
function updateHealthDisplay() {
    const healthDisplay = document.getElementById('healthDisplay');
    if (healthDisplay) {
        healthDisplay.innerHTML = '❤️'.repeat(playerHealth);
    }
}

function updateEnemyCount() {
    const enemyCountEl = document.getElementById('enemyCount');
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

// Spawn functions
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

// Power up activation
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

// Game state functions
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

// Main game loop
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
