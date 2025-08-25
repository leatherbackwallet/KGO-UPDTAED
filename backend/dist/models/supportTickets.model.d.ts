import mongoose, { Document } from 'mongoose';
export declare enum TicketStatus {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    CLOSED = "closed"
}
export interface IConversationMessage {
    byUser: mongoose.Types.ObjectId;
    message: string;
    timestamp: Date;
}
export interface ISupportTicket extends Document {
    userId: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    issue: string;
    description?: string;
    status: TicketStatus;
    assignedTo?: mongoose.Types.ObjectId;
    conversation: IConversationMessage[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const SupportTicket: mongoose.Model<ISupportTicket, {}, {}, {}, mongoose.Document<unknown, {}, ISupportTicket, {}> & ISupportTicket & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=supportTickets.model.d.ts.map