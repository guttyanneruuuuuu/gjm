/**
 * Combat System V2 - Enhanced with aiming, combos, and advanced targeting
 */

import * as THREE from 'three';
import { dist, clamp } from '../core/utils.js';

export class CombatSystemV2 {
  constructor(player, scene) {
    this.player = player;
    this.scene = scene;
    this.particles = player.engine.getParticles();

    this.enemies = [];
    this.lockedTarget = null;
    this.combatRadius = 60;
    this.attackQueue = [];
    this.comboCounter = 0;
    this.comboTimeout = 0;
    this.critChance = 0.15;
    this.critDamage = 1.5;

    // Aim state
    this.isAiming = false;
    this.aimDirection = new THREE.Vector3(0, 0, 1);

    // Combat state
    this.inCombat = false;
    this.combatTimeout = 0;

    // Raycast for aiming
    this.raycaster = new THREE.Raycaster();
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
   * Find target in front of player (camera-relative)
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

      // Only consider enemies in front (roughly 120 degree cone)
      if (dot > 0.3) {
        // Score based on proximity and angle
        const score = dot / (dist * 0.3 + 1);
        if (score > bestScore) {
          bestScore = score;
          bestTarget = enemy;
        }
      }
    }
    return bestTarget;
  }

  /**
   * Lock onto target
   */
  lockTarget(enemy) {
    this.lockedTarget = enemy;
    this.isAiming = true;
  }

  /**
   * Unlock target
   */
  unlockTarget() {
    this.lockedTarget = null;
    this.isAiming = false;
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
    let baseDamage = this.player.forms[this.player.currentForm].attackDamage;

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
    baseDamage *= (0.85 + Math.random() * 0.3);

    // Combo multiplier
    baseDamage *= (1 + this.comboCounter * 0.15);

    return Math.round(baseDamage);
  }

  /**
   * Get attack range based on form and attack type
   */
  getAttackRange(attackType) {
    const form = this.player.forms[this.player.currentForm];
    let range = form.attackRange;

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
    let hitChance = 0.88;

    // Reduce if target is moving away
    const toTarget = target.position.clone().sub(this.player.position);
    const playerForward = new THREE.Vector3(
      Math.sin(this.player.yaw),
      0,
      Math.cos(this.player.yaw)
    );

    const angle = toTarget.normalize().dot(playerForward);
    if (angle < 0) {
      hitChance *= 0.6;
    }

    // Increase hit chance with lock-on
    if (this.lockedTarget === target) {
      hitChance *= 1.15;
    }

    return clamp(hitChance, 0.4, 0.98);
  }

  /**
   * Update combo counter
   */
  updateCombo() {
    this.comboCounter++;
    this.comboTimeout = 3;

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
    const color = isCrit ? 0xff6b6b : 0xffff66;
    this.particles.spawnHitParticles(hitPos, color, isCrit ? 16 : 12);

    // Screen shake
    if (isCrit) {
      this.player.engine.getCamera().shake(0.4, 0.15);
    } else {
      this.player.engine.getCamera().shake(0.2, 0.1);
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
      }
    };

    animate();
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

    // Update combat state
    if (this.inCombat) {
      this.combatTimeout -= dt;
      if (this.combatTimeout <= 0) {
        this.inCombat = false;
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.active);
  }

  /**
   * Get combat stats
   */
  getCombatStats() {
    const form = this.player.forms[this.player.currentForm];
    return {
      damage: form.attackDamage,
      critChance: this.critChance,
      critDamage: this.critDamage,
      combo: this.comboCounter,
      targetLocked: this.lockedTarget !== null,
    };
  }
}

export default CombatSystemV2;
