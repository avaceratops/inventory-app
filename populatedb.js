const mongoose = require('mongoose');
require('dotenv').config();

console.log('Populates the database with some default data');

const Category = require('./models/category');
const Subcategory = require('./models/subcategory');
const Product = require('./models/product');

const categories = [];
const subcategories = [];
const products = [];

// Set up mongoose connection
mongoose.set('strictQuery', false);
const mongoDB = process.env.MONGODB_URI;
main().catch((err) => console.log(err));

async function main() {
  console.log('Debug: About to connect');
  await mongoose.connect(mongoDB);
  console.log('Debug: Should be connected?');
  await createCategories();
  await createSubcategories();
  await createProducts();
  console.log('Debug: Closing mongoose');
  mongoose.connection.close();
}

async function categoryCreate(index, name) {
  const category = new Category({ name, desc: 'This is a description.' });
  await category.save();
  categories[index] = category;
  console.log(`Added category: ${name}`);
}

async function subcategoryCreate(index, name, category) {
  const subcategory = new Subcategory({
    name,
    desc: 'This is a description.',
    category,
  });
  await subcategory.save();
  subcategories[index] = subcategory;
  console.log(`Added subcategory: ${name}`);
}

async function productCreate(index, name, category, subcategory, price, stock) {
  const product = new Product({
    name,
    desc: 'This is a description.',
    category,
  });
  if (subcategory) product.subcategory = subcategory;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  await product.save();
  products[index] = product;
  console.log(`Added product: ${name}`);
}

async function createCategories() {
  console.log('Adding categories');
  await Promise.all([
    categoryCreate(0, 'Uncategorised'),
    categoryCreate(1, 'Warhammer 40,000'),
    categoryCreate(2, 'Warhammer Age of Sigmar'),
    categoryCreate(3, 'Citadel Colour'),
  ]);
}

async function createSubcategories() {
  console.log('Adding subcategories');
  await Promise.all([
    subcategoryCreate(0, 'Aeldari', categories[1]),
    subcategoryCreate(1, 'Blood Angels', categories[1]),
    subcategoryCreate(2, 'Nighthaunt', categories[2]),
    subcategoryCreate(3, 'Seraphon', categories[2]),
  ]);
}

async function createProducts() {
  console.log('Adding products');
  await Promise.all([
    productCreate(0, 'Avatar of Khaine', categories[1], subcategories[0], 6500),
    productCreate(1, 'Commander Dante', categories[1], subcategories[1], 2750),
    productCreate(2, 'Black Coach', categories[2], subcategories[2], 8500, 5),
    productCreate(3, 'Kroxigor', categories[2], subcategories[3], 3750, 4),
    productCreate(
      4,
      'Layer: Temple Guard Blue',
      categories[2],
      undefined,
      275,
      21
    ),
  ]);
}
