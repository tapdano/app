if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
}

// iOS compatibility polyfills
if (typeof global === 'undefined') {
  window.global = window;
}

if (typeof process === 'undefined') {
  window.process = { env: {} };
}

// Buffer polyfill for iOS
if (typeof Buffer === 'undefined' && typeof window !== 'undefined') {
  try {
    import('buffer').then(bufferModule => {
      window.Buffer = bufferModule.Buffer;
    }).catch(err => {
      console.error('Falha ao importar Buffer:', err);
    });
  } catch (err) {
    console.error('Buffer import falhou:', err);
  }
}