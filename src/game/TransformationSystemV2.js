/**
 * Transformation System V2 - Enhanced with visual effects and state management
 */

import * as THREE from 'three';

export class TransformationSystemV2 {
  constructor(player) {
    this.player = player;
    this.scene = player.scene;
    this.particles = player.engine.getParticles();

    // Transformation state
    this.isTransforming = false;
    this.transformProgress = 0;
    this.transformDuration = 0.6;
    this.currentForm = 'mouse';
    this.targetForm = 'mouse';

    // Form colors for visual feedback
    this.formColors = {
      mouse: 0xaa8844,
      fox: 0xff9944,
      snake: 0x44aa44,
      eagle: 0xddaa44,
      wolf: 0x888888,
    };

    // Instinct cost per transformation
    this.transformCost = 15;
  }

  /**
   * Transform to a new form
   */
  transformTo(formId) {
    // Check if form is unlocked
    if (!this.player.unlockedForms.includes(formId)) {
      console.log(`Form ${formId} not unlocked`);
      return false;
    }

    // Check if already in this form
    if (this.player.currentForm === formId) {
      return false;
    }

    // Check instinct cost
    if (this.player.instinct < this.transformCost) {
      console.log('Not enough instinct to transform');
      return false;
    }

    // Start transformation
    this.isTransforming = true;
    this.transformProgress = 0;
    this.currentForm = this.player.currentForm;
    this.targetForm = formId;

    // Consume instinct
    this.player.instinct -= this.transformCost;

    // Spawn transformation effect
    this.spawnTransformationEffect();

    return true;
  }

  /**
   * Spawn transformation effect
   */
  spawnTransformationEffect() {
    const pos = this.player.position.clone();

    // Spawn particles
    this.particles.spawnMagicEffect(pos, 0x6b9bff, 24);

    // Camera shake
    this.player.engine.getCamera().shake(0.5, 0.3);

    // Play sound (would be added later)
  }

  /**
   * Update transformation
   */
  update(dt) {
    if (!this.isTransforming) return;

    this.transformProgress += dt / this.transformDuration;

    if (this.transformProgress >= 1) {
      // Complete transformation
      this.isTransforming = false;
      this.transformProgress = 1;
      this.player.currentForm = this.targetForm;

      // Spawn completion effect
      this.particles.spawnMagicEffect(
        this.player.position,
        0x6b9bff,
        16
      );
    } else {
      // Update player visuals during transformation
      this.updateTransformationVisuals();
    }
  }

  /**
   * Update transformation visuals
   */
  updateTransformationVisuals() {
    const progress = this.transformProgress;

    // Lerp between colors
    const fromColor = new THREE.Color(this.formColors[this.currentForm]);
    const toColor = new THREE.Color(this.formColors[this.targetForm]);
    const currentColor = fromColor.lerp(toColor, progress);

    this.player.mesh.material.color.copy(currentColor);

    // Scale effect
    const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
    this.player.mesh.scale.set(scale, scale, scale);

    // Rotation effect
    this.player.group.rotation.y += 0.05;
  }

  /**
   * Get current form
   */
  getCurrentForm() {
    return this.player.forms[this.player.currentForm];
  }

  /**
   * Get target form
   */
  getTargetForm() {
    return this.player.forms[this.targetForm];
  }

  /**
   * Check if transforming
   */
  isTransformingNow() {
    return this.isTransforming;
  }

  /**
   * Get transformation progress (0-1)
   */
  getTransformProgress() {
    return this.transformProgress;
  }

  /**
   * Unlock all forms (for testing)
   */
  unlockAllForms() {
    this.player.unlockedForms = Object.keys(this.player.forms);
  }
}

export default TransformationSystemV2;
