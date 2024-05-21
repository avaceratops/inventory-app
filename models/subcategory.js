const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const SubcategorySchema = new Schema({
  name: { type: String, required: true },
  desc: String,
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
});

SubcategorySchema.virtual('slug').get(function slug() {
  return slugify(this.name, { lower: true, strict: true });
});

SubcategorySchema.virtual('url').get(function url() {
  return `/subcategory/${this._id}/${this.slug}`;
});

module.exports = mongoose.model('Subcategory', SubcategorySchema);
