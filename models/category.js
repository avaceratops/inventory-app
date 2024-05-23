const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const CategorySchema = new Schema({
  name: { type: String, required: true },
  desc: String,
});

CategorySchema.statics.getDefaultCategory = async function getDefault() {
  let defaultCategory = await this.findOne({ name: 'Uncategorised' });

  if (!defaultCategory) {
    defaultCategory = await this.create({
      name: 'Uncategorised',
      desc: 'All items which do not belong to a user-defined category.',
    });
  }
  return defaultCategory;
};

CategorySchema.virtual('default').get(function isDefault() {
  return this.name === 'Uncategorised';
});

CategorySchema.virtual('slug').get(function slug() {
  return slugify(this.name, { lower: true, strict: true });
});

CategorySchema.virtual('url').get(function url() {
  return `/category/${this._id}/${this.slug}`;
});

module.exports = mongoose.model('Category', CategorySchema);
