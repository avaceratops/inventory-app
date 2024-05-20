const express = require('express');

const router = express.Router();

const categoryController = require('../controllers/categoryController');
const subcategoryController = require('../controllers/subcategoryController');
const productController = require('../controllers/productController');

router.get('/', (req, res) => {
  res.redirect('/categories');
});

router.get('/categories', categoryController.category_list);
router.get('/subcategories', subcategoryController.subcategory_list);
router.get('/products', productController.product_list);

module.exports = router;
