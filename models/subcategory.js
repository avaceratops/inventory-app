const mongoose = require('mongoose');

const { Schema } = mongoose;

const SubcategorySchema = new Schema({
  name: { type: String, required: true },
  desc: String,
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
});

SubcategorySchema.virtual('url').get(function url() {
  return `/subcategory/${this._id}`;
});

module.exports = mongoose.model('Subcategory', SubcategorySchema);
