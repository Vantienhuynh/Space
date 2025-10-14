// ===== GAME CLASSES =====

// Player class
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

// PowerUp class
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

// OrbitingMoon class
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

// Bomb class
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

// Projectile class
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

// Enemy class
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

// Particle class
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

// PinkMonster class
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

// Boss class
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
