/**
 * Enemy Spawner V2 - Advanced wave management and enemy spawning
 */

import * as THREE from 'three';
import { EnemyV2 } from './EnemyV2.js';

export class EnemySpawnerV2 {
  constructor(scene, player, combatSystem) {
    this.scene = scene;
    this.player = player;
    this.combatSystem = combatSystem;

    this.enemies = [];
    this.waveIndex = 0;
    this.waveActive = false;
    this.waveTimer = 0;
    this.waveDelay = 0.5;
    this.spawnIndex = 0;

    // Wave configuration
    this.waves = this.generateWaves();
  }

  /**
   * Generate wave configurations
   */
  generateWaves() {
    return [
      {
        name: 'Wave 1: Weak Enemies',
        enemies: [
          { type: 'basic', count: 3, level: 1 },
        ],
        delay: 2,
      },
      {
        name: 'Wave 2: Mixed',
        enemies: [
          { type: 'basic', count: 4, level: 1 },
          { type: 'fast', count: 2, level: 1 },
        ],
        delay: 1.5,
      },
      {
        name: 'Wave 3: Heavy',
        enemies: [
          { type: 'heavy', count: 2, level: 2 },
          { type: 'basic', count: 3, level: 1 },
        ],
        delay: 1.5,
      },
      {
        name: 'Wave 4: Ranged',
        enemies: [
          { type: 'ranged', count: 3, level: 2 },
          { type: 'fast', count: 4, level: 1 },
        ],
        delay: 1,
      },
      {
        name: 'Wave 5: Boss',
        enemies: [
          { type: 'heavy', count: 1, level: 5 },
          { type: 'basic', count: 2, level: 2 },
        ],
        delay: 2,
      },
    ];
  }

  /**
   * Start a wave
   */
  startWave(waveIndex = 0) {
    if (waveIndex >= this.waves.length) {
      console.log('All waves completed!');
      return;
    }

    this.waveIndex = waveIndex;
    this.waveActive = true;
    this.waveTimer = 0;
    this.spawnIndex = 0;

    console.log(`Starting ${this.waves[waveIndex].name}`);
  }

  /**
   * Update spawner
   */
  update(dt) {
    if (!this.waveActive) return;

    const wave = this.waves[this.waveIndex];
    this.waveTimer += dt;

    // Spawn enemies
    if (this.spawnIndex < this.getTotalEnemiesInWave()) {
      if (this.waveTimer >= wave.delay) {
        this.spawnNextEnemy();
        this.waveTimer = 0;
      }
    }

    // Update all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (!enemy.active) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(dt, this.player, this.player.engine.getParticles());
    }

    // Check if wave is complete
    if (this.enemies.length === 0 && this.spawnIndex >= this.getTotalEnemiesInWave()) {
      this.waveActive = false;
      console.log(`Wave ${this.waveIndex + 1} completed!`);
    }
  }

  /**
   * Get total enemies in current wave
   */
  getTotalEnemiesInWave() {
    const wave = this.waves[this.waveIndex];
    return wave.enemies.reduce((sum, group) => sum + group.count, 0);
  }

  /**
   * Spawn next enemy in wave
   */
  spawnNextEnemy() {
    const wave = this.waves[this.waveIndex];
    let currentCount = 0;

    for (let group of wave.enemies) {
      if (this.spawnIndex < currentCount + group.count) {
        // Spawn this type
        const spawnPos = this.getSpawnPosition();
        const enemy = new EnemyV2(this.scene, spawnPos, group.type, group.level);

        this.enemies.push(enemy);
        this.combatSystem.registerEnemy(enemy);

        this.spawnIndex++;
        return;
      }

      currentCount += group.count;
    }
  }

  /**
   * Get spawn position around player
   */
  getSpawnPosition() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 10;
    const height = Math.random() * 5 + 2;

    const spawnPos = this.player.position.clone();
    spawnPos.x += Math.cos(angle) * distance;
    spawnPos.z += Math.sin(angle) * distance;
    spawnPos.y = height;

    return spawnPos;
  }

  /**
   * Get active enemies
   */
  getActiveEnemies() {
    return this.enemies.filter(e => e.active);
  }

  /**
   * Get wave status
   */
  getWaveStatus() {
    return {
      waveIndex: this.waveIndex + 1,
      totalWaves: this.waves.length,
      waveActive: this.waveActive,
      enemiesAlive: this.enemies.filter(e => e.active).length,
      waveName: this.waves[this.waveIndex].name,
    };
  }

  /**
   * Spawn boss
   */
  spawnBoss(type = 'heavy', level = 5) {
    const spawnPos = this.player.position.clone();
    spawnPos.z += 15;
    spawnPos.y = 5;

    const boss = new EnemyV2(this.scene, spawnPos, type, level);
    this.enemies.push(boss);
    this.combatSystem.registerEnemy(boss);

    return boss;
  }

  /**
   * Clear all enemies
   */
  clear() {
    for (let enemy of this.enemies) {
      enemy.dispose();
    }
    this.enemies = [];
    this.waveActive = false;
  }

  /**
   * Dispose
   */
  dispose() {
    this.clear();
  }
}

export default EnemySpawnerV2;
