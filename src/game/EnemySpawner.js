/**
 * Enemy Spawner - Manages enemy spawning and waves
 */

import { Enemy } from './Enemy.js';
import { rand, randInt } from '../core/utils.js';

export class EnemySpawner {
  constructor(engine, player, combatSystem) {
    this.engine = engine;
    this.player = player;
    this.combatSystem = combatSystem;
    this.enemies = [];
    this.spawnPoints = [];
    this.waveIndex = 0;
    this.enemiesDefeated = 0;
    this.spawnRadius = 30;
    this.maxEnemies = 10;
    this.spawnInterval = 3;
    this.spawnTimer = 0;
    this.waveActive = false;
  }

  /**
   * Setup spawn points for a stage
   */
  setupSpawnPoints(stageIndex) {
    this.spawnPoints = [];
    const spawnCount = 6;

    for (let i = 0; i < spawnCount; i++) {
      const angle = (Math.PI * 2 * i) / spawnCount;
      const distance = this.spawnRadius;
      const x = this.player.position.x + Math.cos(angle) * distance;
      const z = this.player.position.z + Math.sin(angle) * distance;

      this.spawnPoints.push({ x, z });
    }
  }

  /**
   * Start a wave
   */
  startWave(waveIndex) {
    this.waveIndex = waveIndex;
    this.waveActive = true;
    this.spawnTimer = 0;
    this.enemiesDefeated = 0;

    console.log(`Wave ${waveIndex + 1} started`);
  }

  /**
   * Get enemies for this wave
   */
  getWaveEnemies(waveIndex) {
    const baseCount = 2 + waveIndex;
    const types = ['fox', 'boar', 'deer', 'snake'];

    const enemies = [];
    for (let i = 0; i < baseCount; i++) {
      enemies.push({
        type: types[i % types.length],
        count: 1 + Math.floor(i / types.length),
      });
    }

    return enemies;
  }

  /**
   * Update spawner each frame
   */
  update(dt) {
    if (!this.waveActive) return;

    this.spawnTimer -= dt;

    // Spawn enemies
    if (this.spawnTimer <= 0 && this.enemies.length < this.maxEnemies) {
      this.spawnEnemy();
      this.spawnTimer = this.spawnInterval;
    }

    // Update enemies
    for (let enemy of this.enemies) {
      if (enemy.active) {
        // Set player as target if in range
        if (!enemy.target && enemy.position.distanceTo(this.player.position) < enemy.detectionRange) {
          enemy.setTarget(this.player);
        }
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.active);

    // Check if wave is complete
    if (this.enemies.length === 0 && this.spawnTimer > this.spawnInterval * 2) {
      this.waveActive = false;
      console.log(`Wave ${this.waveIndex + 1} complete`);
    }
  }

  /**
   * Spawn a single enemy
   */
  spawnEnemy() {
    if (this.spawnPoints.length === 0) return;

    const spawnPoint = this.spawnPoints[randInt(0, this.spawnPoints.length - 1)];
    const waveEnemies = this.getWaveEnemies(this.waveIndex);
    const enemyType = waveEnemies[randInt(0, waveEnemies.length - 1)].type;

    const enemy = new Enemy(this.engine, {
      x: spawnPoint.x + rand(-2, 2),
      y: 5,
      z: spawnPoint.z + rand(-2, 2),
    }, enemyType);

    // Scale enemy based on wave
    const scale = 1 + this.waveIndex * 0.1;
    enemy.maxHp = Math.round(enemy.maxHp * scale);
    enemy.hp = enemy.maxHp;
    enemy.attackDamage = Math.round(enemy.attackDamage * scale);
    enemy.speed *= scale;

    this.enemies.push(enemy);
    this.combatSystem.registerEnemy(enemy);

    console.log(`Spawned ${enemyType} (Wave ${this.waveIndex + 1})`);
  }

  /**
   * Spawn multiple enemies
   */
  spawnMultiple(count, type) {
    for (let i = 0; i < count; i++) {
      const spawnPoint = this.spawnPoints[randInt(0, this.spawnPoints.length - 1)];
      const enemy = new Enemy(this.engine, {
        x: spawnPoint.x + rand(-2, 2),
        y: 5,
        z: spawnPoint.z + rand(-2, 2),
      }, type);

      this.enemies.push(enemy);
      this.combatSystem.registerEnemy(enemy);
    }
  }

  /**
   * Get active enemies
   */
  getEnemies() {
    return this.enemies.filter(e => e.active);
  }

  /**
   * Get wave info
   */
  getWaveInfo() {
    return {
      waveIndex: this.waveIndex,
      active: this.waveActive,
      enemyCount: this.getEnemies().length,
      maxEnemies: this.maxEnemies,
      defeated: this.enemiesDefeated,
    };
  }

  /**
   * Stop current wave
   */
  stopWave() {
    this.waveActive = false;
    for (let enemy of this.enemies) {
      if (enemy.active) {
        enemy.die();
      }
    }
  }

  /**
   * Clear all enemies
   */
  clear() {
    for (let enemy of this.enemies) {
      if (enemy.active) {
        enemy.dispose();
      }
    }
    this.enemies = [];
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.clear();
  }
}

export default EnemySpawner;
