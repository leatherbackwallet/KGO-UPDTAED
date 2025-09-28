/**
 * Resource Manager - Prevents ERR_INSUFFICIENT_RESOURCES errors
 * Manages script loading, cleanup, and resource optimization
 */

class ResourceManager {
  private static instance: ResourceManager;
  private loadedScripts: Set<string> = new Set();
  private loadedStyles: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxScripts: number = 10; // Limit concurrent scripts
  private maxStyles: number = 5; // Limit concurrent styles

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  constructor() {
    this.startCleanup();
  }

  /**
   * Track loaded scripts to prevent duplicates and resource exhaustion
   */
  trackScript(src: string): boolean {
    // Check if we've hit the script limit
    if (this.loadedScripts.size >= this.maxScripts) {
      console.warn('⚠️ Script limit reached, cleaning up old scripts');
      this.cleanupOldScripts();
    }

    if (this.loadedScripts.has(src)) {
      return false; // Already loaded
    }
    this.loadedScripts.add(src);
    return true;
  }

  /**
   * Track loaded styles to prevent duplicates
   */
  trackStyle(href: string): boolean {
    if (this.loadedStyles.size >= this.maxStyles) {
      console.warn('⚠️ Style limit reached, cleaning up old styles');
      this.cleanupOldStyles();
    }

    if (this.loadedStyles.has(href)) {
      return false; // Already loaded
    }
    this.loadedStyles.add(href);
    return true;
  }

  /**
   * Clean up old scripts to prevent resource exhaustion
   */
  private cleanupOldScripts(): void {
    const scripts = document.querySelectorAll('script[src]');
    const scriptArray = Array.from(scripts);
    
    // Remove oldest scripts first
    const scriptsToRemove = scriptArray.slice(0, Math.floor(scriptArray.length / 2));
    scriptsToRemove.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !src.includes('razorpay')) { // Don't remove Razorpay scripts
        script.remove();
        this.loadedScripts.delete(src);
      }
    });
  }

  /**
   * Clean up old styles
   */
  private cleanupOldStyles(): void {
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    const styleArray = Array.from(styles);
    
    const stylesToRemove = styleArray.slice(0, Math.floor(styleArray.length / 2));
    stylesToRemove.forEach(style => {
      const href = style.getAttribute('href');
      if (href) {
        style.remove();
        this.loadedStyles.delete(href);
      }
    });
  }

  /**
   * Clean up unused resources
   */
  cleanup(): void {
    // Remove unused script tags
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !this.loadedScripts.has(src) && !src.includes('razorpay')) {
        script.remove();
      }
    });

    // Remove unused style tags
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    styles.forEach(style => {
      const href = style.getAttribute('href');
      if (href && !this.loadedStyles.has(href)) {
        style.remove();
      }
    });

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000); // Clean up every 30 seconds
  }

  /**
   * Stop cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get resource usage stats
   */
  getStats(): { scripts: number; styles: number; totalElements: number } {
    return {
      scripts: this.loadedScripts.size,
      styles: this.loadedStyles.size,
      totalElements: document.querySelectorAll('script, link').length
    };
  }

  /**
   * Force cleanup of all resources
   */
  forceCleanup(): void {
    console.log('🧹 Force cleaning up resources...');
    
    // Remove all non-essential scripts
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !src.includes('razorpay') && !src.includes('essential')) {
        script.remove();
      }
    });

    // Remove all non-essential styles
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    styles.forEach(style => {
      const href = style.getAttribute('href');
      if (href && !href.includes('essential')) {
        style.remove();
      }
    });

    // Clear tracking sets
    this.loadedScripts.clear();
    this.loadedStyles.clear();

    // Force garbage collection
    if (window.gc) {
      window.gc();
    }

    console.log('✅ Resource cleanup completed');
  }
}

export default ResourceManager.getInstance();