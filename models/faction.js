const mongoose = require('mongoose');

const { Schema } = mongoose;

const FactionSchema = new Schema({
  name: { type: String, required: true },
  desc: String,
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
});

FactionSchema.virtual('url').get(function url() {
  return `/faction/${this._id}`;
});

module.exports = mongoose.model('Faction', FactionSchema);
