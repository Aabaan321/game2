const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const shotsElement = document.getElementById('shots');
const restartBtn = document.getElementById('restartBtn');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let shotsLeft = 10;
let bottles = [];
let projectiles = [];
let isGameOver = false;

class Bottle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 60;
        this.broken = false;
    }

    draw() {
        if (!this.broken) {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Bottle neck
            ctx.fillRect(this.x + 10, this.y - 10, 10, 10);
        }
    }
}

class Projectile {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.angle = angle;
        this.speed = speed;
        this.gravity = 0.5;
        this.velocityY = -speed * Math.sin(angle);
        this.velocityX = speed * Math.cos(angle);
    }

    update() {
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();
    }
}

function initializeBottles() {
    bottles = [];
    for (let i = 0; i < 5; i++) {
        bottles.push(new Bottle(150 + i * 120, canvas.height - 100));
    }
}

function checkCollision(projectile, bottle) {
    return projectile.x > bottle.x &&
           projectile.x < bottle.x + bottle.width &&
           projectile.y > bottle.y &&
           projectile.y < bottle.y + bottle.height;
}

function gameLoop() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw projectiles
    projectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw();

        // Remove projectiles that are off screen
        if (projectile.y > canvas.height || projectile.x > canvas.width) {
            projectiles.splice(index, 1);
        }

        // Check for collisions
        bottles.forEach(bottle => {
            if (!bottle.broken && checkCollision(projectile, bottle)) {
                bottle.broken = true;
                score += 10;
                scoreElement.textContent = `Score: ${score}`;
            }
        });
    });

    // Draw bottles
    bottles.forEach(bottle => bottle.draw());

    // Check game over
    if (shotsLeft === 0 && projectiles.length === 0) {
        isGameOver = true;
        ctx.fillStyle = 'black';
        ctx.font = '48px Arial';
        ctx.fillText(`Game Over! Score: ${score}`, canvas.width/2 - 150, canvas.height/2);
        restartBtn.style.display = 'inline-block';
    }

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (e) => {
    if (isGameOver || shotsLeft <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate angle and create projectile
    const angle = Math.atan2(canvas.height - mouseY, mouseX - 50);
    projectiles.push(new Projectile(50, canvas.height - 50, angle, 15));

    shotsLeft--;
    shotsElement.textContent = `Shots Left: ${shotsLeft}`;
});

restartBtn.addEventListener('click', () => {
    score = 0;
    shotsLeft = 10;
    projectiles = [];
    isGameOver = false;
    scoreElement.textContent = `Score: ${score}`;
    shotsElement.textContent = `Shots Left: ${shotsLeft}`;
    initializeBottles();
    restartBtn.style.display = 'none';
});

initializeBottles();
gameLoop();
