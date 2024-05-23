const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const Product = require('../models/product');

// display list of all categories
exports.category_list = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).exec();
  res.render('categoryList', { title: 'Categories', categories });
});

// display information about a specific category
exports.category_detail = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const [category, subcategories, products] = await Promise.all([
    Category.findById(id).exec(),
    Subcategory.find({ category: id }, 'name').sort({ name: 1 }).exec(),
    Product.find({ category: id }, 'name').sort({ name: 1 }).exec(),
  ]);

  if (category === null) {
    const err = new Error('Category not found');
    err.status = 404;
    return next(err);
  }

  return res.render('categoryDetail', {
    category,
    subcategories,
    products,
  });
});

// displays the add category form
exports.category_create_get = (req, res) => {
  res.render('categoryForm', { title: 'Add category', url: '/categories' });
};

// validates and adds new categories to the database
exports.category_create_post = [
  body('name', 'Category name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 }),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const { name, desc } = req.body;
    const category = new Category({ name, desc });

    if (!errors.isEmpty()) {
      return res.render('categoryForm', {
        title: 'Add category',
        category,
        url: '/categories',
        errors: errors.array(),
      });
    }

    // ensure name is unique, ignoring casing
    const categoryExists = await Category.findOne({ name })
      .collation({ locale: 'en', strength: 2 })
      .exec();
    if (categoryExists) {
      return res.redirect(categoryExists.url);
    }

    await category.save();
    return res.redirect(category.url);
  }),
];

// displays the delete category form
exports.category_delete_get = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec();
  if (category === null) {
    return res.redirect('/categories');
  }
  if (category.default) {
    return next();
  }
  return res.render('categoryDelete', { category });
});

// handles category deletion
exports.category_delete_post = asyncHandler(async (req, res, next) => {
  // make sure the Uncategorised category exists
  // otherwise we can't update subcategories/products
  const defaultCategory = await Category.getDefaultCategory();
  if (!defaultCategory) {
    throw new Error('Default category not found');
  }

  // use a transaction to ensure all operations are successful before changes are committed
  const session = await mongoose.startSession();
  const { id } = req.params;
  try {
    await session.withTransaction(async () => {
      // update relevant subcategories to Uncategorised
      await Subcategory.updateMany(
        { category: id },
        { $set: { category: defaultCategory._id } },
        { session }
      );

      // update any remaining products to Uncategorised
      await Product.updateMany(
        { category: id },
        { $set: { category: defaultCategory._id } },
        { session }
      );

      await Category.findByIdAndDelete(id).session(session);
    });
    res.redirect('/categories');
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
});

// displays the edit category form
exports.category_edit_get = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec();
  if (category === null) {
    return res.redirect('/categories');
  }
  if (category.default) {
    return next();
  }

  // cache the URL for redirecting after unsuccessful POST
  // otherwise altered name would break the URL
  const { url } = category;

  return res.render('categoryForm', {
    title: 'Edit category',
    category,
    url,
  });
});

// updates edited category
exports.category_edit_post = [
  body('name')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Category name must contain at least 3 characters')
    .custom(async (value, { req }) => {
      // ensure category with that name doesn't already exist
      const categoryExists = await Category.findOne({
        name: req.body.name,
        _id: { $ne: req.params.id },
      })
        .collation({ locale: 'en', strength: 2 })
        .exec();
      if (categoryExists) {
        throw new Error('Category with that name already exists');
      }
    }),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { name, desc, url } = req.body;
    const category = new Category({ name, desc, _id: id });

    if (!errors.isEmpty()) {
      return res.render('categoryForm', {
        title: 'Edit category',
        category,
        url,
        errors: errors.array(),
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, category, {});
    return res.redirect(updatedCategory.url);
  }),
];
