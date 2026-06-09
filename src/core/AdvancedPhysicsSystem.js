/**
 * Advanced Physics System - Full character controller with slopes, wall slides, and collisions
 */

import * as THREE from 'three';
import { clamp } from './utils.js';

export class AdvancedPhysicsSystem {
  constructor() {
    this.bodies = [];
    this.colliders = [];
    this.gravity = -32;
    this.raycaster = new THREE.Raycaster();
    this.groundCheckDistance = 0.5;
    this.wallSlideThreshold = 0.5; // Minimum speed to wall slide
  }

  /**
   * Create a dynamic character body
   */
  createCharacterBody(position, radius = 0.3, height = 1.2) {
    const body = {
      position: position.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      radius: radius,
      height: height,
      mass: 1,
      friction: 0.1,
      grounded: false,
      onWall: false,
      wallNormal: new THREE.Vector3(0, 0, 0),
      slopeAngle: 0,
      canJump: false,
      jumpCooldown: 0,
      dashCooldown: 0,
      dashDirection: new THREE.Vector3(0, 0, 0),
      isDashing: false,
      dashSpeed: 25,
      dashDuration: 0.2,
      dashElapsed: 0,
    };

    this.bodies.push(body);
    return body;
  }

  /**
   * Add static collider mesh
   */
  addCollider(mesh) {
    if (!this.colliders.includes(mesh)) {
      this.colliders.push(mesh);
    }
  }

  /**
   * Remove collider
   */
  removeCollider(mesh) {
    const idx = this.colliders.indexOf(mesh);
    if (idx > -1) {
      this.colliders.splice(idx, 1);
    }
  }

  /**
   * Update body physics
   */
  updateBody(body, dt) {
    // Apply gravity
    if (!body.isDashing) {
      body.velocity.y += this.gravity * dt;
    }

    // Apply friction
    body.velocity.x *= (1 - this.friction * dt);
    body.velocity.z *= (1 - this.friction * dt);

    // Check ground contact
    const groundHit = this.checkGround(body);
    body.grounded = groundHit !== null;
    body.canJump = body.grounded;

    // Check wall contact
    const wallHit = this.checkWall(body);
    body.onWall = wallHit !== null;

    if (wallHit) {
      body.wallNormal = wallHit.normal;
      // Reduce fall speed on wall
      if (body.velocity.y < 0) {
        body.velocity.y *= 0.5;
      }
    }

    // Handle dash
    if (body.isDashing) {
      body.dashElapsed += dt;
      if (body.dashElapsed >= body.dashDuration) {
        body.isDashing = false;
      }
    }

    // Update position
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt;
    body.position.z += body.velocity.z * dt;

    // Resolve collisions
    this.resolveCollisions(body);

    // Ground clamp
    if (body.grounded && body.velocity.y < 0) {
      body.velocity.y = 0;
    }

    // Update cooldowns
    body.jumpCooldown = Math.max(0, body.jumpCooldown - dt);
    body.dashCooldown = Math.max(0, body.dashCooldown - dt);
  }

  /**
   * Check ground contact via raycast
   */
  checkGround(body) {
    const rayStart = body.position.clone();
    const rayDir = new THREE.Vector3(0, -1, 0);
    const rayDistance = this.groundCheckDistance + 0.1;

    this.raycaster.set(rayStart, rayDir);
    const hits = this.raycaster.intersectObjects(this.colliders);

    for (let hit of hits) {
      if (hit.distance < rayDistance) {
        return hit;
      }
    }

    return null;
  }

  /**
   * Check wall contact via raycast
   */
  checkWall(body) {
    // Check in movement direction
    const moveDir = new THREE.Vector3(body.velocity.x, 0, body.velocity.z);
    if (moveDir.length() < 0.1) return null;

    moveDir.normalize();
    const rayStart = body.position.clone();
    const rayDistance = body.radius + 0.2;

    this.raycaster.set(rayStart, moveDir);
    const hits = this.raycaster.intersectObjects(this.colliders);

    for (let hit of hits) {
      if (hit.distance < rayDistance) {
        return hit;
      }
    }

    return null;
  }

  /**
   * Resolve collisions with geometry
   */
  resolveCollisions(body) {
    const checkPoints = [
      body.position.clone(),
      body.position.clone().add(new THREE.Vector3(body.radius, 0, 0)),
      body.position.clone().add(new THREE.Vector3(-body.radius, 0, 0)),
      body.position.clone().add(new THREE.Vector3(0, 0, body.radius)),
      body.position.clone().add(new THREE.Vector3(0, 0, -body.radius)),
    ];

    for (let point of checkPoints) {
      this.raycaster.set(point, new THREE.Vector3(0, -1, 0));
      const hits = this.raycaster.intersectObjects(this.colliders);

      if (hits.length > 0 && hits[0].distance < 0.1) {
        // Push body up
        body.position.y += 0.1 - hits[0].distance;
      }
    }
  }

  /**
   * Apply jump impulse
   */
  jump(body, force = 15) {
    if (body.canJump && body.jumpCooldown <= 0) {
      body.velocity.y = force;
      body.canJump = false;
      body.jumpCooldown = 0.1;
      return true;
    }
    return false;
  }

  /**
   * Apply dash impulse
   */
  dash(body, direction, speed = 25) {
    if (body.dashCooldown <= 0) {
      body.isDashing = true;
      body.dashElapsed = 0;
      body.dashDirection = direction.normalize();
      body.velocity.copy(body.dashDirection.multiplyScalar(speed));
      body.dashCooldown = 0.5;
      return true;
    }
    return false;
  }

  /**
   * Apply velocity
   */
  setVelocity(body, velocity) {
    body.velocity.copy(velocity);
  }

  /**
   * Add force
   */
  addForce(body, force) {
    body.velocity.add(force);
  }

  /**
   * Add impulse
   */
  addImpulse(body, impulse) {
    body.velocity.add(impulse);
  }

  /**
   * Update all bodies
   */
  update(dt) {
    for (let body of this.bodies) {
      this.updateBody(body, dt);
    }
  }

  /**
   * Get body position
   */
  getPosition(body) {
    return body.position.clone();
  }

  /**
   * Set body position
   */
  setPosition(body, position) {
    body.position.copy(position);
  }

  /**
   * Check if body is grounded
   */
  isGrounded(body) {
    return body.grounded;
  }

  /**
   * Check if body is on wall
   */
  isOnWall(body) {
    return body.onWall;
  }

  /**
   * Get slope angle
   */
  getSlopeAngle(body) {
    const ground = this.checkGround(body);
    if (ground && ground.face) {
      const normal = ground.face.normal;
      return Math.acos(Math.abs(normal.y));
    }
    return 0;
  }

  /**
   * Dispose
   */
  dispose() {
    this.bodies = [];
    this.colliders = [];
  }
}

export default AdvancedPhysicsSystem;
