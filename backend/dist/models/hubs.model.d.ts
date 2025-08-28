import mongoose, { Document } from 'mongoose';
export interface IHubAddress {
    street: string;
    city: string;
    state: string;
    postalCode: string;
}
export interface IHub extends Document {
    name: string;
    address: IHubAddress;
    operatingHours?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Hub: mongoose.Model<IHub, {}, {}, {}, mongoose.Document<unknown, {}, IHub, {}, {}> & IHub & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=hubs.model.d.ts.map