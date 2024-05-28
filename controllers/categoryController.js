const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const Product = require('../models/product');

// display list of all categories
exports.category_list = asyncHandler(async (req, res) => {
  const categories = await Category.find().exec();
  // sort categories alphabetically, with Uncategorised coming first for visibility
  categories.sort((a, b) => {
    if (a.name === 'Uncategorised') return -1;
    if (b.name === 'Uncategorised') return 1;
    return a.name.localeCompare(b.name);
  });
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

// display the add category form
exports.category_create_get = (req, res) => {
  res.render('categoryForm', { title: 'Add category', url: '/categories' });
};

// validate and add new category to the database
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

// display the delete category form
exports.category_delete_get = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec();
  if (category === null) {
    return res.redirect('/categories');
  }
  if (category.default) {
    return next();
  }
  return res.render('categoryDelete', { category, requirePassword: true });
});

// delete category from the database
exports.category_delete_post = [
  body('password').custom(async (value) => {
    if (value !== process.env.ADMIN_PASSWORD) {
      throw new Error('Incorrect admin password');
    }
  }),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { password } = req.body;

    if (!errors.isEmpty()) {
      const category = await Category.findById(id).exec();
      return res.render('categoryDelete', {
        category,
        requirePassword: true,
        password,
        errors: errors.array(),
      });
    }

    // make sure the Uncategorised category exists
    // otherwise we can't update subcategories/products
    const defaultCategory = await Category.getDefaultCategory();
    if (!defaultCategory) {
      throw new Error('Default category not found');
    }

    // use a transaction to ensure all operations are successful before changes are committed
    const session = await mongoose.startSession();
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
    }
    return session.endSession();
  }),
];

// display the edit category form
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
    requirePassword: true,
    url,
  });
});

// update edited category in the database
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
  body('password').custom(async (value) => {
    if (value !== process.env.ADMIN_PASSWORD) {
      throw new Error('Incorrect admin password');
    }
  }),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { name, desc, password, url } = req.body;
    const category = new Category({ name, desc, _id: id });

    if (!errors.isEmpty()) {
      return res.render('categoryForm', {
        title: 'Edit category',
        category,
        requirePassword: true,
        password,
        url,
        errors: errors.array(),
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, category, {});
    return res.redirect(updatedCategory.url);
  }),
];
