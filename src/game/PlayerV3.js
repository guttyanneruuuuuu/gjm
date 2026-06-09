/**
 * Player V3 - Complete rewrite with proper form system and combat
 * Inverse Hunter - 食物連鎖を逆走する3DアクションRPG
 */

import * as THREE from 'three';
import { clamp, lerp, TAU } from '../core/utils.js';
import { GAME_BALANCE } from '../config/GameBalanceV3.js';

export class PlayerV3 {
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
    this.maxHp = GAME_BALANCE.getPlayerStat('maxHp');
    this.hp = this.maxHp;
    this.maxStamina = GAME_BALANCE.player.maxStamina;
    this.stamina = this.maxStamina;
    this.maxInstinct = GAME_BALANCE.player.maxInstinct;
    this.instinct = this.maxInstinct;

    // Movement
    this.speed = GAME_BALANCE.player.baseSpeed;
    this.acceleration = GAME_BALANCE.player.acceleration;
    this.jumpForce = GAME_BALANCE.player.jumpForce;
    this.grounded = false;
    this.isSprinting = false;

    // Forms (transformations)
    this.forms = GAME_BALANCE.forms;
    this.currentFormId = 'mouse';
    this.unlockedForms = ['mouse'];
    this.formSwitchCooldown = 0;
    this.formSwitchDuration = 0.3;

    // Combat
    this.attacking = false;
    this.attackCooldown = 0;
    this.attackDamage = GAME_BALANCE.getPlayerStat('baseAttackDamage');
    this.comboCounter = 0;
    this.comboTimeout = 0;
    this.lockedTarget = null;
    this.iFrames = 0;

    // Dash
    this.dashing = false;
    this.dashCooldown = 0;
    this.dashDirection = new THREE.Vector3(0, 0, 1);

    // Visual representation
    this.createVisuals();

    // Register with engine
    this.engine.onUpdate((dt) => this.update(dt));
    this.engine.onLateUpdate((dt) => this.lateUpdate(dt));

