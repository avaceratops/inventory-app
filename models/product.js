const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  desc: String,
  image: String,
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: Schema.Types.ObjectId, ref: 'Subcategory' },
  price: { type: Number, default: 999999 },
  stock: { type: Number, default: 0 },
});

ProductSchema.virtual('slug').get(function slug() {
  return slugify(this.name, { lower: true, strict: true });
});

ProductSchema.virtual('url').get(function url() {
  return `/product/${this._id}/${this.slug}`;
});

module.exports = mongoose.model('Product', ProductSchema);
