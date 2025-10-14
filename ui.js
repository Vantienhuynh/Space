// ===== UI LOGIC =====

// Power up UI functions
function updatePowerUpUI(type, duration) {
    const powerUpsStatusEl = document.getElementById('powerUpsStatus');
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

// Score update function
function updateScore() {
    const scoreEl = document.getElementById('scoreEl');
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

// Boss spawn function
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

// Upgrade system functions
function showUpgradeModal() {
    const upgradeModal = document.getElementById('upgradeModal');
    upgradeModal.style.display = 'flex';
    // Pause the game
    cancelAnimationFrame(animationId);
}

function hideUpgradeModal() {
    const upgradeModal = document.getElementById('upgradeModal');
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

// Event listeners setup
function setupEventListeners() {
    // Mouse click for shooting
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

    // Keyboard controls
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

    // Restart button
    const restartButton = document.getElementById('restartButton');
    restartButton.addEventListener('click', () => {
        init();
        animate();
        spawnEnemies();
        spawnPowerUps();
        spawnBombs();
        spawnPinkMonsters();
    });

    // Help modal event listeners
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const closeHelpButton = document.getElementById('closeHelpButton');
    
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
    const leaderboardButton = document.getElementById('leaderboardButton');
    const leaderboardModal = document.getElementById('leaderboardModal');
    const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
    
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

    // Chat modal event listeners
    const chatButton = document.getElementById('chatButton');
    const chatModal = document.getElementById('chatModal');
    const closeChatButton = document.getElementById('closeChatButton');
    const sendChatButton = document.getElementById('sendChatButton');
    const chatInput = document.getElementById('chatInput');
    
    chatButton.addEventListener('click', () => {
        loadChatMessages();
        chatModal.style.display = 'flex';
        chatInput.focus();
    });

    closeChatButton.addEventListener('click', () => {
        chatModal.style.display = 'none';
    });

    // Close chat modal when clicking outside
    chatModal.addEventListener('click', (e) => {
        if (e.target === chatModal) {
            chatModal.style.display = 'none';
        }
    });

    // Send chat message
    sendChatButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message && playerName) {
            sendChatMessage(message).then(() => {
                chatInput.value = '';
                chatInput.focus();
            }).catch((error) => {
                console.error('Error sending message:', error);
                alert('Lỗi khi gửi tin nhắn!');
            });
        }
    });

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatButton.click();
        }
    });

    // Info modal event listeners
    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');
    const closeInfoButton = document.getElementById('closeInfoButton');
    const infoContent = document.getElementById('infoContent');
    
    infoButton.addEventListener('click', () => {
        loadInfoContent();
        infoModal.style.display = 'flex';
    });

    closeInfoButton.addEventListener('click', () => {
        infoModal.style.display = 'none';
    });

    // Close info modal when clicking outside
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.style.display = 'none';
        }
    });

    // Name input modal event listeners
    const nameInputModal = document.getElementById('nameInputModal');
    const playerNameInput = document.getElementById('playerNameInput');
    const nextToDifficultyButton = document.getElementById('nextToDifficultyButton');
    
    nextToDifficultyButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name.length === 0) {
            alert('Vui lòng nhập tên của bạn!');
            return;
        }
        playerName = name;
        nameInputModal.style.display = 'none';
        const difficultyModal = document.getElementById('difficultyModal');
        difficultyModal.style.display = 'flex';
    });

    // Difficulty selection event listeners
    const difficultyModal = document.getElementById('difficultyModal');
    const easyModeButton = document.getElementById('easyModeButton');
    const hardModeButton = document.getElementById('hardModeButton');
    const insaneModeButton = document.getElementById('insaneModeButton');
    const backToNameButton = document.getElementById('backToNameButton');
    
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

    // Upgrade button event listeners
    const upgradeDamageButton = document.getElementById('upgradeDamage');
    const upgradePierceButton = document.getElementById('upgradePierce');
    const upgradeSizeButton = document.getElementById('upgradeSize');
    
    upgradeDamageButton.addEventListener('click', () => applyUpgrade('damage'));
    upgradePierceButton.addEventListener('click', () => applyUpgrade('pierce'));
    upgradeSizeButton.addEventListener('click', () => applyUpgrade('size'));

    // Save score button
    const saveScoreButton = document.getElementById('saveScoreButton');
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
            nextToDifficultyButton.click();
        }
    });
}

