import mongoose, { Document } from 'mongoose';
export interface IUserLocation {
    type: 'Point';
    coordinates: number[];
}
export interface IUserSchedule {
    type: 'work_shift' | 'time_off';
    startDate: Date;
    endDate: Date;
    isRecurring: boolean;
}
export interface IRecipientAddress {
    name: string;
    phone: string;
    address: {
        streetName: string;
        houseNumber: string;
        postalCode: string;
        city: string;
        countryCode: string;
    };
    additionalInstructions?: string;
    isDefault: boolean;
}
export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId: mongoose.Types.ObjectId;
    phone: string;
    avatar?: string;
    location?: IUserLocation;
    schedules?: IUserSchedule[];
    recipientAddresses?: IRecipientAddress[];
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=users.model.d.ts.map