const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Cart    = require('../models/Cart');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// POST /api/orders  ← "Place Order" button on checkout.html
router.post('/', async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });

    const items = cart.items.map(i => ({
      product: i.product._id,
      name:    i.product.name,
      image:   i.product.image,
      price:   i.price,
      qty:     i.qty,
      size:    i.size,
      color:   i.color
    }));

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const discount = couponCode ? 10 : 0;   // flat $10 for any coupon (extend later)
    const tax      = parseFloat((subtotal * 0.038).toFixed(2));
    const shipping = subtotal > 100 ? 0 : 10;
    const total    = parseFloat((subtotal - discount + tax + shipping).toFixed(2));

    const order = await Order.create({
      user: req.user._id,
      items, shippingAddress, paymentMethod,
      subtotal, discount, tax, shipping, total, couponCode
    });

    // Clear cart after order
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my  ← "My orders" in header
router.get('/my', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders  ← admin-dashboard.html orders table (admin only)
router.get('/', adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status  ← admin update order status
router.put('/:id/status', adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;