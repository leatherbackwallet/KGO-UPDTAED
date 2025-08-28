import mongoose, { Document } from 'mongoose';
export declare enum PageStatus {
    PUBLISHED = "published",
    DRAFT = "draft"
}
export interface IPage extends Document {
    title: string;
    slug: string;
    body: string;
    status: PageStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Page: mongoose.Model<IPage, {}, {}, {}, mongoose.Document<unknown, {}, IPage, {}, {}> & IPage & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=pages.model.d.ts.map