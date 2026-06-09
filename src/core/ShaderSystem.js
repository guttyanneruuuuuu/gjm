/**
 * Shader System - Custom shaders for visual effects and form-specific rendering
 */

import * as THREE from 'three';

export class ShaderSystem {
  constructor() {
    this.shaders = {};
    this.initializeShaders();
  }

  /**
   * Initialize all custom shaders
   */
  initializeShaders() {
    // Form-specific color grading vertex shader
    this.shaders.formGrading = {
      vertex: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        uniform sampler2D map;
        uniform vec3 formColor;
        uniform float formIntensity;
        uniform int formType;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vec4 texColor = texture2D(map, vUv);
          vec3 color = texColor.rgb;

          // Form-specific color grading
          if (formType == 0) {
            // Mouse: Purple UV vision
            color = mix(color, vec3(0.7, 0.3, 1.0), formIntensity * 0.3);
          } else if (formType == 1) {
            // Fox: Normal
            color = mix(color, formColor, formIntensity * 0.2);
          } else if (formType == 2) {
            // Snake: Thermal vision
            color = mix(color, vec3(1.0, 0.5, 0.0), formIntensity * 0.4);
          } else if (formType == 3) {
            // Eagle: High contrast
            color = mix(color, color * 1.5, formIntensity * 0.3);
          } else if (formType == 4) {
            // Wolf: Dark vision
            color = mix(color, color * 0.8, formIntensity * 0.2);
          }

          gl_FragColor = vec4(color, texColor.a);
        }
      `,
    };

    // Rim light shader
    this.shaders.rimLight = {
      vertex: `
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        uniform vec3 rimColor;
        uniform float rimWidth;

        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          float rim = 1.0 - dot(vNormal, vViewDir);
          rim = smoothstep(0.0, rimWidth, rim);
          gl_FragColor = vec4(rimColor, rim * 0.6);
        }
      `,
    };

    // Transformation effect shader
    this.shaders.transformEffect = {
      vertex: `
        uniform float transformProgress;
        varying vec3 vPosition;

        void main() {
          vec3 pos = position;
          
          // Morph effect
          pos *= mix(0.8, 1.0, transformProgress);
          
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragment: `
        uniform float transformProgress;
        uniform vec3 fromColor;
        uniform vec3 toColor;

        varying vec3 vPosition;

        void main() {
          vec3 color = mix(fromColor, toColor, transformProgress);
          float alpha = mix(0.5, 1.0, transformProgress);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    };

    // Glow shader for effects
    this.shaders.glow = {
      vertex: `
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        uniform vec3 glowColor;
        uniform float glowIntensity;

        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          float glow = dot(vNormal, vViewDir);
          glow = pow(1.0 - abs(glow), 2.0);
          gl_FragColor = vec4(glowColor, glow * glowIntensity);
        }
      `,
    };

    // Dissolve shader for death/teleport effects
    this.shaders.dissolve = {
      vertex: `
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        uniform sampler2D noiseTexture;
        uniform float dissolveAmount;
        uniform vec3 dissolveColor;

        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          float noise = texture2D(noiseTexture, vPosition.xy * 0.5).r;
          float threshold = dissolveAmount;
          
          if (noise < threshold) {
            discard;
          }
          
          float edge = smoothstep(threshold - 0.1, threshold, noise);
          vec3 color = mix(vec3(1.0), dissolveColor, edge);
          
          gl_FragColor = vec4(color, 1.0 - edge);
        }
      `,
    };
  }

  /**
   * Create material with shader
   */
  createShaderMaterial(shaderName, uniforms = {}) {
    const shader = this.shaders[shaderName];
    if (!shader) {
      console.warn(`Shader ${shaderName} not found`);
      return new THREE.MeshStandardMaterial();
    }

    return new THREE.ShaderMaterial({
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,
      uniforms: {
        ...uniforms,
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Get shader code
   */
  getShader(name) {
    return this.shaders[name];
  }

  /**
   * Add custom shader
   */
  addShader(name, vertexShader, fragmentShader) {
    this.shaders[name] = {
      vertex: vertexShader,
      fragment: fragmentShader,
    };
  }
}

export default ShaderSystem;
