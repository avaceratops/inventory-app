const express = require('express');

const router = express.Router();

const subcategoryController = require('../controllers/subcategoryController');

router.get('/create', subcategoryController.subcategory_create_get);
router.post('/create', subcategoryController.subcategory_create_post);

router.get('/:id/:slug/delete', subcategoryController.subcategory_delete_get);
router.post('/:id/:slug/delete', subcategoryController.subcategory_delete_post);

router.get('/:id/:slug/edit', subcategoryController.subcategory_edit_get);
router.post('/:id/:slug/edit', subcategoryController.subcategory_edit_post);

router.get('/:id/:slug', subcategoryController.subcategory_detail);

module.exports = router;
