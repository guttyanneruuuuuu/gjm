/**
 * Game Balance Configuration
 * Centralized balance tuning for gameplay mechanics
 */

export const GameBalance = {
  // Player stats
  player: {
    maxHp: 150,
    maxStamina: 100,
    maxInstinct: 100,
    staminaRegenRate: 25,
    instinctRegenRate: 10,
  },

  // Movement
  movement: {
    baseSpeed: 12,
    sprintMultiplier: 1.4,
    acceleration: 14,
    jumpForce: 15,
    dashSpeed: 25,
    dashDuration: 0.2,
    dashCooldown: 0.6,
  },

  // Combat
  combat: {
    baseAttackCooldown: 0.4,
    critChance: 0.15,
    critDamage: 1.5,
    comboTimeout: 3,
    comboMultiplier: 0.15, // Damage increase per combo
    lockOnBonus: 1.15, // Hit chance multiplier
  },

  // Forms
  forms: {
    mouse: {
      speed: 14,
      jump: 12,
      dashSpeed: 28,
      attackRange: 2,
      attackDamage: 8,
      transformCost: 15,
    },
    fox: {
      speed: 13,
      jump: 13,
      dashSpeed: 26,
      attackRange: 3,
      attackDamage: 12,
      transformCost: 15,
    },
    snake: {
      speed: 10,
      jump: 8,
      dashSpeed: 22,
      attackRange: 4,
      attackDamage: 10,
      transformCost: 15,
    },
    eagle: {
      speed: 11,
      jump: 10,
      dashSpeed: 30,
      attackRange: 5,
      attackDamage: 15,
      transformCost: 15,
      canFly: true,
    },
    wolf: {
      speed: 12,
      jump: 11,
      dashSpeed: 25,
      attackRange: 3.5,
      attackDamage: 14,
      transformCost: 15,
    },
  },

  // Enemy types
  enemies: {
    basic: {
      baseHp: 30,
      baseDamage: 8,
      baseSpeed: 8,
      attackRange: 2,
      detectionRange: 30,
      attackCooldown: 1.5,
    },
    fast: {
      baseHp: 20,
      baseDamage: 6,
      baseSpeed: 14,
      attackRange: 1.5,
      detectionRange: 35,
      attackCooldown: 1.2,
    },
    heavy: {
      baseHp: 60,
      baseDamage: 12,
      baseSpeed: 5,
      attackRange: 3,
      detectionRange: 25,
      attackCooldown: 2,
    },
    ranged: {
      baseHp: 25,
      baseDamage: 10,
      baseSpeed: 10,
      attackRange: 15,
      detectionRange: 40,
      attackCooldown: 1.8,
    },
  },

  // Enemy scaling
  enemyScaling: {
    levelMultiplier: 0.3, // Per level above 1
    hpScalePerLevel: 1.3,
    damageScalePerLevel: 1.3,
  },

  // Camera
  camera: {
    freeDistance: 14,
    freeHeight: 8,
    lockDistance: 10,
    lockHeight: 6,
    aimDistance: 6,
    aimHeight: 5,
    aimFOV: 45,
    followSpeed: 0.15,
    rotationSpeed: 0.2,
  },

  // Physics
  physics: {
    gravity: -32,
    groundCheckDistance: 0.5,
    wallSlideThreshold: 0.5,
  },

  // Difficulty multipliers
  difficulty: {
    easy: {
      enemyDamageMultiplier: 0.7,
      enemyHpMultiplier: 0.8,
      playerDamageMultiplier: 1.2,
      playerHpMultiplier: 1.3,
    },
    normal: {
      enemyDamageMultiplier: 1.0,
      enemyHpMultiplier: 1.0,
      playerDamageMultiplier: 1.0,
      playerHpMultiplier: 1.0,
    },
    hard: {
      enemyDamageMultiplier: 1.3,
      enemyHpMultiplier: 1.2,
      playerDamageMultiplier: 0.9,
      playerHpMultiplier: 0.9,
    },
    nightmare: {
      enemyDamageMultiplier: 1.6,
      enemyHpMultiplier: 1.5,
      playerDamageMultiplier: 0.8,
      playerHpMultiplier: 0.8,
    },
  },

  // Rewards
  rewards: {
    killExp: 10,
    waveCompleteExp: 100,
    stageCompleteExp: 500,
  },
};

/**
 * Apply difficulty multipliers
 */
export function applyDifficultyMultipliers(difficulty = 'normal') {
  const multipliers = GameBalance.difficulty[difficulty];
  if (!multipliers) return;

  // This would be called during game initialization
  console.log(`Applied ${difficulty} difficulty multipliers`);
}

/**
 * Get form stats
 */
export function getFormStats(formId) {
  return GameBalance.forms[formId] || GameBalance.forms.mouse;
}

/**
 * Get enemy stats
 */
export function getEnemyStats(type, level = 1) {
  const baseStats = GameBalance.enemies[type] || GameBalance.enemies.basic;
  const multiplier = 1 + (level - 1) * GameBalance.enemyScaling.levelMultiplier;

  return {
    hp: Math.round(baseStats.baseHp * multiplier),
    damage: Math.round(baseStats.baseDamage * multiplier),
    speed: baseStats.baseSpeed,
    attackRange: baseStats.attackRange,
    detectionRange: baseStats.detectionRange,
    attackCooldown: baseStats.attackCooldown,
  };
}

export default GameBalance;
