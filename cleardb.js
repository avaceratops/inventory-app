const mongoose = require('mongoose');
require('dotenv').config();

console.log('Drops all collections from the database');

const Category = require('./models/category');
const Subcategory = require('./models/subcategory');
const Product = require('./models/product');

// Set up mongoose connection
mongoose.set('strictQuery', false);
const mongoDB = process.env.MONGODB_URI;
main().catch((err) => console.log(err));

async function main() {
  console.log('Debug: About to connect');
  await mongoose.connect(mongoDB);
  console.log('Debug: Should be connected?');
  await clearCategories();
  await clearSubcategories();
  await clearProducts();
  console.log('Debug: Closing mongoose');
  mongoose.connection.close();
}

async function clearCategories() {
  await Category.collection.drop().catch((err) => console.log(err));
}

async function clearSubcategories() {
  await Subcategory.collection.drop().catch((err) => console.log(err));
}

async function clearProducts() {
  await Product.collection.drop().catch((err) => console.log(err));
}