    console.log('Player V3 initialized');
  }

  /**
   * Create visual representation
   */
  createVisuals() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Body
    const geometry = new THREE.CapsuleGeometry(0.35, 1.4, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xaa8844,
      metalness: 0.2,
      roughness: 0.7,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.12, 0.35, 0.3);
    this.group.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.12, 0.35, 0.3);
    this.group.add(this.rightEye);

    // Glow effect for instinct
    const glowGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xc79b4a,
      transparent: true,
      opacity: 0.1,
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.group.add(this.glow);
  }

  /**
   * Update player each frame
   */
  update(dt) {
    // Update cooldowns
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.formSwitchCooldown = Math.max(0, this.formSwitchCooldown - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.comboTimeout = Math.max(0, this.comboTimeout - dt);
    this.iFrames = Math.max(0, this.iFrames - dt);

    // Reset combo if timeout
    if (this.comboTimeout <= 0) {
      this.comboCounter = 0;
    }

    // Get input
    const movement = this.input.getMovementInput();
    const camYaw = this.input.yaw;
    const camPitch = this.input.pitch;

    // Update yaw/pitch
    this.yaw = camYaw;
    this.pitch = camPitch;

    // Handle form switching
    this.handleFormSwitching();

    // Handle movement
    this.handleMovement(movement, dt);

    // Handle jumping
    if (this.input.isJumping() && this.grounded && !this.dashing) {
      this.velocity.y = this.jumpForce;
      this.grounded = false;
    }

    // Handle dashing
    if (this.input.isDashing() && this.dashCooldown <= 0 && this.stamina >= GAME_BALANCE.player.dashStaminaCost) {
      this.startDash(movement);
    }

    // Update dash
    if (this.dashing) {
      this.updateDash(dt);
    }

    // Handle lock-on
    if (this.input.isLocking()) {
      this.toggleLockOn();
    }

    // Handle attacking
    if (this.input.isAttacking() && this.attackCooldown <= 0) {
      this.performAttack();
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

    // Update stamina
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - GAME_BALANCE.player.staminaSprintCost * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + GAME_BALANCE.player.staminaRegenRate * dt);
    }

    // Update instinct
    this.instinct = Math.min(this.maxInstinct, this.instinct + GAME_BALANCE.player.instinctRegenRate * dt);

    // Update visuals
    this.updateVisuals();
  }

  /**
   * Late update (after physics)
   */
  lateUpdate(dt) {
    // Update group position
    this.group.position.copy(this.position);

    // Update camera to follow player
    const camera = this.engine.getCamera();
    camera.update(
      this.position,
      this.yaw,
      this.pitch,
      dt,
      this.lockedTarget
    );
  }

  /**
   * Handle form switching
   */
  handleFormSwitching() {
    if (this.formSwitchCooldown > 0) return;

    // Check for direct form selection (1-5 keys)
    const formIndex = this.input.getFormByNumber();
    if (formIndex >= 0) {
      const formIds = GAME_BALANCE.getFormIds();
      if (formIndex < formIds.length) {
        this.transformTo(formIds[formIndex]);
      }
    }

    // Check for form cycling
    if (this.input.isFormNext()) {
      this.cycleFormNext();
    }
    if (this.input.isFormPrev()) {
      this.cycleFormPrev();
    }
  }

  /**
   * Handle movement
   */
  handleMovement(movement, dt) {
    // Calculate desired velocity based on camera-relative input
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const desired = new THREE.Vector3(0, 0, 0);
    desired.addScaledVector(fwd, movement.z);
    desired.addScaledVector(right, movement.x);

    if (desired.lengthSq() > 0) {
      desired.normalize();
    }

    // Apply form multipliers
    const formStats = this.forms[this.currentFormId];
    const moveSpeed = GAME_BALANCE.player.baseSpeed * formStats.speedMultiplier;

    // Apply sprint multiplier
    this.isSprinting = this.input.isSprinting() && this.stamina > 0 && movement.magnitude > 0;
    const finalSpeed = moveSpeed * (this.isSprinting ? GAME_BALANCE.player.sprintMultiplier : 1.0);

    desired.multiplyScalar(finalSpeed);

    // Smooth acceleration
    const accelFactor = clamp(this.acceleration * dt, 0, 1);
    this.velocity.x = lerp(this.velocity.x, desired.x, accelFactor);
    this.velocity.z = lerp(this.velocity.z, desired.z, accelFactor);

    // Clamp velocity
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (horizontalSpeed > GAME_BALANCE.physics.maxVelocity) {
      const scale = GAME_BALANCE.physics.maxVelocity / horizontalSpeed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }
  }

  /**
   * Start dash
   */
  startDash(movement) {
    this.dashing = true;
    this.dashCooldown = GAME_BALANCE.player.dashCooldown;
    this.stamina -= GAME_BALANCE.player.dashStaminaCost;

    // Set dash direction
    if (movement.magnitude > 0.1) {
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      this.dashDirection.copy(fwd).multiplyScalar(movement.z).add(right.multiplyScalar(movement.x));
      this.dashDirection.normalize();
    } else {
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      this.dashDirection.copy(fwd);
    }

    // Apply dash velocity
    this.velocity.x = this.dashDirection.x * GAME_BALANCE.player.dashSpeed;
    this.velocity.z = this.dashDirection.z * GAME_BALANCE.player.dashSpeed;

    // Particle effect
    this.createDashParticles();
  }

  /**
   * Update dash
   */
  updateDash(dt) {
    // Dash duration is handled by formSwitchDuration
    if (this.formSwitchCooldown > GAME_BALANCE.player.dashDuration) {
      this.dashing = false;
    }
  }

  /**
   * Create dash particles
   */
  createDashParticles() {
    if (!this.particles) return;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * TAU;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * 5,
        Math.random() * 3,
        Math.sin(angle) * 5
      );

      this.particles.spawn(
        this.position.clone(),
        velocity,
        0.3,
        0xc79b4a,
        0.6
      );
    }
  }

  /**
   * Toggle lock-on
   */
  toggleLockOn() {
    if (this.lockedTarget) {
      this.lockedTarget = null;
    } else {
      const enemies = this.engine.getEnemies();
      if (enemies.length > 0) {
        // Find nearest enemy
        let nearest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
          const dist = this.position.distanceTo(enemy.position);
          if (dist < minDist && dist < GAME_BALANCE.player.lockOnRange) {
            minDist = dist;
            nearest = enemy;
          }
        }

        this.lockedTarget = nearest;
      }
    }
  }

  /**
   * Perform attack
   */
  performAttack() {
    this.attacking = true;
    this.attackCooldown = GAME_BALANCE.player.attackCooldown;
    this.comboCounter++;
    this.comboTimeout = GAME_BALANCE.combat.comboTimeout;

    // Calculate damage
    let damage = this.attackDamage * this.forms[this.currentFormId].damageMultiplier;
    damage *= (1 + (this.comboCounter - 1) * 0.1); // Combo multiplier

    // Check for critical hit
    const isCrit = Math.random() < GAME_BALANCE.player.critChance;
    if (isCrit) {
      damage *= GAME_BALANCE.player.critMultiplier;
    }

    // Find targets
    const enemies = this.engine.getEnemies();
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const attackCone = GAME_BALANCE.player.attackCone;
    const attackRange = GAME_BALANCE.player.attackRange;

    for (const enemy of enemies) {
      const toEnemy = enemy.position.clone().sub(this.position);
      const dist = toEnemy.length();

      if (dist > attackRange) continue;

      // Check if in attack cone
      toEnemy.normalize();
      const dotProduct = toEnemy.dot(fwd);
      const angleToEnemy = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

      if (angleToEnemy > attackCone / 2) continue;

      // Hit!
      enemy.takeDamage(damage, isCrit);

      // Knockback
      const knockback = this.dashDirection.clone().multiplyScalar(GAME_BALANCE.combat.knockbackBase);
      enemy.velocity.add(knockback);

      // Particle effect
      this.createHitParticles(enemy.position, isCrit);
    }

    // Attack particle effect
    this.createAttackParticles();
  }

  /**
   * Create attack particles
   */
  createAttackParticles() {
    if (!this.particles) return;

    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    for (let i = 0; i < 6; i++) {
      const spread = (Math.random() - 0.5) * 1.5;
      const velocity = fwd.clone().multiplyScalar(8).add(new THREE.Vector3(spread, Math.random() * 3, spread));

      this.particles.spawn(
        this.position.clone().add(fwd.clone().multiplyScalar(1.5)),
        velocity,
        0.2,
        0xff8844,
        0.7
      );
    }
  }

  /**
   * Create hit particles
   */
  createHitParticles(position, isCrit) {
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
        position.clone(),
        velocity,
        0.4,
        color,
        0.8
      );
    }
  }

  /**
   * Transform to a different form
   */
  transformTo(formId) {
    if (this.currentFormId === formId) return;
    if (!this.unlockedForms.includes(formId)) return;
    if (this.formSwitchCooldown > 0) return;

    this.currentFormId = formId;
    this.formSwitchCooldown = this.formSwitchDuration;

    // Update stats
    const formStats = this.forms[formId];
    this.jumpForce = GAME_BALANCE.player.jumpForce * formStats.jumpMultiplier;

    // Transformation particle effect
    this.createTransformParticles();

    console.log(`Transformed to: ${formStats.name}`);
  }

  /**
   * Cycle to next form
   */
  cycleFormNext() {
    const formIds = GAME_BALANCE.getFormIds();
    const currentIndex = formIds.indexOf(this.currentFormId);
    const nextIndex = (currentIndex + 1) % formIds.length;
    this.transformTo(formIds[nextIndex]);
  }

  /**
   * Cycle to previous form
   */
  cycleFormPrev() {
    const formIds = GAME_BALANCE.getFormIds();
    const currentIndex = formIds.indexOf(this.currentFormId);
    const prevIndex = (currentIndex - 1 + formIds.length) % formIds.length;
    this.transformTo(formIds[prevIndex]);
  }

  /**
   * Create transformation particles
   */
  createTransformParticles() {
    if (!this.particles) return;

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * TAU;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * 8,
        Math.random() * 6,
        Math.sin(angle) * 8
      );

      this.particles.spawn(
        this.position.clone(),
        velocity,
        0.5,
        0xc79b4a,
        0.8
      );
    }
  }

  /**
   * Unlock a form
   */
  unlockForm(formId) {
    if (!this.unlockedForms.includes(formId)) {
      this.unlockedForms.push(formId);
      console.log(`Unlocked: ${this.forms[formId].name}`);
    }
  }

  /**
   * Take damage
   */
  takeDamage(amount, isCrit = false) {
    if (this.iFrames > 0) return; // Invulnerability frames

    this.hp = Math.max(0, this.hp - amount);
    this.iFrames = GAME_BALANCE.combat.iFramesDuration;

    // Damage particle effect
    this.createDamageParticles(amount, isCrit);

    if (this.hp <= 0) {
      this.die();
    }
  }

  /**
   * Create damage particles
   */
  createDamageParticles(amount, isCrit) {
    if (!this.particles) return;

    const color = isCrit ? 0xff4444 : 0xff8888;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * TAU;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * 5,
        Math.random() * 4 + 2,
        Math.sin(angle) * 5
      );

      this.particles.spawn(
        this.position.clone(),
        velocity,
        0.3,
        color,
        0.7
      );
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
   * Update visuals
   */
  updateVisuals() {
    // Update form color
    const colors = {
      mouse: 0xaa8844,
      fox: 0xff9944,
      snake: 0x44aa44,
      eagle: 0xddaa44,
      wolf: 0x888888,
    };
    this.mesh.material.color.setHex(colors[this.currentFormId] || 0xaa8844);

    // Update glow based on instinct
    this.glow.material.opacity = 0.1 + (this.instinct / this.maxInstinct) * 0.3;

    // Rotate to face movement direction
    if (this.velocity.lengthSq() > 0.1) {
      const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
      this.group.rotation.y = lerp(this.group.rotation.y, targetYaw, 0.15);
    }
  }

  /**
   * Get position
   */
  getPosition() {
    return this.position.clone();
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
      form: this.currentFormId,
      formName: this.forms[this.currentFormId].name,
      formEmoji: this.forms[this.currentFormId].emoji,
      combo: this.comboCounter,
      targetLocked: this.lockedTarget !== null,
      dashing: this.dashing,
    };
  }

  /**
   * Dispose
   */
  dispose() {
    this.scene.remove(this.group);
  }
}

export default PlayerV3;
