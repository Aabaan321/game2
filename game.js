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

// Game state
let gameState = {
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
    powerups: []
};

// Load images
const bottleImg = new Image();
bottleImg.src = 'data:image/png;base64,/* Add base64 bottle image here */';
const backgroundImg = new Image();
backgroundImg.src = 'data:image/png;base64,/* Add base64 background image here */';

// Sound effects
const sounds = {
    shoot: new Audio('data:audio/wav;base64,/* Add base64 shoot sound here */'),
    break: new Audio('data:audio/wav;base64,/* Add base64 break sound here */'),
    powerup: new Audio('data:audio/wav;base64,/* Add base64 powerup sound here */')
};

class Bottle {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
        this.type = type;
        this.health = type === 'strong' ? 2 : 1;
        this.rotation = 0;
        this.broken = false;
        this.sparkles = [];
    }

    draw() {
        if (!this.broken) {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.rotation);
            ctx.drawImage(bottleImg, -this.width/2, -this.height/2, this.width, this.height);
            
            if (this.type === 'strong') {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
            }
            
            ctx.restore();
            
            // Draw sparkles
            this.sparkles.forEach((sparkle, index) => {
                sparkle.life--;
                if (sparkle.life <= 0) {
                    this.sparkles.splice(index, 1);
                } else {
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(255, 255, 255, ${sparkle.life/50})`;
                    ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
    }

    addSparkle() {
        for (let i = 0; i < 3; i++) {
            this.sparkles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                size: Math.random() * 2 + 1,
                life: 50
            });
        }
    }
}

class Projectile {
    constructor(x, y, angle, power) {
        this.x = x;
        this.y = y;
        this.radius = 6;
        this.angle = angle;
        this.speed = power * 0.5;
        this.gravity = 0.5;
        this.velocityY = -this.speed * Math.sin(angle);
        this.velocityX = this.speed * Math.cos(angle);
        this.trail = [];
    }

    update() {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) this.trail.shift();
        
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw() {
        // Draw trail
        this.trail.forEach((pos, index) => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius * (index/this.trail.length), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 100, 100, ${index/this.trail.length})`;
            ctx.fill();
        });

        // Draw projectile
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1;
        this.gravity = 0.1;
    }

    update() {
        this.x += this.speedX;
        this.speedY += this.gravity;
        this.y += this.speedY;
        this.life -= 0.02;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
        ctx.fill();
    }
}

function createParticleExplosion(x, y, color) {
    for (let i = 0; i < 30; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

function initializeLevel() {
    gameState.bottles = [];
    const bottleCount = 5 + gameState.level;
    
    for (let i = 0; i < bottleCount; i++) {
        const type = Math.random() < 0.3 ? 'strong' : 'normal';
        const x = 150 + i * 120;
        const y = canvas.height - 150 + (i % 2) * 50;
        gameState.bottles.push(new Bottle(x, y, type));
    }
}

function updatePowerBar() {
    if (gameState.isPowerCharging) {
        gameState.power = Math.min(gameState.power + 2, 100);
        powerBar.style.width = `${gameState.power}%`;
    }
}

function shoot(e) {
    if (gameState.isGameOver || gameState.shotsLeft <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const angle = Math.atan2(canvas.height - mouseY, mouseX - 50);
    gameState.projectiles.push(new Projectile(50, canvas.height - 50, angle, gameState.power));
    
    if (!gameState.isMuted) sounds.shoot.play();
    
    gameState.shotsLeft--;
    gameState.power = 0;
    powerBar.style.width = '0%';
    shotsElement.textContent = `Shots: ${gameState.shotsLeft}`;
}

function checkCollisions() {
    gameState.projectiles.forEach((projectile, pIndex) => {
        gameState.bottles.forEach((bottle, bIndex) => {
            if (!bottle.broken && checkCollision(projectile, bottle)) {
                bottle.health--;
                if (bottle.health <= 0) {
                    bottle.broken = true;
                    gameState.score += bottle.type === 'strong' ? 20 : 10;
                    createParticleExplosion(bottle.x + bottle.width/2, bottle.y + bottle.height/2, '144, 238, 144');
                    if (!gameState.isMuted) sounds.break.play();
                }
                gameState.projectiles.splice(pIndex, 1);
                scoreElement.textContent = `Score: ${gameState.score}`;
            }
        });
    });
}

function checkGameState() {
    const allBottlesBroken = gameState.bottles.every(bottle => bottle.broken);
    if (allBottlesBroken) {
        gameState.level++;
        gameState.shotsLeft = 10 + gameState.level;
        levelElement.textContent = `Level: ${gameState.level}`;
        shotsElement.textContent = `Shots: ${gameState.shotsLeft}`;
        initializeLevel();
    } else if (gameState.shotsLeft === 0 && gameState.projectiles.length === 0) {
        gameState.isGameOver = true;
        showGameOver();
    }
}

function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px "Press Start 2P"';
    ctx.fillText('Game Over!', canvas.width/2 - 150, canvas.height/2 - 50);
    ctx.font = '24px "Press Start 2P"';
    ctx.fillText(`Final Score: ${gameState.score}`, canvas.width/2 - 120, canvas.height/2 + 20);
    
    restartBtn.style.display = 'inline-block';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    gameState.particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        if (particle.life <= 0) gameState.particles.splice(index, 1);
    });
    
    // Update and draw projectiles
    gameState.projectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw();
        if (projectile.y > canvas.height || projectile.x > canvas.width) {
            gameState.projectiles.splice(index, 1);
        }
    });
    
    // Draw bottles
    gameState.bottles.forEach(bottle => {
        bottle.rotation += 0.01;
        bottle.addSparkle();
        bottle.draw();
    });
    
    updatePowerBar();
    checkCollisions();
    checkGameState();
    
    if (!gameState.isGameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Event Listeners
canvas.addEventListener('mousedown', () => {
    gameState.isPowerCharging = true;
});

canvas.addEventListener('mouseup', (e) => {
    gameState.isPowerCharging = false;
    shoot(e);
});

restartBtn.addEventListener('click', () => {
    gameState = {
        score: 0,
        level: 1,
        shotsLeft: 10,
        power: 0,
        isPowerCharging: false,
        isGameOver: false,
        bottles: [],
        projectiles: [],
        particles: [],
        powerups: []
    };
    scoreElement.textContent = `Score: ${gameState.score}`;
    levelElement.textContent = `Level: ${gameState.level}`;
    shotsElement.textContent = `Shots: ${gameState.shotsLeft}`;
    restartBtn.style.display = 'none';
    initializeLevel();
    gameLoop();
});

muteBtn.addEventListener('click', () => {
    gameState.isMuted = !gameState.isMuted;
    muteBtn.textContent = gameState.isMuted ? '🔇' : '🔊';
});

// Initialize and start game
initializeLevel();
gameLoop();
