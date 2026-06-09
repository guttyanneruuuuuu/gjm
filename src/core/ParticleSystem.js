/**
 * Particle System - Advanced particle effects with pooling and GPU optimization
 */

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene, maxParticles = 5000) {
    this.scene = scene;
    this.maxParticles = maxParticles;
    this.particles = [];
    this.particlePool = [];

    // Create shared geometry and material
    this.initializePool();
  }

  /**
   * Initialize particle pool
   */
  initializePool() {
    // Pre-allocate particles
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = {
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        lifetime: 0,
        maxLifetime: 1,
        size: 0.1,
        color: new THREE.Color(0xffffff),
        opacity: 1,
        mesh: null,
        active: false,
      };
      this.particlePool.push(particle);
    }
  }

  /**
   * Get particle from pool
   */
  getParticle() {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop();
    }
    return null;
  }

  /**
   * Return particle to pool
   */
  returnParticle(particle) {
    if (particle.mesh) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      particle.mesh.material.dispose();
      particle.mesh = null;
    }
    particle.active = false;
    this.particlePool.push(particle);
  }

  /**
   * Spawn hit particles
   */
  spawnHitParticles(position, color = 0xff6b6b, count = 12) {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = (Math.PI * 2 * i) / count;
      const speed = 8 + Math.random() * 8;

      particle.position.copy(position);
      particle.velocity.set(
        Math.cos(angle) * speed,
        5 + Math.random() * 5,
        Math.sin(angle) * speed
      );
      particle.acceleration.set(0, -20, 0);
      particle.lifetime = 0;
      particle.maxLifetime = 0.6;
      particle.size = 0.15;
      particle.color.setHex(color);
      particle.opacity = 1;
      particle.active = true;

      // Create mesh
      const geometry = new THREE.SphereGeometry(particle.size, 4, 4);
      const material = new THREE.MeshStandardMaterial({
        color: particle.color,
        emissive: particle.color,
        emissiveIntensity: 0.8,
        transparent: true,
      });
      particle.mesh = new THREE.Mesh(geometry, material);
      particle.mesh.position.copy(particle.position);
      this.scene.add(particle.mesh);

      this.particles.push(particle);
    }
  }

  /**
   * Spawn slash effect
   */
  spawnSlashEffect(position, direction, color = 0xffff66) {
    const slashCount = 3;
    for (let i = 0; i < slashCount; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const offset = (i - 1) * 0.3;
      particle.position.copy(position).addScaledVector(direction, offset);
      particle.velocity.copy(direction).multiplyScalar(15 + Math.random() * 5);
      particle.acceleration.set(0, -15, 0);
      particle.lifetime = 0;
      particle.maxLifetime = 0.4;
      particle.size = 0.2 + Math.random() * 0.1;
      particle.color.setHex(color);
      particle.opacity = 0.8;
      particle.active = true;

      // Create mesh
      const geometry = new THREE.BoxGeometry(particle.size * 2, 0.05, particle.size);
      const material = new THREE.MeshStandardMaterial({
        color: particle.color,
        emissive: particle.color,
        emissiveIntensity: 0.6,
        transparent: true,
      });
      particle.mesh = new THREE.Mesh(geometry, material);
      particle.mesh.position.copy(particle.position);
      this.scene.add(particle.mesh);

      this.particles.push(particle);
    }
  }

  /**
   * Spawn dust effect
   */
  spawnDustEffect(position, count = 8) {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;

      particle.position.copy(position);
      particle.velocity.set(
        Math.cos(angle) * speed,
        2 + Math.random() * 3,
        Math.sin(angle) * speed
      );
      particle.acceleration.set(0, -5, 0);
      particle.lifetime = 0;
      particle.maxLifetime = 1.0;
      particle.size = 0.1 + Math.random() * 0.15;
      particle.color.setHex(0x8b7355);
      particle.opacity = 0.6;
      particle.active = true;

      // Create mesh
      const geometry = new THREE.SphereGeometry(particle.size, 3, 3);
      const material = new THREE.MeshStandardMaterial({
        color: particle.color,
        transparent: true,
      });
      particle.mesh = new THREE.Mesh(geometry, material);
      particle.mesh.position.copy(particle.position);
      this.scene.add(particle.mesh);

      this.particles.push(particle);
    }
  }

  /**
   * Spawn magic effect
   */
  spawnMagicEffect(position, color = 0x6b9bff, count = 16) {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = (Math.PI * 2 * i) / count;
      const speed = 6 + Math.random() * 4;

      particle.position.copy(position);
      particle.velocity.set(
        Math.cos(angle) * speed,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * speed
      );
      particle.acceleration.set(0, -8, 0);
      particle.lifetime = 0;
      particle.maxLifetime = 0.8;
      particle.size = 0.12;
      particle.color.setHex(color);
      particle.opacity = 0.9;
      particle.active = true;

      // Create mesh
      const geometry = new THREE.SphereGeometry(particle.size, 4, 4);
      const material = new THREE.MeshStandardMaterial({
        color: particle.color,
        emissive: particle.color,
        emissiveIntensity: 1.0,
        transparent: true,
      });
      particle.mesh = new THREE.Mesh(geometry, material);
      particle.mesh.position.copy(particle.position);
      this.scene.add(particle.mesh);

      this.particles.push(particle);
    }
  }

  /**
   * Update all particles
   */
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update lifetime
      particle.lifetime += dt;
      const progress = particle.lifetime / particle.maxLifetime;

      if (progress >= 1) {
        this.returnParticle(particle);
        this.particles.splice(i, 1);
        continue;
      }

      // Update physics
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(dt));
      particle.position.add(particle.velocity.clone().multiplyScalar(dt));

      // Update visual
      if (particle.mesh) {
        particle.mesh.position.copy(particle.position);
        particle.mesh.material.opacity = particle.opacity * (1 - progress);
        particle.mesh.scale.multiplyScalar(1 - dt * 0.5);
      }
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    for (let particle of this.particles) {
      this.returnParticle(particle);
    }
    this.particles = [];
  }

  /**
   * Dispose
   */
  dispose() {
    this.clear();
    this.particlePool = [];
  }
}

export default ParticleSystem;
