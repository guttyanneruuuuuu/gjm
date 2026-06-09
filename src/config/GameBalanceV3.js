/**
 * Game Balance V3 - Centralized balance configuration
 * All gameplay values in one place for easy tuning
 */

export const GAME_BALANCE = {
  // ========== DIFFICULTY SETTINGS ==========
  difficulty: {
    easy: 0.7,
    normal: 1.0,
    hard: 1.3,
    insane: 1.6,
  },
  currentDifficulty: 'normal',

  // ========== PLAYER STATS ==========
  player: {
    // Health
    maxHp: 150,
    hpRegenRate: 5, // per second out of combat
    hpRegenDelay: 3, // seconds before regen starts

    // Stamina
    maxStamina: 100,
    staminaRegenRate: 30, // per second
    staminaSprintCost: 20, // per second while sprinting

    // Instinct/Mana
    maxInstinct: 100,
    instinctRegenRate: 15, // per second

    // Movement
    baseSpeed: 12,
    sprintMultiplier: 1.4,
    acceleration: 18,
    deceleration: 12,
    jumpForce: 16,
    airControl: 0.6,

    // Combat
    baseAttackDamage: 15,
    attackCooldown: 0.4, // seconds between attacks
    attackRange: 3,
    attackCone: Math.PI / 3, // 60 degrees
    critChance: 0.15,
    critMultiplier: 1.8,

    // Dash
    dashSpeed: 25,
    dashDuration: 0.3,
    dashCooldown: 1.2,
    dashStaminaCost: 20,

    // Lock-on
    lockOnRange: 30,
    lockOnSwitchSpeed: 0.3,
  },

  // ========== FORM STATS ==========
  forms: {
    mouse: {
      name: 'ネズミ',
      emoji: '🐭',
      speedMultiplier: 1.2,
      jumpMultiplier: 1.0,
      damageMultiplier: 0.8,
      defenseMultiplier: 0.7,
      canFly: false,
      specialAbility: 'squeeze', // Can fit through small spaces
    },
    fox: {
      name: 'キツネ',
      emoji: '🦊',
      speedMultiplier: 1.1,
      jumpMultiplier: 1.2,
      damageMultiplier: 1.0,
      defenseMultiplier: 0.9,
      canFly: false,
      specialAbility: 'dodge', // Better dodge chance
    },
    snake: {
      name: 'ヘビ',
      emoji: '🐍',
      speedMultiplier: 0.9,
      jumpMultiplier: 0.7,
      damageMultiplier: 1.1,
      defenseMultiplier: 1.0,
      canFly: false,
      specialAbility: 'poison', // Poison damage over time
    },
    eagle: {
      name: 'ワシ',
      emoji: '🦅',
      speedMultiplier: 1.0,
      jumpMultiplier: 1.5,
      damageMultiplier: 1.2,
      defenseMultiplier: 0.8,
      canFly: true,
      specialAbility: 'dive', // Dive attack
    },
    wolf: {
      name: 'オオカミ',
      emoji: '🐺',
      speedMultiplier: 1.15,
      jumpMultiplier: 1.1,
      damageMultiplier: 1.3,
      defenseMultiplier: 1.1,
      canFly: false,
      specialAbility: 'howl', // AOE damage and buff
    },
  },

  // ========== ENEMY STATS ==========
  enemies: {
    // Small enemies
    small: {
      maxHp: 20,
      attackDamage: 5,
      attackCooldown: 1.5,
      speed: 8,
      senseRange: 20,
      attackRange: 2,
      experienceReward: 10,
      lootChance: 0.3,
    },

    // Medium enemies
    medium: {
      maxHp: 50,
      attackDamage: 12,
      attackCooldown: 1.8,
      speed: 10,
      senseRange: 25,
      attackRange: 2.5,
      experienceReward: 30,
      lootChance: 0.5,
    },

    // Large enemies
    large: {
      maxHp: 100,
      attackDamage: 20,
      attackCooldown: 2.2,
      speed: 9,
      senseRange: 30,
      attackRange: 3,
      experienceReward: 60,
      lootChance: 0.7,
    },

    // Boss enemies
    boss: {
      maxHp: 300,
      attackDamage: 35,
      attackCooldown: 2.5,
      speed: 11,
      senseRange: 40,
      attackRange: 3.5,
      experienceReward: 200,
      lootChance: 1.0,
    },
  },

  // ========== COMBAT MECHANICS ==========
  combat: {
    // Hit detection
    hitChanceBase: 0.85,
    hitChanceBehind: 0.5, // Behind target
    hitChanceAimed: 1.0, // With lock-on

    // Knockback
    knockbackBase: 1.0,
    knockbackMultiplier: 0.5,

    // Combo system
    comboTimeout: 2.0, // seconds
    comboMultiplier: 1.1, // per hit

    // Stagger system
    staggerThreshold: 50, // damage to trigger stagger
    staggerDuration: 0.8,

    // Invulnerability frames
    iFramesDuration: 0.3,
  },

  // ========== CAMERA SETTINGS ==========
  camera: {
    fov: 70,
    freeDistance: 14,
    freeHeight: 8,
    freePitch: 0.3,
    lockDistance: 10,
    lockHeight: 6,
    lockOffsetX: 2,
    lockOffsetZ: 1,
    followSpeed: 0.15,
    rotationSpeed: 0.2,
  },

  // ========== PHYSICS ==========
  physics: {
    gravity: 32,
    groundDrag: 0.1,
    airDrag: 0.02,
    maxVelocity: 50,
  },

  // ========== DIFFICULTY MULTIPLIERS ==========
  difficultyMultipliers: {
    easy: {
      enemyHp: 0.7,
      enemyDamage: 0.6,
      enemySpeed: 0.8,
      playerHp: 1.3,
      playerDamage: 1.2,
      experienceMultiplier: 0.8,
    },
    normal: {
      enemyHp: 1.0,
      enemyDamage: 1.0,
      enemySpeed: 1.0,
      playerHp: 1.0,
      playerDamage: 1.0,
      experienceMultiplier: 1.0,
    },
    hard: {
      enemyHp: 1.3,
      enemyDamage: 1.3,
      enemySpeed: 1.2,
      playerHp: 0.9,
      playerDamage: 0.9,
      experienceMultiplier: 1.5,
    },
    insane: {
      enemyHp: 1.8,
      enemyDamage: 1.8,
      enemySpeed: 1.5,
      playerHp: 0.7,
      playerDamage: 0.7,
      experienceMultiplier: 2.5,
    },
  },

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Get difficulty multiplier
   */
  getDifficultyMultiplier(stat) {
    const diff = this.currentDifficulty;
    const multipliers = this.difficultyMultipliers[diff] || this.difficultyMultipliers.normal;
    return multipliers[stat] || 1.0;
  },

  /**
   * Get player stat with difficulty applied
   */
  getPlayerStat(statName) {
    const baseStat = this.player[statName];
    if (typeof baseStat !== 'number') return baseStat;

    // Apply difficulty multiplier for certain stats
    if (statName === 'maxHp' || statName === 'baseAttackDamage') {
      return baseStat * this.getDifficultyMultiplier(`player${statName.charAt(0).toUpperCase() + statName.slice(1)}`);
    }

    return baseStat;
  },

  /**
   * Get form stat
   */
  getFormStat(formId, statName) {
    const form = this.forms[formId];
    if (!form) return 1;
    return form[statName] || 1;
  },

  /**
   * Get enemy stat with difficulty applied
   */
  getEnemyStat(enemyType, statName) {
    const baseStat = this.enemies[enemyType]?.[statName];
    if (typeof baseStat !== 'number') return baseStat;

    // Apply difficulty multiplier
    const multiplierKey = statName === 'attackDamage' ? 'enemyDamage'
      : statName === 'maxHp' ? 'enemyHp'
      : statName === 'speed' ? 'enemySpeed'
      : null;

    if (multiplierKey) {
      return baseStat * this.getDifficultyMultiplier(multiplierKey);
    }

    return baseStat;
  },

  /**
   * Set difficulty
   */
  setDifficulty(difficulty) {
    if (this.difficultyMultipliers[difficulty]) {
      this.currentDifficulty = difficulty;
      console.log(`Difficulty set to: ${difficulty}`);
    }
  },

  /**
   * Get all form IDs
   */
  getFormIds() {
    return Object.keys(this.forms);
  },

  /**
   * Get all enemy types
   */
  getEnemyTypes() {
    return Object.keys(this.enemies);
  },
};

export default GAME_BALANCE;
