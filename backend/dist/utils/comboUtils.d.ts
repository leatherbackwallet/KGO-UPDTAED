export interface ComboItemConfig {
    name: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    defaultQuantity?: number;
}
export interface ComboPriceBreakdown {
    basePrice: number;
    additionalItems: Array<{
        name: string;
        additionalQuantity: number;
        unitPrice: number;
        additionalCost: number;
        unit: string;
    }>;
    totalPrice: number;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare const calculateComboPrice: (comboBasePrice: number, comboItemConfigurations: ComboItemConfig[]) => number;
export declare const validateComboItemConfig: (itemConfig: any) => ValidationResult;
export declare const createComboItemConfigurations: (comboItems: any[], customQuantities?: Record<string, number>) => ComboItemConfig[];
export declare const formatComboPriceBreakdown: (comboBasePrice: number, comboItemConfigurations: ComboItemConfig[]) => ComboPriceBreakdown;
//# sourceMappingURL=comboUtils.d.ts.map