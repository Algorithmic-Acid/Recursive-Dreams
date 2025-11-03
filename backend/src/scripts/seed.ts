import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductModel from '../models/ProductModel.mongoose';
import { initialProducts } from '../data/products';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algorithmic_acid';

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    console.log('Clearing existing products...');
    await ProductModel.deleteMany({});
    console.log('✅ Existing products cleared');

    // Insert seed data
    console.log('Inserting seed data...');
    const products = await ProductModel.insertMany(initialProducts);
    console.log(`✅ Inserted ${products.length} products`);

    // Display seeded products
    console.log('\nSeeded Products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.category}) - $${product.price}`);
    });

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run seeding
seedDatabase();
