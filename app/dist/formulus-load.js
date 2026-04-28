/**
 * Formulus Bridge Loader
 * Provides getFormulus() helper for custom apps running in Formulus WebView
 * Copied from ODE custom app tutorial
 */
(function() {
  let resolvePromise = null;
  let formulusPromise = null;

  // Create the promise that will resolve when formulus is ready
  function createPromise() {
    formulusPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }

  // Initialize the promise
  createPromise();

  // Poll for the formulus API
  function checkForFormulus() {
    if (window.globalThis && window.globalThis.formulus) {
      // Found it! Resolve the promise
      if (resolvePromise) {
        resolvePromise(window.globalThis.formulus);
      }
    } else {
      // Not found yet, check again in 50ms
      setTimeout(checkForFormulus, 50);
    }
  }

  // Start polling
  checkForFormulus();

  // Expose the getFormulus function globally
  window.getFormulus = function() {
    return formulusPromise;
  };

  // Recovery mechanism: if the promise doesn't resolve within 10 seconds,
  // create a new promise and restart polling
  setTimeout(() => {
    if (formulusPromise && typeof formulusPromise.then === 'function') {
      // Check if the promise is still pending
      let isPending = true;
      formulusPromise.then(() => { isPending = false; });
      
      // If it's still pending after 10 seconds, restart
      setTimeout(() => {
        if (isPending) {
          console.warn('Formulus API not found, restarting detection...');
          createPromise();
          checkForFormulus();
        }
      }, 10000);
    }
  }, 10000);
})();
