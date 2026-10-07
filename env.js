/**
 * Environment configuration loader
 * Reads from .env file or local definitions
 */
window.ENV = {
  GEMINI_API_KEY: "", // Will be auto-loaded from .env or can be set here
  GEMINI_MODEL: "gemini-3.8-flash"
};

// Auto-fetch .env file if hosted on http/https local server
(async function loadEnvFile() {
  try {
    const res = await fetch('.env');
    if (res.ok) {
      const text = await res.text();
      text.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          const val = values.join('=').trim().replace(/^["']|["']$/g, '');
          if (key.trim() === 'GEMINI_API_KEY' && val && val !== 'YOUR_GEMINI_API_KEY_HERE') {
            window.ENV.GEMINI_API_KEY = val;
            console.log("Loaded GEMINI_API_KEY from .env");
          }
          if (key.trim() === 'GEMINI_MODEL' && val) {
            window.ENV.GEMINI_MODEL = val;
          }
        }
      });
    }
  } catch (e) {
    // Expected on direct file:// protocol
  }
})();
