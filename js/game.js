let score = 0;
let lives = 3;
let multiplier = 1;
let multiplierTimer;
let powerupTimers = {}; // Pour stocker les timers de tous les power-ups
let powerup;
let colorIndex = 0;
let colorChangeTimer = 0;
let paddleSpeed = 8;
let ballSpeed = 200;
let originalBallSpeed = 200; // Pour restaurer la vitesse après un ralentissement
let currentLevel = 1;
let isGameOver = false;
let isPaused = false; // Pour la pause
let multiBalls = []; // Pour stocker les balles supplémentaires
let originalPaddleWidth = 104; // Largeur par défaut de la raquette
let maxBallSpeed = 500; // Vitesse maximale de la balle
let multiballCount = 0; // Compteur de power-ups multiball actifs

const pointsPerBrick = {
  brick_red: 10,
  brick_green: 20,
  brick_blue: 30,
  brick_yellow: 40,
  brick_purple: 50,
  brick_orange: 60,
  brick_pink: 70,
  brick_cyan: 80,
  rainbow_brick: 100,
};

// Types de power-ups
const POWERUP_TYPES = {
  MULTIPLIER: "powerup",
  MULTIBALL: "exploball",
  EXTEND: "extend",
  SHRINK: "shrink",
  SLOWBALL: "slowball",
};

let rainbowColors = [
  "#ff4444",
  "#ff8844",
  "#ffdd44",
  "#44ff44",
  "#4444ff",
  "#cc44ff",
];

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  backgroundColor: "#333",
  parent: "gameArea",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
      checkCollision: { down: false },
      fps: 60,
      timeScale: 1,
      tileBias: 16,
      overlapBias: 8,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function updateScore(value) {
  document.getElementById("scoreValue").textContent = value;
}

function updateMultiplier(value) {
  document.getElementById("multiplierValue").textContent = value;
}

function updateLives(value) {
  document.getElementById("livesValue").textContent = value;
}

updateScore(score);
updateMultiplier(multiplier);
updateLives(lives);

function preload() {
  this.load.audio("boom", "assets/sounds/boom.wav");
  this.load.audio("go", "assets/sounds/go.wav");
  this.load.audio("powerup", "assets/sounds/powerup.wav");
  this.load.audio("blip", "assets/sounds/blip.wav");

  this.load.image("paddle", "assets/paddle.png");
  this.load.image("ball", "assets/ball.png");
  this.load.image("brick_red", "assets/brick_red.png");
  this.load.image("brick_green", "assets/brick_green.png");
  this.load.image("brick_blue", "assets/brick_blue.png");
  this.load.image("brick_yellow", "assets/brick_yellow.png");
  this.load.image("brick_purple", "assets/brick_purple.png");
  this.load.image("brick_orange", "assets/brick_orange.png");
  this.load.image("brick_pink", "assets/brick_pink.png");
  this.load.image("brick_cyan", "assets/brick_cyan.png");
  this.load.image("rainbow_brick", "assets/rainbow_brick.png");

  // Charger les images des power-ups
  this.load.image("powerup", "assets/powerup.png");
  this.load.image("exploball", "assets/exploball.png");
  this.load.image("extend", "assets/extend.png");
  this.load.image("shrink", "assets/shrink.png");
  this.load.image("slowball", "assets/slowball.png");

  this.load.image("pixel", "assets/particle.png");
}

