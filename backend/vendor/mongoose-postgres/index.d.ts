declare namespace mongoose {
  type FilterQuery<T> = Record<string, any>;
  type UpdateQuery<T> = Record<string, any>;
  class ObjectId {
    constructor(value?: string | ObjectId);
    static isValid(value: unknown): boolean;
    equals(value: unknown): boolean;
    toString(): string;
    toJSON(): string;
  }
  namespace Types { export { ObjectId }; }
  interface Document {
    _id: ObjectId;
    id: string;
    save(): Promise<this>;
    toObject(): Record<string, any>;
    [key: string]: any;
  }
  class Schema<T = any> {
    static Types: { ObjectId: typeof ObjectId; Mixed: any };
    constructor(definition?: Record<string, any>, options?: Record<string, any>);
    index(fields: Record<string, any>, options?: Record<string, any>): this;
  }
  interface Model<T = any> {
    new (data?: any): T;
    find(filter?: any, projection?: any, options?: any): any;
    findOne(filter?: any, projection?: any, options?: any): any;
    findById(id: any, projection?: any, options?: any): any;
    create(data: any, ...rest: any[]): Promise<any>;
    insertMany(data: any[], options?: any): Promise<any[]>;
    countDocuments(filter?: any): Promise<number>;
    distinct(field: string, filter?: any): Promise<any[]>;
    findByIdAndUpdate(id: any, update: any, options?: any): any;
    findOneAndUpdate(filter: any, update: any, options?: any): any;
    findByIdAndDelete(id: any): any;
    findOneAndDelete(filter: any): any;
    updateOne(filter: any, update: any, options?: any): Promise<any>;
    updateMany(filter: any, update: any): Promise<any>;
    deleteOne(filter: any): Promise<any>;
    deleteMany(filter: any): Promise<any>;
    aggregate(pipeline: any[]): Promise<any[]>;
  }
  function model<T = any>(name: string, schema?: Schema<T>): Model<T>;
  function connect(uri: string, options?: any): Promise<any>;
  function disconnect(): Promise<void>;
  function set(key: string, value: any): void;
  const models: Record<string, Model<any>>;
  const connection: any;
}
declare const mongoose: {
  Schema: typeof mongoose.Schema;
  Types: typeof mongoose.Types;
  model: typeof mongoose.model;
  models: typeof mongoose.models;
  connect: typeof mongoose.connect;
  disconnect: typeof mongoose.disconnect;
  set: typeof mongoose.set;
  connection: typeof mongoose.connection;
};
export = mongoose;
