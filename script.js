// script.js - 携帯対応版クイズバトルRPG

// 入力状態
const keys = {};
const vKeys = { up: false, down: false, left: false, right: false };

// ゲーム状態
const gameState = {
  player: { x: 200, y: 200, speed: 4 },
  enemies: [],
  isPaused: false,
  level: 1,
  exp: 0,
  maxExp: 100,
  hp: 3,
  maxHp: 3
};

// BGM要素保持
let bgmField;
let seCorrect, seWrong, seLevelup;

// 初期化
document.addEventListener("DOMContentLoaded", () => {
  initializeGame();
  setupControls();
  spawnEnemies();
  updateUI();
  requestAnimationFrame(gameLoop);
});

// ゲーム初期化
function initializeGame() {
  const playerEl = document.getElementById("player");
  const areaEl = document.getElementById("game-area");

  // プレイヤー画像設定
  playerEl.style.backgroundImage = "url('./images/hero.png')";
  playerEl.style.backgroundSize = "contain";
  playerEl.style.backgroundRepeat = "no-repeat";
  playerEl.style.backgroundPosition = "center";

  // 背景画像設定
  areaEl.style.backgroundImage = "url('./images/fi-rudo.png')";
  areaEl.style.backgroundSize = "cover";
  areaEl.style.backgroundRepeat = "repeat";

  // オーディオ要素取得
  bgmField = document.getElementById("bgm-field");
  seCorrect = document.getElementById("se-correct");
  seWrong = document.getElementById("se-wrong");
  seLevelup = document.getElementById("se-levelup");

  // プレイヤー初期位置設定
  // 画面サイズが小さい場合でもプレイヤーが画面外に出ないよう補正
  gameState.player.x = Math.max(0, Math.min(areaEl.clientWidth - 48, gameState.player.x));
  gameState.player.y = Math.max(0, Math.min(areaEl.clientHeight - 48, gameState.player.y));
  updatePlayerPosition();
}

// 操作設定
function setupControls() {
  // キーボード操作
  document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    startBGM();
    e.preventDefault();
  });

  document.addEventListener("keyup", (e) => {
    delete keys[e.key];
    e.preventDefault();
  });

  // 仮想コントローラー設定
  const controlButtons = [
    { id: "btn-up", direction: "up" },
    { id: "btn-down", direction: "down" },
    { id: "btn-left", direction: "left" },
    { id: "btn-right", direction: "right" }
  ];

  controlButtons.forEach(({ id, direction }) => {
    const button = document.getElementById(id);
    
    // タッチスタート
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      vKeys[direction] = true;
      startBGM();
    }, { passive: false });

    // マウスダウン（PCでのテスト用）
    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      vKeys[direction] = true;
      startBGM();
    });

    // タッチエンド
    button.addEventListener("touchend", (e) => {
      e.preventDefault();
      vKeys[direction] = false;
    }, { passive: false });

    // タッチキャンセル
    button.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      vKeys[direction] = false;
    }, { passive: false });

    // マウスアップ
    button.addEventListener("mouseup", (e) => {
      e.preventDefault();
      vKeys[direction] = false;
    });

    // マウスリーブ
    button.addEventListener("mouseleave", (e) => {
      e.preventDefault();
      vKeys[direction] = false;
    });
  });

  // タッチ操作の改善
  document.addEventListener("touchmove", (e) => {
    e.preventDefault();
  }, { passive: false });
}

// BGM再生開始
function startBGM() {
  if (bgmField && bgmField.paused) {
    bgmField.volume = 0.3;
    bgmField.play().catch(() => {});
  }
}

// プレイヤー移動
function moveHero(dx, dy) {
  if (gameState.isPaused) return;

  const area = document.getElementById("game-area");
  const playerSize = 48;

  // 新しい位置を計算
  gameState.player.x += dx * gameState.player.speed;
  gameState.player.y += dy * gameState.player.speed;

  // 画面境界チェック
  gameState.player.x = Math.max(0, Math.min(area.clientWidth - playerSize, gameState.player.x));
  gameState.player.y = Math.max(0, Math.min(area.clientHeight - playerSize, gameState.player.y));

  // 位置更新
  updatePlayerPosition();
}

// プレイヤー位置更新
function updatePlayerPosition() {
  const playerEl = document.getElementById("player");
  playerEl.style.left = gameState.player.x + "px";
  playerEl.style.top = gameState.player.y + "px";
}

