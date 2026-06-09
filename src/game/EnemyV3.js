/**
 * Enemy V3 - Improved AI and balance system
 * Inverse Hunter - 食物連鎖を逆走する3DアクションRPG
 */

import * as THREE from 'three';
import { clamp, lerp, TAU } from '../core/utils.js';
import { GAME_BALANCE } from '../config/GameBalanceV3.js';

export class EnemyV3 {
  constructor(engine, enemyType = 'small', position = { x: 0, y: 0, z: 0 }) {
    this.engine = engine;
    this.scene = engine.getScene();
    this.particles = engine.getParticles();

    this.enemyType = enemyType;
    this.position = new THREE.Vector3(position.x, position.y, position.z);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Get stats from balance config
    const baseStats = GAME_BALANCE.getEnemyStat(enemyType, 'maxHp');
    this.maxHp = baseStats;
    this.hp = this.maxHp;

    this.attackDamage = GAME_BALANCE.getEnemyStat(enemyType, 'attackDamage');
    this.attackCooldown = GAME_BALANCE.getEnemyStat(enemyType, 'attackCooldown');
    this.speed = GAME_BALANCE.getEnemyStat(enemyType, 'speed');
    this.senseRange = GAME_BALANCE.getEnemyStat(enemyType, 'senseRange');
    this.attackRange = GAME_BALANCE.getEnemyStat(enemyType, 'attackRange');

    // AI state
    this.state = 'idle'; // idle, patrol, chase, attack, flee, dead
    this.target = null;
    this.lastAttackTime = 0;
    this.stateChangeTime = 0;
    this.patrolTarget = this.position.clone();
    this.grounded = true;

    // Visual
    this.createVisuals();

    // Register with engine
    this.engine.addEnemy(this);
    this.engine.onUpdate((dt) => this.update(dt));
  }

  /**
   * Create visual representation
   */
  createVisuals() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Body
    const colors = {
      small: 0xff6b6b,
      medium: 0xffaa44,
      large: 0xdd9944,
      boss: 0xff4444,
    };
    const sizes = {
      small: { radius: 0.25, height: 0.8 },
      medium: { radius: 0.35, height: 1.2 },
      large: { radius: 0.45, height: 1.6 },
      boss: { radius: 0.6, height: 2.0 },
    };

    const size = sizes[this.enemyType] || sizes.small;
    const geometry = new THREE.CapsuleGeometry(size.radius, size.height, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: colors[this.enemyType] || 0xff6b6b,
      metalness: 0.1,
      roughness: 0.8,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Health bar
    this.createHealthBar();

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(size.radius * 0.4, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-size.radius * 0.5, size.height * 0.3, size.radius * 0.8);
    this.group.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(size.radius * 0.5, size.height * 0.3, size.radius * 0.8);
    this.group.add(this.rightEye);
  }

