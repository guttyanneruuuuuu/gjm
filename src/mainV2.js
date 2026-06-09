/**
 * Inverse Hunter - Main Entry Point V2
 * Enhanced 3D Action RPG with advanced systems
 */

import GameEngineV2 from './core/GameEngineV2.js';
import { PlayerV2 } from './game/PlayerV2.js';
import { WorldBuilderV2 } from './world/WorldBuilderV2.js';
import { EnemySpawnerV2 } from './game/EnemySpawnerV2.js';
import { HUDSystem } from './ui/HUDSystem.js';
import './styles.css';

// Initialize game
const gameContainer = document.getElementById('game');
const engine = new GameEngineV2(gameContainer);

// Create world
const worldBuilder = new WorldBuilderV2(engine);
worldBuilder.buildStage(0); // Start with Grassland

// Create player
const player = new PlayerV2(engine, { x: 0, y: 5, z: 0 });

// Create enemy spawner
const spawner = new EnemySpawnerV2(engine.getScene(), player, player.getCombatSystem());

// Create HUD
const hud = new HUDSystem();

// Game state
let gameRunning = true;
let currentWave = 0;
let waveStarted = false;

// Setup update loop
engine.onUpdate((dt) => {
  // Update player
  player.update(dt);

  // Update enemy spawner
  spawner.update(dt);

  // Update camera to follow player with lock-on support
  const lockedTarget = player.getCombatSystem().lockedTarget;
  engine.getCamera().update(
    player.getPosition(),
    player.yaw,
    player.pitch,
    dt,
    lockedTarget
  );

  // Update rim light to follow player
  const rimLight = engine.rimLight;
  rimLight.position.copy(player.getPosition());
  rimLight.position.y += 3;

  // Update HUD
  const stats = player.getStats();
  const waveStatus = spawner.getWaveStatus();
  hud.update(
    {
      hp: stats.hp,
      maxHp: stats.maxHp,
      stamina: stats.stamina,
      maxStamina: stats.maxStamina,
      instinct: stats.instinct,
      maxInstinct: stats.maxInstinct,
      combo: stats.combo,
      formName: stats.formName,
      formEmoji: player.getCurrentForm().emoji,
    },
    waveStatus,
    lockedTarget !== null
  );

  // Auto-start waves
  if (!waveStarted && currentWave < spawner.waves.length) {
    if (currentWave === 0 || !spawner.waveActive) {
      spawner.startWave(currentWave);
      waveStarted = true;
      hud.showMessage(`${spawner.waves[currentWave].name}`, 2);
    }
  }

  // Advance to next wave
  if (waveStarted && !spawner.waveActive && spawner.spawnIndex >= spawner.getTotalEnemiesInWave()) {
    currentWave++;
    waveStarted = false;

    if (currentWave < spawner.waves.length) {
      setTimeout(() => {
        hud.showMessage(`Wave ${currentWave + 1} incoming...`, 2);
      }, 1000);
    } else {
      hud.showMessage('All waves defeated! Victory!', 3);
      gameRunning = false;
    }
  }

  // Check game over
  if (player.hp <= 0) {
    gameRunning = false;
    hud.showMessage('Game Over', 3);
  }
});

// Start game
engine.start();

// Handle visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    engine.setState('paused');
  } else {
    engine.setState('playing');
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  engine.dispose();
  hud.dispose();
  spawner.dispose();
  player.dispose();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    // Restart
    location.reload();
  }

  if (e.key === 'Escape') {
    // Pause menu (would be implemented later)
    console.log('Pause menu');
  }

  // Unlock all forms for testing
  if (e.key === 'u' || e.key === 'U') {
    player.getTransformationSystem().unlockAllForms();
    hud.showMessage('All forms unlocked!', 1);
  }
});

console.log('Inverse Hunter V2 initialized');
console.log('Controls:');
console.log('  WASD/Arrows - Move');
console.log('  Mouse - Look around (click to lock)');
console.log('  Left Click - Attack');
console.log('  Right Click - Skill');
console.log('  Space - Jump');
console.log('  Shift - Sprint');
console.log('  E - Dash');
console.log('  Q - Lock-on');
console.log('  1-5 - Change form');
console.log('  R - Restart');
console.log('  U - Unlock all forms (testing)');