// 敵生成
function spawnEnemies() {
  const area = document.getElementById("game-area");
  
  // 既存の敵をクリア
  gameState.enemies.forEach(enemy => {
    if (enemy.el && enemy.el.parentNode) {
      enemy.el.remove();
    }
  });
  gameState.enemies = [];

  // 新しい敵を生成
  for (let i = 1; i <= 10; i++) {
    const enemyEl = document.createElement("div");
    enemyEl.className = "enemy";
    enemyEl.style.backgroundImage = `url('./images/enemy${i}.png')`;
    enemyEl.style.backgroundSize = "contain";
    enemyEl.style.backgroundRepeat = "no-repeat";
    enemyEl.style.backgroundPosition = "center";

    // ランダム位置（プレイヤーから離れた場所）
    let x, y;
    let attempts = 0;
    do {
      x = Math.random() * (area.clientWidth - 80);
      y = Math.random() * (area.clientHeight - 80);
      attempts++;
      if (attempts > 100) {
        // 画面が極端に狭い場合はループを抜ける
        break;
      }
    } while (
      Math.hypot(x - gameState.player.x, y - gameState.player.y) < 150
    );

    enemyEl.style.left = x + "px";
    enemyEl.style.top = y + "px";
    area.appendChild(enemyEl);

    const enemy = {
      el: enemyEl,
      x: x,
      y: y,
      speed: 1 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2,
      type: i
    };

    gameState.enemies.push(enemy);
  }
}

// 敵移動
function moveEnemies() {
  const area = document.getElementById("game-area");
  const enemySize = 80;

  gameState.enemies.forEach(enemy => {
    // 移動計算
    enemy.x += Math.cos(enemy.angle) * enemy.speed;
    enemy.y += Math.sin(enemy.angle) * enemy.speed;

    // 壁との衝突判定
    if (enemy.x <= 0 || enemy.x >= area.clientWidth - enemySize) {
      enemy.angle = Math.PI - enemy.angle;
    }
    if (enemy.y <= 0 || enemy.y >= area.clientHeight - enemySize) {
      enemy.angle = -enemy.angle;
    }

    // 境界内に収める
    enemy.x = Math.max(0, Math.min(area.clientWidth - enemySize, enemy.x));
    enemy.y = Math.max(0, Math.min(area.clientHeight - enemySize, enemy.y));

    // DOM更新
    enemy.el.style.left = enemy.x + "px";
    enemy.el.style.top = enemy.y + "px";
  });
}

// UI更新
function updateUI() {
  // HPハート表示
  const heartsContainer = document.getElementById("hp-hearts");
  heartsContainer.innerHTML = "";
  for (let i = 0; i < gameState.maxHp; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = i < gameState.hp ? "♥" : "♡";
    heartsContainer.appendChild(heart);
  }

  // 経験値バー
  const expFill = document.getElementById("exp-fill");
  const expText = document.getElementById("exp-text");
  const expPercent = (gameState.exp / gameState.maxExp) * 100;
  expFill.style.width = expPercent + "%";
  expText.textContent = `${gameState.exp}/${gameState.maxExp}`;

  // レベル表示
  const levelDisplay = document.getElementById("level-display");
  levelDisplay.textContent = `Lv.${gameState.level}`;
}

// レベルアップ処理
function levelUp() {
  gameState.level++;
  gameState.exp = 0;
  gameState.maxExp = Math.floor(gameState.maxExp * 1.2);
  gameState.maxHp++;
  gameState.hp = gameState.maxHp;
  
  if (seLevelup) {
    seLevelup.volume = 0.5;
    seLevelup.play().catch(() => {});
  }
  
  updateUI();
}

// メインゲームループ
function gameLoop() {
  // 入力処理
  let dx = 0;
  let dy = 0;

  // キーボード入力
  if (keys.ArrowRight || keys.d || keys.D) dx += 1;
  if (keys.ArrowLeft || keys.a || keys.A) dx -= 1;
  if (keys.ArrowDown || keys.s || keys.S) dy += 1;
  if (keys.ArrowUp || keys.w || keys.W) dy -= 1;

  // 仮想コントローラー入力
  if (vKeys.right) dx += 1;
  if (vKeys.left) dx -= 1;
  if (vKeys.down) dy += 1;
  if (vKeys.up) dy -= 1;

  // 移動処理
  if (dx !== 0 || dy !== 0) {
    moveHero(dx, dy);
  }

  // 敵移動
  moveEnemies();

  // 次のフレームをリクエスト
  requestAnimationFrame(gameLoop);
}

// 画面サイズ変更時の処理
window.addEventListener("resize", () => {
  // プレイヤー位置を画面内に調整
  const area = document.getElementById("game-area");
  const playerSize = 48;
  gameState.player.x = Math.max(0, Math.min(area.clientWidth - playerSize, gameState.player.x));
  gameState.player.y = Math.max(0, Math.min(area.clientHeight - playerSize, gameState.player.y));
  updatePlayerPosition();
});

// タッチ操作の無効化（スクロール防止）
document.addEventListener("touchstart", (e) => {
  if (e.target.closest("#controller")) {
    return; // コントローラー部分は除外
  }
  e.preventDefault();
}, { passive: false });

document.addEventListener("touchmove", (e) => {
  e.preventDefault();
}, { passive: false });
