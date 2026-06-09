/**
 * HUD System - Advanced UI and HUD management
 */

export class HUDSystem {
  constructor() {
    this.hudContainer = null;
    this.elements = {};
    this.initializeHUD();
  }

  /**
   * Initialize HUD
   */
  initializeHUD() {
    // Create HUD container
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'hud';
    this.hudContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: 'Arial', sans-serif;
      color: #fff;
      z-index: 100;
    `;
    document.body.appendChild(this.hudContainer);

    // Create health bar
    this.createHealthBar();

    // Create stamina bar
    this.createStaminaBar();

    // Create instinct gauge
    this.createInstinctGauge();

    // Create form indicator
    this.createFormIndicator();

    // Create combo counter
    this.createComboCounter();

    // Create lock-on indicator
    this.createLockOnIndicator();

    // Create wave info
    this.createWaveInfo();

    // Create crosshair
    this.createCrosshair();

    // Create minimap
    this.createMinimap();
  }

  /**
   * Create health bar
   */
  createHealthBar() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: 200px;
      height: 20px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #fff;
      border-radius: 4px;
      overflow: hidden;
    `;

    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ff6b6b, #ff9b6b);
      transition: width 0.1s ease;
    `;

    const text = document.createElement('div');
    text.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: bold;
      color: #fff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    `;

    container.appendChild(bar);
    container.appendChild(text);
    this.hudContainer.appendChild(container);

    this.elements.healthBar = { container, bar, text };
  }

  /**
   * Create stamina bar
   */
  createStaminaBar() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 60px;
      left: 30px;
      width: 200px;
      height: 8px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid #fff;
      border-radius: 2px;
      overflow: hidden;
    `;

    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #6b9bff, #9b6bff);
      transition: width 0.1s ease;
    `;

    container.appendChild(bar);
    this.hudContainer.appendChild(container);

    this.elements.staminaBar = { container, bar };
  }

  /**
   * Create instinct gauge
   */
  createInstinctGauge() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      width: 200px;
      height: 20px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #ffff00;
      border-radius: 4px;
      overflow: hidden;
    `;

    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ffff00, #ff6b6b);
      transition: width 0.1s ease;
    `;

    const text = document.createElement('div');
    text.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: bold;
      color: #fff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    `;

    container.appendChild(bar);
    container.appendChild(text);
    this.hudContainer.appendChild(container);

    this.elements.instinctGauge = { container, bar, text };
  }

  /**
   * Create form indicator
   */
  createFormIndicator() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 30px;
      left: 30px;
      text-align: center;
    `;

    const emoji = document.createElement('div');
    emoji.style.cssText = `
      font-size: 48px;
      margin-bottom: 10px;
    `;

    const name = document.createElement('div');
    name.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: #fff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    `;

    container.appendChild(emoji);
    container.appendChild(name);
    this.hudContainer.appendChild(container);

    this.elements.formIndicator = { container, emoji, name };
  }

  /**
   * Create combo counter
   */
  createComboCounter() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      font-size: 48px;
      font-weight: bold;
      color: #ffff00;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      opacity: 0;
      pointer-events: none;
    `;

    container.textContent = 'COMBO x0';
    this.hudContainer.appendChild(container);

    this.elements.comboCounter = { container };
  }

  /**
   * Create lock-on indicator
   */
  createLockOnIndicator() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border: 3px solid #ff6b6b;
      border-radius: 50%;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    `;

    // Corner markers
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    for (let corner of corners) {
      const marker = document.createElement('div');
      marker.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: #ff6b6b;
      `;

      if (corner === 'top-left') {
        marker.style.cssText += 'top: -6px; left: -6px;';
      } else if (corner === 'top-right') {
        marker.style.cssText += 'top: -6px; right: -6px;';
      } else if (corner === 'bottom-left') {
        marker.style.cssText += 'bottom: -6px; left: -6px;';
      } else if (corner === 'bottom-right') {
        marker.style.cssText += 'bottom: -6px; right: -6px;';
      }

      container.appendChild(marker);
    }

    this.hudContainer.appendChild(container);

    this.elements.lockOnIndicator = { container };
  }

  /**
   * Create wave info
   */
  createWaveInfo() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 30px;
      right: 30px;
      text-align: right;
      font-size: 14px;
      color: #fff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    `;

    this.hudContainer.appendChild(container);

    this.elements.waveInfo = { container };
  }

  /**
   * Create crosshair
   */
  createCrosshair() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      pointer-events: none;
    `;

    // Horizontal line
    const h = document.createElement('div');
    h.style.cssText = `
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 1px;
      background: rgba(255, 255, 255, 0.5);
      transform: translateY(-50%);
    `;

    // Vertical line
    const v = document.createElement('div');
    v.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      width: 1px;
      height: 100%;
      background: rgba(255, 255, 255, 0.5);
      transform: translateX(-50%);
    `;

    // Center dot
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    `;

    container.appendChild(h);
    container.appendChild(v);
    container.appendChild(dot);
    this.hudContainer.appendChild(container);

    this.elements.crosshair = { container };
  }

  /**
   * Create minimap
   */
  createMinimap() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 30px;
      right: 30px;
      width: 150px;
      height: 150px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #fff;
      border-radius: 4px;
      overflow: hidden;
    `;

    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;

    container.appendChild(canvas);
    this.hudContainer.appendChild(container);

    this.elements.minimap = { container, canvas };
  }

  /**
   * Update HUD
   */
  update(playerStats, waveStatus, lockedTarget) {
    // Update health bar
    const healthPercent = (playerStats.hp / playerStats.maxHp) * 100;
    this.elements.healthBar.bar.style.width = healthPercent + '%';
    this.elements.healthBar.text.textContent = `${playerStats.hp}/${playerStats.maxHp}`;

    // Update stamina bar
    const staminaPercent = (playerStats.stamina / playerStats.maxStamina) * 100;
    this.elements.staminaBar.bar.style.width = staminaPercent + '%';

    // Update instinct gauge
    const instinctPercent = (playerStats.instinct / playerStats.maxInstinct) * 100;
    this.elements.instinctGauge.bar.style.width = instinctPercent + '%';
    this.elements.instinctGauge.text.textContent = Math.round(playerStats.instinct);

    // Update form indicator
    this.elements.formIndicator.emoji.textContent = playerStats.formEmoji;
    this.elements.formIndicator.name.textContent = playerStats.formName;

    // Update combo counter
    if (playerStats.combo > 0) {
      this.elements.comboCounter.container.textContent = `COMBO x${playerStats.combo}`;
      this.elements.comboCounter.container.style.opacity = 1;
    } else {
      this.elements.comboCounter.container.style.opacity = 0;
    }

    // Update lock-on indicator
    this.elements.lockOnIndicator.container.style.opacity = lockedTarget ? 1 : 0;

    // Update wave info
    if (waveStatus) {
      this.elements.waveInfo.container.innerHTML = `
        <div>Wave ${waveStatus.waveIndex}/${waveStatus.totalWaves}</div>
        <div>Enemies: ${waveStatus.enemiesAlive}</div>
      `;
    }
  }

  /**
   * Show message
   */
  showMessage(text, duration = 2) {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 32px;
      font-weight: bold;
      color: #ffff00;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      animation: fadeInOut ${duration}s ease-in-out;
      pointer-events: none;
    `;
    message.textContent = text;

    this.hudContainer.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, duration * 1000);
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.hudContainer) {
      this.hudContainer.remove();
    }
  }
}

export default HUDSystem;