  /**
   * Create health bar
   */
  createHealthBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 64, 8);

    // Health
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(0, 0, 64, 8);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(2, 0.25);
    this.healthBar = new THREE.Mesh(geometry, material);
    this.healthBar.position.y = 1.2;
    this.healthBar.position.z = 0.1;
    this.group.add(this.healthBar);

    this.healthBarCanvas = canvas;
    this.healthBarTexture = texture;
  }

  /**
   * Update health bar
   */
  updateHealthBar() {
    const healthPercent = this.hp / this.maxHp;
    const ctx = this.healthBarCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 64, 8);

    // Health
    ctx.fillStyle = healthPercent > 0.5 ? '#6bff6b' : healthPercent > 0.25 ? '#ffaa44' : '#ff6b6b';
    ctx.fillRect(0, 0, 64 * healthPercent, 8);

    this.healthBarTexture.needsUpdate = true;
  }

  /**
   * Update enemy each frame
   */
  update(dt) {
    if (this.hp <= 0) {
      this.state = 'dead';
      return;
    }

    // Find player
    const player = this.engine.player;
    if (!player) return;

    const toPlayer = player.position.clone().sub(this.position);
    const distToPlayer = toPlayer.length();

    // AI state machine
    switch (this.state) {
      case 'idle':
        this.updateIdleState(dt, distToPlayer, player);
        break;
      case 'patrol':
        this.updatePatrolState(dt, distToPlayer, player);
        break;
      case 'chase':
        this.updateChaseState(dt, distToPlayer, player);
        break;
      case 'attack':
        this.updateAttackState(dt, distToPlayer, player);
        break;
      case 'flee':
        this.updateFleeState(dt, distToPlayer, player);
        break;
    }

    // Apply gravity
    this.velocity.y += -GAME_BALANCE.physics.gravity * dt;

    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Ground collision
    if (this.position.y < 0.5) {
      this.position.y = 0.5;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // Update visuals
    this.updateVisuals();
  }

  /**
   * Update idle state
   */
  updateIdleState(dt, distToPlayer, player) {
    this.stateChangeTime += dt;

    if (distToPlayer < this.senseRange) {
      this.state = 'chase';
      this.target = player;
      this.stateChangeTime = 0;
    } else if (this.stateChangeTime > 3) {
      this.state = 'patrol';
      this.patrolTarget = this.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 20
      ));
      this.stateChangeTime = 0;
    }
  }

  /**
   * Update patrol state
   */
  updatePatrolState(dt, distToPlayer, player) {
    if (distToPlayer < this.senseRange) {
      this.state = 'chase';
      this.target = player;
      this.stateChangeTime = 0;
      return;
    }

    // Move toward patrol target
    const toPatrol = this.patrolTarget.clone().sub(this.position);
    const distToPatrol = toPatrol.length();

    if (distToPatrol < 2) {
      this.state = 'idle';
      this.stateChangeTime = 0;
      return;
    }

    toPatrol.normalize();
    this.velocity.x = toPatrol.x * this.speed;
    this.velocity.z = toPatrol.z * this.speed;
  }

  /**
   * Update chase state
   */
  updateChaseState(dt, distToPlayer, player) {
    if (distToPlayer > this.senseRange * 1.5) {
      this.state = 'idle';
      this.target = null;
      this.stateChangeTime = 0;
      return;
    }

    if (distToPlayer < this.attackRange) {
      this.state = 'attack';
      this.stateChangeTime = 0;
      return;
    }

    // Chase player
    const toPlayer = player.position.clone().sub(this.position);
    toPlayer.normalize();

    this.velocity.x = toPlayer.x * this.speed;
    this.velocity.z = toPlayer.z * this.speed;

    // Jump if needed
    if (this.grounded && Math.random() < 0.02) {
      this.velocity.y = 10;
    }
  }

  /**
   * Update attack state
   */
  updateAttackState(dt, distToPlayer, player) {
    const toPlayer = player.position.clone().sub(this.position);
    const distToPlayer2 = toPlayer.length();

    if (distToPlayer2 > this.attackRange * 1.5) {
      this.state = 'chase';
      this.stateChangeTime = 0;
      return;
    }

    // Face player
    toPlayer.normalize();
    this.velocity.x = toPlayer.x * this.speed * 0.5;
    this.velocity.z = toPlayer.z * this.speed * 0.5;

    // Attack
    this.lastAttackTime += dt;
    if (this.lastAttackTime >= this.attackCooldown) {
      this.performAttack(player);
      this.lastAttackTime = 0;
    }
  }

  /**
   * Update flee state
   */
  updateFleeState(dt, distToPlayer, player) {
    if (this.hp > this.maxHp * 0.5) {
      this.state = 'chase';
      this.stateChangeTime = 0;
      return;
    }

    // Flee from player
    const toPlayer = player.position.clone().sub(this.position);
    toPlayer.normalize();
    toPlayer.multiplyScalar(-1);

    this.velocity.x = toPlayer.x * this.speed * 1.5;
    this.velocity.z = toPlayer.z * this.speed * 1.5;

    // Jump to escape
    if (this.grounded && Math.random() < 0.05) {
      this.velocity.y = 12;
    }
  }

  /**
   * Perform attack
   */
  performAttack(player) {
    const toPlayer = player.position.clone().sub(this.position);
    const distToPlayer = toPlayer.length();

    if (distToPlayer > this.attackRange) return;

    // Randomize damage
    const variance = 0.8 + Math.random() * 0.4;
    const damage = this.attackDamage * variance;

    // Apply knockback
    toPlayer.normalize();
    const knockback = toPlayer.clone().multiplyScalar(2);

    player.takeDamage(damage, false);
    player.velocity.add(knockback);

    // Attack particle effect
    this.createAttackParticles();
  }

  /**
   * Create attack particles
   */
  createAttackParticles() {
    if (!this.particles) return;

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * TAU;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * 5,
        Math.random() * 2,
        Math.sin(angle) * 5
      );

      this.particles.spawn(
        this.position.clone(),
        velocity,
        0.2,
        0xff6b6b,
        0.7
      );
    }
  }

  /**
   * Take damage
   */
  takeDamage(amount, isCrit = false) {
    this.hp = Math.max(0, this.hp - amount);

    // Change to flee if low health
    if (this.hp < this.maxHp * 0.3 && this.state !== 'flee') {
      this.state = 'flee';
    }

    // Damage particle effect
    this.createDamageParticles(isCrit);

    if (this.hp <= 0) {
      this.die();
    }
  }

  /**
   * Create damage particles
   */
  createDamageParticles(isCrit) {
    if (!this.particles) return;

    const count = isCrit ? 12 : 6;
    const color = isCrit ? 0xff4444 : 0xffaa44;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * 6,
        Math.random() * 4 + 2,
        Math.sin(angle) * 6
      );

      this.particles.spawn(
        this.position.clone(),
        velocity,
        0.3,
        color,
        0.8
      );
    }
  }

  /**
   * Die
   */
  die() {
    this.state = 'dead';

    // Death particle effect
    this.createDeathParticles();

    // Remove from scene after delay
    setTimeout(() => {
      this.dispose();
    }, 1000);
  }

  /**
   * Create death particles
   */
  createDeathParticles() {
    if (!this.particles) return;

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * TAU;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * 8,
        Math.random() * 8 + 2,
        Math.sin(angle) * 8
      );

      this.particles.spawn(
        this.position.clone(),
        velocity,
        0.6,
        0xff6b6b,
        0.9
      );
    }
  }

  /**
   * Update visuals
   */
  updateVisuals() {
    this.group.position.copy(this.position);
    this.updateHealthBar();

    // Rotate to face movement direction
    if (this.velocity.lengthSq() > 0.1) {
      const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
      this.group.rotation.y = lerp(this.group.rotation.y, targetYaw, 0.1);
    }
  }

  /**
   * Dispose
   */
  dispose() {
    this.scene.remove(this.group);
    this.engine.removeEnemy(this);
  }
}

export default EnemyV3;
