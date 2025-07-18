const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  stock: { type: Number, required: true },
  images: [{ type: String }],
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  slug: { type: String, unique: true },
  defaultImage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 