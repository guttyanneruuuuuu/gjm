/**
 * Player Class - Main player character with transformation system
 */

import * as THREE from 'three';
import { clamp, lerp, TAU } from '../core/utils.js';

export class Player {
  constructor(engine, startPos = { x: 0, y: 5, z: 0 }) {
    this.engine = engine;
    this.scene = engine.getScene();
    this.physics = engine.getPhysics();
    this.input = engine.getInput();

    // Position and movement
    this.position = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;

    // Stats
    this.maxHp = 100;
    this.hp = this.maxHp;
    this.maxStamina = 100;
    this.stamina = this.maxStamina;
    this.maxInstinct = 100;
    this.instinct = this.maxInstinct;

    // Movement
    this.speed = 12;
    this.acceleration = 14;
    this.jumpForce = 15;
    this.grounded = false;
    this.height = 0; // For flying forms

    // Forms (transformations)
    this.forms = {
      mouse: { id: 'mouse', name: 'ネズミ', emoji: '🐭', speed: 14, jump: 12, canFly: false },
      fox: { id: 'fox', name: 'キツネ', emoji: '🦊', speed: 13, jump: 13, canFly: false },
      snake: { id: 'snake', name: 'ヘビ', emoji: '🐍', speed: 10, jump: 8, canFly: false },
      eagle: { id: 'eagle', name: 'ワシ', emoji: '🦅', speed: 11, jump: 10, canFly: true },
      wolf: { id: 'wolf', name: 'オオカミ', emoji: '🐺', speed: 12, jump: 11, canFly: false },
    };

    this.currentForm = 'mouse';
    this.unlockedForms = ['mouse'];

    // Combat
    this.attacking = false;
    this.attackCooldown = 0;
    this.attackDamage = 10;

    // Visual representation
    this.createVisuals();

    // Add to physics
    this.physicsBody = this.physics.createBody(this.position, 1, 0.5);

    // Register with engine
    this.engine.onUpdate((dt) => this.update(dt));
  }

  /**
   * Create visual representation of player
   */
  createVisuals() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Simple placeholder model
    const geometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0xaa8844 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    // Eyes for direction indication
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.1, 0.3, 0.25);
    this.group.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.1, 0.3, 0.25);
    this.group.add(this.rightEye);
  }

  /**
   * Update player each frame
   */
  update(dt) {
    // Get input
    const movement = this.input.getMovementInput();
    const camYaw = this.input.yaw;
    const camPitch = this.input.pitch;

    // Update yaw/pitch for camera
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
    const moveSpeed = currentForm.speed * (this.input.isSprinting() ? 1.3 : 1.0);
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
    }

    // Handle form switching
    if (this.input.isKeyPressed('1')) this.switchForm('mouse');
    if (this.input.isKeyPressed('2')) this.switchForm('fox');
    if (this.input.isKeyPressed('3')) this.switchForm('snake');
    if (this.input.isKeyPressed('4')) this.switchForm('eagle');
    if (this.input.isKeyPressed('5')) this.switchForm('wolf');

    // Handle attacking
    if (this.input.isAttacking() && this.attackCooldown <= 0) {
      this.attack();
    }

    this.attackCooldown -= dt;

    // Update stamina
    this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);

    // Update visuals
    this.updateVisuals();

    // Update physics body
    this.physicsBody.position.copy(this.position);
  }

  /**
   * Update visual representation
   */
  updateVisuals() {
    this.group.position.copy(this.position);

    // Rotate to face movement direction
    if (this.velocity.lengthSq() > 0.1) {
      const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
      this.group.rotation.y = lerp(this.group.rotation.y, targetYaw, 0.1);
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
  }

  /**
   * Switch to a different form
   */
  switchForm(formId) {
    if (!this.unlockedForms.includes(formId)) {
      console.log(`Form ${formId} not unlocked yet`);
      return;
    }

    if (this.currentForm === formId) return;

    this.currentForm = formId;
    console.log(`Switched to ${this.forms[formId].name}`);

    // Consume instinct
    this.instinct = Math.max(0, this.instinct - 10);
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
   * Perform attack
   */
  attack() {
    this.attacking = true;
    this.attackCooldown = 0.5;
    console.log(`${this.forms[this.currentForm].name} attacks!`);

    // TODO: Implement actual attack logic with damage, effects, etc.
  }

  /**
   * Take damage
   */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
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
    };
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.scene.remove(this.group);
    this.physics.removeBody(this.physicsBody);
  }
}

export default Player;
