/**
 * Transformation System - Handles form changes with effects and abilities
 */

import * as THREE from 'three';
import { lerp, clamp } from '../core/utils.js';

export class TransformationSystem {
  constructor(player) {
    this.player = player;
    this.isTransforming = false;
    this.transformProgress = 0;
    this.transformDuration = 0.6; // seconds
    this.transforming = null;
    this.morphTargets = new Map();
    this.particleSystem = null;
    
    this.setupFormAbilities();
  }

  /**
   * Setup abilities for each form
   */
  setupFormAbilities() {
    this.abilities = {
      mouse: {
        name: 'ネズミ',
        emoji: '🐭',
        speed: 14,
        jump: 12,
        canFly: false,
        abilities: [
          { id: 'sneak', name: '隠密ダッシュ', cost: 15, cooldown: 3 },
          { id: 'squeeze', name: '狭い隙間', cost: 0, cooldown: 0 },
        ],
        senseMode: 'ultraviolet',
        color: 0xaa8844,
      },
      fox: {
        name: 'キツネ',
        emoji: '🦊',
        speed: 13,
        jump: 13,
        canFly: false,
        abilities: [
          { id: 'pounce', name: '飛び掛かり攻撃', cost: 20, cooldown: 2 },
          { id: 'dash', name: 'アジリティダッシュ', cost: 15, cooldown: 2 },
        ],
        senseMode: 'normal',
        color: 0xff9944,
      },
      snake: {
        name: 'ヘビ',
        emoji: '🐍',
        speed: 10,
        jump: 8,
        canFly: false,
        abilities: [
          { id: 'coil', name: '巻きつき拘束', cost: 25, cooldown: 4 },
          { id: 'venom', name: '毒液攻撃', cost: 20, cooldown: 3 },
        ],
        senseMode: 'thermal',
        color: 0x44aa44,
      },
      eagle: {
        name: 'ワシ',
        emoji: '🦅',
        speed: 11,
        jump: 10,
        canFly: true,
        abilities: [
          { id: 'dive', name: '急降下攻撃', cost: 30, cooldown: 3 },
          { id: 'soar', name: '上昇気流', cost: 20, cooldown: 2 },
        ],
        senseMode: 'highres',
        color: 0xddaa44,
      },
      wolf: {
        name: 'オオカミ',
        emoji: '🐺',
        speed: 12,
        jump: 11,
        canFly: false,
        abilities: [
          { id: 'howl', name: '咆哮バフ', cost: 25, cooldown: 5 },
          { id: 'pack', name: '群れ指揮', cost: 30, cooldown: 4 },
        ],
        senseMode: 'normal',
        color: 0x888888,
      },
    };
  }

  /**
   * Transform to a new form
   */
  async transformTo(formId) {
    if (this.isTransforming) return;
    if (!this.abilities[formId]) return;

    const fromForm = this.abilities[this.player.currentForm];
    const toForm = this.abilities[formId];

    this.isTransforming = true;
    this.transforming = formId;
    this.transformProgress = 0;

    // Consume instinct
    this.player.instinct = Math.max(0, this.player.instinct - 10);

    // Play transformation effect
    this.playTransformEffect(fromForm, toForm);

    // Animate transformation
    while (this.transformProgress < 1) {
      this.transformProgress += 0.016 / this.transformDuration; // Assuming 60fps
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    this.player.currentForm = formId;
    this.isTransforming = false;
    this.transforming = null;

    // Update player stats
    this.updatePlayerStats(toForm);
  }

  /**
   * Play transformation visual effect
   */
  playTransformEffect(fromForm, toForm) {
    const playerMesh = this.player.mesh;
    const startColor = new THREE.Color(fromForm.color);
    const endColor = new THREE.Color(toForm.color);

    // Morph animation
    const animateTransform = () => {
      const progress = this.transformProgress;
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      // Color transition
      const currentColor = startColor.clone().lerp(endColor, easedProgress);
      playerMesh.material.color.copy(currentColor);

      // Scale pulse
      const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
      playerMesh.scale.set(scale, scale, scale);

      // Emit particles
      if (Math.random() < 0.3) {
        this.emitTransformParticle(playerMesh.position, currentColor);
      }

      if (this.transformProgress < 1) {
        requestAnimationFrame(animateTransform);
      } else {
        playerMesh.scale.set(1, 1, 1);
      }
    };

    animateTransform();
  }

  /**
   * Emit transformation particle
   */
  emitTransformParticle(position, color) {
    const scene = this.player.scene;
    
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    particle.position.add(new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ));

    scene.add(particle);

    // Animate particle
    let lifespan = 0.5;
    const animate = () => {
      lifespan -= 0.016;
      if (lifespan > 0) {
        particle.position.y += 0.05;
        particle.material.opacity = lifespan / 0.5;
        requestAnimationFrame(animate);
      } else {
        scene.remove(particle);
        geometry.dispose();
        material.dispose();
      }
    };

    animate();
  }

