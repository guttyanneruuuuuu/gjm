/**
 * Enemy V2 - Advanced enemy AI with state machine and combat behaviors
 */

import * as THREE from 'three';
import { lerp, clamp } from '../core/utils.js';

export class EnemyV2 {
  constructor(scene, position, type = 'basic', level = 1) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.type = type;
    this.level = level;
    this.active = true;

    // Stats based on type and level
    this.stats = this.getStats();
    this.hp = this.stats.maxHp;
    this.maxHp = this.stats.maxHp;
    this.damage = this.stats.damage;
    this.speed = this.stats.speed;
    this.attackRange = this.stats.attackRange;
    this.attackCooldown = 0;
    this.lastDamage = 0;

    // AI state machine
    this.state = 'idle'; // idle, patrolling, chasing, attacking, fleeing
    this.stateTimer = 0;
    this.detectionRange = 30;
    this.attackRange = this.stats.attackRange;

    // Target
    this.target = null;
    this.targetLostTimer = 0;

    // Patrol
    this.patrolPoint = position.clone();
    this.patrolRadius = 15;

    // Visual
    this.createVisuals();

    // Animation
    this.animationState = 'idle';
    this.animationTimer = 0;
  }

  /**
   * Get stats based on type and level
   */
  getStats() {
    const baseStats = {
      basic: { maxHp: 30, damage: 8, speed: 8, attackRange: 2 },
      fast: { maxHp: 20, damage: 6, speed: 14, attackRange: 1.5 },
      heavy: { maxHp: 60, damage: 12, speed: 5, attackRange: 3 },
      ranged: { maxHp: 25, damage: 10, speed: 10, attackRange: 15 },
    };

    const base = baseStats[this.type] || baseStats.basic;
    const multiplier = 1 + (this.level - 1) * 0.3;

    return {
      maxHp: Math.round(base.maxHp * multiplier),
      damage: Math.round(base.damage * multiplier),
      speed: base.speed,
      attackRange: base.attackRange,
    };
  }

  /**
   * Create visual representation
   */
  createVisuals() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Body
    const geometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    const material = new THREE.MeshStandardMaterial({
      color: this.getTypeColor(),
      metalness: 0.2,
      roughness: 0.7,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.08, 0.2, 0.2);
    this.group.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.08, 0.2, 0.2);
    this.group.add(this.rightEye);

    // Health bar
    this.createHealthBar();
  }

  /**
   * Create health bar
   */
  createHealthBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, 0, 64, 8);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(0.8, 0.1);
    this.healthBar = new THREE.Mesh(geometry, material);
    this.healthBar.position.y = 0.6;
    this.healthBar.position.z = 0.25;
    this.group.add(this.healthBar);
  }

  /**
   * Get color based on type
   */
  getTypeColor() {
    switch (this.type) {
      case 'fast':
        return 0xff6b6b;
      case 'heavy':
        return 0x6b6bff;
      case 'ranged':
        return 0xffff6b;
      default:
        return 0x6bff6b;
    }
  }

  /**
   * Update enemy each frame
   */
  update(dt, player, particles) {
    if (!this.active) return;

    // Update state machine
    this.updateAI(dt, player);

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    // Apply gravity
    this.velocity.y -= 32 * dt;

    // Ground collision
    if (this.position.y < 0.5) {
      this.position.y = 0.5;
      this.velocity.y = 0;
    }

    // Update visuals
    this.updateVisuals(dt);

    // Update cooldowns
    this.attackCooldown -= dt;
  }

  /**
   * Update AI state machine
   */
  updateAI(dt, player) {
    const distToPlayer = this.position.distanceTo(player.position);

    // Update target lost timer
    if (this.target && !this.target.active) {
      this.target = null;
      this.targetLostTimer = 2;
    }

    if (this.targetLostTimer > 0) {
      this.targetLostTimer -= dt;
    }

    // State transitions
    switch (this.state) {
      case 'idle':
        this.updateIdleState(dt, player, distToPlayer);
        break;
      case 'patrolling':
        this.updatePatrolState(dt, player, distToPlayer);
        break;
      case 'chasing':
        this.updateChasingState(dt, player, distToPlayer);
        break;
      case 'attacking':
        this.updateAttackingState(dt, player, distToPlayer);
        break;
      case 'fleeing':
        this.updateFleeingState(dt, player, distToPlayer);
        break;
    }

    this.stateTimer += dt;
  }

  /**
   * Idle state
   */
  updateIdleState(dt, player, distToPlayer) {
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;

    if (distToPlayer < this.detectionRange) {
      this.state = 'chasing';
      this.target = player;
      this.stateTimer = 0;
    } else if (this.stateTimer > 3) {
      this.state = 'patrolling';
      this.stateTimer = 0;
    }
  }

  /**
   * Patrolling state
   */
  updatePatrolState(dt, player, distToPlayer) {
    const toPatrol = this.patrolPoint.clone().sub(this.position);
    const distToPatrol = toPatrol.length();

    if (distToPatrol < 1) {
      // Reached patrol point, pick new one
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.patrolRadius;
      this.patrolPoint = this.position.clone().add(
        new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
      );
    }

    // Move towards patrol point
    toPatrol.normalize().multiplyScalar(this.speed);
    this.velocity.x = lerp(this.velocity.x, toPatrol.x, 0.1);
    this.velocity.z = lerp(this.velocity.z, toPatrol.z, 0.1);

    if (distToPlayer < this.detectionRange) {
      this.state = 'chasing';
      this.target = player;
      this.stateTimer = 0;
    }
  }

  /**
   * Chasing state
   */
  updateChasingState(dt, player, distToPlayer) {
    if (!this.target || !this.target.active) {
      this.state = 'idle';
      this.stateTimer = 0;
      return;
    }

    // Move towards player
    const toPlayer = player.position.clone().sub(this.position);
    toPlayer.normalize().multiplyScalar(this.speed);

    this.velocity.x = lerp(this.velocity.x, toPlayer.x, 0.15);
    this.velocity.z = lerp(this.velocity.z, toPlayer.z, 0.15);

    // Check if in attack range
    if (distToPlayer < this.attackRange) {
      this.state = 'attacking';
      this.stateTimer = 0;
    } else if (distToPlayer > this.detectionRange * 1.5) {
      this.state = 'idle';
      this.stateTimer = 0;
    }
  }

  /**
   * Attacking state
   */
  updateAttackingState(dt, player, distToPlayer) {
    if (!this.target || !this.target.active) {
      this.state = 'idle';
      this.stateTimer = 0;
      return;
    }

    // Stop moving
    this.velocity.x *= 0.8;
    this.velocity.z *= 0.8;

    // Attack if cooldown ready
    if (this.attackCooldown <= 0) {
      this.performAttack(player);
      this.attackCooldown = 1.5;
    }

    // Return to chasing if too far
    if (distToPlayer > this.attackRange * 1.5) {
      this.state = 'chasing';
      this.stateTimer = 0;
    }
  }

  /**
   * Fleeing state
   */
  updateFleeingState(dt, player, distToPlayer) {
    // Move away from player
    const awayFromPlayer = this.position.clone().sub(player.position);
    awayFromPlayer.normalize().multiplyScalar(this.speed * 1.5);

    this.velocity.x = lerp(this.velocity.x, awayFromPlayer.x, 0.1);
    this.velocity.z = lerp(this.velocity.z, awayFromPlayer.z, 0.1);

    // Stop fleeing if far enough
    if (distToPlayer > this.detectionRange * 2) {
      this.state = 'idle';
      this.stateTimer = 0;
    }
  }

  /**
   * Perform attack
   */
  performAttack(player) {
    const damage = this.damage + (Math.random() - 0.5) * this.damage * 0.2;
    player.takeDamage(Math.round(damage), false);
    this.lastDamage = Math.round(damage);

    // Knockback
    const knockback = player.position.clone().sub(this.position).normalize().multiplyScalar(5);
    player.velocity.add(knockback);
  }

  /**
   * Take damage
   */
  takeDamage(amount, isCrit = false) {
    this.hp -= amount;
    this.lastDamage = amount;

    if (this.hp <= 0) {
      this.die();
    }

    // Flinch
    this.state = 'fleeing';
    this.stateTimer = 0;
  }

  /**
   * Die
   */
  die() {
    this.active = false;
    this.scene.remove(this.group);
  }

  /**
   * Update visuals
   */
  updateVisuals(dt) {
    this.group.position.copy(this.position);

    // Rotate to face direction
    if (this.velocity.lengthSq() > 0.1) {
      const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
      this.group.rotation.y = lerp(this.group.rotation.y, targetYaw, 0.1);
    }

    // Update health bar
    const healthPercent = this.hp / this.maxHp;
    const canvas = this.healthBar.material.map.image;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(0, 0, 64 * healthPercent, 8);

    this.healthBar.material.map.needsUpdate = true;

    // Eye animation
    this.animationTimer += 0.016;
    const eyeGlow = Math.sin(this.animationTimer * 3) * 0.3 + 0.7;
    this.leftEye.material.emissiveIntensity = eyeGlow;
    this.rightEye.material.emissiveIntensity = eyeGlow;
  }

  /**
   * Get position
   */
  getPosition() {
    return this.position.clone();
  }

  /**
   * Dispose
   */
  dispose() {
    this.scene.remove(this.group);
  }
}

export default EnemyV2;
