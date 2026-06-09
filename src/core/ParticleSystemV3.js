/**
 * Particle System V3 - Enhanced visual effects
 * Inverse Hunter - 食物連鎖を逆走する3DアクションRPG
 */

import * as THREE from 'three';

export class ParticleSystemV3 {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 2000;

    // Create shared geometry and material
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.alphas = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, material);
    this.scene.add(this.points);
  }

  /**
   * Spawn a particle
   */
  spawn(position, velocity, lifetime, color = 0xffffff, opacity = 1.0) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift(); // Remove oldest particle
    }

    const particle = {
      position: position.clone(),
      velocity: velocity.clone(),
      lifetime: lifetime,
      maxLifetime: lifetime,
      color: new THREE.Color(color),
      opacity: opacity,
      size: 0.5 + Math.random() * 0.5,
      maxSize: 0.5 + Math.random() * 0.5,
    };

    this.particles.push(particle);
  }

  /**
   * Update particles
   */
  update(dt) {
    // Update particle positions and properties
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update lifetime
      p.lifetime -= dt;

      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
        i--;
        continue;
      }

      // Update position
      p.position.add(p.velocity.clone().multiplyScalar(dt));
      p.velocity.y -= 9.8 * dt; // Gravity

      // Update size (fade out)
      const progress = 1 - (p.lifetime / p.maxLifetime);
      p.size = p.maxSize * (1 - progress * progress);

      // Update opacity
      const alphaProgress = Math.max(0, 1 - progress * 1.2);
      p.opacity = alphaProgress;
    }

    // Update geometry
    this.updateGeometry();
  }

  /**
   * Update geometry with current particles
   */
  updateGeometry() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Position
      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;

      // Color
      this.colors[i * 3] = p.color.r;
      this.colors[i * 3 + 1] = p.color.g;
      this.colors[i * 3 + 2] = p.color.b;

      // Size
      this.sizes[i] = p.size;

      // Alpha
      this.alphas[i] = p.opacity;
    }

    // Update buffer
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;

    // Update draw range
    this.geometry.setDrawRange(0, this.particles.length);
  }

  /**
   * Create burst effect
   */
  burst(position, count = 16, velocity = 10, lifetime = 0.5, color = 0xffffff) {
    const TAU = Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU;
      const v = new THREE.Vector3(
        Math.cos(angle) * velocity,
        Math.random() * velocity + velocity * 0.5,
        Math.sin(angle) * velocity
      );

      this.spawn(position.clone(), v, lifetime, color, 0.8);
    }
  }

  /**
   * Create trail effect
   */
  trail(position, direction, count = 8, lifetime = 0.3, color = 0xffffff) {
    for (let i = 0; i < count; i++) {
      const offset = direction.clone().multiplyScalar(i * 0.2);
      const v = direction.clone().multiplyScalar(2);

      this.spawn(position.clone().add(offset), v, lifetime, color, 0.6);
    }
  }

  /**
   * Create impact effect
   */
  impact(position, count = 12, velocity = 8, lifetime = 0.4, color = 0xffffff) {
    this.burst(position, count, velocity, lifetime, color);
  }

  /**
   * Create heal effect
   */
  heal(position, count = 16) {
    const TAU = Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU;
      const v = new THREE.Vector3(
        Math.cos(angle) * 6,
        Math.random() * 8 + 4,
        Math.sin(angle) * 6
      );

      this.spawn(position.clone(), v, 0.6, 0x6bff6b, 0.8);
    }
  }

  /**
   * Dispose
   */
  dispose() {
    this.geometry.dispose();
    this.points.material.dispose();
    this.scene.remove(this.points);
  }
}

export default ParticleSystemV3;