  /**
   * Update player stats based on form
   */
  updatePlayerStats(form) {
    this.player.speed = form.speed;
    this.player.jumpForce = form.jump;
    this.player.mesh.material.color.setHex(form.color);

    // Update max stats based on form
    switch (this.player.currentForm) {
      case 'mouse':
        this.player.maxHp = 60;
        this.player.attackDamage = 8;
        break;
      case 'fox':
        this.player.maxHp = 80;
        this.player.attackDamage = 12;
        break;
      case 'snake':
        this.player.maxHp = 100;
        this.player.attackDamage = 15;
        break;
      case 'eagle':
        this.player.maxHp = 90;
        this.player.attackDamage = 18;
        break;
      case 'wolf':
        this.player.maxHp = 110;
        this.player.attackDamage = 20;
        break;
    }

    this.player.hp = Math.min(this.player.hp, this.player.maxHp);
  }

  /**
   * Get current form abilities
   */
  getCurrentAbilities() {
    return this.abilities[this.player.currentForm]?.abilities || [];
  }

  /**
   * Use ability
   */
  useAbility(abilityId) {
    const form = this.abilities[this.player.currentForm];
    if (!form) return false;

    const ability = form.abilities.find(a => a.id === abilityId);
    if (!ability) return false;

    // Check instinct cost
    if (this.player.instinct < ability.cost) {
      console.log('Not enough instinct');
      return false;
    }

    // Consume instinct
    this.player.instinct -= ability.cost;

    // Execute ability
    this.executeAbility(abilityId);
    return true;
  }

  /**
   * Execute ability logic
   */
  executeAbility(abilityId) {
    const form = this.player.currentForm;

    switch (form) {
      case 'mouse':
        if (abilityId === 'sneak') this.abilitySneak();
        if (abilityId === 'squeeze') this.abilitySqueeze();
        break;
      case 'fox':
        if (abilityId === 'pounce') this.abilityPounce();
        if (abilityId === 'dash') this.abilityDash();
        break;
      case 'snake':
        if (abilityId === 'coil') this.abilityCoil();
        if (abilityId === 'venom') this.abilityVenom();
        break;
      case 'eagle':
        if (abilityId === 'dive') this.abilityDive();
        if (abilityId === 'soar') this.abilitySoar();
        break;
      case 'wolf':
        if (abilityId === 'howl') this.abilityHowl();
        if (abilityId === 'pack') this.abilityPack();
        break;
    }
  }

  // ========== Ability Implementations ==========

  abilitySneak() {
    // Temporary speed boost and invisibility
    this.player.speed *= 1.5;
    this.player.mesh.material.opacity = 0.5;
    setTimeout(() => {
      this.player.speed /= 1.5;
      this.player.mesh.material.opacity = 1;
    }, 2000);
  }

  abilitySqueeze() {
    // Reduce collision radius for tight spaces
    this.player.physicsBody.radius *= 0.5;
    setTimeout(() => {
      this.player.physicsBody.radius *= 2;
    }, 3000);
  }

  abilityPounce() {
    // Jump attack
    const direction = new THREE.Vector3(
      Math.sin(this.player.yaw),
      0.5,
      Math.cos(this.player.yaw)
    ).normalize();
    this.player.velocity.addScaledVector(direction, 20);
    this.player.attackDamage *= 1.5;
    setTimeout(() => {
      this.player.attackDamage /= 1.5;
    }, 1000);
  }

  abilityDash() {
    // Quick dash in movement direction
    const direction = new THREE.Vector3(
      Math.sin(this.player.yaw),
      0,
      Math.cos(this.player.yaw)
    ).normalize();
    this.player.velocity.addScaledVector(direction, 25);
  }

  abilityCoil() {
    // Stun nearby enemies
    console.log('Coil ability - stun nearby enemies');
  }

  abilityVenom() {
    // Poison damage over time
    this.player.attackDamage *= 1.3;
    setTimeout(() => {
      this.player.attackDamage /= 1.3;
    }, 5000);
  }

  abilityDive() {
    // Dive attack from air
    this.player.velocity.y = -30;
    this.player.attackDamage *= 2;
    setTimeout(() => {
      this.player.attackDamage /= 2;
    }, 1000);
  }

  abilitySoar() {
    // Gain altitude
    this.player.velocity.y = 20;
  }

  abilityHowl() {
    // Buff nearby allies and stun enemies
    console.log('Howl ability - buff allies and stun enemies');
  }

  abilityPack() {
    // Summon pack members
    console.log('Pack ability - summon pack members');
  }

  /**
   * Get sense mode for current form
   */
  getSenseMode() {
    return this.abilities[this.player.currentForm]?.senseMode || 'normal';
  }

  /**
   * Apply sense mode visual effect
   */
  applySenseModeEffect(camera, senseMode) {
    // This would be applied to the camera/renderer
    // Different color grading and effects for each sense mode
    switch (senseMode) {
      case 'ultraviolet':
        // Blue-purple tint, see hidden things
        break;
      case 'thermal':
        // Red-green thermal vision
        break;
      case 'highres':
        // High contrast, far vision
        break;
      case 'normal':
      default:
        // Normal vision
        break;
    }
  }
}

export default TransformationSystem;
