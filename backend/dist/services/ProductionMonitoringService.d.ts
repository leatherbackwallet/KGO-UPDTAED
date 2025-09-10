import { EventEmitter } from 'events';
export interface MonitoringMetrics {
    timestamp: Date;
    errorRate: number;
    performanceImpact: number;
    loadingFailureRate: number;
    cacheHitRate: number;
    averageResponseTime: number;
    userFeedbackScore: number;
    activeUsers: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface AlertRule {
    id: string;
    name: string;
    metric: keyof MonitoringMetrics;
    threshold: number;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    cooldownPeriod: number;
    lastTriggered?: Date;
}
export interface SLATarget {
    name: string;
    metric: keyof MonitoringMetrics;
    target: number;
    period: 'hour' | 'day' | 'week' | 'month';
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
}
export interface PerformanceBenchmark {
    name: string;
    baseline: number;
    current: number;
    threshold: number;
    trend: 'improving' | 'stable' | 'degrading';
    lastUpdated: Date;
}
declare class ProductionMonitoringService extends EventEmitter {
    private metrics;
    private alertRules;
    private slaTargets;
    private benchmarks;
    private isMonitoring;
    private monitoringInterval?;
    constructor();
    private initializeDefaultAlertRules;
    private initializeDefaultSLATargets;
    private initializeDefaultBenchmarks;
    startMonitoring(intervalMs?: number): void;
    stopMonitoring(): void;
    private collectMetrics;
    private gatherCurrentMetrics;
    private checkAlertRules;
    private triggerAlert;
    private sendAlert;
    private getAlertColor;
    private updateBenchmarks;
    private updateBenchmark;
    private checkSLACompliance;
    private calculateSLACompliance;
    private getMetricsForPeriod;
    getMetrics(limit?: number): MonitoringMetrics[];
    getCurrentMetrics(): MonitoringMetrics | null;
    getAlertRules(): AlertRule[];
    updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean;
    getSLATargets(): SLATarget[];
    getSLACompliance(): Array<{
        sla: SLATarget;
        compliance: ReturnType<typeof this.calculateSLACompliance>;
    }>;
    getBenchmarks(): PerformanceBenchmark[];
    getHealthStatus(): {
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
        metrics: MonitoringMetrics | null;
    };
}
export declare const productionMonitoringService: ProductionMonitoringService;
export default productionMonitoringService;
//# sourceMappingURL=ProductionMonitoringService.d.ts.map