function create() {
  this.boomSound = this.sound.add("boom", { volume: 1 });
  this.goSound = this.sound.add("go", { volume: 1 });
  this.powerupSound = this.sound.add("powerup", { volume: 1 });
  this.blipSound = this.sound.add("blip", { volume: 1 });

  this.paddle = this.physics.add.image(320, 450, "paddle").setImmovable();
  originalPaddleWidth = this.paddle.displayWidth; // Stocker la largeur originale de la raquette
  this.goSound.play();

  this.ball = this.physics.add.image(320, 400, "ball");
  this.ball.setCollideWorldBounds(true);
  this.ball.setBounce(1);
  this.ball.setVelocity(ballSpeed, -ballSpeed);
  this.ball.setData("isMainBall", true); // Marquer comme balle principale
  this.ball.body.onWorldBounds = true;
  this.physics.world.setFPS(120); // Plus de checks par seconde

  createBricks.call(this);

  this.particleEmitter = this.add.particles("pixel").createEmitter({
    speed: { min: 100, max: 200 },
    angle: { min: 0, max: 360 },
    lifespan: 500,
    gravityY: 100,
    scale: { start: 0.5, end: 0 },
    quantity: 10,
    on: false,
  });

  // Ajouter un bouton de retour au menu
  this.add
    .text(320, 500, "MENU PRINCIPAL", {
      font: "16px Press Start 2P",
      fill: "#00CCFF",
      stroke: "#000000",
      strokeThickness: 4,
      backgroundColor: "#000033",
      padding: { x: 15, y: 8 },
    })
    .setOrigin(0.5, 0.5)
    .setInteractive()
    .on("pointerover", function () {
      this.setStyle({ fill: "#FFFF00" });
    })
    .on("pointerout", function () {
      this.setStyle({ fill: "#00CCFF" });
    })
    .on("pointerdown", function () {
      window.location.href = "index.html";
    });

  // Ajouter un indicateur de pause
  this.pauseText = this.add
    .text(320, 240, "PAUSE", {
      font: "48px Press Start 2P",
      fill: "#FFFF00",
      stroke: "#000000",
      strokeThickness: 6,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: { x: 30, y: 20 },
    })
    .setOrigin(0.5)
    .setVisible(false);

  this.physics.add.collider(
    this.ball,
    this.paddle,
    handlePaddleCollision,
    null,
    this
  );
  this.physics.add.collider(
    this.ball,
    this.bricks,
    handleBrickCollision,
    null,
    this
  );
  this.cursors = this.input.keyboard.createCursorKeys();
  
  // Ajouter la touche P pour pause
  this.pauseKey = this.input.keyboard.addKey('P');
  this.pauseKey.on('down', () => {
    togglePause.call(this);
  });

  displayLevelMessage.call(this, `Niveau ${currentLevel}`);

  // Pour garder une référence au contexte de la scène
  this.gameScene = this;
}

function togglePause() {
  if (isGameOver) return;
  
  isPaused = !isPaused;
  
  if (isPaused) {
    this.physics.pause();
    this.pauseText.setVisible(true);
  } else {
    this.physics.resume();
    this.pauseText.setVisible(false);
  }
}

function displayLevelMessage(text) {
  let message = this.add
    .text(320, 240, text, {
      font: "48px Press Start 2P",
      fill: "#00ccff",
      align: "center",
      padding: { x: 20, y: 10 },
      backgroundColor: "#002233",
      border: "5px solid #00ccff",
      borderRadius: "10px",
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: "#00ccff",
        blur: 20,
        fill: true,
      },
    })
    .setOrigin(0.5);

  this.time.delayedCall(
    2000,
    () => {
      message.destroy();
      this.ball.setVelocity(ballSpeed, -ballSpeed);
    },
    [],
    this
  );

  this.ball.setVelocity(0, 0); // Stop the ball temporarily
}

function handlePaddleCollision(ball, paddle) {
  this.blipSound.play();

  // Position relative de la balle par rapport au centre de la raquette
  const hitPoint = ball.x - paddle.x;
  const paddleWidth = paddle.width;

  // Normaliser la position entre -1 (extrême gauche) et 1 (extrême droite)
  const normalizedHitPoint = hitPoint / (paddleWidth / 2);

  // Modification ici : angles plus prononcés aux extrémités avec une courbe
  // On utilise une fonction quadratique pour avoir un angle qui augmente rapidement aux extrémités
  // Math.sign maintient la direction, normalizedHitPoint² augmente l'effet aux extrémités
  const adjustedHitPoint =
    Math.sign(normalizedHitPoint) * Math.pow(Math.abs(normalizedHitPoint), 1.5);

  // Angle maximal de 60 degrés (π/3 radians) au lieu de 45 degrés
  const angle = adjustedHitPoint * (Math.PI / 3);

  // La vitesse de base
  const speed = ball.body.speed || ballSpeed;

  // Ajout : légère augmentation de la vitesse aux extrémités
  const speedMultiplier = 1 + Math.abs(normalizedHitPoint) * 0.2; // Jusqu'à 20% plus rapide
  const newSpeed = Math.min(speed * speedMultiplier, maxBallSpeed); // Limiter la vitesse maximale

  // Appliquer la nouvelle vélocité avec l'angle modifié et la vitesse ajustée
  ball.setVelocity(newSpeed * Math.sin(angle), -newSpeed * Math.cos(angle));
}

