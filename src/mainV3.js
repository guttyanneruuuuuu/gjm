/**
 * Main Entry Point V3 - Complete game initialization
 * Inverse Hunter - 食物連鎖を逆走する3DアクションRPG
 */

import GameEngineV3 from './core/GameEngineV3.js';
import InputManagerV3 from './input/InputManagerV3.js';
import MobileControlsV3 from './input/MobileControlsV3.js';
import { PlayerV3 } from './game/PlayerV3.js';
import { WorldBuilderV3 } from './world/WorldBuilderV3.js';
import { HUDSystemV3 } from './ui/HUDSystemV3.js';
import { GAME_BALANCE } from './config/GameBalanceV3.js';
import './styles.css';

// Initialize game engine
const gameContainer = document.getElementById('game');
const engine = new GameEngineV3(gameContainer);

// Setup input
const input = new InputManagerV3(engine.getIsMobile());
engine.input = input;

// Setup mobile controls if on mobile
let mobileControls = null;
if (engine.getIsMobile()) {
  mobileControls = new MobileControlsV3(input, engine);
}

// Create world
const worldBuilder = new WorldBuilderV3(engine);
worldBuilder.buildStage(0);

// Create player
const player = new PlayerV3(engine, { x: 0, y: 5, z: 0 });
engine.player = player;

// Create HUD
const hud = new HUDSystemV3(engine);

// Setup game loop
let gameState = 'playing';
let waveNumber = 0;
let enemiesDefeated = 0;

engine.onUpdate((dt) => {
  // Update input
  input.update();

  // Update HUD
  hud.update(player);

  // Check game state
  if (gameState === 'playing') {
    // Check if all enemies defeated
    const enemies = engine.getEnemies();
    if (enemies.length === 0 && waveNumber < 3) {
      // Advance to next wave
      waveNumber++;
      if (waveNumber < 3) {
        worldBuilder.buildStage(waveNumber);
      } else {
        gameState = 'victory';
        engine.setState('victory');
      }
    }

    // Check if player is dead
    if (player.hp <= 0) {
      gameState = 'gameOver';
      engine.setState('gameOver');
    }
  }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (gameState === 'playing') {
      gameState = 'paused';
      engine.setState('paused');
    } else if (gameState === 'paused') {
      gameState = 'playing';
      engine.setState('playing');
    }
  }

  if (e.key === 'r' || e.key === 'R') {
    // Restart game
    location.reload();
  }

  if (e.key === 'u' || e.key === 'U') {
    // Unlock all forms
    player.unlockForm('mouse');
    player.unlockForm('fox');
    player.unlockForm('snake');
    player.unlockForm('eagle');
    player.unlockForm('wolf');
    console.log('All forms unlocked');
  }

  if (e.key === 'd' || e.key === 'D') {
    // Toggle difficulty
    const difficulties = ['easy', 'normal', 'hard', 'insane'];
    const currentIndex = difficulties.indexOf(GAME_BALANCE.currentDifficulty);
    const nextDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
    GAME_BALANCE.setDifficulty(nextDifficulty);
  }
});

// Start game
engine.start();

console.log('Inverse Hunter V3 started');
console.log(`Mobile: ${engine.getIsMobile()}, Landscape: ${engine.getIsLandscape()}`);
console.log('Controls: WASD/Arrows to move, Mouse to look, Click to attack, Space to jump, Shift to sprint');
console.log('Keyboard: 1-5 to switch forms, E/Q to cycle forms, L to lock-on, Shift+Space to dash');
console.log('Debug: P to pause, R to restart, U to unlock all forms, D to change difficulty');

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  engine.dispose();
  if (mobileControls) mobileControls.dispose();
  hud.dispose();
});
