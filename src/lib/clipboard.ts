/**
 * Copies text to clipboard reliably across all environments:
 * - Localhost HTTP & HTTPS
 * - Insecure contexts where navigator.clipboard might fail or be restricted
 * - Mobile and desktop browsers
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API if available and document is focused
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, falling back to execCommand:', err);
    }
  }

  // 2. Fallback: create a temporary hidden textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Ensure element is offscreen, fixed, and invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    // For iOS compatibility
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback execCommand copy failed:', err);
    return false;
  }
}
