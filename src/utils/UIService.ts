/**
 * UI utilities for consistent user feedback and error handling
 */

export class UIService {
  static showSuccess(message: string): void {
    alert(message); // In production, use a proper toast/notification system
  }

  static showError(error: any): void {
    const message = error instanceof Error ? error.message : (error?.error || String(error));
    alert(message);
  }

  static async showConfirmation(message: string): Promise<boolean> {
    return confirm(message);
  }

  static showLoading(isLoading: boolean, element?: HTMLElement): void {
    // In production, implement proper loading states
    if (element) {
      element.style.opacity = isLoading ? '0.5' : '1';
      element.style.pointerEvents = isLoading ? 'none' : 'auto';
    }
  }
}