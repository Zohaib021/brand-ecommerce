const express = require('express');
const router  = express.Router();
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// All cart routes require login
router.use(protect);

// GET /api/cart  ← cart.html loads cart items
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name image price stock');
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart  ← "Add to Cart" button on product-details.html
router.post('/', async (req, res) => {
  try {
    const { productId, qty = 1, size = '', color = '' } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ message: 'Not enough stock' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId && i.size === size && i.color === color);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.items.push({ product: productId, qty, size, color, price: product.price });
    }
    await cart.save();
    await cart.populate('items.product', 'name image price stock');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/cart/:itemId  ← quantity +/- buttons on cart.html
router.put('/:itemId', async (req, res) => {
  try {
    const { qty } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.qty = qty;
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart/:itemId  ← remove ✕ button on cart.html
router.delete('/:itemId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/cart  ← clears cart after order placed
router.delete('/', async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;