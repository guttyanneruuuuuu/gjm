/**
 * Inverse Hunter - Main Entry Point
 * 食物連鎖を逆走する3DアクションRPG
 */

import GameEngine from './core/GameEngine.js';
import { Player } from './game/Player.js';
import { WorldBuilder } from './world/WorldBuilder.js';
import './styles.css';

// Initialize game
const gameContainer = document.getElementById('game');
const engine = new GameEngine(gameContainer);

// Create world
const worldBuilder = new WorldBuilder(engine);
worldBuilder.buildStage(0); // Start with stage 0

// Create player
const player = new Player(engine, { x: 0, y: 5, z: 0 });

// Setup update loop
engine.onUpdate((dt) => {
  // Update player
  player.update(dt);

  // Update camera to follow player
  const input = engine.getInput();
  engine.getCamera().update(
    player.getPosition(),
    input.yaw,
    input.pitch,
    dt
  );

  // Update rim light to follow player
  const rimLight = engine.rimLight;
  rimLight.position.copy(player.getPosition());
  rimLight.position.y += 2;
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
});

console.log('Inverse Hunter initialized');
