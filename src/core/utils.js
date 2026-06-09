/**
 * Utility functions for Inverse Hunter game engine
 */

export const TAU = Math.PI * 2;
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

/**
 * Clamp a value between min and max
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Smooth step interpolation (Hermite)
 */
export function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * 2D distance squared
 */
export function dist2(x1, z1, x2, z2) {
  const dx = x1 - x2;
  const dz = z1 - z2;
  return dx * dx + dz * dz;
}

/**
 * 2D distance
 */
export function dist(x1, z1, x2, z2) {
  return Math.sqrt(dist2(x1, z1, x2, z2));
}

/**
 * Random number between min and max
 */
export function rand(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Random integer between min and max (inclusive)
 */
export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

/**
 * Perlin-like noise function (simple implementation)
 */
export function makeNoise(seed) {
  const p = [];
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }
  // Fisher-Yates shuffle with seed
  let random = mulberry32(seed);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  // Duplicate permutation table
  for (let i = 0; i < 256; i++) {
    p[i + 256] = p[i];
  }

  return function noise(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const u = fade(xf);
    const v = fade(yf);
    
    const n00 = grad(p[p[xi] + yi], xf, yf);
    const n10 = grad(p[p[xi + 1] + yi], xf - 1, yf);
    const n01 = grad(p[p[xi] + yi + 1], xf, yf - 1);
    const n11 = grad(p[p[xi + 1] + yi + 1], xf - 1, yf - 1);
    
    const nx0 = lerp(n00, n10, u);
    const nx1 = lerp(n01, n11, u);
    return lerp(nx0, nx1, v);
  };
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function grad(hash, x, y) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 8 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h, s, l) {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Convert RGB to Hex
 */
export function rgbToHex(r, g, b) {
  return (r << 16) | (g << 8) | b;
}

/**
 * Angle between two 2D points
 */
export function angleTo(x1, z1, x2, z2) {
  return Math.atan2(z2 - z1, x2 - x1);
}

/**
 * Normalize angle to [-PI, PI]
 */
export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= TAU;
  while (angle < -Math.PI) angle += TAU;
  return angle;
}

/**
 * Get shortest angle difference
 */
export function angleDiff(a1, a2) {
  let diff = a2 - a1;
  while (diff > Math.PI) diff -= TAU;
  while (diff < -Math.PI) diff += TAU;
  return diff;
}

/**
 * Ease-out cubic
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease-in-out cubic
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease-out elastic
 */
export function easeOutElastic(t) {
  const c5 = (2 * Math.PI) / 4.5;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c5) + 1;
}
