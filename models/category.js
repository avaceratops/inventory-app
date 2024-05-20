const mongoose = require('mongoose');

const { Schema } = mongoose;

const CategorySchema = new Schema({
  name: { type: String, required: true },
  desc: String,
});

CategorySchema.virtual('url').get(function url() {
  return `/category/${this._id}`;
});

module.exports = mongoose.model('Category', CategorySchema);
