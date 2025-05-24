let quizData = {};
let genreList = [];

const aiTypes = {
  enemy1: 'chase',
  enemy2: 'flee',
  enemy3: 'dash',
  enemy4: 'random',
  enemy5: 'bounce',
  enemy6: 'random',
  enemy7: 'random',
  enemy8: 'random',
  enemy9: 'random',
  enemy10: 'random'
};

const enemyNames = {
  enemy1: "スライムン",
  enemy2: "コウモリン",
  enemy3: "ドクロベエ",
  enemy4: "ワンコソーシャル",
  enemy5: "うでだけん",
  enemy6: "モクモク",
  enemy7: "ファイヤ坊",
  enemy8: "バウンサー",
  enemy9: "タマシイくん",
  enemy10: "ばくだんボー"
};

const gameState = {
  level: 1,
  hp: 3,
  maxHP: 3,
  exp: 0,
  expToNext: 100,
  defeated: 0,
  player: { x: 200, y: 200, speed: 4 },
  enemies: [],
  currentEnemy: null,
  isPaused: false,
  isBossBattle: false,
  score: 0,
  quizHistory: {}
};

const playerEl = document.getElementById("player");
const heartsEl = document.getElementById("hp-hearts");
const expFill = document.getElementById("exp-fill");
const expText = document.getElementById("exp-text");
const levelDisplay = document.getElementById("level-display");
const gameArea = document.getElementById("game-area");
const quizContainer = document.getElementById("quiz-container");
const genreName = document.getElementById("quiz-genre-name");
const questionText = document.getElementById("question-text");
const messageBox = document.getElementById("message-box");
const gameOverEl = document.getElementById("game-over");
const gameClearEl = document.getElementById("game-clear");
const finalScore = document.getElementById("final-score");
const clearScore = document.getElementById("clear-score");
const bestScore = document.getElementById("best-score");

const bgmField = document.getElementById("bgm-field");
const bgmBattle = document.getElementById("bgm-battle");
const bgmMaou = document.getElementById("bgm-maou");
const seCorrect = document.getElementById("se-correct");
const seWrong = document.getElementById("se-wrong");
const seLevelup = document.getElementById("se-levelup");

const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => delete keys[e.key]);

function setupTouchController() {
  const mapping = {
    "btn-up": "ArrowUp",
    "btn-down": "ArrowDown",
    "btn-left": "ArrowLeft",
    "btn-right": "ArrowRight"
  };

  Object.entries(mapping).forEach(([btnId, key]) => {
    const btn = document.getElementById(btnId);
    btn.addEventListener("touchstart", e => {
      e.preventDefault();
      keys[key] = true;
    });
    btn.addEventListener("touchend", e => {
      e.preventDefault();
      delete keys[key];
    });
  });
}

function updateHP() {
  heartsEl.innerHTML = "";
  for (let i = 0; i < gameState.hp; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = "❤️";
    heartsEl.appendChild(heart);
  }
}

function updateEXP() {
  const percent = (gameState.exp / gameState.expToNext) * 100;
  expFill.style.width = `${percent}%`;
  expText.textContent = `${gameState.exp}/${gameState.expToNext}`;
  levelDisplay.textContent = `Lv.${gameState.level}`;
}

function playBGM(bgm) {
  [bgmField, bgmBattle, bgmMaou].forEach(b => { b.pause(); b.currentTime = 0; });
  bgm.play();
}

function createEnemy(index) {
  const id = "enemy" + (index + 1);
  const ai = aiTypes[id] || 'random';

  const enemy = document.createElement("div");
  enemy.className = "enemy";
  enemy.style.backgroundImage = `url('./images/${id}.png')`;

  const x = Math.random() * (gameArea.clientWidth - 67);
  const y = Math.random() * (gameArea.clientHeight - 67);
  enemy.style.left = x + "px";
  enemy.style.top = y + "px";

  gameArea.appendChild(enemy);

  gameState.enemies.push({
    el: enemy,
    x,
    y,
    speed: 1 + Math.random(),
    angle: Math.random() * Math.PI * 2,
    genre: genreList[index],
    ai,
    id
  });
}

