/**
 * Game Engine V2 - Enhanced with advanced systems
 */

import * as THREE from 'three';
import InputManager from '../input/InputManager.js';
import { AdvancedCameraSystem } from './AdvancedCameraSystem.js';
import { AdvancedPhysicsSystem } from './AdvancedPhysicsSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ShaderSystem } from './ShaderSystem.js';
import { makeNoise } from './utils.js';

export class GameEngineV2 {
  constructor(containerElement) {
    this.container = containerElement;
    this.running = false;
    this.deltaTime = 0;
    this.clock = new THREE.Clock();

    // Initialize Three.js
    this.initThreeJS();

    // Initialize systems
    this.input = new InputManager();
    this.camera = new AdvancedCameraSystem(this.scene, this.renderer);
    this.physics = new AdvancedPhysicsSystem();
    this.particles = new ParticleSystem(this.scene);
    this.shaders = new ShaderSystem();

    // Game state
    this.gameState = 'loading'; // loading, menu, playing, paused, gameOver
    this.stageIndex = 0;
    this.noise = makeNoise(1337);

    // Callbacks
    this.updateCallbacks = [];
    this.renderCallbacks = [];

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Initialize Three.js scene, camera, renderer
   */
  initThreeJS() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x9cb0a0, 0.012);
    this.scene.background = new THREE.Color(0x05080c);

    // Renderer with high quality settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();
  }

  /**
   * Setup advanced lighting
   */
  setupLighting() {
    // Hemisphere light
    const hemi = new THREE.HemisphereLight(0xbfd8e8, 0x3a4a3a, 0.8);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xfff1d0, 1.6);
    sun.position.set(50, 100, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;

    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sunLight = sun;

    // Directional light (moon)
    const moon = new THREE.DirectionalLight(0x8ea0d0, 0.0);
    moon.position.set(-40, 80, -30);
    this.scene.add(moon);
    this.moonLight = moon;

    // Ambient point light (rim light following player)
    const rim = new THREE.PointLight(0xffe0a0, 0.0, 40);
    this.scene.add(rim);
    this.rimLight = rim;

    // Add some area lights for better ambience
    const areaLight1 = new THREE.PointLight(0x6b9bff, 0.3, 50);
    areaLight1.position.set(-30, 15, 30);
    this.scene.add(areaLight1);

    const areaLight2 = new THREE.PointLight(0xff9b6b, 0.2, 50);
    areaLight2.position.set(30, 15, -30);
    this.scene.add(areaLight2);
  }

  /**
   * Register update callback
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Register render callback
   */
  onRender(callback) {
    this.renderCallbacks.push(callback);
  }

  /**
   * Start game loop
   */
  start() {
    this.running = true;
    this.gameState = 'playing';
    this.clock.start();
    this.gameLoop();
  }

  /**
   * Stop game loop
   */
  stop() {
    this.running = false;
  }

  /**
   * Main game loop
   */
  gameLoop = () => {
    if (!this.running) return;

    requestAnimationFrame(this.gameLoop);

    // Calculate delta time
    this.deltaTime = Math.min(this.clock.getDelta(), 0.033); // Max 30ms per frame

    // Update physics
    this.physics.update(this.deltaTime);

    // Update particles
    this.particles.update(this.deltaTime);

    // Call update callbacks
    for (let callback of this.updateCallbacks) {
      callback(this.deltaTime);
    }

    // Call render callbacks
    for (let callback of this.renderCallbacks) {
      callback();
    }

    // Update input (clear pressed actions at the END of frame)
    this.input.update();

    // Render scene
    this.renderer.render(this.scene, this.camera.getCamera());
  };

  /**
   * Handle window resize
   */
  onWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.camera.updateProjectionMatrix();
  };

  /**
   * Set game state
   */
  setState(state) {
    this.gameState = state;
  }

  /**
   * Get game state
   */
  getState() {
    return this.gameState;
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
   * Get camera
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Get physics
   */
  getPhysics() {
    return this.physics;
  }

  /**
   * Get input
   */
  getInput() {
    return this.input;
  }

  /**
   * Get particles
   */
  getParticles() {
    return this.particles;
  }

  /**
   * Get shaders
   */
  getShaders() {
    return this.shaders;
  }

  /**
   * Dispose
   */
  dispose() {
    this.running = false;
    this.particles.dispose();
    this.renderer.dispose();
  }
}

export default GameEngineV2;
