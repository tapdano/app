import type { AlertType } from '@/components/AlertModal.vue';

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  closeButtonText?: string;
  showConfirmCancel?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
}

// Global alert modal reference
let alertModalRef: any = null;

/**
 * UI utilities for consistent user feedback and error handling
 */
export class UIService {
  /**
   * Set the global alert modal reference
   * This should be called from the root component or layout
   */
  static setAlertModal(modalRef: any): void {
    alertModalRef = modalRef;
  }

  /**
   * Show a success alert
   */
  static async showSuccess(message: string, title?: string): Promise<boolean> {
    return this.showAlert({
      message,
      title,
      type: 'success'
    });
  }

  /**
   * Show an error alert
   */
  static async showError(error: any, title?: string): Promise<boolean> {
    const message = error instanceof Error ? error.message : (error?.error || String(error));
    return this.showAlert({
      message,
      title,
      type: 'error'
    });
  }

  /**
   * Show a warning alert
   */
  static async showWarning(message: string, title?: string): Promise<boolean> {
    return this.showAlert({
      message,
      title,
      type: 'warning'
    });
  }

  /**
   * Show an info alert
   */
  static async showInfo(message: string, title?: string): Promise<boolean> {
    return this.showAlert({
      message,
      title,
      type: 'info'
    });
  }

  /**
   * Show a confirmation dialog
   */
  static async showConfirmation(
    message: string, 
    title?: string,
    confirmButtonText: string = 'Confirm',
    cancelButtonText: string = 'Cancel'
  ): Promise<boolean> {
    return this.showAlert({
      message,
      title: title || 'Confirmation',
      type: 'warning',
      showConfirmCancel: true,
      confirmButtonText,
      cancelButtonText
    });
  }

  /**
   * Show a generic alert with custom options
   */
  static async showAlert(options: AlertOptions): Promise<boolean> {
    if (!alertModalRef) {
      console.error('UIService: Modal reference not set. Call UIService.setAlertModal() first.');
      // Fallback to browser alert
      alert(options.message);
      return true;
    }

    try {
      return await alertModalRef.openAlert(options);
    } catch (error) {
      console.error('UIService: Error showing alert:', error);
      // Fallback to browser alert
      alert(options.message);
      return true;
    }
  }
}