import mongoose, { Document } from 'mongoose';
export interface INotification extends Document {
    recipientId: mongoose.Types.ObjectId;
    title: string;
    message?: string;
    link?: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification> & INotification & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=notifications.model.d.ts.map