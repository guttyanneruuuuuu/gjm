/**
 * World Builder V2 - Advanced procedural terrain, props, and environment
 */

import * as THREE from 'three';

export class WorldBuilderV2 {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.getScene();
    this.physics = engine.getPhysics();

    this.stages = this.generateStages();
    this.currentStage = null;
    this.terrainMesh = null;
    this.props = [];
  }

  /**
   * Generate stage configurations
   */
  generateStages() {
    return [
      {
        id: 0,
        name: 'Grassland',
        terrain: {
          size: 200,
          segments: 64,
          color: 0x4a9d5f,
          heightScale: 15,
          waterLevel: 0,
        },
        lighting: {
          sunIntensity: 1.6,
          sunColor: 0xfff1d0,
          ambientColor: 0xbfd8e8,
          ambientIntensity: 0.8,
        },
        props: [
          { type: 'tree', count: 30, radius: 100 },
          { type: 'rock', count: 50, radius: 100 },
          { type: 'bush', count: 40, radius: 100 },
        ],
      },
      {
        id: 1,
        name: 'Forest',
        terrain: {
          size: 200,
          segments: 64,
          color: 0x2d6a3e,
          heightScale: 20,
          waterLevel: -2,
        },
        lighting: {
          sunIntensity: 1.2,
          sunColor: 0xd4af8f,
          ambientColor: 0x6b8e6f,
          ambientIntensity: 0.6,
        },
        props: [
          { type: 'tree', count: 60, radius: 100 },
          { type: 'rock', count: 30, radius: 100 },
          { type: 'bush', count: 50, radius: 100 },
        ],
      },
      {
        id: 2,
        name: 'Mountain',
        terrain: {
          size: 250,
          segments: 64,
          color: 0x8b8b7a,
          heightScale: 40,
          waterLevel: 5,
        },
        lighting: {
          sunIntensity: 1.8,
          sunColor: 0xffffff,
          ambientColor: 0x9ca3af,
          ambientIntensity: 0.7,
        },
        props: [
          { type: 'rock', count: 80, radius: 120 },
          { type: 'tree', count: 20, radius: 100 },
        ],
      },
    ];
  }

  /**
   * Build a stage
   */
  buildStage(stageIndex) {
    // Clear previous stage
    this.clearStage();

    const stage = this.stages[stageIndex];
    if (!stage) {
      console.warn(`Stage ${stageIndex} not found`);
      return;
    }

    this.currentStage = stage;

    // Build terrain
    this.buildTerrain(stage.terrain);

    // Update lighting
    this.updateLighting(stage.lighting);

    // Spawn props
    this.spawnProps(stage.props);

    console.log(`Built stage: ${stage.name}`);
  }

  /**
   * Build terrain mesh
   */
  buildTerrain(terrainConfig) {
    const { size, segments, color, heightScale, waterLevel } = terrainConfig;

    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    // Apply height variation using Perlin-like noise
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = this.getTerrainHeight(x, z, heightScale);
      positions.setY(i, height);
    }

    geometry.computeVertexNormals();

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    // Create mesh
    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.castShadow = true;
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Add to physics
    this.physics.addCollider(this.terrainMesh);

    // Add water if needed
    if (waterLevel !== undefined && waterLevel > -100) {
      this.buildWater(size, waterLevel);
    }
  }

  /**
   * Get terrain height at position
   */
  getTerrainHeight(x, z, heightScale) {
    // Simple Perlin-like noise using sine/cosine
    const scale = 0.01;
    const height =
      Math.sin(x * scale) * Math.cos(z * scale) * heightScale * 0.5 +
      Math.sin(x * scale * 0.5) * Math.cos(z * scale * 0.5) * heightScale * 0.3 +
      Math.sin(x * scale * 0.25) * Math.cos(z * scale * 0.25) * heightScale * 0.2;

    return height;
  }

  /**
   * Build water
   */
  buildWater(size, level) {
    const waterGeometry = new THREE.PlaneGeometry(size * 1.5, size * 1.5);
    waterGeometry.rotateX(-Math.PI / 2);

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.6,
    });

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = level;
    water.receiveShadow = true;
    this.scene.add(water);

    this.props.push(water);
  }

  /**
   * Update lighting
   */
  updateLighting(lightingConfig) {
    const { sunIntensity, sunColor, ambientColor, ambientIntensity } = lightingConfig;

    // Update sun
    this.engine.sunLight.intensity = sunIntensity;
    this.engine.sunLight.color.setHex(sunColor);

    // Update ambient
    this.engine.hemiLight.intensity = ambientIntensity;
    this.engine.hemiLight.color.setHex(ambientColor);
  }

  /**
   * Spawn props
   */
  spawnProps(propConfigs) {
    for (let propConfig of propConfigs) {
      for (let i = 0; i < propConfig.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * propConfig.radius;

        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = this.getTerrainHeight(x, z, 15);

        const position = new THREE.Vector3(x, y + 1, z);

        let prop;
        switch (propConfig.type) {
          case 'tree':
            prop = this.createTree(position);
            break;
          case 'rock':
            prop = this.createRock(position);
            break;
          case 'bush':
            prop = this.createBush(position);
            break;
          default:
            continue;
        }

        if (prop) {
          this.scene.add(prop);
          this.props.push(prop);
        }
      }
    }
  }

  /**
   * Create tree prop
   */
  createTree(position) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.position.y = 2;
    group.add(trunk);

    // Foliage
    const foliageGeometry = new THREE.SphereGeometry(2, 8, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d6a3e,
      roughness: 0.7,
    });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    foliage.position.y = 4;
    group.add(foliage);

    return group;
  }

  /**
   * Create rock prop
   */
  createRock(position) {
    const geometry = new THREE.IcosahedronGeometry(0.5, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
    });
    const rock = new THREE.Mesh(geometry, material);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.position.copy(position);

    // Random rotation
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    return rock;
  }

  /**
   * Create bush prop
   */
  createBush(position) {
    const geometry = new THREE.SphereGeometry(0.6, 6, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3d7a3e,
      roughness: 0.8,
    });
    const bush = new THREE.Mesh(geometry, material);
    bush.castShadow = true;
    bush.receiveShadow = true;
    bush.position.copy(position);
    bush.scale.y = 0.8;

    return bush;
  }

  /**
   * Clear stage
   */
  clearStage() {
    // Remove terrain
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.physics.removeCollider(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      this.terrainMesh.material.dispose();
      this.terrainMesh = null;
    }

    // Remove props
    for (let prop of this.props) {
      this.scene.remove(prop);
      if (prop.geometry) prop.geometry.dispose();
      if (prop.material) prop.material.dispose();
    }
    this.props = [];
  }

  /**
   * Get current stage
   */
  getCurrentStage() {
    return this.currentStage;
  }

  /**
   * Dispose
   */
  dispose() {
    this.clearStage();
  }
}

export default WorldBuilderV2;
