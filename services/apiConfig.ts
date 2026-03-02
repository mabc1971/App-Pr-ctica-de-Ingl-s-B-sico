
/**
 * Utility to retrieve the Gemini API Key from various possible sources.
 * In production (Vercel/GitHub), it relies on environment variables injected at build time.
 * In the AI Studio preview, it can use the platform's key selector.
 */
export const getGeminiApiKey = (): string | undefined => {
  const win = window as any;
  
  // 1. Try build-time injected variables (Vite define)
  // These are replaced by strings during 'npm run build'
  const buildTimeKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (buildTimeKey && buildTimeKey !== 'undefined' && buildTimeKey !== 'null' && buildTimeKey !== '') {
    return buildTimeKey;
  }

  // 2. Try runtime window.process (AI Studio preview environment)
  const runtimeKey = win.process?.env?.GEMINI_API_KEY || win.process?.env?.API_KEY;
  if (runtimeKey) return runtimeKey;

  // 3. Try Vite's standard import.meta.env (if user used VITE_ prefix)
  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY;
  if (viteKey) return viteKey;

  return undefined;
};
