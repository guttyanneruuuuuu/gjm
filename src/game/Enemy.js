/**
 * Enemy Base Class - Template for all enemy types
 */

import * as THREE from 'three';
import { clamp, lerp, rand, dist } from '../core/utils.js';

export class Enemy {
  constructor(engine, position, type = 'fox') {
    this.engine = engine;
    this.scene = engine.getScene();
    this.physics = engine.getPhysics();
    this.position = position.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.type = type;
    this.active = true;
    this.lastDamage = 0;

    // Stats
    this.maxHp = 50;
    this.hp = this.maxHp;
    this.attackDamage = 8;
    this.speed = 8;
    this.detectionRange = 20;
    this.attackRange = 2;
    this.attackCooldown = 0;
    this.attackCooldownMax = 1.5;

    // State
    this.state = 'idle'; // idle, patrolling, chasing, attacking, dead
    this.target = null;
    this.lastSeenPosition = null;
    this.stateTimer = 0;
    this.patrolPoint = null;

    // Visual
    this.createVisuals();

    // Physics
    this.physicsBody = this.physics.createBody(this.position, 1, 0.4);

    // Register with engine
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
    const geometry = new THREE.CapsuleGeometry(0.25, 1.0, 4, 8);
    const material = new THREE.MeshStandardMaterial({ color: this.getTypeColor() });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.08, 0.25, 0.2);
    this.group.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.08, 0.25, 0.2);
    this.group.add(this.rightEye);

    // Health bar
    this.createHealthBar();
  }

  /**
   * Create health bar above enemy
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
    const geometry = new THREE.PlaneGeometry(2, 0.25);
    this.healthBar = new THREE.Mesh(geometry, material);
    this.healthBar.position.y = 1.2;
    this.group.add(this.healthBar);
    this.healthBarCanvas = canvas;
    this.healthBarTexture = texture;
  }

  /**
   * Update health bar
   */
  updateHealthBar() {
    const percentage = this.hp / this.maxHp;
    const canvas = this.healthBarCanvas;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 64, 8);

    const color = percentage > 0.5 ? '#00ff00' : percentage > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64 * percentage, 8);

    this.healthBarTexture.needsUpdate = true;
  }

  /**
   * Get color based on type
   */
  getTypeColor() {
    const colors = {
      fox: 0xff9944,
      snake: 0x44aa44,
      eagle: 0xddaa44,
      wolf: 0x888888,
      boar: 0x8b6f47,
      deer: 0xaa8844,
    };
    return colors[this.type] || 0xaa8844;
  }

  /**
   * Update enemy each frame
   */
  update(dt) {
    if (!this.active) return;

    // Update state
    this.updateState(dt);

    // Update position based on velocity
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Apply gravity
    this.velocity.y -= 32 * dt;

    // Ground collision
    if (this.position.y < 0.5) {
      this.position.y = 0.5;
      this.velocity.y = 0;
    }

    // Update visuals
    this.group.position.copy(this.position);
    this.updateHealthBar();

    // Update physics body
    this.physicsBody.position.copy(this.position);

    // Update attack cooldown
    this.attackCooldown -= dt;
  }

  /**
   * Update AI state
   */
  updateState(dt) {
    this.stateTimer -= dt;

    switch (this.state) {
      case 'idle':
        this.updateIdleState(dt);
        break;
      case 'patrolling':
        this.updatePatrollingState(dt);
        break;
      case 'chasing':
        this.updateChasingState(dt);
        break;
      case 'attacking':
        this.updateAttackingState(dt);
        break;
    }
  }

  /**
   * Idle state
   */
  updateIdleState(dt) {
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;

    // Look for target
    if (this.target && this.canSeeTarget()) {
      this.state = 'chasing';
      this.stateTimer = 0;
    } else if (this.stateTimer <= 0) {
      this.state = 'patrolling';
      this.stateTimer = rand(3, 8);
      this.patrolPoint = new THREE.Vector3(
        this.position.x + rand(-10, 10),
        this.position.y,
        this.position.z + rand(-10, 10)
      );
    }
  }

  /**
   * Patrolling state
   */
  updatePatrollingState(dt) {
    if (!this.patrolPoint) {
      this.state = 'idle';
      return;
    }

    // Look for target
    if (this.target && this.canSeeTarget()) {
      this.state = 'chasing';
      this.stateTimer = 0;
      return;
    }

    // Move toward patrol point
    const direction = this.patrolPoint.clone().sub(this.position).normalize();
    this.velocity.x = direction.x * this.speed * 0.5;
    this.velocity.z = direction.z * this.speed * 0.5;

    // Reached patrol point
    if (this.position.distanceTo(this.patrolPoint) < 1) {
      this.state = 'idle';
      this.stateTimer = rand(2, 5);
    }
  }

  /**
   * Chasing state
   */
  updateChasingState(dt) {
    if (!this.target || !this.canSeeTarget()) {
      this.lastSeenPosition = this.target?.position.clone();
      this.state = 'idle';
      this.stateTimer = 0;
      return;
    }

    const distance = this.position.distanceTo(this.target.position);

    if (distance < this.attackRange) {
      this.state = 'attacking';
      this.stateTimer = 0;
      return;
    }

    // Move toward target
    const direction = this.target.position.clone().sub(this.position).normalize();
    this.velocity.x = direction.x * this.speed;
    this.velocity.z = direction.z * this.speed;

    // Jump if needed
    if (Math.random() < 0.02 && this.velocity.y === 0) {
      this.velocity.y = 8;
    }
  }

  /**
   * Attacking state
   */
  updateAttackingState(dt) {
    if (!this.target) {
      this.state = 'idle';
      return;
    }

    const distance = this.position.distanceTo(this.target.position);

    if (distance > this.attackRange * 1.5) {
      this.state = 'chasing';
      return;
    }

    // Stop moving
    this.velocity.x *= 0.8;
    this.velocity.z *= 0.8;

    // Attack
    if (this.attackCooldown <= 0) {
      this.attack();
      this.attackCooldown = this.attackCooldownMax;
    }
  }

  /**
   * Check if can see target
   */
  canSeeTarget() {
    if (!this.target) return false;
    const distance = this.position.distanceTo(this.target.position);
    return distance < this.detectionRange;
  }

  /**
   * Attack target
   */
  attack() {
    if (!this.target) return;

    const distance = this.position.distanceTo(this.target.position);
    if (distance > this.attackRange) return;

    // Apply damage to target
    this.target.takeDamage(this.attackDamage);

    // Knockback
    const direction = this.target.position.clone().sub(this.position).normalize();
    this.target.velocity.addScaledVector(direction, 5);
  }

  /**
   * Take damage
   */
  takeDamage(damage, isCrit = false) {
    this.lastDamage = damage;
    this.hp = Math.max(0, this.hp - damage);

    if (this.hp <= 0) {
      this.die();
    }

    // Knockback effect
    this.velocity.y += 3;
  }

  /**
   * Die
   */
  die() {
    this.active = false;
    this.state = 'dead';

    // Play death animation
    let lifespan = 1;
    const animate = () => {
      lifespan -= 0.016;
      if (lifespan > 0) {
        this.mesh.material.opacity = lifespan;
        this.group.scale.set(1 - (1 - lifespan) * 0.3, 1 - (1 - lifespan) * 0.3, 1 - (1 - lifespan) * 0.3);
        requestAnimationFrame(animate);
      } else {
        this.dispose();
      }
    };

    animate();
  }

  /**
   * Set target
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      type: this.type,
      hp: this.hp,
      maxHp: this.maxHp,
      state: this.state,
      distance: this.target ? this.position.distanceTo(this.target.position) : 0,
    };
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.scene.remove(this.group);
    this.physics.removeBody(this.physicsBody);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.healthBar.geometry.dispose();
    this.healthBar.material.dispose();
    this.healthBarTexture.dispose();
  }
}

export default Enemy;
