const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const CategorySchema = new Schema({
  name: { type: String, required: true },
  desc: String,
});

CategorySchema.virtual('slug').get(function slug() {
  return slugify(this.name, { lower: true, strict: true });
});

CategorySchema.virtual('url').get(function url() {
  return `/category/${this._id}/${this.slug}`;
});

module.exports = mongoose.model('Category', CategorySchema);