function handleBrickCollision(ball, brick) {
    // Éviter les collisions multiples avec la même brique
    if (brick.getData('isDestroyed')) {
        return;
    }
    
    // Marquer la brique comme détruite
    brick.setData('isDestroyed', true);
    
    // Jouer le son de collision
    this.boomSound.play();
  
    // Calculer la direction du rebond AVANT de détruire la brique
    const ballVelocity = ball.body.velocity.clone();
    const ballCenter = { x: ball.x, y: ball.y };
    const brickCenter = { x: brick.x, y: brick.y };
    
    // Calculer les différences pour déterminer le côté de collision
    const diffX = ballCenter.x - brickCenter.x;
    const diffY = ballCenter.y - brickCenter.y;
    
    // Dimensions de la brique
    const halfWidth = brick.width / 2;
    const halfHeight = brick.height / 2;
    
    // Déterminer la direction du rebond
    const overlapX = halfWidth - Math.abs(diffX);
    const overlapY = halfHeight - Math.abs(diffY);
    
    // Si l'overlap horizontal est plus petit, c'est une collision latérale
    if (overlapX < overlapY) {
        // Collision horizontale (gauche ou droite)
        ballVelocity.x = -ballVelocity.x;
    } else {
        // Collision verticale (haut ou bas)
        ballVelocity.y = -ballVelocity.y;
    }
    
    // Ajouter une légère randomisation pour éviter les boucles infinies
    const randomFactor = 0.02;
    ballVelocity.x *= (1 + (Math.random() - 0.5) * randomFactor);
    ballVelocity.y *= (1 + (Math.random() - 0.5) * randomFactor);
    
    // Appliquer immédiatement la nouvelle vélocité
    ball.setVelocity(ballVelocity.x, ballVelocity.y);
    
    // Pousser légèrement la balle hors de la brique pour éviter le tunneling
    if (overlapX < overlapY) {
        // Pousser horizontalement
        const pushX = diffX > 0 ? overlapX + 1 : -(overlapX + 1);
        ball.x += pushX;
    } else {
        // Pousser verticalement
        const pushY = diffY > 0 ? overlapY + 1 : -(overlapY + 1);
        ball.y += pushY;
    }

  // Continuer avec le traitement de la destruction de la brique
  let brickType = brick.texture.key;

  // Positionner l'émetteur
  this.particleEmitter.setPosition(brick.x, brick.y);

  // Créer un nouvel émetteur temporaire avec la couleur appropriée
  let particleColor;
  if (brickType === "rainbow_brick") {
    particleColor = rainbowColors[colorIndex];
  } else {
    // Utiliser une correspondance directe de couleur en format hexa texte
    const brickColorsHexa = {
      brick_red: "#ff0000",
      brick_green: "#00ff00",
      brick_blue: "#0000ff",
      brick_yellow: "#ffff00",
      brick_purple: "#800080",
      brick_orange: "#ff8000",
      brick_pink: "#ff66b2",
      brick_cyan: "#00ffff",
    };
    particleColor = brickColorsHexa[brickType] || "#ffffff";
  }

  // Créer un émetteur temporaire pour cette explosion avec la bonne couleur
  let tempEmitter = this.add.particles("pixel").createEmitter({
    x: brick.x,
    y: brick.y,
    speed: { min: 100, max: 200 },
    angle: { min: 0, max: 360 },
    lifespan: 500,
    gravityY: 100,
    scale: { start: 0.5, end: 0 },
    quantity: 20,
    tint: Phaser.Display.Color.HexStringToColor(particleColor).color,
  });

  // Lancer l'émetteur puis le détruire après l'animation
  tempEmitter.explode(20);
  this.time.delayedCall(600, () => {
    tempEmitter.remove();
  });

  let points = pointsPerBrick[brickType] || 10;
  brick.destroy();
  score += points * multiplier;
  updateScore(score);

  // Chance de créer un power-up (25% de chance au lieu de 30%)
  if (Math.random() < 0.25) {
    createPowerup.call(this, brick.x, brick.y);
  }

  if (this.bricks.countActive() === 0) {
    nextLevel.call(this);
  }
}

