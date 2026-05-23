/**
 * 贪吃蛇游戏主逻辑
 * @version 1.0.0
 */

// 游戏配置常量
const CONFIG = {
    CANVAS_SIZE: 400,
    GRID_SIZE: 20,
    INITIAL_SPEED: 100,
    MIN_SPEED: 50,
    SPEED_DECREMENT: 2,
    SCORE_PER_FOOD: 10
};

// 游戏状态
class GameState {
    constructor() {
        this.snake = [];
        this.food = {};
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameLoop = null;
        this.isPaused = false;
        this.gameSpeed = CONFIG.INITIAL_SPEED;
        this.isRunning = false;
    }

    init() {
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.isPaused = false;
        this.gameSpeed = CONFIG.INITIAL_SPEED;
        this.spawnFood();
    }

    spawnFood() {
        const tileCount = CONFIG.CANVAS_SIZE / CONFIG.GRID_SIZE;
        do {
            this.food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }

    updateDirection(newDirection) {
        // 防止反向移动
        if (
            (newDirection.x !== 0 && this.direction.x === -newDirection.x) ||
            (newDirection.y !== 0 && this.direction.y === -newDirection.y)
        ) {
            return;
        }
        this.nextDirection = newDirection;
    }
}

// 渲染器
class GameRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.tileCount = CONFIG.CANVAS_SIZE / CONFIG.GRID_SIZE;
    }

    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#2a2a3e';
        for (let i = 0; i < this.tileCount; i++) {
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(i * CONFIG.GRID_SIZE, 0);
            this.ctx.lineTo(i * CONFIG.GRID_SIZE, this.canvas.height);
            this.ctx.stroke();

            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * CONFIG.GRID_SIZE);
            this.ctx.lineTo(this.canvas.width, i * CONFIG.GRID_SIZE);
            this.ctx.stroke();
        }
    }

    drawFood(food) {
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(
            food.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
            food.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
            CONFIG.GRID_SIZE / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    drawSnake(snake, direction) {
        snake.forEach((segment, index) => {
            // 蛇头颜色不同
            if (index === 0) {
                this.ctx.fillStyle = '#4ecdc4';
            } else {
                // 蛇身渐变效果
                const gradient = 1 - (index / snake.length) * 0.5;
                this.ctx.fillStyle = `rgba(78, 205, 196, ${gradient})`;
            }

            this.ctx.fillRect(
                segment.x * CONFIG.GRID_SIZE + 1,
                segment.y * CONFIG.GRID_SIZE + 1,
                CONFIG.GRID_SIZE - 2,
                CONFIG.GRID_SIZE - 2
            );

            // 绘制蛇眼睛（仅蛇头）
            if (index === 0) {
                this.drawEyes(segment, direction);
            }
        });
    }

    drawEyes(segment, direction) {
        this.ctx.fillStyle = 'white';
        const eyeSize = 3;
        const eyeOffset = 5;

        let positions = [];

        if (direction.x === 1) { // 向右
            positions = [
                [CONFIG.GRID_SIZE - eyeOffset, 5],
                [CONFIG.GRID_SIZE - eyeOffset, CONFIG.GRID_SIZE - 8]
            ];
        } else if (direction.x === -1) { // 向左
            positions = [
                [eyeOffset - 2, 5],
                [eyeOffset - 2, CONFIG.GRID_SIZE - 8]
            ];
        } else if (direction.y === -1) { // 向上
            positions = [
                [5, eyeOffset - 2],
                [CONFIG.GRID_SIZE - 8, eyeOffset - 2]
            ];
        } else { // 向下
            positions = [
                [5, CONFIG.GRID_SIZE - eyeOffset],
                [CONFIG.GRID_SIZE - 8, CONFIG.GRID_SIZE - eyeOffset]
            ];
        }

        positions.forEach(([x, y]) => {
            this.ctx.fillRect(
                segment.x * CONFIG.GRID_SIZE + x,
                segment.y * CONFIG.GRID_SIZE + y,
                eyeSize,
                eyeSize
            );
        });
    }

    render(gameState) {
        this.clear();
        this.drawGrid();
        this.drawFood(gameState.food);
        this.drawSnake(gameState.snake, gameState.direction);
    }
}

// 游戏控制器
class SnakeGame {
    constructor() {
        this.state = new GameState();
        this.renderer = new GameRenderer('gameCanvas');
        this.ui = new UIController(this.state);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            const keyMap = {
                'ArrowUp': { x: 0, y: -1 },
                'w': { x: 0, y: -1 },
                'W': { x: 0, y: -1 },
                'ArrowDown': { x: 0, y: 1 },
                's': { x: 0, y: 1 },
                'S': { x: 0, y: 1 },
                'ArrowLeft': { x: -1, y: 0 },
                'a': { x: -1, y: 0 },
                'A': { x: -1, y: 0 },
                'ArrowRight': { x: 1, y: 0 },
                'd': { x: 1, y: 0 },
                'D': { x: 1, y: 0 }
            };

            const newDirection = keyMap[e.key];
            if (newDirection && this.state.isRunning) {
                this.state.updateDirection(newDirection);
            }
        });
    }

    start() {
        if (this.state.gameLoop) {
            clearInterval(this.state.gameLoop);
        }

        this.state.init();
        this.state.isRunning = true;
        this.ui.updateScore(0);
        this.ui.hideGameOver();
        this.renderer.render(this.state);

        this.state.gameLoop = setInterval(() => this.update(), this.state.gameSpeed);
    }

    update() {
        if (this.state.isPaused) return;

        // 更新方向
        this.state.direction = { ...this.state.nextDirection };

        // 计算新头部位置
        const newHead = {
            x: this.state.snake[0].x + this.state.direction.x,
            y: this.state.snake[0].y + this.state.direction.y
        };

        // 检查碰撞
        if (this.checkCollision(newHead)) {
            this.gameOver();
            return;
        }

        // 移动蛇
        this.state.snake.unshift(newHead);

        // 检查是否吃到食物
        if (newHead.x === this.state.food.x && newHead.y === this.state.food.y) {
            this.state.score += CONFIG.SCORE_PER_FOOD;
            this.ui.updateScore(this.state.score);
            this.state.spawnFood();
            this.accelerate();
        } else {
            this.state.snake.pop();
        }

        this.renderer.render(this.state);
    }

    checkCollision(position) {
        const tileCount = CONFIG.CANVAS_SIZE / CONFIG.GRID_SIZE;
        
        // 检查墙壁碰撞
        if (
            position.x < 0 || position.x >= tileCount ||
            position.y < 0 || position.y >= tileCount
        ) {
            return true;
        }

        // 检查自身碰撞
        return this.state.snake.some(
            segment => segment.x === position.x && segment.y === position.y
        );
    }

    accelerate() {
        if (this.state.gameSpeed > CONFIG.MIN_SPEED) {
            clearInterval(this.state.gameLoop);
            this.state.gameSpeed -= CONFIG.SPEED_DECREMENT;
            this.state.gameLoop = setInterval(() => this.update(), this.state.gameSpeed);
        }
    }

    gameOver() {
        clearInterval(this.state.gameLoop);
        this.state.isRunning = false;

        // 更新最高分
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('snakeHighScore', this.state.highScore);
            this.ui.updateHighScore(this.state.highScore);
        }

        this.ui.showGameOver(this.state.score);
    }

    togglePause() {
        if (!this.state.isRunning) return;
        this.state.isPaused = !this.state.isPaused;
    }
}

// UI 控制器
class UIController {
    constructor(gameState) {
        this.currentScoreEl = document.getElementById('currentScore');
        this.highScoreEl = document.getElementById('highScore');
        this.finalScoreEl = document.getElementById('finalScore');
        this.gameOverEl = document.getElementById('gameOver');

        // 初始化最高分显示
        this.highScoreEl.textContent = gameState.highScore;
    }

    updateScore(score) {
        this.currentScoreEl.textContent = score;
    }

    updateHighScore(score) {
        this.highScoreEl.textContent = score;
    }

    showGameOver(finalScore) {
        this.finalScoreEl.textContent = finalScore;
        this.gameOverEl.style.display = 'block';
    }

    hideGameOver() {
        this.gameOverEl.style.display = 'none';
    }
}

// 全局函数（供 HTML 按钮调用）
let game = null;

function initGame() {
    game = new SnakeGame();
    game.renderer.render(game.state);
}

function startGame() {
    if (!game) {
        game = new SnakeGame();
    }
    game.start();
}

function pauseGame() {
    if (game) {
        game.togglePause();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initGame);
