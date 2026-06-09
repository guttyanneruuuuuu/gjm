/**
 * Input Manager - Handles keyboard, mouse, touch, and gamepad input
 */

export class InputManager {
  constructor() {
    this.keys = {};
    this.pressed = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseLook = false;
    this.yaw = 0;
    this.pitch = 0;
    this.moveX = 0;
    this.moveZ = 0;
    this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCurrentX = 0;
    this.touchCurrentY = 0;
    this.gamepads = [];
    
    this.setupKeyboardInput();
    this.setupMouseInput();
    this.setupTouchInput();
    this.setupGamepadInput();
  }

  setupKeyboardInput() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  setupMouseInput() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      if (this.mouseLook) {
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;
        
        this.yaw -= movementX * 0.005;
        this.pitch -= movementY * 0.005;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.press('attack');
      if (e.button === 2) this.press('skill');
    });

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  setupTouchInput() {
    const canvas = document.getElementById('game');
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchCurrentX = this.touchStartX;
        this.touchCurrentY = this.touchStartY;
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        this.touchCurrentX = e.touches[0].clientX;
        this.touchCurrentY = e.touches[0].clientY;
        
        // Update camera yaw/pitch based on touch movement
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;
        
        this.yaw -= deltaX * 0.005;
        this.pitch -= deltaY * 0.005;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
      }
    });

    canvas.addEventListener('touchend', (e) => {
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchCurrentX = 0;
      this.touchCurrentY = 0;
    });
  }

  setupGamepadInput() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
    });
  }

  updateGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;

      // Left stick for movement
      if (Math.abs(gp.axes[0]) > 0.1) {
        this.moveX = gp.axes[0];
      } else {
        this.moveX = 0;
      }

      if (Math.abs(gp.axes[1]) > 0.1) {
        this.moveZ = gp.axes[1];
      } else {
        this.moveZ = 0;
      }

      // Right stick for camera
      if (Math.abs(gp.axes[2]) > 0.1) {
        this.yaw -= gp.axes[2] * 0.05;
      }

      if (Math.abs(gp.axes[3]) > 0.1) {
        this.pitch -= gp.axes[3] * 0.05;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
      }

      // Buttons
      if (gp.buttons[0].pressed) this.press('jump');
      if (gp.buttons[1].pressed) this.press('skill');
      if (gp.buttons[2].pressed) this.press('interact');
      if (gp.buttons[3].pressed) this.press('attack');
      if (gp.buttons[4].pressed) this.press('dash');
      if (gp.buttons[5].pressed) this.press('lock');
    }
  }

  /**
   * Get movement input (camera-relative)
   * Returns {x, z} normalized movement vector
   */
  getMovementInput() {
    let ix = 0, iz = 0;

    // Keyboard input - FIXED: Standard WASD/Arrow key mapping
    if (this.keys['w'] || this.keys['arrowup']) iz -= 1;      // W/↑ = forward
    if (this.keys['s'] || this.keys['arrowdown']) iz += 1;    // S/↓ = backward
    if (this.keys['a'] || this.keys['arrowleft']) ix -= 1;    // A/← = left
    if (this.keys['d'] || this.keys['arrowright']) ix += 1;   // D/→ = right

    // Gamepad input
    if (this.moveX || this.moveZ) {
      ix += this.moveX;
      iz += this.moveZ;
    }

    // Normalize
    const il = Math.hypot(ix, iz);
    if (il > 1) {
      ix /= il;
      iz /= il;
    }

    return { x: ix, z: iz, magnitude: il };
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(key) {
    return this.keys[key.toLowerCase()] === true;
  }

  /**
   * Check if shift is held (for sprinting)
   */
  isSprinting() {
    return this.isKeyPressed('shift') || this.isKeyPressed('control');
  }

  /**
   * Check if jump key is pressed
   */
  isJumping() {
    return this.consume('jump');
  }

  /**
   * Check if attack key is pressed
   */
  isAttacking() {
    return this.consume('attack');
  }

  /**
   * Check if skill key is pressed
   */
  isSkilling() {
    return this.consume('skill');
  }

  /**
   * Check if dash key is pressed
   */
  isDashing() {
    return this.consume('dash');
  }

  /**
   * Check if lock-on key is pressed
   */
  isLocking() {
    return this.consume('lock');
  }

  /**
   * Press an action
   */
  press(name) {
    this.pressed[name] = true;
  }

  /**
   * Consume a pressed action (can only be consumed once per frame)
   */
  consume(name) {
    if (this.pressed[name]) {
      this.pressed[name] = false;
      return true;
    }
    return false;
  }

  /**
   * Clear all pressed actions (called at end of frame)
   */
  clearPressed() {
    this.pressed = {};
  }

  /**
   * Request pointer lock for mouse look
   */
  requestPointerLock(element) {
    if (!this.isTouch && !this.mouseLook) {
      element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock;
      element.requestPointerLock();
    }
  }

  /**
   * Exit pointer lock
   */
  exitPointerLock() {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    document.exitPointerLock();
    this.mouseLook = false;
  }

  /**
   * Update input state (called once per frame)
   */
  update() {
    this.updateGamepad();
    this.clearPressed();
  }
}

export default InputManager;