function createBricks() {
    this.bricks = this.physics.add.staticGroup();
    const colors = [
      "brick_red",
      "brick_green",
      "brick_blue",
      "brick_yellow",
      "brick_purple",
      "brick_orange",
      "brick_pink",
      "brick_cyan",
    ];
  
    for (let y = 50; y <= 110; y += 30) {
      for (let x = 80; x <= 580; x += 60) {
        let isRainbowBrick = Math.random() < 0.05;
        let brick;
        if (isRainbowBrick) {
          brick = this.bricks.create(x, y, "rainbow_brick").setData("isRainbow", true);
        } else {
          let color = colors[Math.floor(Math.random() * colors.length)];
          brick = this.bricks.create(x, y, color);
        }
        // Initialiser le flag de destruction
        brick.setData('isDestroyed', false);
        // Ajuster la taille de la hitbox pour un meilleur contact
        brick.body.setSize(brick.width * 0.95, brick.height * 0.95);
      }
    }
  }

function getBrickColor(brickType) {
  const brickColors = {
    brick_red: 0xff0000,
    brick_green: 0x00ff00,
    brick_blue: 0x0000ff,
    brick_yellow: 0xffff00,
    brick_purple: 0x800080,
    brick_orange: 0xff8000,
    brick_pink: 0xff66b2,
    brick_cyan: 0x00ffff,
    rainbow_brick: 0xffffff,
  };
  return brickColors[brickType] || 0xffffff;
}

function createPowerup(x, y) {
  // Choix aléatoire du type de power-up
  const powerupTypes = Object.values(POWERUP_TYPES);
  const randomType =
    powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

  // Créer le power-up au-dessus de la brique détruite
  powerup = this.physics.add.image(x, y, randomType);
  powerup.setData("type", randomType); // Stocker le type pour l'identifier lors de la collecte
  powerup.setVelocity(0, 80); // Vitesse réduite pour faciliter la collecte
  powerup.setCollideWorldBounds(false);
  powerup.setGravityY(30); // Gravité réduite

  // Ajouter un effet de scintillement
  this.tweens.add({
    targets: powerup,
    alpha: { from: 1, to: 0.6 },
    duration: 500,
    yoyo: true,
    repeat: -1,
  });

  this.physics.add.overlap(this.paddle, powerup, collectPowerup, null, this);
}

