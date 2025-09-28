/**
 * Resource Manager
 * Handles resource cleanup and prevents ERR_INSUFFICIENT_RESOURCES
 */

class ResourceManager {
  private static instance: ResourceManager;
  private loadedScripts: Set<string> = new Set();
  private loadedStyles: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;

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
   * Track loaded scripts to prevent duplicates
   */
  trackScript(src: string): boolean {
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
    if (this.loadedStyles.has(href)) {
      return false; // Already loaded
    }
    this.loadedStyles.add(href);
    return true;
  }

  /**
   * Clean up unused resources
   */
  cleanup(): void {
    // Remove unused script tags
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !this.loadedScripts.has(src)) {
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
}

export default ResourceManager.getInstance();
