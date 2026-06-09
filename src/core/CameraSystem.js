/**
 * Camera System - Manages third-person camera with collision detection
 */

import * as THREE from 'three';
import { clamp, lerp } from './utils.js';

export class CameraSystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      62,
      renderer.domElement.clientWidth / renderer.domElement.clientHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, 8, 14);

    // Camera settings
    this.targetDistance = 14;
    this.minDistance = 3;
    this.maxDistance = 25;
    this.height = 8;
    this.minHeight = 2;
    this.maxHeight = 15;
    this.followSpeed = 0.12;
    this.rotationSpeed = 0.08;
    
    // Current state
    this.currentDistance = this.targetDistance;
    this.currentHeight = this.height;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.currentYaw = 0;
    this.currentPitch = 0;
    
    // Aim mode
    this.aimMode = false;
    this.aimDistance = 8;
    this.aimHeight = 6;
    
    // Collision
    this.raycaster = new THREE.Raycaster();
    this.collisionObjects = [];
  }

  /**
   * Update camera position and rotation
   */
  update(playerPos, playerYaw, playerPitch, dt) {
    // Update target angles from player input
    this.targetYaw = playerYaw;
    this.targetPitch = clamp(playerPitch, -Math.PI / 2.5, Math.PI / 2.5);

    // Smoothly interpolate camera angles
    this.currentYaw = lerp(this.currentYaw, this.targetYaw, clamp(this.rotationSpeed * dt * 60, 0, 1));
    this.currentPitch = lerp(this.currentPitch, this.targetPitch, clamp(this.rotationSpeed * dt * 60, 0, 1));

    // Calculate target distance and height based on mode
    const targetDist = this.aimMode ? this.aimDistance : this.targetDistance;
    const targetH = this.aimMode ? this.aimHeight : this.height;

    this.currentDistance = lerp(this.currentDistance, targetDist, clamp(this.followSpeed * dt * 60, 0, 1));
    this.currentHeight = lerp(this.currentHeight, targetH, clamp(this.followSpeed * dt * 60, 0, 1));

    // Calculate desired camera position
    const horizontalDist = this.currentDistance * Math.cos(this.currentPitch);
    const verticalDist = this.currentDistance * Math.sin(this.currentPitch);

    const desiredPos = new THREE.Vector3(
      playerPos.x - Math.sin(this.currentYaw) * horizontalDist,
      playerPos.y + this.currentHeight + verticalDist,
      playerPos.z - Math.cos(this.currentYaw) * horizontalDist
    );

    // Collision detection and adjustment
    const adjustedPos = this.checkCollisions(playerPos, desiredPos);

    // Smoothly move camera to adjusted position
    this.camera.position.lerp(adjustedPos, clamp(this.followSpeed * dt * 60, 0, 1));

    // Look at player (slightly above for better view)
    const lookAtPos = playerPos.clone();
    lookAtPos.y += 1.5;
    this.camera.lookAt(lookAtPos);

    // Update projection matrix if needed
    this.updateProjectionMatrix();
  }

  /**
   * Check for collisions between camera and world objects
   */
  checkCollisions(playerPos, desiredPos) {
    if (this.collisionObjects.length === 0) {
      return desiredPos;
    }

    // Raycast from player to desired camera position
    const direction = desiredPos.clone().sub(playerPos).normalize();
    const distance = playerPos.distanceTo(desiredPos);
    
    this.raycaster.set(playerPos, direction);
    const intersects = this.raycaster.intersectObjects(this.collisionObjects);

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      if (firstHit.distance < distance) {
        // Move camera just before the collision point
        return playerPos.clone().addScaledVector(direction, Math.max(2, firstHit.distance - 0.5));
      }
    }

    return desiredPos;
  }

  /**
   * Set collision objects for camera
   */
  setCollisionObjects(objects) {
    this.collisionObjects = objects;
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
   * Enable aim mode (closer, more precise camera)
   */
  enableAimMode() {
    this.aimMode = true;
  }

  /**
   * Disable aim mode
   */
  disableAimMode() {
    this.aimMode = false;
  }

  /**
   * Update projection matrix on window resize
   */
  updateProjectionMatrix() {
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Get camera forward direction
   */
  getForward() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentYaw);
    return forward;
  }

  /**
   * Get camera right direction
   */
  getRight() {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentYaw);
    return right;
  }

  /**
   * Get camera up direction
   */
  getUp() {
    return new THREE.Vector3(0, 1, 0);
  }

  /**
   * Shake camera (for impact effects)
   */
  shake(intensity, duration) {
    const originalPos = this.camera.position.clone();
    const shakeIntensity = intensity;
    const startTime = Date.now();

    const shakeInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed > duration) {
        this.camera.position.copy(originalPos);
        clearInterval(shakeInterval);
        return;
      }

      const progress = 1 - (elapsed / duration);
      const randomX = (Math.random() - 0.5) * shakeIntensity * progress;
      const randomY = (Math.random() - 0.5) * shakeIntensity * progress;
      const randomZ = (Math.random() - 0.5) * shakeIntensity * progress;

      this.camera.position.copy(originalPos);
      this.camera.position.add(new THREE.Vector3(randomX, randomY, randomZ));
    }, 16);
  }

  /**
   * Get camera as THREE.Camera object
   */
  getCamera() {
    return this.camera;
  }
}

export default CameraSystem;
