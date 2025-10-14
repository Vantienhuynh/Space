// ===== FIREBASE LOGIC =====

// Firebase configuration
const firebaseConfig = {
    databaseURL: "https://space-54f01-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

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
    const leaderboardList = document.getElementById('leaderboardList');
    
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

// Chat functions
function sendChatMessage(message) {
    if (!message.trim() || !playerName) return;
    
    const chatData = {
        name: playerName,
        message: message.trim(),
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('vi-VN'),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    
    return database.ref('chat').push(chatData);
}

function loadChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    
    return database.ref('chat').orderByChild('timestamp').limitToLast(50).once('value').then((snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            messages.push(childSnapshot.val());
        });
        
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            chatMessages.innerHTML = '<p class="text-center text-gray-400">Chưa có tin nhắn nào!</p>';
            return;
        }
        
        messages.forEach((messageData) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'bg-gray-800 p-3 rounded-lg mb-2';
            
            const isOwnMessage = messageData.name === playerName;
            messageElement.className += isOwnMessage ? ' bg-blue-900' : '';
            
            messageElement.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <span class="font-bold text-blue-300">${messageData.name}</span>
                    <span class="text-xs text-gray-400">${messageData.time}</span>
                </div>
                <div class="text-gray-200">${messageData.message}</div>
            `;
            
            chatMessages.appendChild(messageElement);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }).catch((error) => {
        console.error('Error loading chat messages:', error);
        chatMessages.innerHTML = '<p class="text-center text-red-400">Lỗi tải tin nhắn!</p>';
    });
}

function listenForNewMessages() {
    database.ref('chat').orderByChild('timestamp').limitToLast(1).on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        const chatMessages = document.getElementById('chatMessages');
        
        // Only add if chat modal is visible
        const chatModal = document.getElementById('chatModal');
        if (chatModal.style.display === 'flex') {
            const messageElement = document.createElement('div');
            messageElement.className = 'bg-gray-800 p-3 rounded-lg mb-2';
            
            const isOwnMessage = messageData.name === playerName;
            messageElement.className += isOwnMessage ? ' bg-blue-900' : '';
            
            messageElement.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <span class="font-bold text-blue-300">${messageData.name}</span>
                    <span class="text-xs text-gray-400">${messageData.time}</span>
                </div>
                <div class="text-gray-200">${messageData.message}</div>
            `;
            
            chatMessages.appendChild(messageElement);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
}
