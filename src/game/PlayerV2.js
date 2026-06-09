/**
 * Player V2 - Enhanced player with smooth movement, dashing, and advanced combat
 */

import * as THREE from 'three';
import { clamp, lerp, TAU } from '../core/utils.js';
import { TransformationSystem } from './TransformationSystem.js';
import { CombatSystem } from './CombatSystem.js';
import { InstinctGauge } from './InstinctGauge.js';

export class PlayerV2 {
  constructor(engine, startPos = { x: 0, y: 5, z: 0 }) {
    this.engine = engine;
    this.scene = engine.getScene();
    this.physics = engine.getPhysics();
    this.input = engine.getInput();
    this.particles = engine.getParticles();

    // Position and movement
    this.position = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;

    // Stats
    this.maxHp = 150;
    this.hp = this.maxHp;
    this.maxStamina = 100;
    this.stamina = this.maxStamina;
    this.maxInstinct = 100;
    this.instinct = this.maxInstinct;

    // Movement
    this.speed = 12;
    this.acceleration = 14;
    this.jumpForce = 15;
    this.dashSpeed = 25;
    this.dashDuration = 0.2;
    this.grounded = false;
    this.height = 0;

    // Dash state
    this.isDashing = false;
    this.dashCooldown = 0;
    this.dashDirection = new THREE.Vector3(0, 0, 0);

    // Forms (transformations)
    this.forms = {
      mouse: {
        id: 'mouse',
        name: 'ネズミ',
        emoji: '🐭',
        speed: 14,
        jump: 12,
        canFly: false,
        dashSpeed: 28,
        attackRange: 2,
        attackDamage: 8,
      },
      fox: {
        id: 'fox',
        name: 'キツネ',
        emoji: '🦊',
        speed: 13,
        jump: 13,
        canFly: false,
        dashSpeed: 26,
        attackRange: 3,
        attackDamage: 12,
      },
      snake: {
        id: 'snake',
        name: 'ヘビ',
        emoji: '🐍',
        speed: 10,
        jump: 8,
        canFly: false,
        dashSpeed: 22,
        attackRange: 4,
        attackDamage: 10,
      },
      eagle: {
        id: 'eagle',
        name: 'ワシ',
        emoji: '🦅',
        speed: 11,
        jump: 10,
        canFly: true,
        dashSpeed: 30,
        attackRange: 5,
        attackDamage: 15,
      },
      wolf: {
        id: 'wolf',
        name: 'オオカミ',
        emoji: '🐺',
        speed: 12,
        jump: 11,
        canFly: false,
        dashSpeed: 25,
        attackRange: 3.5,
        attackDamage: 14,
      },
    };

    this.currentForm = 'mouse';
    this.unlockedForms = ['mouse'];

    // Combat
    this.attacking = false;
    this.attackCooldown = 0;
    this.comboCounter = 0;
    this.comboTimeout = 0;

    // Visual representation
    this.createVisuals();

    // Create physics body
    this.physicsBody = this.physics.createCharacterBody(this.position, 0.3, 1.2);

    // Initialize systems
    this.transformationSystem = new TransformationSystem(this);
    this.combatSystem = new CombatSystem(this, this.scene);
    this.instinctGauge = new InstinctGauge(this);

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

    // Main body mesh
    const geometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xaa8844,
      metalness: 0.1,
      roughness: 0.6,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Eyes for direction indication
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x000000,
    });

    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.1, 0.3, 0.25);
    this.group.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.1, 0.3, 0.25);
    this.group.add(this.rightEye);

    // Glow effect for instinct
    const glowGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.group.add(this.glowMesh);
  }

  /**
   * Update player each frame
   */
  update(dt) {
    // Update systems
    this.instinctGauge.update(dt);
    this.combatSystem.update(dt);

    // Get input
    const movement = this.input.getMovementInput();
    const camYaw = this.input.yaw;
    const camPitch = this.input.pitch;

    // Update yaw/pitch
    this.yaw = camYaw;
    this.pitch = camPitch;

    // Calculate desired velocity based on camera-relative input
    const fwd = new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw));
    const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));

    const desired = new THREE.Vector3(0, 0, 0);
    desired.addScaledVector(fwd, movement.z);
    desired.addScaledVector(right, movement.x);

    if (desired.lengthSq() > 0) {
      desired.normalize();
    }

    const currentForm = this.forms[this.currentForm];
    let moveSpeed = currentForm.speed;

    // Sprint boost
    if (this.input.isSprinting() && this.stamina > 10) {
      moveSpeed *= 1.4;
      this.stamina -= 15 * dt;
    }

    desired.multiplyScalar(moveSpeed);

    // Smooth acceleration
    const accelFactor = clamp(this.acceleration * dt, 0, 1);
    this.velocity.x = lerp(this.velocity.x, desired.x, accelFactor);
    this.velocity.z = lerp(this.velocity.z, desired.z, accelFactor);

    // Apply gravity
    this.velocity.y += -32 * dt;

    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Simple ground collision
    if (this.position.y < 0.5) {
      this.position.y = 0.5;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // Handle jumping
    if (this.input.isJumping() && this.grounded) {
      this.velocity.y = currentForm.jump;
      this.grounded = false;
      this.particles.spawnDustEffect(this.position, 6);
    }

    // Handle dashing
    if (this.input.isDashing() && this.dashCooldown <= 0) {
      this.startDash(desired.length() > 0 ? desired.normalize() : fwd);
    }

    // Update dash
    if (this.isDashing) {
      this.updateDash(dt);
    }

    // Handle form switching
    if (this.input.isKeyPressed('1')) this.transformationSystem.transformTo('mouse');
    if (this.input.isKeyPressed('2')) this.transformationSystem.transformTo('fox');
    if (this.input.isKeyPressed('3')) this.transformationSystem.transformTo('snake');
    if (this.input.isKeyPressed('4')) this.transformationSystem.transformTo('eagle');
    if (this.input.isKeyPressed('5')) this.transformationSystem.transformTo('wolf');

    // Handle lock-on
    if (this.input.isLocking()) {
      if (this.combatSystem.lockedTarget) {
        this.combatSystem.unlockTarget();
        this.engine.getCamera().clearLockTarget();
      } else {
        const nearest = this.combatSystem.findNearestEnemy();
        if (nearest) {
          this.combatSystem.lockTarget(nearest);
          this.engine.getCamera().setLockTarget(nearest);
        }
      }
    }

    // Handle attacking
    if (this.input.isAttacking() && this.attackCooldown <= 0) {
      this.performAttack();
      this.attackCooldown = 0.4;
    }

    this.attackCooldown -= dt;

    // Update stamina
    this.stamina = Math.min(this.maxStamina, this.stamina + 25 * dt);

    // Update instinct from gauge
    this.instinct = this.instinctGauge.instinct;

    // Update combo
    if (this.comboTimeout > 0) {
      this.comboTimeout -= dt;
    } else {
      this.comboCounter = 0;
    }

    // Update visuals
    this.updateVisuals();

    // Update physics body
    this.physicsBody.position.copy(this.position);
  }

  /**
   * Start dash
   */
  startDash(direction) {
    this.isDashing = true;
    this.dashCooldown = 0.6;
    this.dashDirection = direction.normalize();

    const currentForm = this.forms[this.currentForm];
    this.velocity.copy(this.dashDirection.clone().multiplyScalar(currentForm.dashSpeed));
    this.velocity.y = 0; // Keep dash horizontal

    // Spawn dash effect
    this.particles.spawnMagicEffect(this.position, 0x6b9bff, 12);
  }

  /**
   * Update dash
   */
  updateDash(dt) {
    // Dash duration check would go here
    // For now, dash continues until next frame
  }

  /**
   * Perform attack
   */
  performAttack() {
    const success = this.combatSystem.attack('normal');

    if (success) {
      this.comboCounter++;
      this.comboTimeout = 2.5;

      // Spawn attack effect
      const direction = new THREE.Vector3(
        Math.sin(this.yaw),
        0,
        Math.cos(this.yaw)
      );
      this.particles.spawnSlashEffect(this.position, direction, 0xffff66);

      // Camera shake on hit
      this.engine.getCamera().shake(0.3, 0.1);
    }
  }

  /**
   * Update visual representation
   */
  updateVisuals() {
    this.group.position.copy(this.position);

    // Rotate to face movement direction
    if (this.velocity.lengthSq() > 0.1) {
      const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
      this.group.rotation.y = lerp(this.group.rotation.y, targetYaw, 0.15);
    }

    // Update mesh color based on form
    const form = this.forms[this.currentForm];
    const colors = {
      mouse: 0xaa8844,
      fox: 0xff9944,
      snake: 0x44aa44,
      eagle: 0xddaa44,
      wolf: 0x888888,
    };
    this.mesh.material.color.setHex(colors[this.currentForm] || 0xaa8844);

    // Update glow based on instinct
    const instinctRatio = this.instinct / this.maxInstinct;
    this.glowMesh.material.opacity = instinctRatio * 0.3;
    this.glowMesh.material.color.setHex(
      instinctRatio > 0.7 ? 0xff6b6b : 0xffff00
    );

    // Update eye glow
    const eyeIntensity = instinctRatio * 0.8;
    this.leftEye.material.emissiveIntensity = eyeIntensity;
    this.rightEye.material.emissiveIntensity = eyeIntensity;
  }

  /**
   * Switch to a different form
   */
  switchForm(formId) {
    this.transformationSystem.transformTo(formId);
  }

  /**
   * Unlock a new form
   */
  unlockForm(formId) {
    if (!this.unlockedForms.includes(formId)) {
      this.unlockedForms.push(formId);
      console.log(`Unlocked ${this.forms[formId].name}`);
    }
  }

  /**
   * Take damage
   */
  takeDamage(amount, isCrit = false) {
    this.hp = Math.max(0, this.hp - amount);
    this.combatSystem.inCombat = true;
    this.combatSystem.combatTimeout = 5;
    this.instinctGauge.inCombat = true;
    this.instinctGauge.combatTimeout = 5;

    // Spawn damage effect
    this.particles.spawnHitParticles(this.position, isCrit ? 0xff6b6b : 0xffaa00, 8);

    if (this.hp <= 0) {
      this.die();
    }
  }

  /**
   * Heal
   */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * Die
   */
  die() {
    console.log('Player died');
    this.engine.setState('gameOver');
  }

  /**
   * Get position
   */
  getPosition() {
    return this.position.clone();
  }

  /**
   * Get current form
   */
  getCurrentForm() {
    return this.forms[this.currentForm];
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      instinct: this.instinct,
      maxInstinct: this.maxInstinct,
      form: this.currentForm,
      formName: this.forms[this.currentForm].name,
      combo: this.comboCounter,
      targetLocked: this.combatSystem.lockedTarget !== null,
      isDashing: this.isDashing,
    };
  }

  /**
   * Get transformation system
   */
  getTransformationSystem() {
    return this.transformationSystem;
  }

  /**
   * Get combat system
   */
  getCombatSystem() {
    return this.combatSystem;
  }

  /**
   * Get instinct gauge
   */
  getInstinctGauge() {
    return this.instinctGauge;
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.scene.remove(this.group);
  }
}

export default PlayerV2;
