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

try {
  window.Buffer = Buffer;

  const app = createApp(App)
    .use(IonicVue)
    .use(router);
  
  router.isReady().then(() => {
    app.mount('#app');
  }).catch(error => {
    console.error('Erro no router:', error);
  });

} catch (error) {
  console.error('Erro no main:', error);
}

// Service Worker desabilitado para compatibilidade iOS

/*
if ('serviceWorker' in navigator) {
  alert('DEBUG 19: Service Worker suportado');
  window.addEventListener('load', () => {
    alert('DEBUG 20: Window load, registrando SW');
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      alert('DEBUG 21: Service Worker registrado');
      console.log('Service Worker registered with scope:', registration.scope);
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdate();
            }
          });
        }
      });
    }, (err) => {
      alert('DEBUG 21 ERRO: Falha ao registrar SW - ' + err);
      console.log('Service Worker registration failed:', err);
    });
  });
} else {
  alert('DEBUG 19: Service Worker NÃO suportado');
}
*/

/*
// Funções do Service Worker - Desabilitadas para compatibilidade iOS
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
      registration.waiting.postMessage({ action: 'skipWaiting' });
    }
  });
}
*/

/*
// Service Worker events - Desabilitados para compatibilidade iOS
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
*/

/*
// PWA install prompt - Desabilitado para compatibilidade iOS  
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  //showInstallPromotion();
});

function showInstallPromotion() {
  const installDiv = document.createElement('div');
  installDiv.className = 'install-promotion';
  installDiv.style.position = 'fixed';
  installDiv.style.bottom = '0';
  installDiv.style.width = '100%';
  installDiv.style.backgroundColor = '#ffcc00';
  installDiv.style.color = '#000';
  installDiv.style.textAlign = 'center';
  installDiv.style.padding = '1em';
  installDiv.innerHTML = `
    <p>Install our app for a better experience.</p>
    <button id="install" style="margin: 0 1em; padding: 1em 2em; background-color: #007bff; color: #fff; border: none; border-radius: 4px;">Install</button>
  `;
  document.body.appendChild(installDiv);

  const installButton = document.getElementById('install');
  if (installButton) {
    installButton.addEventListener('click', () => {
      installDiv.style.display = 'none';
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        //(choiceResult.outcome === 'accepted')
        deferredPrompt = null;
      });
    });
  }
}
*/