function spawnEnemies() {
  gameState.enemies = [];
  for (let i = 0; i < 10; i++) createEnemy(i);
}

function moveEnemies() {
  if (gameState.isPaused) return;

  gameState.enemies.forEach(enemy => {
    let speed = enemy.speed;
    if (gameState.level >= 6) speed *= 1.1;

    switch (enemy.ai) {
      case 'chase': {
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        enemy.x += Math.cos(angle) * speed;
        enemy.y += Math.sin(angle) * speed;
        break;
      }
      case 'flee': {
        const dx = enemy.x - gameState.player.x;
        const dy = enemy.y - gameState.player.y;
        const angle = Math.atan2(dy, dx);
        enemy.x += Math.cos(angle) * speed;
        enemy.y += Math.sin(angle) * speed;
        break;
      }
      case 'dash': {
        if (!enemy.fixedAngle) enemy.fixedAngle = Math.random() * Math.PI * 2;
        enemy.x += Math.cos(enemy.fixedAngle) * speed * 1.5;
        enemy.y += Math.sin(enemy.fixedAngle) * speed * 1.5;
        break;
      }
      case 'wait': {
        if (Math.random() < 0.02) {
          const angle = Math.random() * Math.PI * 2;
          enemy.x += Math.cos(angle) * speed;
          enemy.y += Math.sin(angle) * speed;
        }
        break;
      }
      case 'bounce': {
        if (!enemy.angle) enemy.angle = Math.random() * Math.PI * 2;
        enemy.x += Math.cos(enemy.angle) * speed;
        enemy.y += Math.sin(enemy.angle) * speed;

        if (enemy.x <= 0 || enemy.x >= gameArea.clientWidth - 67)
          enemy.angle = Math.PI - enemy.angle + (Math.random() - 0.5);
        if (enemy.y <= 0 || enemy.y >= gameArea.clientHeight - 67)
          enemy.angle = -enemy.angle + (Math.random() - 0.5);
        break;
      }
      default: {
        if (Math.random() < 0.05) enemy.angle = Math.random() * Math.PI * 2;
        enemy.x += Math.cos(enemy.angle) * speed;
        enemy.y += Math.sin(enemy.angle) * speed;
      }
    }

    enemy.x = Math.max(0, Math.min(gameArea.clientWidth - 67, enemy.x));
    enemy.y = Math.max(0, Math.min(gameArea.clientHeight - 67, enemy.y));
    enemy.el.style.left = enemy.x + "px";
    enemy.el.style.top = enemy.y + "px";
  });

  if (gameState.enemies.length === 0 && !gameState.isBossBattle) {
    spawnEnemies();
  }
}

function movePlayer() {
  if (gameState.isPaused) return;
  const speed = gameState.player.speed;
  if (keys["ArrowUp"]) gameState.player.y -= speed;
  if (keys["ArrowDown"]) gameState.player.y += speed;
  if (keys["ArrowLeft"]) gameState.player.x -= speed;
  if (keys["ArrowRight"]) gameState.player.x += speed;

  gameState.player.x = Math.max(0, Math.min(gameArea.clientWidth - 48, gameState.player.x));
  gameState.player.y = Math.max(0, Math.min(gameArea.clientHeight - 48, gameState.player.y));

  playerEl.style.left = gameState.player.x + "px";
  playerEl.style.top = gameState.player.y + "px";
}

function checkCollision() {
  if (gameState.isPaused || gameState.isBossBattle) return;
  const px = gameState.player.x, py = gameState.player.y, pw = 48, ph = 48;

  for (const enemy of gameState.enemies) {
    const ex = enemy.x, ey = enemy.y, ew = 67, eh = 67;
    if (px < ex + ew && px + pw > ex && py < ey + eh && py + ph > ey) {
      gameState.currentEnemy = enemy;
      gameState.isPaused = true;

      const name = enemyNames[enemy.id] || "敵";
      showMessage(`${name} が現れた！`);

      playBGM(bgmBattle);
      setTimeout(() => showQuiz(enemy.genre), 800);
      break;
    }
  }
}

