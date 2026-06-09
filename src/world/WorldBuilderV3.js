/**
 * World Builder V3 - Stage generation and environment setup
 * Inverse Hunter - 食物連鎖を逆走する3DアクションRPG
 */

import * as THREE from 'three';
import { EnemyV3 } from '../game/EnemyV3.js';

export class WorldBuilderV3 {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.getScene();
    this.currentStage = -1;
  }

  /**
   * Build a stage
   */
  buildStage(stageIndex) {
    // Clear previous stage
    this.clearStage();

    this.currentStage = stageIndex;

    // Build ground
    this.buildGround();

    // Build environment
    this.buildEnvironment(stageIndex);

    // Spawn enemies
    this.spawnEnemies(stageIndex);

    console.log(`Stage ${stageIndex} built`);
  }

  /**
   * Clear stage
   */
  clearStage() {
    // Remove all enemies
    const enemies = this.engine.getEnemies().slice();
    for (const enemy of enemies) {
      enemy.dispose();
    }

    // Remove all meshes except player and camera
    const toRemove = [];
    this.scene.traverse((obj) => {
      if (obj.userData.isStageObject) {
        toRemove.push(obj);
      }
    });

    for (const obj of toRemove) {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
  }

  /**
   * Build ground
   */
  buildGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a6b4a,
      metalness: 0,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.isStageObject = true;
    this.scene.add(ground);

    // Add some terrain variation
    this.addTerrainFeatures();
  }

  /**
   * Add terrain features
   */
  addTerrainFeatures() {
    // Add some hills and obstacles
    const positions = [
      { x: 20, y: 0, z: 20, scale: 3 },
      { x: -20, y: 0, z: 20, scale: 2.5 },
      { x: 20, y: 0, z: -20, scale: 2.8 },
      { x: -20, y: 0, z: -20, scale: 3.2 },
      { x: 0, y: 0, z: 30, scale: 2 },
      { x: 0, y: 0, z: -30, scale: 2.2 },
    ];

    for (const pos of positions) {
      const geometry = new THREE.SphereGeometry(pos.scale, 8, 8);
      const material = new THREE.MeshStandardMaterial({
        color: 0x5a7a5a,
        metalness: 0,
        roughness: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, pos.y + pos.scale * 0.5, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.isStageObject = true;
      this.scene.add(mesh);
    }
  }

  /**
   * Build environment
   */
  buildEnvironment(stageIndex) {
    // Stage-specific environment
    switch (stageIndex) {
      case 0:
        this.buildStage0();
        break;
      case 1:
        this.buildStage1();
        break;
      case 2:
        this.buildStage2();
        break;
      default:
        this.buildStage0();
    }
  }

  /**
   * Build Stage 0 - Grassland
   */
  buildStage0() {
    // Add some trees
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 40;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      this.addTree(x, 0, z);
    }

    // Add some rocks
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      const scale = 0.5 + Math.random() * 1.5;

      this.addRock(x, 0, z, scale);
    }
  }

  /**
   * Build Stage 1 - Forest
   */
  buildStage1() {
    // Add many trees
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;

      this.addTree(x, 0, z);
    }

    // Add dense rocks
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      const scale = 0.8 + Math.random() * 2;

      this.addRock(x, 0, z, scale);
    }
  }

  /**
   * Build Stage 2 - Mountain
   */
  buildStage2() {
    // Add tall trees
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;

      this.addTree(x, 0, z, 2);
    }

    // Add large rocks
    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      const scale = 1.5 + Math.random() * 3;

      this.addRock(x, 0, z, scale);
    }

    // Add mountain peaks
    for (let i = 0; i < 5; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      const scale = 8 + Math.random() * 4;

      this.addMountainPeak(x, 0, z, scale);
    }
  }

  /**
   * Add a tree
   */
  addTree(x, y, z, scale = 1) {
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.4 * scale, 0.5 * scale, 6 * scale, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      metalness: 0,
      roughness: 0.8,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 3 * scale, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.userData.isStageObject = true;
    this.scene.add(trunk);

    // Foliage
    const foliageGeometry = new THREE.SphereGeometry(3 * scale, 8, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7a3a,
      metalness: 0,
      roughness: 0.7,
    });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, y + 7 * scale, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    foliage.userData.isStageObject = true;
    this.scene.add(foliage);
  }

  /**
   * Add a rock
   */
  addRock(x, y, z, scale = 1) {
    const geometry = new THREE.IcosahedronGeometry(scale, 4);
    const material = new THREE.MeshStandardMaterial({
      color: 0x7a7a7a,
      metalness: 0.2,
      roughness: 0.8,
    });
    const rock = new THREE.Mesh(geometry, material);
    rock.position.set(x, y + scale, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.userData.isStageObject = true;
    this.scene.add(rock);
  }

  /**
   * Add a mountain peak
   */
  addMountainPeak(x, y, z, scale = 1) {
    const geometry = new THREE.ConeGeometry(scale * 0.8, scale * 2, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x6a6a6a,
      metalness: 0.1,
      roughness: 0.8,
    });
    const peak = new THREE.Mesh(geometry, material);
    peak.position.set(x, y + scale, z);
    peak.castShadow = true;
    peak.receiveShadow = true;
    peak.userData.isStageObject = true;
    this.scene.add(peak);
  }

  /**
   * Spawn enemies
   */
  spawnEnemies(stageIndex) {
    const spawns = this.getEnemySpawns(stageIndex);

    for (const spawn of spawns) {
      const enemy = new EnemyV3(this.engine, spawn.type, spawn.position);
    }
  }

  /**
   * Get enemy spawns for stage
   */
  getEnemySpawns(stageIndex) {
    switch (stageIndex) {
      case 0:
        return [
          { type: 'small', position: { x: 15, y: 0, z: 15 } },
          { type: 'small', position: { x: -15, y: 0, z: 15 } },
          { type: 'small', position: { x: 15, y: 0, z: -15 } },
          { type: 'medium', position: { x: 0, y: 0, z: 25 } },
        ];
      case 1:
        return [
          { type: 'small', position: { x: 20, y: 0, z: 20 } },
          { type: 'small', position: { x: -20, y: 0, z: 20 } },
          { type: 'small', position: { x: 20, y: 0, z: -20 } },
          { type: 'small', position: { x: -20, y: 0, z: -20 } },
          { type: 'medium', position: { x: 0, y: 0, z: 30 } },
          { type: 'medium', position: { x: 30, y: 0, z: 0 } },
        ];
      case 2:
        return [
          { type: 'medium', position: { x: 20, y: 0, z: 20 } },
          { type: 'medium', position: { x: -20, y: 0, z: 20 } },
          { type: 'medium', position: { x: 20, y: 0, z: -20 } },
          { type: 'medium', position: { x: -20, y: 0, z: -20 } },
          { type: 'large', position: { x: 0, y: 0, z: 35 } },
        ];
      default:
        return [
          { type: 'small', position: { x: 15, y: 0, z: 15 } },
        ];
    }
  }
}

export default WorldBuilderV3;
