/**
 * Razorpay Instance Manager
 * Prevents multiple Razorpay instances and manages global state
 */

class RazorpayInstanceManager {
  private static instance: RazorpayInstanceManager;
  private currentInstance: any = null;
  private isInitializing: boolean = false;
  private initializationPromise: Promise<any> | null = null;

  static getInstance(): RazorpayInstanceManager {
    if (!RazorpayInstanceManager.instance) {
      RazorpayInstanceManager.instance = new RazorpayInstanceManager();
    }
    return RazorpayInstanceManager.instance;
  }

  /**
   * Check if Razorpay is currently initializing
   */
  isCurrentlyInitializing(): boolean {
    return this.isInitializing;
  }

  /**
   * Set initialization state
   */
  setInitializing(state: boolean): void {
    this.isInitializing = state;
  }

  /**
   * Get current Razorpay instance
   */
  getCurrentInstance(): any {
    return this.currentInstance;
  }

  /**
   * Set current Razorpay instance
   */
  setCurrentInstance(instance: any): void {
    this.currentInstance = instance;
  }

  /**
   * Close current instance and clean up
   */
  closeCurrentInstance(): void {
    if (this.currentInstance) {
      try {
        this.currentInstance.close();
      } catch (e) {
        console.log('Error closing Razorpay instance:', e);
      }
      this.currentInstance = null;
    }
    this.isInitializing = false;
    this.initializationPromise = null;
  }

  /**
   * Wait for initialization to complete
   */
  async waitForInitialization(): Promise<any> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    return null;
  }

  /**
   * Set initialization promise
   */
  setInitializationPromise(promise: Promise<any>): void {
    this.initializationPromise = promise;
  }

  /**
   * Check if instance exists and is valid
   */
  hasValidInstance(): boolean {
    return this.currentInstance !== null && !this.isInitializing;
  }

  /**
   * Reset manager state
   */
  reset(): void {
    this.closeCurrentInstance();
    this.isInitializing = false;
    this.initializationPromise = null;
  }
}

export default RazorpayInstanceManager.getInstance();
