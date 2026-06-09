/**
 * HUD System V3 - Responsive UI with mobile optimization
 * Inverse Hunter - 食物連鎖を逆走する3DアクションRPG
 */

export class HUDSystemV3 {
  constructor(engine) {
    this.engine = engine;
    this.isMobile = engine.getIsMobile();
    this.player = null;
    this.container = null;
    this.elements = {};

    this.createHUD();
    this.setupEventListeners();
  }

  /**
   * Create HUD
   */
  createHUD() {
    this.container = document.createElement('div');
    this.container.id = 'hud-v3';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 20;
      pointer-events: none;
      font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Segoe UI", sans-serif;
      color: #e8e2d4;
    `;

    // Top left - Player info
    this.createPlayerInfo();

    // Top center - Boss health
    this.createBossHealth();

    // Top right - Mini map
    this.createMinimap();

    // Bottom left - Quest log
    this.createQuestLog();

    // Bottom right - Stats
    this.createStats();

    // Center - Combo counter
    this.createCombo();

    // Center - Damage numbers
    this.createDamageLayer();

    document.body.appendChild(this.container);
  }

  /**
   * Create player info panel
   */
  createPlayerInfo() {
    const panel = document.createElement('div');
    panel.id = 'player-info';
    panel.style.cssText = `
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(10, 15, 20, 0.8);
      border: 1px solid rgba(42, 58, 48, 0.8);
      border-radius: 12px;
      padding: 12px 16px;
      backdrop-filter: blur(4px);
      min-width: 200px;
    `;

    // Form indicator
    const formRow = document.createElement('div');
    formRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    `;

    const formEmoji = document.createElement('span');
    formEmoji.id = 'form-emoji';
    formEmoji.style.cssText = 'font-size: 24px;';
    formEmoji.textContent = '🐭';

    const formName = document.createElement('span');
    formName.id = 'form-name';
    formName.style.cssText = `
      font-size: 14px;
      letter-spacing: 0.1em;
      color: #dfe7df;
    `;
    formName.textContent = 'ネズミ';

    formRow.appendChild(formEmoji);
    formRow.appendChild(formName);
    panel.appendChild(formRow);

    // Health bar
    const hpLabel = document.createElement('div');
    hpLabel.style.cssText = `
      font-size: 11px;
      color: #9fb0a4;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    `;
    hpLabel.innerHTML = '<span>HP</span><span id="hp-text">150/150</span>';
    panel.appendChild(hpLabel);

    const hpBar = document.createElement('div');
    hpBar.style.cssText = `
      height: 8px;
      background: #10171c;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #2a3a30;
      margin-bottom: 8px;
    `;

    const hpFill = document.createElement('div');
    hpFill.id = 'hp-fill';
    hpFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #8a3a3a, #e07b7b);
      transition: width 0.15s;
    `;
    hpBar.appendChild(hpFill);
    panel.appendChild(hpBar);

    // Stamina bar
    const stLabel = document.createElement('div');
    stLabel.style.cssText = `
      font-size: 11px;
      color: #9fb0a4;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    `;
    stLabel.innerHTML = '<span>STAMINA</span><span id="stamina-text">100/100</span>';
    panel.appendChild(stLabel);

    const stBar = document.createElement('div');
    stBar.style.cssText = `
      height: 8px;
      background: #10171c;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #2a3a30;
      margin-bottom: 8px;
    `;

    const stFill = document.createElement('div');
    stFill.id = 'stamina-fill';
    stFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #3a6a8a, #7bd0e0);
      transition: width 0.15s;
    `;
    stBar.appendChild(stFill);
    panel.appendChild(stBar);

    // Instinct bar
    const inLabel = document.createElement('div');
    inLabel.style.cssText = `
      font-size: 11px;
      color: #9fb0a4;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    `;
    inLabel.innerHTML = '<span>INSTINCT</span><span id="instinct-text">100/100</span>';
    panel.appendChild(inLabel);

    const inBar = document.createElement('div');
    inBar.style.cssText = `
      height: 8px;
      background: #10171c;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #2a3a30;
    `;

    const inFill = document.createElement('div');
    inFill.id = 'instinct-fill';
    inFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #c79b4a, #f0d98a);
      transition: width 0.15s;
    `;
    inBar.appendChild(inFill);
    panel.appendChild(inBar);

    this.elements.playerInfo = panel;
    this.container.appendChild(panel);
  }

  /**
   * Create boss health panel
   */
  createBossHealth() {
    const panel = document.createElement('div');
    panel.id = 'boss-health';
    panel.style.cssText = `
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(10, 15, 20, 0.8);
      border: 1px solid rgba(90, 42, 42, 0.8);
      border-radius: 12px;
      padding: 8px 16px;
      backdrop-filter: blur(4px);
      min-width: 300px;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    `;

    const bossName = document.createElement('div');
    bossName.id = 'boss-name';
    bossName.style.cssText = `
      font-size: 14px;
      letter-spacing: 0.12em;
      color: #f0c0c0;
      text-align: center;
      margin-bottom: 6px;
    `;
    bossName.textContent = 'Boss Name';
    panel.appendChild(bossName);

    const bossBar = document.createElement('div');
    bossBar.style.cssText = `
      height: 12px;
      background: #1a0c0c;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #5a2a2a;
      position: relative;
    `;

    const bossFill = document.createElement('div');
    bossFill.id = 'boss-fill';
    bossFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #b03030, #ff6b6b);
      transition: width 0.18s;
    `;
    bossBar.appendChild(bossFill);
    panel.appendChild(bossBar);

    this.elements.bossHealth = panel;
    this.container.appendChild(panel);
  }

