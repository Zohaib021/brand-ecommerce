const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty:      { type: Number, default: 1 },
  size:     { type: String, default: '' },
  color:    { type: String, default: '' },
  price:    { type: Number, required: true }
});

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);