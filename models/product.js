const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  desc: String,
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  faction: { type: Schema.Types.ObjectId, ref: 'Faction' },
  price: { type: Number, default: 999999 },
  stock: { type: Number, default: 0 },
});

ProductSchema.virtual('url').get(function url() {
  return `/product/${this._id}`;
});

module.exports = mongoose.model('Product', ProductSchema);
