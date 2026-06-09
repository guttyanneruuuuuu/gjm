/**
 * Simple Physics System - Basic gravity, collision, and movement
 */

import * as THREE from 'three';
import { clamp } from './utils.js';

export class PhysicsSystem {
  constructor() {
    this.gravity = -32; // units per second squared
    this.bodies = [];
    this.colliders = [];
  }

  /**
   * Create a physics body
   */
  createBody(position, mass = 1, radius = 0.5) {
    const body = {
      position: position.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      mass: mass,
      radius: radius,
      grounded: false,
      groundNormal: new THREE.Vector3(0, 1, 0),
      friction: 0.85,
      restitution: 0.2,
      active: true,
      colliders: []
    };

    this.bodies.push(body);
    return body;
  }

  /**
   * Add a static collider (terrain, obstacles, etc)
   */
  addCollider(mesh, type = 'mesh') {
    const collider = {
      mesh: mesh,
      type: type,
      active: true
    };

    this.colliders.push(collider);
    return collider;
  }

  /**
   * Remove a collider
   */
  removeCollider(collider) {
    const idx = this.colliders.indexOf(collider);
    if (idx > -1) {
      this.colliders.splice(idx, 1);
    }
  }

  /**
   * Update physics simulation
   */
  update(dt) {
    // Clamp dt to prevent large jumps
    dt = clamp(dt, 0, 0.033);

    for (let body of this.bodies) {
      if (!body.active) continue;

      // Apply gravity
      body.acceleration.y = this.gravity;

      // Apply acceleration to velocity
      body.velocity.x += body.acceleration.x * dt;
      body.velocity.y += body.acceleration.y * dt;
      body.velocity.z += body.acceleration.z * dt;

      // Apply velocity to position
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
      body.position.z += body.velocity.z * dt;

      // Ground collision
      this.checkGroundCollision(body);

      // Reset acceleration
      body.acceleration.set(0, 0, 0);
    }
  }

  /**
   * Check if body is on ground
   */
  checkGroundCollision(body) {
    body.grounded = false;

    // Simple raycast downward
    const rayOrigin = body.position.clone();
    rayOrigin.y += body.radius;
    const rayDirection = new THREE.Vector3(0, -1, 0);
    const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);

    for (let collider of this.colliders) {
      if (!collider.active) continue;

      const intersects = raycaster.intersectObject(collider.mesh, true);
      
      if (intersects.length > 0) {
        const hit = intersects[0];
        const groundY = hit.point.y + body.radius;

        if (body.position.y > groundY - 0.1 && body.velocity.y <= 0) {
          body.position.y = groundY;
          body.velocity.y = 0;
          body.grounded = true;
          body.groundNormal = hit.face.normal.clone();
          break;
        }
      }
    }
  }

  /**
   * Apply force to body
   */
  applyForce(body, force) {
    body.acceleration.add(force.clone().divideScalar(body.mass));
  }

  /**
   * Apply impulse to body (instant velocity change)
   */
  applyImpulse(body, impulse) {
    body.velocity.add(impulse.clone().divideScalar(body.mass));
  }

  /**
   * Set body velocity
   */
  setVelocity(body, velocity) {
    body.velocity.copy(velocity);
  }

  /**
   * Get body velocity
   */
  getVelocity(body) {
    return body.velocity.clone();
  }

  /**
   * Check distance between two bodies
   */
  distance(body1, body2) {
    return body1.position.distanceTo(body2.position);
  }

  /**
   * Check if two bodies are colliding (sphere collision)
   */
  isColliding(body1, body2) {
    const dist = this.distance(body1, body2);
    return dist < (body1.radius + body2.radius);
  }

  /**
   * Raycast
   */
  raycast(origin, direction, maxDistance = 1000) {
    const raycaster = new THREE.Raycaster(origin, direction.normalize());
    const results = [];

    for (let collider of this.colliders) {
      if (!collider.active) continue;
      const intersects = raycaster.intersectObject(collider.mesh, true);
      
      for (let hit of intersects) {
        if (hit.distance <= maxDistance) {
          results.push(hit);
        }
      }
    }

    return results.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get all bodies
   */
  getBodies() {
    return this.bodies;
  }

  /**
   * Remove body
   */
  removeBody(body) {
    const idx = this.bodies.indexOf(body);
    if (idx > -1) {
      this.bodies.splice(idx, 1);
    }
  }

  /**
   * Clear all bodies and colliders
   */
  clear() {
    this.bodies = [];
    this.colliders = [];
  }
}

export default PhysicsSystem;
