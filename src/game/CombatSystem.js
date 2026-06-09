/**
 * Combat System - Handles attacks, damage, targeting, and combat mechanics
 */

import * as THREE from 'three';
import { dist, clamp } from '../core/utils.js';

export class CombatSystem {
  constructor(player, scene) {
    this.player = player;
    this.scene = scene;
    this.enemies = [];
    this.lockedTarget = null;
    this.combatRadius = 50;
    this.attackQueue = [];
    this.comboCounter = 0;
    this.comboTimeout = 0;
    this.critChance = 0.15;
    this.critDamage = 1.5;
  }

  /**
   * Register enemy for combat
   */
  registerEnemy(enemy) {
    if (!this.enemies.includes(enemy)) {
      this.enemies.push(enemy);
    }
  }

  /**
   * Unregister enemy
   */
  unregisterEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx > -1) {
      this.enemies.splice(idx, 1);
    }
    if (this.lockedTarget === enemy) {
      this.lockedTarget = null;
    }
  }

  /**
   * Find nearest enemy
   */
  findNearestEnemy() {
    let nearest = null;
    let nearestDist = this.combatRadius;

    for (let enemy of this.enemies) {
      if (!enemy.active) continue;
      const d = this.player.position.distanceTo(enemy.position);
      if (d < nearestDist) {
        nearest = enemy;
        nearestDist = d;
      }
    }

    return nearest;
  }

  /**
   * Lock onto target
   */
  lockTarget(enemy) {
    this.lockedTarget = enemy;
  }

  /**
   * Unlock target
   */
  unlockTarget() {
    this.lockedTarget = null;
  }

  /**
   * Switch to next target
   */
  switchTarget(direction = 1) {
    if (this.enemies.length === 0) {
      this.lockedTarget = null;
      return;
    }

    let currentIndex = this.enemies.indexOf(this.lockedTarget);
    if (currentIndex === -1) {
      currentIndex = 0;
    } else {
      currentIndex = (currentIndex + direction + this.enemies.length) % this.enemies.length;
    }

    this.lockedTarget = this.enemies[currentIndex];
  }

  /**
   * Perform attack
   */
  attack(attackType = 'normal') {
    const damage = this.calculateDamage(attackType);
    let target = this.lockedTarget;
    
    // If no locked target, find one in front of player
    if (!target) {
      target = this.findTargetInFront();
    }

    if (!target) {
      console.log('No target in range');
      return false;
    }

    // Check if target is in range
    const distance = this.player.position.distanceTo(target.position);
    const attackRange = this.getAttackRange(attackType);

    if (distance > attackRange) {
      console.log('Target out of range');
      return false;
    }

    // Calculate hit chance
    const hitChance = this.calculateHitChance(target);
    if (Math.random() > hitChance) {
      console.log('Attack missed');
      this.playMissEffect(target);
      return false;
    }

    // Calculate critical hit
    const isCrit = Math.random() < this.critChance;
    const finalDamage = isCrit ? damage * this.critDamage : damage;

    // Apply damage
    target.takeDamage(finalDamage, isCrit);

    // Update combo
    this.updateCombo();

    // Play attack effects
    this.playAttackEffect(target, isCrit);

    return true;
  }

  /**
   * Calculate damage based on player stats and attack type
   */
  calculateDamage(attackType) {
    let baseDamage = this.player.attackDamage;

    switch (attackType) {
      case 'light':
        baseDamage *= 0.8;
        break;
      case 'heavy':
        baseDamage *= 1.5;
        break;
      case 'skill':
        baseDamage *= 2.0;
        break;
      case 'normal':
      default:
        break;
    }

    // Add variance
    baseDamage *= (0.9 + Math.random() * 0.2);

    return Math.round(baseDamage);
  }

  /**
   * Get attack range based on form and attack type
   */
  getAttackRange(attackType) {
    const baseRange = {
      mouse: 2,
      fox: 3,
      snake: 4,
      eagle: 5,
      wolf: 3.5,
    };

    let range = baseRange[this.player.currentForm] || 3;

    if (attackType === 'skill') {
      range *= 1.5;
    }

    return range;
  }

  /**
   * Calculate hit chance
   */
  calculateHitChance(target) {
    // Base hit chance
    let hitChance = 0.85;

    // Reduce if target is moving away
    const toTarget = target.position.clone().sub(this.player.position);
    const playerForward = new THREE.Vector3(
      Math.sin(this.player.yaw),
      0,
      Math.cos(this.player.yaw)
    );

    const angle = toTarget.normalize().dot(playerForward);
    if (angle < 0) {
      hitChance *= 0.7;
    }

    return clamp(hitChance, 0.3, 0.95);
  }

  /**
   * Update combo counter
   */
  updateCombo() {
    this.comboCounter++;
    this.comboTimeout = 3; // seconds

    console.log(`Combo x${this.comboCounter}`);
  }

  /**
   * Reset combo
   */
  resetCombo() {
    this.comboCounter = 0;
  }

  /**
   * Play attack effect
   */
  playAttackEffect(target, isCrit) {
    const hitPos = target.position.clone();

    // Damage number
    this.spawnDamageNumber(hitPos, target.lastDamage, isCrit);

    // Particle effect
    this.spawnHitParticles(hitPos, isCrit ? 0xff6b6b : 0xffff66);

    // Screen shake
    if (isCrit) {
      // Larger shake for crit
    }
  }

  /**
   * Play miss effect
   */
  playMissEffect(target) {
    const missPos = target.position.clone();
    missPos.y += 2;

    this.spawnMissNumber(missPos);
  }

  /**
   * Spawn damage number
   */
  spawnDamageNumber(position, damage, isCrit) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.font = isCrit ? 'bold 48px Arial' : '32px Arial';
    ctx.fillStyle = isCrit ? '#ff6b6b' : '#ffff66';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(damage.toString(), 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 2;

    this.scene.add(mesh);

    // Animate and remove
    let lifetime = 1;
    const animate = () => {
      lifetime -= 0.016;
      if (lifetime > 0) {
        mesh.position.y += 0.05;
        mesh.material.opacity = lifetime;
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(mesh);
        geometry.dispose();
        material.dispose();
        texture.dispose();
        // canvas = null; // Fix: Prevent reference error in animation loop
      }
    };

    animate();
  }

  /**
   * Spawn miss number
   */
  spawnMissNumber(position) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MISS', 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);

    this.scene.add(mesh);

    // Animate and remove
    let lifetime = 0.8;
    const animate = () => {
      lifetime -= 0.016;
      if (lifetime > 0) {
        mesh.position.y += 0.03;
        mesh.material.opacity = lifetime / 0.8;
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(mesh);
        geometry.dispose();
        material.dispose();
        texture.dispose();
        // canvas = null; // Fix: Prevent reference error in animation loop
      }
    };

    animate();
  }

  /**
   * Spawn hit particles
   */
  spawnHitParticles(position, color) {
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 5 + Math.random() * 5;

      const geometry = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      this.scene.add(particle);

      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 5,
        Math.sin(angle) * speed
      );

      let lifetime = 0.5;
      const animate = () => {
        lifetime -= 0.016;
        if (lifetime > 0) {
          particle.position.add(velocity.clone().multiplyScalar(0.016));
          velocity.y -= 10 * 0.016; // gravity
          particle.material.opacity = lifetime / 0.5;
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      };

      animate();
    }
  }

  /**
   * Find target in front of player
   */
  findTargetInFront() {
    let bestTarget = null;
    let bestScore = -1;

    const playerPos = this.player.position;
    const playerForward = new THREE.Vector3(
      Math.sin(this.player.yaw),
      0,
      Math.cos(this.player.yaw)
    ).normalize();

    for (let enemy of this.enemies) {
      if (!enemy.active) continue;
      
      const toEnemy = enemy.position.clone().sub(playerPos);
      const dist = toEnemy.length();
      
      if (dist > this.combatRadius) continue;
      
      toEnemy.normalize();
      const dot = toEnemy.dot(playerForward);
      
      // Only consider enemies in front (roughly 90 degree cone)
      if (dot > 0.5) {
        // Score based on proximity and angle
        const score = dot / (dist * 0.5 + 1);
        if (score > bestScore) {
          bestScore = score;
          bestTarget = enemy;
        }
      }
    }
    return bestTarget;
  }

  /**
   * Update combat system each frame
   */
  update(dt) {
    // Update combo timeout
    if (this.comboTimeout > 0) {
      this.comboTimeout -= dt;
      if (this.comboTimeout <= 0) {
        this.resetCombo();
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.active);
  }

  /**
   * Get combat stats
   */
  getCombatStats() {
    return {
      damage: this.player.attackDamage,
      critChance: this.critChance,
      critDamage: this.critDamage,
      combo: this.comboCounter,
      targetLocked: this.lockedTarget !== null,
    };
  }
}

export default CombatSystem;