  /**
   * Create minimap
   */
  createMinimap() {
    const minimapContainer = document.createElement('div');
    minimapContainer.id = 'minimap-container';
    minimapContainer.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(10, 15, 20, 0.8);
      border: 2px solid rgba(42, 58, 48, 0.8);
      overflow: hidden;
      backdrop-filter: blur(4px);
    `;

    const canvas = document.createElement('canvas');
    canvas.id = 'minimap-canvas';
    canvas.width = 120;
    canvas.height = 120;
    canvas.style.cssText = 'display: block; width: 100%; height: 100%;';
    minimapContainer.appendChild(canvas);

    this.elements.minimap = minimapContainer;
    this.elements.minimapCanvas = canvas;
    this.container.appendChild(minimapContainer);
  }

  /**
   * Create quest log
   */
  createQuestLog() {
    const panel = document.createElement('div');
    panel.id = 'quest-log';
    panel.style.cssText = `
      position: absolute;
      left: 12px;
      bottom: 12px;
      background: rgba(10, 15, 20, 0.8);
      border: 1px solid rgba(42, 58, 48, 0.8);
      border-radius: 10px;
      padding: 12px;
      backdrop-filter: blur(4px);
      max-width: 280px;
      font-size: 11px;
      color: #c8cabd;
      line-height: 1.6;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      color: #c79b4a;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
      font-weight: bold;
    `;
    title.textContent = 'OBJECTIVE';
    panel.appendChild(title);

    const content = document.createElement('div');
    content.id = 'quest-content';
    content.textContent = 'Defeat all enemies to advance';
    panel.appendChild(content);

    this.elements.questLog = panel;
    this.container.appendChild(panel);
  }

  /**
   * Create stats panel
   */
  createStats() {
    const panel = document.createElement('div');
    panel.id = 'stats-panel';
    panel.style.cssText = `
      position: absolute;
      right: 12px;
      bottom: 12px;
      background: rgba(10, 15, 20, 0.8);
      border: 1px solid rgba(42, 58, 48, 0.8);
      border-radius: 10px;
      padding: 12px;
      backdrop-filter: blur(4px);
      max-width: 200px;
      font-size: 11px;
      color: #c8cabd;
      line-height: 1.8;
    `;

    const fpsRow = document.createElement('div');
    fpsRow.style.cssText = 'display: flex; justify-content: space-between;';
    fpsRow.innerHTML = '<span>FPS</span><span id="fps-value">60</span>';
    panel.appendChild(fpsRow);

    const comboRow = document.createElement('div');
    comboRow.style.cssText = 'display: flex; justify-content: space-between;';
    comboRow.innerHTML = '<span>COMBO</span><span id="combo-value">0</span>';
    panel.appendChild(comboRow);

    const enemiesRow = document.createElement('div');
    enemiesRow.style.cssText = 'display: flex; justify-content: space-between;';
    enemiesRow.innerHTML = '<span>ENEMIES</span><span id="enemies-value">0</span>';
    panel.appendChild(enemiesRow);

    this.elements.stats = panel;
    this.container.appendChild(panel);
  }

  /**
   * Create combo counter
   */
  createCombo() {
    const combo = document.createElement('div');
    combo.id = 'combo-counter';
    combo.style.cssText = `
      position: absolute;
      left: 50%;
      bottom: 100px;
      transform: translateX(-50%);
      font-size: clamp(24px, 5vw, 48px);
      color: #ffd86b;
      letter-spacing: 0.06em;
      font-weight: 700;
      opacity: 0;
      text-shadow: 0 0 14px rgba(199, 155, 74, 0.6);
      transition: opacity 0.2s;
      pointer-events: none;
    `;
    combo.textContent = 'COMBO x0';

    this.elements.combo = combo;
    this.container.appendChild(combo);
  }

  /**
   * Create damage layer
   */
  createDamageLayer() {
    const layer = document.createElement('div');
    layer.id = 'damage-layer';
    layer.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 19;
      pointer-events: none;
      overflow: hidden;
    `;

    this.elements.damageLayer = layer;
    this.container.appendChild(layer);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', () => this.updateLayout());
    window.addEventListener('orientationchange', () => this.updateLayout());
  }