function collectPowerup(paddle, powerup) {
  const powerupType = powerup.getData("type");
  powerup.destroy();
  this.powerupSound.play();

  // Montrer un texte pour indiquer le power-up obtenu
  let powerupText = "";

  switch (powerupType) {
    case POWERUP_TYPES.MULTIPLIER:
      // Power-up multiplicateur de points
      multiplier += 1;
      updateMultiplier(multiplier);
      powerupText = `MULTIPLICATEUR x${multiplier}`;

      // Réinitialiser le multiplicateur après 10 secondes
      clearTimeout(powerupTimers.multiplier);
      powerupTimers.multiplier = setTimeout(() => {
        multiplier = 1;
        updateMultiplier(multiplier);
      }, 10000);
      break;

    case POWERUP_TYPES.MULTIBALL:
      // Limiter le nombre de balles multiples
      if (multiballCount < 3) { // Maximum 3 power-ups multiball actifs
        multiballCount++;
        powerupText = "BALLES MULTIPLES";
        createMultiBalls.call(this);
      } else {
        powerupText = "BALLES MAX!";
      }
      break;

    case POWERUP_TYPES.EXTEND:
      // Power-up élargissement de la raquette
      paddle.setScale(1.5, 1); // Élargir la raquette de 50%
      powerupText = "RAQUETTE ÉLARGIE";

      // Revenir à la taille normale après 15 secondes
      clearTimeout(powerupTimers.paddleSize);
      powerupTimers.paddleSize = setTimeout(() => {
        paddle.setScale(1, 1);
      }, 15000);
      break;

    case POWERUP_TYPES.SHRINK:
      // Power-up rétrécissement de la raquette (négatif pour le joueur)
      paddle.setScale(0.7, 1); // Rétrécir la raquette à 70% de sa largeur
      powerupText = "RAQUETTE RÉTRÉCIE";

      // Revenir à la taille normale après 10 secondes
      clearTimeout(powerupTimers.paddleSize);
      powerupTimers.paddleSize = setTimeout(() => {
        paddle.setScale(1, 1);
      }, 10000);
      break;

    case POWERUP_TYPES.SLOWBALL:
      // Power-up ralentissement de la balle
      // Réduire la vitesse de toutes les balles
      const slowFactor = 0.6; // 60% de la vitesse normale

      // Sauvegarder la vitesse originale avant de la modifier
      const previousSpeed = ballSpeed;
      ballSpeed = originalBallSpeed * slowFactor;

      // Ralentir la balle principale
      const currentVelocity = this.ball.body.velocity;
      const speed = Math.sqrt(
        currentVelocity.x * currentVelocity.x +
          currentVelocity.y * currentVelocity.y
      );
      const newSpeed = speed * slowFactor;
      const ratio = newSpeed / speed;
      this.ball.setVelocity(
        currentVelocity.x * ratio,
        currentVelocity.y * ratio
      );

      // Ralentir les balles supplémentaires
      multiBalls.forEach((ball) => {
        if (ball && ball.active) {
          const ballVelocity = ball.body.velocity;
          const ballSpeed = Math.sqrt(
            ballVelocity.x * ballVelocity.x + ballVelocity.y * ballVelocity.y
          );
          const newBallSpeed = ballSpeed * slowFactor;
          const ballRatio = newBallSpeed / ballSpeed;
          ball.setVelocity(
            ballVelocity.x * ballRatio,
            ballVelocity.y * ballRatio
          );
        }
      });

      powerupText = "BALLE RALENTIE";

      // Revenir à la vitesse normale après 10 secondes
      clearTimeout(powerupTimers.ballSpeed);
      powerupTimers.ballSpeed = setTimeout(() => {
        // Restaurer la vitesse originale
        ballSpeed = originalBallSpeed;

        // Accélérer la balle principale (ajuster sa vélocité actuelle)
        const currVel = this.ball.body.velocity;
        const currSpeed = Math.sqrt(
          currVel.x * currVel.x + currVel.y * currVel.y
        );
        const restoreRatio = originalBallSpeed / currSpeed;
        this.ball.setVelocity(
          currVel.x * restoreRatio,
          currVel.y * restoreRatio
        );

        // Accélérer les balles supplémentaires
        multiBalls.forEach((ball) => {
          if (ball && ball.active) {
            const mbVel = ball.body.velocity;
            const mbSpeed = Math.sqrt(mbVel.x * mbVel.x + mbVel.y * mbVel.y);
            const mbRatio = originalBallSpeed / mbSpeed;
            ball.setVelocity(mbVel.x * mbRatio, mbVel.y * mbRatio);
          }
        });
      }, 10000);
      break;
  }

  // Afficher le texte du power-up
  if (powerupText) {
    const text = this.add
      .text(paddle.x, paddle.y - 40, powerupText, {
        font: "16px Press Start 2P",
        fill: "#FFFF00",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      onComplete: function () {
        text.destroy();
      },
    });
  }
}

function createMultiBalls() {
  // Créer 2 balles supplémentaires à côté de la balle principale
  const mainBall = this.ball;
  const scene = this;

  // Créer les nouvelles balles
  for (let i = 0; i < 2; i++) {
    const offsetX = i === 0 ? -20 : 20;
    const ball = scene.physics.add.image(
      mainBall.x + offsetX,
      mainBall.y,
      "ball"
    );
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);

    // Donner des directions différentes aux balles supplémentaires
    const angle = i === 0 ? Math.PI / 4 : -Math.PI / 4;
    ball.setVelocity(ballSpeed * Math.sin(angle), -ballSpeed * Math.cos(angle));
    ball.body.onWorldBounds = true;


    // Configurer les collisions
    scene.physics.add.collider(
      ball,
      scene.paddle,
      handlePaddleCollision,
      null,
      scene
    );
    scene.physics.add.collider(
      ball,
      scene.bricks,
      handleBrickCollision,
      null,
      scene
    );

    // Stocker la balle
    multiBalls.push(ball);
  }
}

