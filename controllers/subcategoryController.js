const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const Product = require('../models/product');

// display list of all subcategories
exports.subcategory_list = asyncHandler(async (req, res) => {
  const subcategories = await Subcategory.find().sort({ name: 1 }).exec();
  res.render('subcategoryList', { title: 'Subcategories', subcategories });
});

// display information about a specific subcategory
exports.subcategory_detail = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const [subcategory, products] = await Promise.all([
    Subcategory.findById(id).populate('category').exec(),
    Product.find({ subcategory: id }, 'name').sort({ name: 1 }).exec(),
  ]);

  if (subcategory === null) {
    const err = new Error('Subcategory not found');
    err.status = 404;
    return next(err);
  }

  return res.render('subcategoryDetail', {
    subcategory,
    category: subcategory.category,
    products,
  });
});

// display the add subcategory form
exports.subcategory_create_get = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).exec();
  res.render('subcategoryForm', {
    title: 'Add subcategory',
    categories,
    url: '/subcategories',
  });
});

// validate and add new subcategory to the database
exports.subcategory_create_post = [
  body('name', 'Subcategory name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 }),
  body('category', 'You must select a category').trim().isLength({ min: 1 }),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const { name, desc, category } = req.body;
    const subcategory = new Subcategory({ name, desc, category });

    if (!errors.isEmpty()) {
      const categories = await Category.find().sort({ name: 1 }).exec();

      return res.render('subcategoryForm', {
        title: 'Add subcategory',
        subcategory,
        categories,
        url: '/subcategories',
        errors: errors.array(),
      });
    }

    await subcategory.save();
    return res.redirect(subcategory.url);
  }),
];

// display the delete subcategory form
exports.subcategory_delete_get = asyncHandler(async (req, res) => {
  const subcategory = await Subcategory.findById(req.params.id).exec();
  if (subcategory === null) {
    return res.redirect('/subcategories');
  }
  return res.render('subcategoryDelete', { subcategory });
});

// delete subcategory from the database
exports.subcategory_delete_post = asyncHandler(async (req, res, next) => {
  // use a transaction to ensure all operations are successful before changes are committed
  const session = await mongoose.startSession();
  const { id } = req.params;
  try {
    await session.withTransaction(async () => {
      // remove subcategory from products where necessary
      await Product.updateMany(
        { subcategory: id },
        { $unset: { subcategory: 1 } },
        { session }
      );

      await Subcategory.findByIdAndDelete(id).session(session);
    });
    res.redirect('/subcategories');
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
});

// display the edit subcategory form
exports.subcategory_edit_get = asyncHandler(async (req, res) => {
  const [subcategory, categories] = await Promise.all([
    Subcategory.findById(req.params.id).exec(),
    Category.find().sort({ name: 1 }).exec(),
  ]);

  if (subcategory === null) {
    return res.redirect('/subcategories');
  }

  // cache the URL for redirecting after unsuccessful POST
  // otherwise altered name would break the URL
  const { url } = subcategory;

  return res.render('subcategoryForm', {
    title: 'Edit subcategory',
    subcategory,
    categories,
    url,
  });
});

// update edited subcategory in the database
exports.subcategory_edit_post = [
  body('name', 'Subcategory name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 }),
  body('category', 'You must select a category').trim().isLength({ min: 1 }),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { name, desc, category, url } = req.body;
    const subcategory = new Subcategory({ name, desc, category, _id: id });

    if (!errors.isEmpty()) {
      const categories = await Category.find().sort({ name: 1 }).exec();

      return res.render('subcategoryForm', {
        title: 'Edit subcategory',
        subcategory,
        categories,
        url,
        errors: errors.array(),
      });
    }

    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
      id,
      subcategory,
      {}
    );
    return res.redirect(updatedSubcategory.url);
  }),
];
