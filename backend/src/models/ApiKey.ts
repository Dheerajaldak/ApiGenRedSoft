import { Schema, model, Document } from 'mongoose';

export type KeyStatus = 'active' | 'revoked' | 'expired';

export interface IApiKey extends Document {
  name: string;
  keyHash: string;
  displayPrefix: string;
  status: KeyStatus;
  rateLimit: number; // requests per minute (RPM)
  usageCount: number;
  lastUsedAt?: Date;
  expiresAt?: Date;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    name: {
      type: String,
      required: [true, 'Key name is required'],
      trim: true,
      maxlength: 100,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayPrefix: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired'],
      default: 'active',
      index: true,
    },
    rateLimit: {
      type: Number,
      default: 10, // Default 10 requests per minute
      min: 1,
      max: 10000,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    scopes: {
      type: [String],
      default: ['read', 'ai:generate'],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual check to verify if key is expired
ApiKeySchema.methods.isExpired = function (): boolean {
  if (this.status === 'expired') return true;
  if (this.expiresAt && new Date() > this.expiresAt) {
    return true;
  }
  return false;
};

export const ApiKeyModel = model<IApiKey>('ApiKey', ApiKeySchema);
