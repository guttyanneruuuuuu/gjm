/**
 * Mobile Controls V3 - Responsive touch UI for mobile devices
 * Includes: Joystick, action buttons, form wheel, responsive layout
 */

export class MobileControlsV3 {
  constructor(input, engine) {
    this.input = input;
    this.engine = engine;
    this.container = null;
    this.isActive = engine.getIsMobile();

    if (this.isActive) {
      this.createUI();
      this.setupEventListeners();
      this.updateLayout();
    }
  }

  /**
   * Create mobile UI
   */
  createUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'mobile-controls-v3';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 30;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 8px;
      font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Segoe UI", sans-serif;
    `;

    // Left joystick area
    this.createJoystick();

    // Right action buttons area
    this.createActionButtons();

    // Top center form wheel
    this.createFormWheel();

    document.body.appendChild(this.container);
  }

  /**
   * Create joystick
   */
  createJoystick() {
    const joystickContainer = document.createElement('div');
    joystickContainer.id = 'mobile-joystick';
    joystickContainer.style.cssText = `
      position: absolute;
      left: 12px;
      bottom: 12px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 2px solid rgba(255, 255, 255, 0.15);
      pointer-events: auto;
      touch-action: none;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const joystickKnob = document.createElement('div');
    joystickKnob.id = 'mobile-joystick-knob';
    joystickKnob.style.cssText = `
      position: absolute;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(231, 200, 120, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.3);
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    `;

    joystickContainer.appendChild(joystickKnob);
    this.container.appendChild(joystickContainer);

    this.joystickContainer = joystickContainer;
    this.joystickKnob = joystickKnob;

    // Joystick touch handling
    let joystickActive = false;
    let joystickStartX = 0;
    let joystickStartY = 0;

    joystickContainer.addEventListener('touchstart', (e) => {
      joystickActive = true;
      const touch = e.touches[0];
      const rect = joystickContainer.getBoundingClientRect();
      joystickStartX = rect.left + rect.width / 2;
      joystickStartY = rect.top + rect.height / 2;
    });

    document.addEventListener('touchmove', (e) => {
      if (!joystickActive) return;

      const touch = e.touches[0];
      const dx = touch.clientX - joystickStartX;
      const dy = touch.clientY - joystickStartY;
      const distance = Math.hypot(dx, dy);
      const maxDistance = 50;

      let x = dx;
      let y = dy;

      if (distance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        x = Math.cos(angle) * maxDistance;
        y = Math.sin(angle) * maxDistance;
      }

      // Update knob position
      joystickKnob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

      // Update input
      const normalizedX = x / maxDistance;
      const normalizedY = y / maxDistance;
      this.input.setMobileJoystick(normalizedX, normalizedY);
    });

    document.addEventListener('touchend', (e) => {
      if (!joystickActive) return;
      joystickActive = false;

      // Reset knob
      joystickKnob.style.transform = 'translate(-50%, -50%)';
      this.input.setMobileJoystick(0, 0);
    });
  }

  /**
   * Create action buttons
   */
  createActionButtons() {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'mobile-buttons';
    buttonsContainer.style.cssText = `
      position: absolute;
      right: 12px;
      bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: auto;
      z-index: 31;
    `;

    const buttons = [
      { id: 'btn-attack', label: '攻撃', key: 'attack', color: '#d96b6b', size: 60 },
      { id: 'btn-jump', label: 'ジャンプ', key: 'jump', color: '#7bd98b', size: 54 },
      { id: 'btn-dash', label: 'ダッシュ', key: 'dash', color: '#c79b4a', size: 50 },
      { id: 'btn-skill', label: 'スキル', key: 'skill', color: '#6b9ad9', size: 50 },
    ];

    buttons.forEach((btn) => {
      const button = document.createElement('button');
      button.id = btn.id;
      button.innerHTML = btn.label;
      button.style.cssText = `
        width: ${btn.size}px;
        height: ${btn.size}px;
        border-radius: 50%;
        background: ${btn.color}dd;
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: #0a0d12;
        font-weight: bold;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.08s;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 0;
        font-family: inherit;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      `;

      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.style.transform = 'scale(0.85)';
        this.input.press(btn.key);
      });

      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        button.style.transform = 'scale(1)';
      });

      button.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        button.style.transform = 'scale(1)';
      });

      buttonsContainer.appendChild(button);
    });

    this.container.appendChild(buttonsContainer);
  }

  /**
   * Create form wheel
   */
  createFormWheel() {
    const wheelContainer = document.createElement('div');
    wheelContainer.id = 'mobile-form-wheel';
    wheelContainer.style.cssText = `
      position: absolute;
      left: 50%;
      top: 12px;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
      pointer-events: auto;
      z-index: 31;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 80%;
    `;

    const forms = [
      { emoji: '🐭', id: 0, name: 'ネズミ' },
      { emoji: '🦊', id: 1, name: 'キツネ' },
      { emoji: '🐍', id: 2, name: 'ヘビ' },
      { emoji: '🦅', id: 3, name: 'ワシ' },
      { emoji: '🐺', id: 4, name: 'オオカミ' },
    ];

    forms.forEach((form) => {
      const chip = document.createElement('button');
      chip.className = 'form-chip';
      chip.innerHTML = form.emoji;
      chip.title = form.name;
      chip.style.cssText = `
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(10, 15, 20, 0.8);
        border: 1px solid rgba(42, 58, 48, 0.8);
        font-size: 22px;
        cursor: pointer;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        opacity: 0.6;
        backdrop-filter: blur(4px);
      `;

      chip.addEventListener('touchstart', (e) => {
        e.preventDefault();
        chip.style.opacity = '1';
        chip.style.transform = 'scale(1.1)';
        chip.style.borderColor = '#c79b4a';
        chip.style.boxShadow = '0 0 12px rgba(199, 155, 74, 0.6)';
        this.input.press(`form_${form.id}`);
      });

      chip.addEventListener('touchend', (e) => {
        e.preventDefault();
        chip.style.opacity = '0.6';
        chip.style.transform = 'scale(1)';
        chip.style.borderColor = 'rgba(42, 58, 48, 0.8)';
        chip.style.boxShadow = 'none';
      });

      wheelContainer.appendChild(chip);
    });

    this.container.appendChild(wheelContainer);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', () => this.updateLayout());
    window.addEventListener('orientationchange', () => this.updateLayout());
  }

  /**
   * Update layout for responsive design
   */
  updateLayout() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    if (this.joystickContainer) {
      if (isLandscape) {
        this.joystickContainer.style.width = '100px';
        this.joystickContainer.style.height = '100px';
      } else {
        this.joystickContainer.style.width = '120px';
        this.joystickContainer.style.height = '120px';
      }
    }
  }

  /**
   * Show/hide controls
   */
  setVisible(visible) {
    if (this.container) {
      this.container.style.display = visible ? 'flex' : 'none';
    }
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export default MobileControlsV3;
