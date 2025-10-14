# 🚀 Spaceship Shooter - File Structure

## 📁 File Organization

Game đã được tách thành các file riêng biệt để dễ quản lý và sửa lỗi:

### 🎮 **classes.js**
Chứa tất cả các class của game:
- `Player` - Người chơi
- `Enemy` - Kẻ địch
- `Projectile` - Đạn
- `Particle` - Hiệu ứng hạt
- `PowerUp` - Vật phẩm
- `OrbitingMoon` - Vệ tinh mặt trăng
- `Bomb` - Bom
- `PinkMonster` - Quái màu hồng
- `Boss` - Boss

### 🎯 **gameLogic.js**
Chứa logic game chính:
- Game variables và state
- Spawn functions (enemies, powerups, bombs, pink monsters)
- Collision detection
- Main game loop (`animate()`)
- Power up activation
- Game initialization

### 🖥️ **ui.js**
Chứa logic UI và user interface:
- Event listeners (keyboard, mouse, buttons)
- Modal management (help, leaderboard, upgrade)
- Power up UI updates
- Score display
- Game start/restart logic

### 🔥 **firebase.js**
Chứa logic Firebase:
- Database configuration
- Save/load scores
- Leaderboard display
- Firebase functions

### 🚀 **main.js**
File khởi tạo chính:
- DOM element references
- Canvas setup
- Event listener setup
- Game initialization

## 🔧 **Lợi ích của cấu trúc mới:**

1. **Dễ sửa lỗi** - Mỗi file có chức năng riêng biệt
2. **Dễ maintain** - Code được tổ chức theo chức năng
3. **Dễ mở rộng** - Thêm tính năng mới vào file phù hợp
4. **Dễ debug** - Tìm lỗi nhanh hơn trong file cụ thể
5. **Team work** - Nhiều người có thể làm việc trên các file khác nhau

## 📝 **Cách sửa lỗi:**

- **Game logic issues** → `gameLogic.js`
- **UI/UX problems** → `ui.js`
- **Class behavior** → `classes.js`
- **Firebase issues** → `firebase.js`
- **Initialization problems** → `main.js`

## 🎮 **Tính năng game:**

- ✅ Con quái màu hồng (30% spawn, đuổi theo 5s)
- ✅ Ngôi sao cân bằng (1 tia thay vì 3)
- ✅ Trái tim hồi máu (mỗi 25k điểm)
- ✅ Boss system
- ✅ Upgrade system
- ✅ Leaderboard
- ✅ Multiple difficulty modes
