import mongoose, { Schema, Document } from 'mongoose';
import { IProduct, ProductCategory } from '../types';

// Mongoose Document interface
export interface IProductDocument extends Omit<IProduct, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Mongoose Schema
const ProductSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['shirts', 'music', 'anime', 'games', 'software'],
        message: '{VALUE} is not a valid category',
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    icon: {
      type: String,
      default: '📦',
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });

// Instance methods
ProductSchema.methods.updateStock = function (quantity: number): void {
  this.stock += quantity;
  if (this.stock < 0) this.stock = 0;
};

// Static methods for business logic
ProductSchema.statics.findByCategory = function (category: ProductCategory) {
  return this.find({ category });
};

ProductSchema.statics.searchProducts = function (query: string) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
    ],
  });
};

ProductSchema.statics.findInStock = function () {
  return this.find({ stock: { $gt: 0 } });
};

// Model
export const ProductModel = mongoose.model<IProductDocument>('Product', ProductSchema);

export default ProductModel;
