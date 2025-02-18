const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const powerBar = document.getElementById('power-bar');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const shotsElement = document.getElementById('shots');
const restartButton = document.getElementById('restart');

canvas.width = 800;
canvas.height = 500;

let gameState = {
    score: 0,
    level: 1,
    shots: 10,
    power: 0,
    isCharging: false,
    bottles: [],
    projectiles: [],
    particles: []
};

class Bottle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 60;
        this.color = '#3DB34A';
        this.broken = false;
    }

    draw() {
        if (!this.broken) {
            // Bottle body
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Bottle neck
            ctx.fillRect(this.x + 10, this.y - 10, 10, 15);
        }
    }
}

class Projectile {
    constructor(x, y, angle, power) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.angle = angle;
        this.speed = power * 0.2;
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = -Math.sin(angle) * this.speed;
        this.gravity = 0.4;
    }

    update() {
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3;
        this.velocityX = (Math.random() - 0.5) * 5;
        this.velocityY = (Math.random() - 0.5) * 5;
        this.gravity = 0.2;
        this.life = 1;
        this.decay = 0.02;
    }

    update() {
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.life -= this.decay;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(61, 179, 74, ${this.life})`;
        ctx.fill();
        ctx.closePath();
    }
}

function initGame() {
    gameState = {
        score: 0,
        level: 1,
        shots: 10,
        power: 0,
        isCharging: false,
        bottles: [],
        projectiles: [],
        particles: []
    };

    // Create bottles
    for (let i = 0; i < 5 + gameState.level; i++) {
        gameState.bottles.push(new Bottle(
            200 + i * 80,
            canvas.height - 100 - (i % 2) * 50
        ));
    }

    updateHUD();
}

function updateHUD() {
    scoreElement.textContent = `Score: ${gameState.score}`;
    levelElement.textContent = `Level: ${gameState.level}`;
    shotsElement.textContent = `Shots: ${gameState.shots}`;
}

function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        gameState.particles.push(new Particle(x, y));
    }
}

function checkCollision(projectile, bottle) {
    return projectile.x > bottle.x &&
           projectile.x < bottle.x + bottle.width &&
           projectile.y > bottle.y &&
           projectile.y < bottle.y + bottle.height;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw aiming line when charging
    if (gameState.isCharging) {
        const angle = Math.atan2(canvas.height - mouseY, mouseX - 50);
        ctx.beginPath();
        ctx.moveTo(50, canvas.height - 50);
        ctx.lineTo(50 + Math.cos(angle) * 50, canvas.height - 50 - Math.sin(angle) * 50);
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }

    // Update and draw projectiles
    gameState.projectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw();

        // Remove projectiles that are off screen
        if (projectile.y > canvas.height || 
            projectile.x < 0 || 
            projectile.x > canvas.width) {
            gameState.projectiles.splice(index, 1);
        }

        // Check collisions with bottles
        gameState.bottles.forEach(bottle => {
            if (!bottle.broken && checkCollision(projectile, bottle)) {
                bottle.broken = true;
                gameState.score += 10;
                createExplosion(bottle.x + bottle.width/2, bottle.y + bottle.height/2);
                gameState.projectiles.splice(index, 1);
                updateHUD();
            }
        });
    });

    // Draw bottles
    gameState.bottles.forEach(bottle => bottle.draw());

    // Update and draw particles
    gameState.particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        if (particle.life <= 0) {
            gameState.particles.splice(index, 1);
        }
    });

    // Check level completion
    if (gameState.bottles.every(bottle => bottle.broken)) {
        gameState.level++;
        gameState.shots = 10;
        initGame();
    }

    // Check game over
    if (gameState.shots === 0 && gameState.projectiles.length === 0) {
        const remainingBottles = gameState.bottles.filter(bottle => !bottle.broken).length;
        if (remainingBottles > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
            return;
        }
    }

    requestAnimationFrame(gameLoop);
}

let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
    if (gameState.shots > 0) {
        gameState.isCharging = true;
        gameState.power = 0;
    }
});

canvas.addEventListener('mouseup', () => {
    if (gameState.isCharging && gameState.shots > 0) {
        const angle = Math.atan2(canvas.height - mouseY, mouseX - 50);
        gameState.projectiles.push(new Projectile(50, canvas.height - 50, angle, gameState.power));
        gameState.shots--;
        gameState.isCharging = false;
        gameState.power = 0;
        powerBar.style.width = '0%';
        updateHUD();
    }
});

restartButton.addEventListener('click', () => {
    initGame();
    gameLoop();
});

// Power charging animation
setInterval(() => {
    if (gameState.isCharging) {
        gameState.power = Math.min(gameState.power + 2, 100);
        powerBar.style.width = gameState.power + '%';
    }
}, 20);

initGame();
gameLoop();
