const express = require('express');

const router = express.Router();

const categoryController = require('../controllers/categoryController');

router.get('/create', categoryController.category_create_get);
router.post('/create', categoryController.category_create_post);

router.get('/:id/:slug/delete', categoryController.category_delete_get);
router.post('/:id/:slug/delete', categoryController.category_delete_post);

router.get('/:id/:slug/edit', categoryController.category_edit_get);
router.post('/:id/:slug/edit', categoryController.category_edit_post);

router.get('/:id/:slug', categoryController.category_detail);

module.exports = router;