function showQuiz(genre) {
  genreName.textContent = genre;
  const pool = quizData[genre];
  if (!gameState.quizHistory[genre]) gameState.quizHistory[genre] = [...pool];
  if (gameState.quizHistory[genre].length === 0) gameState.quizHistory[genre] = [...pool];
  const index = Math.floor(Math.random() * gameState.quizHistory[genre].length);
  const quiz = gameState.quizHistory[genre].splice(index, 1)[0];

  questionText.textContent = quiz.question;
  quizContainer.classList.remove("hidden");
  quiz.choices.forEach((choice, i) => {
    const btn = document.getElementById(`choice-${i}`);
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(i, quiz.correctAnswer, genre);
  });
}

function checkAnswer(choice, correct, genre) {
  quizContainer.classList.add("hidden");
  const enemy = gameState.currentEnemy;
  gameState.currentEnemy = null;

  if (choice === correct) {
    seCorrect.play();
    enemy.el.remove();
    gameState.enemies = gameState.enemies.filter(e => e !== enemy);
    gameState.defeated++;
    gameState.score += 100;
    gainEXP(25);
  } else {
    seWrong.play();
    gameState.hp -= gameState.isBossBattle ? 3 : 1;
    if (gameState.hp <= 0) return gameOver();
  }

  updateHP();
  gameState.isPaused = false;
  playBGM(bgmField);
}

function gainEXP(amount) {
  gameState.exp += amount;
  if (gameState.exp >= gameState.expToNext) {
    gameState.exp -= gameState.expToNext;
    levelUp();
  }
  updateEXP();
  checkBossSpawn();
}

function levelUp() {
  gameState.level++;
  gameState.expToNext += 50;
  seLevelup.play();
  showMessage(`レベル${gameState.level}になった！`);
  if (gameState.level === 2 || gameState.level === 3) {
    gameState.hp++;
    gameState.maxHP++;
  }
  updateHP();
}

function checkBossSpawn() {
  if (gameState.level === 10 && !gameState.isBossBattle) {
    gameState.isBossBattle = true;
    spawnBoss();
  }
}

function spawnBoss() {
  const boss = document.createElement("div");
  boss.className = "boss";
  boss.style.backgroundImage = "url('./images/maou.png')";
  boss.style.left = "50%";
  boss.style.top = "30%";
  boss.style.transform = "translate(-50%, 0)";
  gameArea.appendChild(boss);
  playBGM(bgmMaou);
  showMessage("魔王があらわれた…！");
  setTimeout(() => {
    showQuiz("小4わり算");
  }, 1500);
}

function showMessage(text) {
  messageBox.textContent = text;
  messageBox.classList.remove("hidden");
  setTimeout(() => {
    messageBox.classList.add("hidden");
  }, 1500);
}

function gameOver() {
  gameState.isPaused = true;
  gameOverEl.classList.remove("hidden");
  finalScore.textContent = gameState.score;
}

function gameClear() {
  gameState.isPaused = true;
  gameClearEl.classList.remove("hidden");
  clearScore.textContent = gameState.score;
  const last = parseInt(localStorage.getItem("bestScore") || "0");
  if (gameState.score > last) {
    localStorage.setItem("bestScore", gameState.score);
  }
  bestScore.textContent = localStorage.getItem("bestScore");
}

function gameLoop() {
  if (!gameState.isPaused) {
    movePlayer();
    moveEnemies();
    checkCollision();
  }
  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameState.hp = 3;
  gameState.level = 1;
  gameState.exp = 0;
  gameState.expToNext = 100;
  gameState.score = 0;
  gameState.isPaused = false;
  gameState.isBossBattle = false;
  gameState.quizHistory = {};
  updateHP();
  updateEXP();
  playerEl.style.left = gameState.player.x + "px";
  playerEl.style.top = gameState.player.y + "px";

  spawnEnemies();
  playBGM(bgmField);
  requestAnimationFrame(gameLoop);
}

window.addEventListener("load", () => {
  fetch("quizData.json")
    .then(res => res.json())
    .then(data => {
      quizData = data;
      genreList = Object.keys(quizData);
      setupTouchController(); // ← スマホ操作追加
      startGame();
    })
    .catch(err => console.error("クイズデータの読み込み失敗:", err));
});
