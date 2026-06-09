/**
 * Mobile Controls - Touch-based controls for mobile devices
 */

export class MobileControls {
  constructor(inputManager) {
    this.input = inputManager;
    this.isActive = this.detectMobile();

    if (this.isActive) {
      this.initializeMobileControls();
    }
  }

  /**
   * Detect if device is mobile
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Initialize mobile controls
   */
  initializeMobileControls() {
    this.createJoystick();
    this.createActionButtons();
    this.createFormWheel();
  }

  /**
   * Create virtual joystick
   */
  createJoystick() {
    const container = document.createElement('div');
    container.id = 'joystick-container';
    container.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 30px;
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: auto;
      z-index: 50;
    `;

    const knob = document.createElement('div');
    knob.id = 'joystick-knob';
    knob.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.05s ease;
    `;

    container.appendChild(knob);
    document.body.appendChild(container);

    this.joystick = { container, knob };

    // Touch events
    container.addEventListener('touchstart', (e) => this.onJoystickStart(e));
    container.addEventListener('touchmove', (e) => this.onJoystickMove(e));
    container.addEventListener('touchend', (e) => this.onJoystickEnd(e));
  }

  /**
   * Joystick touch start
   */
  onJoystickStart(e) {
    e.preventDefault();
    this.joystickActive = true;
  }

  /**
   * Joystick touch move
   */
  onJoystickMove(e) {
    if (!this.joystickActive) return;

    const touch = e.touches[0];
    const rect = this.joystick.container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width / 2 - 20;

    let moveX = dx / maxDistance;
    let moveZ = dy / maxDistance;

    if (distance > maxDistance) {
      moveX = (dx / distance) * 1;
      moveZ = (dy / distance) * 1;
    }

    // Update knob position
    const knobX = (moveX * maxDistance) / 2;
    const knobY = (moveZ * maxDistance) / 2;
    this.joystick.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    // Update input
    this.input.moveX = moveX;
    this.input.moveZ = moveZ;
  }

  /**
   * Joystick touch end
   */
  onJoystickEnd(e) {
    e.preventDefault();
    this.joystickActive = false;
    this.input.moveX = 0;
    this.input.moveZ = 0;
    this.joystick.knob.style.transform = 'translate(-50%, -50%)';
  }

  /**
   * Create action buttons
   */
  createActionButtons() {
    const container = document.createElement('div');
    container.id = 'action-buttons';
    container.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 50;
    `;

    const buttons = [
      { id: 'btn-attack', label: 'A', action: 'attack', color: '#ff6b6b' },
      { id: 'btn-jump', label: 'B', action: 'jump', color: '#6b9bff' },
      { id: 'btn-dash', label: 'X', action: 'dash', color: '#ffff6b' },
      { id: 'btn-skill', label: 'Y', action: 'skill', color: '#6bffff' },
    ];

    for (let btn of buttons) {
      const button = document.createElement('button');
      button.id = btn.id;
      button.textContent = btn.label;
      button.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: ${btn.color};
        color: #000;
        font-weight: bold;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.1s ease;
        pointer-events: auto;
      `;

      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.style.opacity = '1';
        this.input.press(btn.action);
      });

      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        button.style.opacity = '0.7';
      });

      container.appendChild(button);
    }

    document.body.appendChild(container);
    this.actionButtons = container;
  }

  /**
   * Create form transformation wheel
   */
  createFormWheel() {
    const container = document.createElement('div');
    container.id = 'form-wheel';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      right: 30px;
      width: 200px;
      height: 200px;
      transform: translateY(-50%);
      z-index: 50;
      pointer-events: none;
    `;

    const forms = ['mouse', 'fox', 'snake', 'eagle', 'wolf'];
    const emojis = ['🐭', '🦊', '🐍', '🦅', '🐺'];

    for (let i = 0; i < forms.length; i++) {
      const angle = (i / forms.length) * Math.PI * 2;
      const x = Math.cos(angle) * 80;
      const y = Math.sin(angle) * 80;

      const button = document.createElement('button');
      button.textContent = emojis[i];
      button.style.cssText = `
        position: absolute;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 2px solid #fff;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        left: 50%;
        top: 50%;
        transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px));
        opacity: 0.6;
        transition: opacity 0.1s ease;
        pointer-events: auto;
      `;

      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.style.opacity = '1';
        this.input.press(String(i + 1)); // 1-5 for forms
      });

      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        button.style.opacity = '0.6';
      });

      container.appendChild(button);
    }

    document.body.appendChild(container);
    this.formWheel = container;
  }

  /**
   * Update mobile controls
   */
  update() {
    // Movement is handled by joystick
    // Actions are handled by buttons
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.joystick) this.joystick.container.remove();
    if (this.actionButtons) this.actionButtons.remove();
    if (this.formWheel) this.formWheel.remove();
  }
}

export default MobileControls;
