/**
 * Game Engine - Core engine loop and initialization
 */

import * as THREE from 'three';
import InputManager from '../input/InputManager.js';
import { CameraSystem } from './CameraSystem.js';
import { PhysicsSystem } from './PhysicsSystem.js';
import { makeNoise } from './utils.js';

export class GameEngine {
  constructor(containerElement) {
    this.container = containerElement;
    this.running = false;
    this.deltaTime = 0;
    this.clock = new THREE.Clock();
    
    // Initialize Three.js
    this.initThreeJS();
    
    // Initialize systems
    this.input = new InputManager();
    this.camera = new CameraSystem(this.scene, this.renderer);
    this.physics = new PhysicsSystem();
    
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

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();
  }

  /**
   * Setup scene lighting
   */
  setupLighting() {
    // Hemisphere light
    const hemi = new THREE.HemisphereLight(0xbfd8e8, 0x3a4a3a, 0.7);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xfff1d0, 1.4);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    
    const sc = sun.shadow.camera;
    sc.left = -80;
    sc.right = 80;
    sc.top = 80;
    sc.bottom = -80;
    sc.near = 1;
    sc.far = 300;
    sun.shadow.bias = -0.0004;
    
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sunLight = sun;

    // Directional light (moon)
    const moon = new THREE.DirectionalLight(0x8ea0d0, 0.0);
    moon.position.set(-30, 60, -20);
    this.scene.add(moon);
    this.moonLight = moon;

    // Ambient point light (rim light following player)
    const rim = new THREE.PointLight(0xffe0a0, 0.0, 30);
    this.scene.add(rim);
    this.rimLight = rim;
  }

  /**
   * Register update callback (called each frame before rendering)
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Register render callback (called each frame for custom rendering)
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

    // Call update callbacks
    for (let callback of this.updateCallbacks) {
      callback(this.deltaTime);
    }

    // Update input (clear pressed actions at the END of frame)
    this.input.update();

    // Call render callbacks
    for (let callback of this.renderCallbacks) {
      callback();
    }

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
   * Get input manager
   */
  getInput() {
    return this.input;
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
   * Get delta time
   */
  getDeltaTime() {
    return this.deltaTime;
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
}

export default GameEngine;
