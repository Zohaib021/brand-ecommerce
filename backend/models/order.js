const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:    { type: String },
  image:   { type: String },
  price:   { type: Number },
  qty:     { type: Number },
  size:    { type: String, default: '' },
  color:   { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    firstName: String,
    lastName:  String,
    email:     String,
    phone:     String,
    address:   String,
    city:      String,
    zipCode:   String,
    country:   String
  },
  paymentMethod: { type: String, default: 'Card' },
  subtotal:  { type: Number, default: 0 },
  shipping:  { type: Number, default: 0 },
  discount:  { type: Number, default: 0 },
  tax:       { type: Number, default: 0 },
  total:     { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  couponCode: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);