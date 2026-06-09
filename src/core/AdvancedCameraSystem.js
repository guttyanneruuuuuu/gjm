/**
 * Advanced Camera System - Lock-on, aim mode, dynamic FOV, and smooth follow
 */

import * as THREE from 'three';
import { clamp, lerp } from './utils.js';

export class AdvancedCameraSystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      renderer.domElement.clientWidth / renderer.domElement.clientHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, 8, 14);

    // Camera modes
    this.mode = 'free'; // free, lockon, aim
    this.lockedTarget = null;

    // Free camera settings
    this.freeDistance = 14;
    this.freeHeight = 8;
    this.freeYaw = 0;
    this.freePitch = 0.3;

    // Lock-on settings
    this.lockDistance = 10;
    this.lockHeight = 6;
    this.lockOffsetX = 2;
    this.lockOffsetZ = 1;

    // Aim settings
    this.aimDistance = 6;
    this.aimHeight = 5;
    this.aimFOV = 45;

    // Smooth follow
    this.followSpeed = 0.15;
    this.rotationSpeed = 0.2;
    this.currentDistance = this.freeDistance;
    this.currentHeight = this.freeHeight;
    this.currentYaw = this.freeYaw;
    this.currentPitch = this.freePitch;
    this.currentFOV = 70;

    // Collision
    this.raycaster = new THREE.Raycaster();
    this.collisionObjects = [];

    // Shake effect
    this.shakeIntensity = 0;
    this.shakeDecay = 0;
  }

  /**
   * Update camera
   */
  update(playerPos, playerYaw, playerPitch, dt, lockedTarget = null) {
    this.lockedTarget = lockedTarget;

    // Determine camera mode
    if (this.lockedTarget) {
      this.mode = 'lockon';
      this.updateLockOnCamera(playerPos, playerYaw, playerPitch, dt);
    } else {
      this.mode = 'free';
      this.updateFreeCamera(playerPos, playerYaw, playerPitch, dt);
    }

    // Apply shake
    this.updateShake(dt);

    // Update projection
    this.updateProjectionMatrix();
  }

  /**
   * Update free camera
   */
  updateFreeCamera(playerPos, playerYaw, playerPitch, dt) {
    // Smooth yaw/pitch
    this.currentYaw = lerp(this.currentYaw, playerYaw, clamp(this.rotationSpeed * dt * 60, 0, 1));
    this.currentPitch = lerp(this.currentPitch, playerPitch, clamp(this.rotationSpeed * dt * 60, 0, 1));

    // Smooth distance/height
    this.currentDistance = lerp(this.currentDistance, this.freeDistance, clamp(this.followSpeed * dt * 60, 0, 1));
    this.currentHeight = lerp(this.currentHeight, this.freeHeight, clamp(this.followSpeed * dt * 60, 0, 1));

    // Smooth FOV
    this.currentFOV = lerp(this.currentFOV, 70, clamp(this.followSpeed * dt * 60, 0, 1));

    // Calculate position
    const horizontalDist = this.currentDistance * Math.cos(this.currentPitch);
    const verticalDist = this.currentDistance * Math.sin(this.currentPitch);

    const desiredPos = new THREE.Vector3(
      playerPos.x - Math.sin(this.currentYaw) * horizontalDist,
      playerPos.y + this.currentHeight + verticalDist,
      playerPos.z - Math.cos(this.currentYaw) * horizontalDist
    );

    // Collision check
    const adjustedPos = this.checkCollisions(playerPos, desiredPos);

    // Smooth move
    this.camera.position.lerp(adjustedPos, clamp(this.followSpeed * dt * 60, 0, 1));

    // Look at player
    const lookAt = playerPos.clone();
    lookAt.y += 1.5;
    this.camera.lookAt(lookAt);
  }

  /**
   * Update lock-on camera
   */
  updateLockOnCamera(playerPos, playerYaw, playerPitch, dt) {
    if (!this.lockedTarget) {
      this.mode = 'free';
      return;
    }

    const targetPos = this.lockedTarget.position.clone();

    // Calculate direction to target
    const toTarget = targetPos.clone().sub(playerPos);
    const targetDistance = toTarget.length();

    // Smooth distance
    this.currentDistance = lerp(this.currentDistance, this.lockDistance, clamp(this.followSpeed * dt * 60, 0, 1));
    this.currentHeight = lerp(this.currentHeight, this.lockHeight, clamp(this.followSpeed * dt * 60, 0, 1));

    // Smooth FOV
    this.currentFOV = lerp(this.currentFOV, 55, clamp(this.followSpeed * dt * 60, 0, 1));

    // Position between player and target
    const midPoint = playerPos.clone().add(targetPos).multiplyScalar(0.5);

    // Calculate camera offset
    const right = new THREE.Vector3(Math.cos(playerYaw), 0, -Math.sin(playerYaw));
    const up = new THREE.Vector3(0, 1, 0);

    const cameraOffset = right.multiplyScalar(this.lockOffsetX);
    cameraOffset.add(up.clone().multiplyScalar(this.currentHeight));

    const desiredPos = midPoint.clone().add(cameraOffset);
    desiredPos.y = playerPos.y + this.currentHeight;

    // Add distance offset
    const dirToTarget = toTarget.normalize();
    const backOffset = dirToTarget.clone().multiplyScalar(-this.currentDistance);
    desiredPos.add(backOffset);

    // Collision check
    const adjustedPos = this.checkCollisions(playerPos, desiredPos);

    // Smooth move
    this.camera.position.lerp(adjustedPos, clamp(this.followSpeed * dt * 60, 0, 1));

    // Look at target
    this.camera.lookAt(targetPos);
  }

  /**
   * Check camera collisions
   */
  checkCollisions(playerPos, desiredPos) {
    if (this.collisionObjects.length === 0) {
      return desiredPos;
    }

    const direction = desiredPos.clone().sub(playerPos).normalize();
    const distance = playerPos.distanceTo(desiredPos);

    this.raycaster.set(playerPos, direction);
    const hits = this.raycaster.intersectObjects(this.collisionObjects);

    if (hits.length > 0 && hits[0].distance < distance) {
      return playerPos.clone().addScaledVector(direction, Math.max(2, hits[0].distance - 0.5));
    }

    return desiredPos;
  }

  /**
   * Update shake effect
   */
  updateShake(dt) {
    if (this.shakeIntensity > 0) {
      const randomX = (Math.random() - 0.5) * this.shakeIntensity;
      const randomY = (Math.random() - 0.5) * this.shakeIntensity;
      const randomZ = (Math.random() - 0.5) * this.shakeIntensity;

      this.camera.position.add(new THREE.Vector3(randomX, randomY, randomZ));

      this.shakeDecay -= dt;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 5);
    }
  }

  /**
   * Shake camera
   */
  shake(intensity = 0.5, duration = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDecay = duration;
  }

  /**
   * Enable aim mode
   */
  enableAim() {
    this.mode = 'aim';
    this.currentFOV = this.aimFOV;
  }

  /**
   * Disable aim mode
   */
  disableAim() {
    if (this.mode === 'aim') {
      this.mode = 'free';
    }
  }

  /**
   * Set lock-on target
   */
  setLockTarget(target) {
    this.lockedTarget = target;
  }

  /**
   * Clear lock-on target
   */
  clearLockTarget() {
    this.lockedTarget = null;
  }

  /**
   * Add collision object
   */
  addCollisionObject(obj) {
    if (!this.collisionObjects.includes(obj)) {
      this.collisionObjects.push(obj);
    }
  }

  /**
   * Remove collision object
   */
  removeCollisionObject(obj) {
    const idx = this.collisionObjects.indexOf(obj);
    if (idx > -1) {
      this.collisionObjects.splice(idx, 1);
    }
  }

  /**
   * Update projection matrix
   */
  updateProjectionMatrix() {
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.fov = this.currentFOV;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Get camera
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Get camera mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Get locked target
   */
  getLockedTarget() {
    return this.lockedTarget;
  }
}

export default AdvancedCameraSystem;
