const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET /api/products  ← products.html loads these
// Supports: ?category=Clothing&search=hoodie&sort=price&page=1&limit=12
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sortObj = sort === 'price_asc'  ? { price: 1 }
                  : sort === 'price_desc' ? { price: -1 }
                  : sort === 'newest'     ? { createdAt: -1 }
                  : { createdAt: -1 };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit));

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id  ← product-details.html loads this
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products  ← admin-dashboard.html add product form
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const image = req.file ? '/uploads/' + req.file.filename : '';
    const product = await Product.create({ name, description, price, category, stock, image });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id  ← admin edit button
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = '/uploads/' + req.file.filename;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id  ← admin delete button
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;