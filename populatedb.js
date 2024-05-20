const mongoose = require('mongoose');
require('dotenv').config();

console.log('Populates the database with some default data');

const Category = require('./models/category');
const Faction = require('./models/faction');
const Product = require('./models/product');

const categories = [];
const factions = [];
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
  await createFactions();
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

async function factionCreate(index, name, category) {
  const faction = new Faction({
    name,
    desc: 'This is a description.',
    category,
  });
  await faction.save();
  factions[index] = faction;
  console.log(`Added faction: ${name}`);
}

async function productCreate(index, name, category, faction, price, stock) {
  const product = new Product({
    name,
    desc: 'This is a description.',
    category,
  });
  if (faction) product.faction = faction;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  await product.save();
  products[index] = product;
  console.log(`Added product: ${name}`);
}

async function createCategories() {
  console.log('Adding categories');
  await Promise.all([
    categoryCreate(0, 'Warhammer 40,000'),
    categoryCreate(1, 'Warhammer Age of Sigmar'),
    categoryCreate(2, 'Citadel Colour'),
  ]);
}

async function createFactions() {
  console.log('Adding factions');
  await Promise.all([
    factionCreate(0, 'Aeldari', categories[0]),
    factionCreate(1, 'Blood Angels', categories[0]),
    factionCreate(2, 'Nighthaunt', categories[1]),
    factionCreate(3, 'Seraphon', categories[1]),
  ]);
}

async function createProducts() {
  console.log('Adding products');
  await Promise.all([
    productCreate(0, 'Avatar of Khaine', categories[0], factions[0], 6500),
    productCreate(1, 'Commander Dante', categories[0], factions[1], 2750),
    productCreate(2, 'Black Coach', categories[1], factions[2], 8500, 5),
    productCreate(3, 'Kroxigor', categories[1], factions[3], 3750, 4),
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