  /**
   * Update layout
   */
  updateLayout() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    // Adjust panel sizes for mobile
    if (this.isMobile) {
      if (isLandscape) {
        this.elements.playerInfo.style.minWidth = '160px';
        this.elements.playerInfo.style.padding = '8px 12px';
        this.elements.playerInfo.style.fontSize = '10px';
      } else {
        this.elements.playerInfo.style.minWidth = '200px';
        this.elements.playerInfo.style.padding = '12px 16px';
        this.elements.playerInfo.style.fontSize = '11px';
      }
    }
  }

  /**
   * Update HUD with player stats
   */
  update(player) {
    if (!player) return;

    const stats = player.getStats();

    // Update form
    this.elements.playerInfo.querySelector('#form-emoji').textContent = stats.formEmoji;
    this.elements.playerInfo.querySelector('#form-name').textContent = stats.formName;

    // Update bars
    const hpPercent = (stats.hp / stats.maxHp) * 100;
    const staminaPercent = (stats.stamina / stats.maxStamina) * 100;
    const instinctPercent = (stats.instinct / stats.maxInstinct) * 100;

    this.elements.playerInfo.querySelector('#hp-fill').style.width = `${hpPercent}%`;
    this.elements.playerInfo.querySelector('#stamina-fill').style.width = `${staminaPercent}%`;
    this.elements.playerInfo.querySelector('#instinct-fill').style.width = `${instinctPercent}%`;

    // Update text
    this.elements.playerInfo.querySelector('#hp-text').textContent = `${Math.ceil(stats.hp)}/${stats.maxHp}`;
    this.elements.playerInfo.querySelector('#stamina-text').textContent = `${Math.ceil(stats.stamina)}/${stats.maxStamina}`;
    this.elements.playerInfo.querySelector('#instinct-text').textContent = `${Math.ceil(stats.instinct)}/${stats.maxInstinct}`;

    // Update combo
    if (stats.combo > 0) {
      this.elements.combo.textContent = `COMBO x${stats.combo}`;
      this.elements.combo.style.opacity = '1';
    } else {
      this.elements.combo.style.opacity = '0';
    }

    // Update stats
    this.elements.stats.querySelector('#combo-value').textContent = stats.combo;
    this.elements.stats.querySelector('#fps-value').textContent = this.engine.getFPS();
    this.elements.stats.querySelector('#enemies-value').textContent = this.engine.getEnemies().length;
  }

  /**
   * Show boss health
   */
  showBossHealth(bossName, hp, maxHp) {
    const panel = this.elements.bossHealth;
    panel.querySelector('#boss-name').textContent = bossName;
    panel.querySelector('#boss-fill').style.width = `${(hp / maxHp) * 100}%`;
    panel.style.opacity = '1';
  }

  /**
   * Hide boss health
   */
  hideBossHealth() {
    this.elements.bossHealth.style.opacity = '0';
  }

  /**
   * Add damage number
   */
  addDamageNumber(position, damage, isCrit = false) {
    const number = document.createElement('div');
    number.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y}px;
      font-weight: 800;
      font-size: ${isCrit ? '28px' : '20px'};
      color: ${isCrit ? '#ff4444' : '#ffe066'};
      text-shadow: 0 1px 4px #000;
      pointer-events: none;
      z-index: 19;
      animation: damageFloat 0.8s ease-out forwards;
    `;
    number.textContent = isCrit ? `${Math.ceil(damage)}!` : Math.ceil(damage);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes damageFloat {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-60px); }
      }
    `;
    if (!document.querySelector('style[data-damage-animation]')) {
      style.setAttribute('data-damage-animation', 'true');
      document.head.appendChild(style);
    }

    this.elements.damageLayer.appendChild(number);

    setTimeout(() => number.remove(), 800);
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

export default HUDSystemV3;
