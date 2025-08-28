import mongoose, { Document } from 'mongoose';
export interface ITarget {
    type: string;
    id: mongoose.Types.ObjectId;
}
export interface IActivityLog extends Document {
    actorId?: mongoose.Types.ObjectId;
    actionType: string;
    target?: ITarget;
    details?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ActivityLog: mongoose.Model<IActivityLog, {}, {}, {}, mongoose.Document<unknown, {}, IActivityLog, {}, {}> & IActivityLog & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=activityLogs.model.d.ts.map