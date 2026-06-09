/**
 * Instinct Gauge System - Manages the instinct resource for transformations and abilities
 */

import { clamp, lerp } from '../core/utils.js';

export class InstinctGauge {
  constructor(player) {
    this.player = player;
    this.maxInstinct = 100;
    this.instinct = this.maxInstinct;
    this.regenRate = 10; // per second in neutral state
    this.regenMultiplier = 1.0;
    this.lastActionTime = 0;
    this.inCombat = false;
    this.combatTimeout = 5; // seconds

    // Form-specific regen bonuses
    this.formRegenBonuses = {
      mouse: { action: 'hiding', bonus: 2.0 },      // Double regen when hiding
      fox: { action: 'running', bonus: 1.5 },       // 1.5x regen when running
      snake: { action: 'coiling', bonus: 1.8 },     // 1.8x regen when coiled
      eagle: { action: 'soaring', bonus: 1.6 },     // 1.6x regen when soaring
      wolf: { action: 'howling', bonus: 2.0 },      // Double regen when howling
    };

    this.currentAction = null;
    this.actionTimer = 0;
  }

  /**
   * Update instinct gauge each frame
   */
  update(dt) {
    // Update combat status
    if (this.inCombat) {
      this.combatTimeout -= dt;
      if (this.combatTimeout <= 0) {
        this.inCombat = false;
      }
    }

    // Calculate regen rate
    let currentRegenRate = this.regenRate * this.regenMultiplier;

    // Apply form-specific bonuses
    if (this.currentAction) {
      const bonus = this.formRegenBonuses[this.player.currentForm];
      if (bonus && bonus.action === this.currentAction) {
        currentRegenRate *= bonus.bonus;
      }
    }

    // Reduce regen in combat
    if (this.inCombat) {
      currentRegenRate *= 0.5;
    }

    // Regenerate instinct
    this.instinct = Math.min(this.maxInstinct, this.instinct + currentRegenRate * dt);

    // Update action timer
    if (this.currentAction) {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.currentAction = null;
      }
    }
  }

  /**
   * Consume instinct for action
   */
  consume(amount) {
    if (this.instinct >= amount) {
      this.instinct -= amount;
      this.inCombat = true;
      this.combatTimeout = 5;
      return true;
    }
    return false;
  }

  /**
   * Set current action for regen bonus
   */
  setAction(actionName, duration = 1) {
    this.currentAction = actionName;
    this.actionTimer = duration;
  }

  /**
   * Clear current action
   */
  clearAction() {
    this.currentAction = null;
    this.actionTimer = 0;
  }

  /**
   * Get instinct percentage (0-1)
   */
  getPercentage() {
    return clamp(this.instinct / this.maxInstinct, 0, 1);
  }

  /**
   * Get instinct status
   */
  getStatus() {
    const percentage = this.getPercentage();
    if (percentage > 0.75) return 'full';
    if (percentage > 0.5) return 'high';
    if (percentage > 0.25) return 'medium';
    return 'low';
  }

  /**
   * Get eye glow color based on instinct
   */
  getEyeGlowColor() {
    const percentage = this.getPercentage();
    
    // Gold when full, gray when empty
    const hue = percentage * 60; // 0-60 degrees (red to yellow)
    const saturation = percentage * 100;
    const lightness = 50;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  /**
   * Check if can perform action
   */
  canPerformAction(cost) {
    return this.instinct >= cost;
  }

  /**
   * Get instinct value
   */
  getValue() {
    return Math.round(this.instinct);
  }

  /**
   * Get max instinct value
   */
  getMaxValue() {
    return this.maxInstinct;
  }

  /**
   * Boost instinct temporarily
   */
  boost(amount, duration) {
    this.instinct = Math.min(this.maxInstinct, this.instinct + amount);
    const originalRegenMultiplier = this.regenMultiplier;
    this.regenMultiplier = 0.5; // Reduced regen during boost

    setTimeout(() => {
      this.regenMultiplier = originalRegenMultiplier;
    }, duration * 1000);
  }

  /**
   * Get instinct regen rate
   */
  getRegenRate() {
    let rate = this.regenRate * this.regenMultiplier;
    
    if (this.currentAction) {
      const bonus = this.formRegenBonuses[this.player.currentForm];
      if (bonus && bonus.action === this.currentAction) {
        rate *= bonus.bonus;
      }
    }

    if (this.inCombat) {
      rate *= 0.5;
    }

    return rate;
  }

  /**
   * Get instinct info for UI
   */
  getInfo() {
    return {
      current: this.getValue(),
      max: this.getMaxValue(),
      percentage: this.getPercentage(),
      status: this.getStatus(),
      eyeColor: this.getEyeGlowColor(),
      regenRate: this.getRegenRate(),
      inCombat: this.inCombat,
      currentAction: this.currentAction,
    };
  }
}

export default InstinctGauge;
