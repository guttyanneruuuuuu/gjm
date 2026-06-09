/**
 * Game State Manager - Manages game states and transitions
 */

export class GameStateManager {
  constructor() {
    this.currentState = 'loading';
    this.previousState = null;
    this.states = {};
    this.stateData = {};
    this.listeners = {};

    this.registerDefaultStates();
  }

  /**
   * Register default game states
   */
  registerDefaultStates() {
    this.registerState('loading', {
      onEnter: () => console.log('Entering loading state'),
      onExit: () => console.log('Exiting loading state'),
    });

    this.registerState('menu', {
      onEnter: () => console.log('Entering menu state'),
      onExit: () => console.log('Exiting menu state'),
    });

    this.registerState('playing', {
      onEnter: () => console.log('Entering playing state'),
      onExit: () => console.log('Exiting playing state'),
    });

    this.registerState('paused', {
      onEnter: () => console.log('Entering paused state'),
      onExit: () => console.log('Exiting paused state'),
    });

    this.registerState('gameOver', {
      onEnter: () => console.log('Entering gameOver state'),
      onExit: () => console.log('Exiting gameOver state'),
    });

    this.registerState('victory', {
      onEnter: () => console.log('Entering victory state'),
      onExit: () => console.log('Exiting victory state'),
    });
  }

  /**
   * Register a game state
   */
  registerState(name, handlers = {}) {
    this.states[name] = {
      onEnter: handlers.onEnter || (() => {}),
      onExit: handlers.onExit || (() => {}),
      onUpdate: handlers.onUpdate || (() => {}),
    };
  }

  /**
   * Change to a new state
   */
  changeState(newState, data = {}) {
    if (!this.states[newState]) {
      console.warn(`State ${newState} not registered`);
      return false;
    }

    // Exit current state
    if (this.currentState && this.states[this.currentState]) {
      this.states[this.currentState].onExit();
    }

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateData = data;

    // Enter new state
    this.states[newState].onEnter(data);

    // Emit event
    this.emit('stateChanged', { from: this.previousState, to: newState });

    return true;
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get previous state
   */
  getPreviousState() {
    return this.previousState;
  }

  /**
   * Get state data
   */
  getStateData() {
    return this.stateData;
  }

  /**
   * Update current state
   */
  update(dt) {
    if (this.currentState && this.states[this.currentState]) {
      this.states[this.currentState].onUpdate(dt, this.stateData);
    }
  }

  /**
   * Check if in specific state
   */
  isState(state) {
    return this.currentState === state;
  }

  /**
   * Add state listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove state listener
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    const idx = this.listeners[event].indexOf(callback);
    if (idx > -1) {
      this.listeners[event].splice(idx, 1);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    for (let callback of this.listeners[event]) {
      callback(data);
    }
  }

  /**
   * Get all registered states
   */
  getStates() {
    return Object.keys(this.states);
  }
}

export default GameStateManager;
