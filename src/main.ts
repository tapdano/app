import './polyfills';

import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';

import './theme/shared.css';

import { Buffer } from 'buffer';
window.Buffer = Buffer;

const app = createApp(App)
  .use(IonicVue)
  .use(router);
  
router.isReady().then(() => {
  app.mount('#app');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova atualização encontrada
              notifyUpdate();
            }
          });
        }
      });
    }, (err) => {
      console.log('Service Worker registration failed:', err);
    });
  });
}

function notifyUpdate() {
  const updateDiv = document.createElement('div');
  updateDiv.className = 'update-notification';
  updateDiv.style.position = 'fixed';
  updateDiv.style.bottom = '0';
  updateDiv.style.width = '100%';
  updateDiv.style.backgroundColor = '#ffcc00';
  updateDiv.style.color = '#000';
  updateDiv.style.textAlign = 'center';
  updateDiv.style.padding = '1em';
  updateDiv.innerHTML = `
    <p>A new update is available. Do you want to update now?</p>
    <button id="refresh" style="margin: 0 1em; padding: 1em 2em; background-color: #007bff; color: #fff; border: none; border-radius: 4px;">Update</button>
  `;
  document.body.appendChild(updateDiv);

  const refreshButton = document.getElementById('refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      updateServiceWorker();
    });
  }
}

function updateServiceWorker() {
  navigator.serviceWorker.getRegistration().then(registration => {
    if (registration && registration.waiting) {
      // Envia uma mensagem ao Service Worker esperando
      registration.waiting.postMessage({ action: 'skipWaiting' });
    }
  });
}

navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});