function cleanupMultiBalls() {
  // Nettoyer les anciennes balles multiples
  multiBalls.forEach((ball) => {
    if (ball && ball.active) {
      ball.destroy();
    }
  });
  multiBalls = [];
  multiballCount = 0; // Réinitialiser le compteur
}

function nextLevel() {
  currentLevel++;
  displayLevelMessage.call(this, `Niveau ${currentLevel}`);

  // Nettoyer les balles multiples
  cleanupMultiBalls();

  // Réinitialiser la position et la vitesse de la balle principale
  this.ball.setPosition(320, 350);
  this.ball.setVisible(true); // S'assurer que la balle est visible
  
  // Augmenter la vitesse mais avec une limite
  ballSpeed = Math.min(originalBallSpeed + (currentLevel - 1) * 30, maxBallSpeed);
  originalBallSpeed = ballSpeed; // Mettre à jour la vitesse de référence
  this.ball.setVelocity(0, 0); // La vitesse sera réinitialisée après le message

  // Réinitialiser la position et la taille de la raquette
  this.paddle.setPosition(320, 450);
  this.paddle.setScale(1, 1);

  // Annuler tous les power-ups actifs
  Object.keys(powerupTimers).forEach((key) => {
    clearTimeout(powerupTimers[key]);
  });
  powerupTimers = {};

  multiplier = 1;
  updateMultiplier(multiplier);

  this.bricks.clear(true, true);
  createBricks.call(this);

  // Réinitialiser le collider pour les nouvelles briques
  this.physics.add.collider(
    this.ball,
    this.bricks,
    handleBrickCollision,
    null,
    this
  );
}

