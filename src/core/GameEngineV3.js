/**
 * Game Engine V3 - Complete rewrite with mobile-first design
 * Inverse Hunter - 食物連鎖を逆走する3DアクションRPG
 */

import * as THREE from 'three';
import { AdvancedCameraSystem } from './AdvancedCameraSystem.js';
import { AdvancedPhysicsSystem } from './AdvancedPhysicsSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { InputManager } from '../input/InputManager.js';

export class GameEngineV3 {
  constructor(container) {
    this.container = container;
    this.running = false;
    this.state = 'loading'; // loading, menu, playing, paused, gameOver, victory

    // Timing
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateTime = 0;

    // Three.js setup
    this.initThreeJS();

    // Systems
    this.input = new InputManager();
    this.camera = new AdvancedCameraSystem(this.scene, this.renderer);
    this.physics = new AdvancedPhysicsSystem();
    this.particles = new ParticleSystem(this.scene);

    // Game state
    this.player = null;
    this.enemies = [];
    this.world = null;
    this.updateCallbacks = [];
    this.lateUpdateCallbacks = [];

    // Mobile detection
    this.isMobile = this.detectMobile();
    this.isLandscape = window.innerWidth > window.innerHeight;

    // Event listeners
    this.setupEventListeners();

    console.log(`Game Engine V3 initialized (Mobile: ${this.isMobile}, Landscape: ${this.isLandscape})`);
  }

  /**
   * Initialize Three.js
   */
  initThreeJS() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d12);
    this.scene.fog = new THREE.Fog(0x0a0d12, 200, 500);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.container,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Lighting
    this.setupLighting();

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Setup lighting
   */
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light (sun)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(50, 80, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Rim light
    this.rimLight = new THREE.DirectionalLight(0xff8844, 0.4);
    this.rimLight.position.set(-30, 40, -30);
    this.scene.add(this.rimLight);

    // Sky light
    const skyLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    skyLight.position.set(0, 100, 0);
    this.scene.add(skyLight);
  }

  /**
   * Detect mobile device
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
      || ('ontouchstart' in window);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    window.addEventListener('orientationchange', () => {
      this.isLandscape = window.innerWidth > window.innerHeight;
      this.onWindowResize();
      this.dispatchEvent('orientationchange', { landscape: this.isLandscape });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.setState('paused');
      } else if (this.state === 'paused') {
        this.setState('playing');
      }
    });
  }

  /**
   * Register update callback
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Register late update callback
   */
  onLateUpdate(callback) {
    this.lateUpdateCallbacks.push(callback);
  }

  /**
   * Start game loop
   */
  start() {
    this.running = true;
    this.clock.start();
    this.animate();
  }

  /**
   * Animation loop
   */
  animate = () => {
    requestAnimationFrame(this.animate);

    // Calculate delta time
    this.deltaTime = Math.min(this.clock.getDelta(), 0.016); // Cap at 60fps

    // Update FPS
    this.fpsUpdateTime += this.deltaTime;
    this.frameCount++;
    if (this.fpsUpdateTime >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }

    if (this.state === 'playing') {
      // Update input
      this.input.update();

      // Call update callbacks
      for (const callback of this.updateCallbacks) {
        callback(this.deltaTime);
      }

      // Update physics
      this.physics.step(this.deltaTime);

      // Call late update callbacks
      for (const callback of this.lateUpdateCallbacks) {
        callback(this.deltaTime);
      }
    }

    // Render
    this.renderer.render(this.scene, this.camera.getCamera());
  };

  /**
   * Handle window resize
   */
  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.camera.updateProjectionMatrix();

    this.dispatchEvent('resize', { width, height });
  }

  /**
   * Set game state
   */
  setState(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.dispatchEvent('statechange', { oldState, newState });
    }
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Dispatch event
   */
  dispatchEvent(eventName, data) {
    const event = new CustomEvent(`engine:${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Get scene
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get renderer
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Get camera system
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Get physics system
   */
  getPhysics() {
    return this.physics;
  }

  /**
   * Get particle system
   */
  getParticles() {
    return this.particles;
  }

  /**
   * Get input manager
   */
  getInput() {
    return this.input;
  }

  /**
   * Add enemy
   */
  addEnemy(enemy) {
    if (!this.enemies.includes(enemy)) {
      this.enemies.push(enemy);
    }
  }

  /**
   * Remove enemy
   */
  removeEnemy(enemy) {
    const idx = this.enemies.indexOf(enemy);
    if (idx > -1) {
      this.enemies.splice(idx, 1);
    }
  }

  /**
   * Get all enemies
   */
  getEnemies() {
    return this.enemies;
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.running = false;
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  /**
   * Get FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get delta time
   */
  getDeltaTime() {
    return this.deltaTime;
  }

  /**
   * Check if mobile
   */
  getIsMobile() {
    return this.isMobile;
  }

  /**
   * Check if landscape
   */
  getIsLandscape() {
    return this.isLandscape;
  }
}

export default GameEngineV3;
