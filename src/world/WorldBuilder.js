/**
 * World Builder - Constructs stages and environments
 */

import * as THREE from 'three';
import { rand, randInt, terrainHeight, makeNoise } from '../core/utils.js';

export class WorldBuilder {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.getScene();
    this.physics = engine.getPhysics();
    this.noise = engine.noise;
    this.currentStage = null;
    this.groundMesh = null;
    this.waterMesh = null;
    this.props = [];
  }

  /**
   * Build a stage
   */
  buildStage(stageIndex) {
    // Clear previous stage
    this.clearStage();

    const stages = [
      {
        id: 0,
        name: '草原の夜明け',
        ground: 0x7a9a6a,
        water: 0x2a4a5a,
        hasWater: true,
      },
      {
        id: 1,
        name: '湿地のヘビ王国',
        ground: 0x6a8a6a,
        water: 0x244a44,
        hasWater: true,
      },
      {
        id: 2,
        name: '断崖のワシの縄張り',
        ground: 0x8a8a7a,
        water: 0x2a4a5a,
        hasWater: false,
      },
      {
        id: 3,
        name: '森のオオカミ群れ',
        ground: 0x5a7a5a,
        water: 0x2a4a5a,
        hasWater: false,
      },
      {
        id: 4,
        name: '人間の村',
        ground: 0x8a8a8a,
        water: 0x2a4a5a,
        hasWater: false,
      },
      {
        id: 5,
        name: '文明の心臓部',
        ground: 0x6a6a6a,
        water: 0x2a4a5a,
        hasWater: false,
      },
    ];

    const stage = stages[stageIndex] || stages[0];
    this.currentStage = stage;
    this.engine.stageIndex = stageIndex;

    console.log(`Building stage: ${stage.name}`);

    // Build terrain
    this.buildTerrain(stage);

    // Build props
    this.buildProps(stage);

    // Build water if needed
    if (stage.hasWater) {
      this.buildWater(stage);
    }

    // Add colliders to physics
    if (this.groundMesh) {
      this.physics.addCollider(this.groundMesh, 'terrain');
    }

    return stage;
  }

  /**
   * Build terrain mesh
   */
  buildTerrain(stage) {
    const WORLD_SIZE = 240;
    const GROUND_SEG = 96;

    if (this.groundMesh) {
      this.scene.remove(this.groundMesh);
      this.groundMesh.geometry.dispose();
    }

    const geo = new THREE.PlaneGeometry(WORLD_SIZE * 1.4, WORLD_SIZE * 1.4, GROUND_SEG, GROUND_SEG);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = [];
    const base = new THREE.Color(stage.ground);
    const hi = base.clone().offsetHSL(0, 0.05, 0.12);
    const lo = base.clone().offsetHSL(0, -0.05, -0.10);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this.getTerrainHeight(x, z, stage);
      pos.setY(i, h);

      const t = Math.max(0, Math.min(1, (h + 6) / 18));
      const c = lo.clone().lerp(hi, t);
      c.offsetHSL(0, 0, this.noise(x * 0.2, z * 0.2) * 0.05);
      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: false,
    });

    this.groundMesh = new THREE.Mesh(geo, mat);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  /**
   * Get terrain height at position
   */
  getTerrainHeight(x, z, stage) {
    const n = this.noise;
    const s = stage.id;
    let h = 0;

    if (s === 2) {
      // Cliff stage - big elevation
      h += n(x * 0.012, z * 0.012) * 14;
      h += n(x * 0.04, z * 0.04) * 4;
      // Central plateau
      const d = Math.sqrt(x * x + z * z);
      h += Math.max(0, Math.min(18, (40 - d) * 0.5));
    } else if (s === 5) {
      // City - mostly flat platforms
      h += n(x * 0.02, z * 0.02) * 1.5;
    } else {
      h += n(x * 0.018, z * 0.018) * 5.5;
      h += n(x * 0.06, z * 0.06) * 1.4;
    }

    // Gentle bowl to keep player in
    const d2 = x * x + z * z;
    const WORLD_SIZE = 240;
    h -= Math.max(0, (d2 - (WORLD_SIZE * 0.55) * (WORLD_SIZE * 0.55)) * 0.0006);

    return h;
  }

  /**
   * Build props (trees, rocks, buildings)
   */
  buildProps(stage) {
    const WORLD_SIZE = 240;
    const R = WORLD_SIZE * 0.5;

    const treeCount = stage.id === 5 ? 0 : (stage.id === 3 ? 70 : 46);
    const rockCount = stage.id === 2 ? 80 : 34;

    // Trees
    for (let i = 0; i < treeCount; i++) {
      const x = rand(-R, R);
      const z = rand(-R, R);
      if (x * x + z * z < 100 * 100) continue;

      const g = new THREE.Group();
      const th = rand(3, 7);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.45, th, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 1 })
      );
      trunk.position.y = th / 2;
      trunk.castShadow = true;
      g.add(trunk);

      const leafColor = stage.id === 3 ? 0x1f3a24 : stage.id === 1 ? 0x2f5a3a : 0x3a6a3a;
      const lc = new THREE.Color(leafColor).offsetHSL(0, 0, rand(-0.05, 0.06));

      for (let k = 0; k < 3; k++) {
        const leaf = new THREE.Mesh(
          new THREE.IcosahedronGeometry(rand(1.6, 2.6), 0),
          new THREE.MeshStandardMaterial({ color: lc, roughness: 1, flatShading: true })
        );
        leaf.position.set(rand(-0.8, 0.8), th + k * 1.2 - 0.5, rand(-0.8, 0.8));
        leaf.castShadow = true;
        g.add(leaf);
      }

      g.position.set(x, this.getTerrainHeight(x, z, stage), z);
      this.scene.add(g);
      this.props.push(g);
    }

    // Rocks
    for (let i = 0; i < rockCount; i++) {
      const x = rand(-R, R);
      const z = rand(-R, R);
      if (x * x + z * z < 60 * 60) continue;

      const s = rand(0.8, 3.2);
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(s, 0),
        new THREE.MeshStandardMaterial({ color: 0x6a6a64, roughness: 0.95, flatShading: true })
      );
      rock.rotation.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2));
      rock.position.set(x, this.getTerrainHeight(x, z, stage), z);
      rock.castShadow = true;
      this.scene.add(rock);
      this.props.push(rock);
    }
  }

  /**
   * Build water mesh
   */
  buildWater(stage) {
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
    }

    const WORLD_SIZE = 240;
    const wgeo = new THREE.PlaneGeometry(WORLD_SIZE * 1.4, WORLD_SIZE * 1.4, 1, 1);
    wgeo.rotateX(-Math.PI / 2);

    const wmat = new THREE.MeshStandardMaterial({
      color: stage.water,
      transparent: true,
      opacity: 0.78,
      roughness: 0.18,
      metalness: 0.4,
    });

    this.waterMesh = new THREE.Mesh(wgeo, wmat);
    this.waterMesh.position.y = stage.id === 1 ? -1.2 : -3.6;
    this.scene.add(this.waterMesh);
  }

  /**
   * Clear current stage
   */
  clearStage() {
    // Remove ground
    if (this.groundMesh) {
      this.scene.remove(this.groundMesh);
      this.groundMesh.geometry.dispose();
      this.groundMesh = null;
    }

    // Remove water
    if (this.waterMesh) {
      this.scene.remove(this.waterMesh);
      this.waterMesh = null;
    }

    // Remove props
    for (let prop of this.props) {
      this.scene.remove(prop);
      if (prop.geometry) prop.geometry.dispose();
      if (prop.material) prop.material.dispose();
    }
    this.props = [];

    // Clear physics colliders
    this.physics.colliders = [];
  }

  /**
   * Get current stage
   */
  getCurrentStage() {
    return this.currentStage;
  }
}

export default WorldBuilder;
