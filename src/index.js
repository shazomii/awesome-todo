import './styles.css';
import { appState, loadState } from './state.js';
import { renderAll } from './ui.js';
import { initializeEventListeners } from './handlers.js';

// Initialize the application
loadState();
renderAll(appState);
initializeEventListeners();