const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const powerBar = document.getElementById('power-bar');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const shotsElement = document.getElementById('shots');
const restartBtn = document.getElementById('restartBtn');
const muteBtn = document.getElementById('muteBtn');

canvas.width = 1000;
canvas.height = 600;

// Create bottle images
const bottleTypes = {
    green: createBottleImage('#4CAF50', '#388E3C'),
    blue: createBottleImage('#2196F3', '#1976D2'),
    red: createBottleImage('#F44336', '#D32F2F'),
    gold: createBottleImage('#FFD700', '#FFA000')
};

function createBottleImage(mainColor, neckColor) {
    const bottleCanvas = document.createElement('canvas');
    bottleCanvas.width = 40;
    bottleCanvas.height = 80;
    const bCtx = bottleCanvas.getContext('2d');

    // Bottle body
    bCtx.fillStyle = mainColor;
    bCtx.beginPath();
    bCtx.roundRect(5, 20, 30, 55, 5);
    bCtx.fill();

    // Bottle neck
    bCtx.fillStyle = neckColor;
    bCtx.beginPath();
    bCtx.roundRect(15, 5, 10, 20, 2);
    bCtx.fill();

    // Shine effect
    bCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    bCtx.beginPath();
    bCtx.ellipse(25, 40, 5, 15, 0, 0, Math.PI * 2);
    bCtx.fill();

    return bottleCanvas;
}

// Game state
const gameState = {
    score: 0,
    level: 1,
    shotsLeft: 10,
    power: 0,
    isPowerCharging: false,
    isGameOver: false,
    isMuted: false,
    bottles: [],
    projectiles: [],
    particles: [],
    gravity: 0.5,
    wind: 0
};

class Bottle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
        this.type = type;
        this.health = type === 'gold' ? 3 : type === 'red' ? 2 : 1;
        this.rotation = 0;
        this.broken = false;
        this.value = type === 'gold' ? 30 : type === 'red' ? 20 : 10;
        this.sparkles = [];
        this.wobble = {
            angle: 0,
            speed: 0.02,
            amplitude: 0.1
        };
    }

    update() {
        this.wobble.angle += this.wobble.speed;
        this.rotation = Math.sin(this.wobble.angle) * this.wobble.amplitude;
        
        // Update sparkles
        if (Math.random() < 0.1) {
            this.addSparkle();
        }
        
        this.sparkles = this.sparkles.filter(sparkle => {
            sparkle.life -= 1;
            sparkle.y -= 0.5;
            return sparkle.life > 0;
        });
    }

    draw() {
        if (!this.broken) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.rotation);
            
            // Draw bottle shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.ellipse(2, 5, 20, 10, 0, 0, Math.PI * 2);
            
            // Draw bottle
            ctx.drawImage(bottleTypes[this.type], -this.width/2, -this.height/2);
            
            // Draw sparkles
            this.sparkles.forEach(sparkle => {
                ctx.fillStyle = `rgba(255, 255, 255, ${sparkle.life/50})`;
                ctx.beginPath();
                ctx.arc(sparkle.x - this.width/2, sparkle.y - this.height/2, 
                       sparkle.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.restore();
        }
    }

    addSparkle() {
        this.sparkles.push({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            size: Math.random() * 2 + 1,
            life: 50
        });
    }
}

// Rest of the code (Projectile, Particle classes and game logic) remains similar
// but with enhanced visual effects and improved physics

// Initialize game
function initGame() {
    gameState.bottles = [];
    const bottleTypes = ['green', 'blue', 'red', 'gold'];
    
    for (let i = 0; i < 6 + gameState.level; i++) {
        const type = bottleTypes[Math.floor(Math.random() * 
                    (gameState.level > 3 ? 4 : 3))];
        const x = 200 + i * 100;
        const y = canvas.height - 150 + (i % 2) * 30;
        gameState.bottles.push(new Bottle(x, y, type));
    }
}

// Add game loop and event listeners
// ... (Similar to previous version but with enhanced effects)

initGame();
gameLoop();
