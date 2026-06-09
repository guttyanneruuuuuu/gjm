/**
 * Input Manager V3 - Complete mobile + PC input handling
 * Fixes: Proper arrow key mapping, mobile joystick, touch buttons
 */

export class InputManagerV3 {
  constructor(isMobile = false) {
    this.isMobile = isMobile;
    this.keys = {};
    this.pressed = {};
    this.held = {};

    // Mouse/pointer
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseLook = false;
    this.yaw = 0;
    this.pitch = 0;

    // Movement input
    this.moveX = 0;
    this.moveZ = 0;

    // Touch input
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchCurrentX = 0;
    this.touchCurrentY = 0;

    // Gamepad
    this.gamepads = [];

    // Mobile controls
    this.mobileJoyX = 0;
    this.mobileJoyY = 0;
    this.mobileAimX = 0;
    this.mobileAimY = 0;

    this.setupKeyboardInput();
    this.setupMouseInput();
    this.setupTouchInput();
    this.setupGamepadInput();
  }

  /**
   * Setup keyboard input with FIXED arrow key mapping
   */
  setupKeyboardInput() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      // Prevent default for game keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'control'].includes(k)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  /**
   * Setup mouse input
   */
  setupMouseInput() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      if (this.mouseLook) {
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;

        this.yaw -= movementX * 0.003;
        this.pitch -= movementY * 0.003;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.mouseLook && !this.isMobile) {
        this.requestPointerLock(document.body);
      }
      if (e.button === 0) this.press('attack');
      if (e.button === 2) this.press('skill');
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouseLook = !!document.pointerLockElement;
    });

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Setup touch input for camera control
   */
  setupTouchInput() {
    const canvas = document.getElementById('game');
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchCurrentX = this.touchStartX;
        this.touchCurrentY = this.touchStartY;
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchCurrentX = touch.clientX;
        this.touchCurrentY = touch.clientY;

        // Only update camera if touch is on right side of screen
        if (this.touchCurrentX > window.innerWidth * 0.5) {
          const deltaX = this.touchCurrentX - this.touchStartX;
          const deltaY = this.touchCurrentY - this.touchStartY;

          this.yaw -= deltaX * 0.008;
          this.pitch -= deltaY * 0.008;
          this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

          this.touchStartX = this.touchCurrentX;
          this.touchStartY = this.touchCurrentY;
        }
      }
    });

    canvas.addEventListener('touchend', (e) => {
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchCurrentX = 0;
      this.touchCurrentY = 0;
    });
  }

  /**
   * Setup gamepad input
   */
  setupGamepadInput() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
    });
  }

  /**
   * Update gamepad state
   */
  updateGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;

      // Left stick for movement
      if (Math.abs(gp.axes[0]) > 0.15) {
        this.moveX = gp.axes[0];
      } else {
        this.moveX = 0;
      }

      if (Math.abs(gp.axes[1]) > 0.15) {
        this.moveZ = gp.axes[1];
      } else {
        this.moveZ = 0;
      }

      // Right stick for camera
      if (Math.abs(gp.axes[2]) > 0.15) {
        this.yaw -= gp.axes[2] * 0.06;
      }

      if (Math.abs(gp.axes[3]) > 0.15) {
        this.pitch -= gp.axes[3] * 0.06;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
      }

      // Buttons
      if (gp.buttons[0].pressed) this.press('jump');
      if (gp.buttons[1].pressed) this.press('skill');
      if (gp.buttons[2].pressed) this.press('interact');
      if (gp.buttons[3].pressed) this.press('attack');
      if (gp.buttons[4].pressed) this.press('dash');
      if (gp.buttons[5].pressed) this.press('lock');
      if (gp.buttons[6].pressed) this.press('form_prev');
      if (gp.buttons[7].pressed) this.press('form_next');
    }
  }

  /**
   * Get movement input (camera-relative)
   * Returns {x, z} normalized movement vector
   */
  getMovementInput() {
    let ix = 0, iz = 0;

    // Keyboard input - FIXED MAPPING
    if (this.keys['w'] || this.keys['arrowup']) iz -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) iz += 1;
    if (this.keys['a'] || this.keys['arrowleft']) ix -= 1;
    if (this.keys['d'] || this.keys['arrowright']) ix += 1;

    // Mobile joystick input
    if (Math.abs(this.mobileJoyX) > 0.1 || Math.abs(this.mobileJoyY) > 0.1) {
      ix += this.mobileJoyX;
      iz += this.mobileJoyY;
    }

    // Gamepad input
    if (Math.abs(this.moveX) > 0.1 || Math.abs(this.moveZ) > 0.1) {
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
   * Set mobile joystick input
   */
  setMobileJoystick(x, y) {
    this.mobileJoyX = x;
    this.mobileJoyY = y;
  }

  /**
   * Set mobile aim input
   */
  setMobileAim(x, y) {
    this.mobileAimX = x;
    this.mobileAimY = y;
  }

  /**
   * Check if key is pressed
   */
  isKeyPressed(key) {
    return this.keys[key.toLowerCase()] === true;
  }

  /**
   * Check if sprinting
   */
  isSprinting() {
    return this.isKeyPressed('shift') || this.isKeyPressed('control');
  }

  /**
   * Check if jumping
   */
  isJumping() {
    return this.consume('jump');
  }

  /**
   * Check if attacking
   */
  isAttacking() {
    return this.consume('attack');
  }

  /**
   * Check if skilling
   */
  isSkilling() {
    return this.consume('skill');
  }

  /**
   * Check if dashing
   */
  isDashing() {
    return this.consume('dash');
  }

  /**
   * Check if locking on
   */
  isLocking() {
    return this.consume('lock');
  }

  /**
   * Check if interacting
   */
  isInteracting() {
    return this.consume('interact');
  }

  /**
   * Check if changing form (next)
   */
  isFormNext() {
    return this.consume('form_next') || this.isKeyPressed('e');
  }

  /**
   * Check if changing form (prev)
   */
  isFormPrev() {
    return this.consume('form_prev') || this.isKeyPressed('q');
  }

  /**
   * Get specific form by number
   */
  getFormByNumber() {
    if (this.consume('1') || this.isKeyPressed('1')) return 0;
    if (this.consume('2') || this.isKeyPressed('2')) return 1;
    if (this.consume('3') || this.isKeyPressed('3')) return 2;
    if (this.consume('4') || this.isKeyPressed('4')) return 3;
    if (this.consume('5') || this.isKeyPressed('5')) return 4;
    return -1;
  }

  /**
   * Press an action
   */
  press(name) {
    this.pressed[name] = true;
  }

  /**
   * Hold an action
   */
  hold(name) {
    this.held[name] = true;
  }

  /**
   * Release an action
   */
  release(name) {
    this.held[name] = false;
  }

  /**
   * Check if held
   */
  isHeld(name) {
    return this.held[name] === true;
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
   * Request pointer lock
   */
  requestPointerLock(element) {
    if (!this.isMobile && !this.mouseLook) {
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

export default InputManagerV3;