function saveScore(playerScore, playerLevel) {
  // Récupérer les scores existants ou initialiser un tableau vide
  let highScores = JSON.parse(localStorage.getItem("gregonoidScores")) || [];

  // Créer l'interface de saisie de nom stylisée rétro
  isGameOver = true;

  // Nettoyer les balles multiples
  cleanupMultiBalls();

  // Créer un overlay semi-transparent
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  overlay.style.zIndex = "1000";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  document.body.appendChild(overlay);

  // Créer la boîte de dialogue
  const dialogBox = document.createElement("div");
  dialogBox.style.backgroundColor = "#000080";
  dialogBox.style.border = "3px solid #00CCFF";
  dialogBox.style.boxShadow = "0 0 20px #00CCFF";
  dialogBox.style.borderRadius = "10px";
  dialogBox.style.padding = "20px";
  dialogBox.style.textAlign = "center";
  dialogBox.style.maxWidth = "500px";
  dialogBox.style.width = "90%";
  dialogBox.style.fontFamily = "'Press Start 2P', cursive";
  dialogBox.style.color = "#00FF00";
  overlay.appendChild(dialogBox);

  // Titre de la boîte
  const title = document.createElement("h2");
  title.textContent = "GAME OVER";
  title.style.color = "#FF0000";
  title.style.textShadow = "0 0 10px #FF0000";
  title.style.marginBottom = "20px";
  dialogBox.appendChild(title);

  // Afficher le score
  const scoreText = document.createElement("p");
  scoreText.innerHTML = `Score: <span style="color: #FFFF00; text-shadow: 0 0 10px #FFFF00;">${playerScore}</span>`;
  dialogBox.appendChild(scoreText);

  // Afficher le niveau
  const levelText = document.createElement("p");
  levelText.innerHTML = `Niveau: <span style="color: #00FFFF; text-shadow: 0 0 10px #00FFFF;">${playerLevel}</span>`;
  dialogBox.appendChild(levelText);

  // Label pour l'input
  const label = document.createElement("p");
  label.textContent = "Entrez votre nom:";
  label.style.marginTop = "20px";
  dialogBox.appendChild(label);

  // Input pour le nom
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 10;
  input.value = "Joueur";
  input.style.backgroundColor = "#000033";
  input.style.border = "2px solid #00FF00";
  input.style.color = "#00FF00";
  input.style.padding = "10px";
  input.style.margin = "10px 0";
  input.style.width = "80%";
  input.style.fontFamily = "'Press Start 2P', cursive";
  input.style.fontSize = "14px";
  input.style.textAlign = "center";
  input.style.outline = "none";
  input.style.boxShadow = "0 0 10px #00FF00";
  dialogBox.appendChild(input);

  // Sélectionner tout le texte quand l'input reçoit le focus
  input.addEventListener("focus", function () {
    this.select();
  });
  input.focus();

  // Bouton de validation
  const saveButton = document.createElement("button");
  saveButton.textContent = "SAUVEGARDER";
  saveButton.style.backgroundColor = "#000000";
  saveButton.style.border = "2px solid #00FF00";
  saveButton.style.color = "#00FF00";
  saveButton.style.boxShadow = "inset 0 0 10px #000000, 0 0 10px #00FF00";
  saveButton.style.textShadow = "0 0 5px #00FF00";
  saveButton.style.padding = "10px 20px";
  saveButton.style.margin = "20px 10px 0 10px";
  saveButton.style.fontFamily = "'Press Start 2P', cursive";
  saveButton.style.cursor = "pointer";
  saveButton.style.display = "inline-block";
  dialogBox.appendChild(saveButton);

  // Bouton pour retourner au menu
  const menuButton = document.createElement("button");
  menuButton.textContent = "MENU";
  menuButton.style.backgroundColor = "#000000";
  menuButton.style.border = "2px solid #FF0000";
  menuButton.style.color = "#FF0000";
  menuButton.style.boxShadow = "inset 0 0 10px #000000, 0 0 10px #FF0000";
  menuButton.style.textShadow = "0 0 5px #FF0000";
  menuButton.style.padding = "10px 20px";
  menuButton.style.margin = "20px 10px 0 10px";
  menuButton.style.fontFamily = "'Press Start 2P', cursive";
  menuButton.style.cursor = "pointer";
  menuButton.style.display = "inline-block";
  dialogBox.appendChild(menuButton);

  // Effet hover pour les boutons
  const hoverSound = new Audio("assets/sounds/menu_hover.wav");

  saveButton.addEventListener("mouseenter", function () {
    this.style.backgroundColor = "#001100";
    hoverSound.currentTime = 0;
    hoverSound.play().catch((e) => console.error(e));
  });

  saveButton.addEventListener("mouseleave", function () {
    this.style.backgroundColor = "#000000";
  });

  menuButton.addEventListener("mouseenter", function () {
    this.style.backgroundColor = "#110000";
    hoverSound.currentTime = 0;
    hoverSound.play().catch((e) => console.error(e));
  });

  menuButton.addEventListener("mouseleave", function () {
    this.style.backgroundColor = "#000000";
  });

  // Fonction pour sauvegarder le score
  function savePlayerScore() {
    let playerName = input.value.trim();
    if (playerName === "") {
      playerName = "Joueur";
    }

    // Créer un nouvel objet score
    const newScore = {
      name: playerName,
      score: playerScore,
      level: playerLevel,
      date: new Date().toLocaleDateString(),
    };

    // Ajouter le nouveau score
    highScores.push(newScore);

    // Trier les scores du plus élevé au plus bas
    highScores.sort((a, b) => b.score - a.score);

    // Garder uniquement les 10 meilleurs scores
    highScores = highScores.slice(0, 10);

    // Sauvegarder dans le localStorage
    localStorage.setItem("gregonoidScores", JSON.stringify(highScores));

    // Fermer la boîte de dialogue
    document.body.removeChild(overlay);
    isGameOver = false;

    // Réinitialiser complètement le jeu
    score = 0;
    lives = 3;
    multiplier = 1;
    ballSpeed = 200;
    originalBallSpeed = 200;
    currentLevel = 1;
    multiballCount = 0;

    // Nettoyer tous les power-ups et leurs timers
    Object.keys(powerupTimers).forEach((key) => {
      clearTimeout(powerupTimers[key]);
    });
    powerupTimers = {};

    // Redémarrer la scène
    game.scene.scenes[0].scene.restart();
  }

  // Action du bouton de sauvegarde
  saveButton.addEventListener("click", savePlayerScore);

  // Action du bouton menu
  menuButton.addEventListener("click", function () {
    savePlayerScore(); // Sauvegarder avant de quitter
    window.location.href = "index.html";
  });

  // Permettre de valider avec Entrée
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      savePlayerScore();
    }
  });

  return null; // Le score est sauvegardé par la fonction interne
}

