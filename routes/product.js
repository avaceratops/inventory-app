const express = require('express');

const router = express.Router();

const productController = require('../controllers/productController');

router.get('/create', productController.product_create_get);
router.post('/create', productController.product_create_post);

router.get('/:id/:slug/delete', productController.product_delete_get);
router.post('/:id/:slug/delete', productController.product_delete_post);

router.get('/:id/:slug/edit', productController.product_edit_get);
router.post('/:id/:slug/edit', productController.product_edit_post);

router.get('/:id/:slug', productController.product_detail);

module.exports = router;
