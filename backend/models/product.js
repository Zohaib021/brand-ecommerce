const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true },
  category:    { type: String, required: true },
  stock:       { type: Number, default: 0 },
  image:       { type: String, default: '' },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  rating:      { type: Number, default: 0 },
  numReviews:  { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);