function loseLife() {
  lives -= 1;
  updateLives(lives);

  // Nettoyer les balles multiples
  cleanupMultiBalls();
  
  // Réinitialiser la visibilité de la balle principale
  this.ball.setVisible(true);

  if (lives <= 0) {
    // Sauvegarder le score
    if (score > 0) {
      saveScore(score, currentLevel);
    } else {
      isGameOver = true;
      score = 0;
      lives = 3;
      multiplier = 1;
      ballSpeed = 200;
      originalBallSpeed = 200;
      currentLevel = 1;
      multiballCount = 0;
      updateScore(score);
      updateMultiplier(multiplier);
      updateLives(lives);
      this.scene.restart();
      isGameOver = false;
    }
  } else {
    // Annuler tous les power-ups actifs
    Object.keys(powerupTimers).forEach((key) => {
      clearTimeout(powerupTimers[key]);
    });
    powerupTimers = {};

    // Réinitialiser le multiplicateur
    multiplier = 1;
    updateMultiplier(multiplier);

    // Réinitialiser la taille de la raquette
    this.paddle.setScale(1, 1);

    // Réinitialiser la vitesse de la balle
    ballSpeed = originalBallSpeed;

    // Repositionner la balle et la raquette
    this.ball.setPosition(320, 400);
    this.ball.setVelocity(ballSpeed, -ballSpeed);
    this.paddle.setPosition(320, 450);
  }
}

function update(delta) {
  // Si c'est game over ou en pause, ne pas mettre à jour le jeu
  if (isGameOver || isPaused) {
    return;
  }

  if (this.cursors.left.isDown) {
    this.paddle.x -= paddleSpeed;
  }
  if (this.cursors.right.isDown) {
    this.paddle.x += paddleSpeed;
  }
  this.paddle.x = Phaser.Math.Clamp(this.paddle.x, 52, 588);

  // Vérifier la balle principale
  if (this.ball.y > 480) {
    // Si on a des balles multiples actives, ne pas perdre de vie
    const hasActiveMultiBalls = multiBalls.some(ball => ball && ball.active && ball.y <= 480);
    
    if (!hasActiveMultiBalls) {
      // Plus aucune balle en jeu, on perd une vie
      loseLife.call(this);
    } else {
      // On a encore des balles en jeu, on cache juste la balle principale
      this.ball.setPosition(-100, -100);
      this.ball.setVelocity(0, 0);
      this.ball.setVisible(false);
    }
  }

  // Vérifier si des balles supplémentaires sont sorties de l'écran
  let activeBallsCount = 0;
  if (this.ball.visible && this.ball.y <= 480) {
    activeBallsCount++;
  }
  
  multiBalls.forEach((ball, index) => {
    if (ball && ball.active) {
      if (ball.y > 480) {
        ball.destroy();
        multiBalls[index] = null;
      } else {
        activeBallsCount++;
      }
    }
  });

  // Si plus aucune balle n'est active, on perd une vie
  if (activeBallsCount === 0 && !this.ball.visible) {
    loseLife.call(this);
  }

  // Nettoyer le tableau des balles multiples
  multiBalls = multiBalls.filter((ball) => ball !== null);

  colorChangeTimer += delta;
  if (colorChangeTimer > 200) {
    let rainbowBrick = this.bricks
      .getChildren()
      .find((b) => b.getData("isRainbow"));
    if (rainbowBrick) {
      rainbowBrick.setTint(
        Phaser.Display.Color.HexStringToColor(rainbowColors[colorIndex]).color
      );
      colorIndex = (colorIndex + 1) % rainbowColors.length;
    }
    colorChangeTimer = 0;
  }
}

function applyRandomFlicker() {
  const letters = document.querySelectorAll("#gameTitle span");
  letters.forEach((letter) => letter.classList.remove("random-flicker"));
  letters.forEach((letter) => {
    if (Math.random() < 0.3) {
      letter.classList.add("random-flicker");
    }
  });
}
setInterval(applyRandomFlicker, 1000);