// Start game function
function startGame() {
    const difficultyModal = document.getElementById('difficultyModal');
    difficultyModal.style.display = 'none';
    init();
    animate();
    spawnEnemies();
    spawnPowerUps();
    spawnBombs();
    spawnPinkMonsters();
}

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

// Load info content directly from JavaScript
function loadInfoContent() {
    const infoContent = document.getElementById('infoContent');
    
    // Direct content in JavaScript
    const changelogData = `
🚀 SPACESHIP SHOOTER - CHANGELOG

📅 Version 2.0.0 - Cập nhật mới nhất

🆕 TÍNH NĂNG MỚI:
• 💬 Hệ thống Chat - Người chơi có thể chat với nhau
• 🩷 Con quái màu hồng - Đuổi theo 5s, nổ nếu không bắt được
• ❤️ Trái tim hồi máu - Xuất hiện mỗi 25k điểm
• ℹ️ Thông tin cập nhật - Xem changelog và thông tin game

🔧 CẢI TIẾN:
• ⭐ Ngôi sao cân bằng - Chỉ tạo 1 tia thay vì 3
• 📱 Giao diện tối ưu - 4 icon nằm dọc gọn gàng
• 🎮 Trải nghiệm mượt mà - Tối ưu hiệu suất game
• 📖 Hướng dẫn chi tiết - Cập nhật thông tin đầy đủ

🐛 SỬA LỖI:
• Sửa lỗi tràn màn hình trong hướng dẫn
• Tối ưu hiệu suất khi có nhiều particles
• Sửa lỗi collision detection
• Cải thiện responsive design

🎯 TÍNH NĂNG GAME:
• 🎮 3 chế độ khó: Dễ, Khó, Siêu khó
• 🏆 Bảng xếp hạng Firebase
• 🎯 Hệ thống nâng cấp
• 👾 Boss system
• 💣 Bom nguy hiểm
• 🌙 Vệ tinh bảo vệ
• 🛡️ Khiên bất tử

📊 THỐNG KÊ:
• 8 loại vật phẩm khác nhau
• 4 loại kẻ địch
• 3 chế độ khó
• Real-time chat
• Firebase integration

🔮 TƯƠNG LAI:
• 🎵 Nhạc nền và âm thanh
• 🎨 Hiệu ứng visual mới
• 🏆 Thành tích và badge
• 🌐 Multiplayer mode
• 📱 Mobile optimization

📞 LIÊN HỆ:
• GitHub: github.com/spaceship-shooter
• Email: support@spaceship-game.com
• Discord: discord.gg/spaceship

🎉 CẢM ƠN NGƯỜI CHƠI!
Chúc bạn chơi game vui vẻ! 🚀✨
    `;
    
    // Parse and format the content
    const lines = changelogData.split('\n');
    let formattedContent = '';
    
    lines.forEach(line => {
        if (line.trim() === '') {
            formattedContent += '<br>';
        } else if (line.startsWith('🚀') || line.startsWith('📅')) {
            formattedContent += `<h3 class="text-purple-300 font-bold text-lg mb-2">${line}</h3>`;
        } else if (line.startsWith('🆕') || line.startsWith('🔧') || line.startsWith('🐛') || line.startsWith('🎯') || line.startsWith('📊') || line.startsWith('🔮') || line.startsWith('📞') || line.startsWith('🎉')) {
            formattedContent += `<h4 class="text-blue-300 font-bold text-base mb-2 mt-4">${line}</h4>`;
        } else if (line.startsWith('•')) {
            formattedContent += `<p class="text-gray-300 ml-4 mb-1">${line}</p>`;
        } else {
            formattedContent += `<p class="text-gray-400 mb-1">${line}</p>`;
        }
    });
    
    infoContent.innerHTML = formattedContent;
}
