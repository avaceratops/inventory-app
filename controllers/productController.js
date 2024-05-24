const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const Product = require('../models/product');

// display list of all products
exports.product_list = asyncHandler(async (req, res) => {
  // populate category and subcategory fields
  // group products by category and subcategory
  // sort subcategory and product arrays alphabetically
  const products = await Product.aggregate([
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $lookup: {
        from: 'subcategories',
        localField: 'subcategory',
        foreignField: '_id',
        as: 'subcategory',
      },
    },
    {
      $unwind: {
        path: '$category',
      },
    },
    {
      $unwind: {
        path: '$subcategory',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        category: '$category.name',
        subcategory: {
          $ifNull: ['$subcategory.name', '!NoSubcategory'],
        },
      },
    },
    {
      $group: {
        _id: {
          category: '$category',
          subcategory: '$subcategory',
        },
        products: {
          $push: '$$ROOT',
        },
      },
    },
    {
      $group: {
        _id: '$_id.category',
        subcategories: {
          $push: {
            name: '$_id.subcategory',
            products: {
              $sortArray: { input: '$products', sortBy: { name: 1 } },
            },
          },
        },
      },
    },
    {
      $project: {
        name: '$_id',
        subcategories: {
          $sortArray: { input: '$subcategories', sortBy: { name: 1 } },
        },
        _id: 0,
      },
    },
  ]);

  // sort categories alphabetically, with Uncategorised coming first for visibility
  products.sort((a, b) => {
    if (a.name === 'Uncategorised') return -1;
    if (b.name === 'Uncategorised') return 1;
    return a.name.localeCompare(b.name);
  });

  // rehydrate the products arrays to enable virtual fields
  products.forEach((category) => {
    category.subcategories.forEach((subcategory) => {
      subcategory.products = subcategory.products.map((product) =>
        Product.hydrate(product)
      );
    });
  });

  res.render('productList', { title: 'Products', products });
});

// display information about a specific product
exports.product_detail = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category subcategory')
    .exec();

  if (product === null) {
    const err = new Error('Product not found');
    err.status = 404;
    return next(err);
  }

  return res.render('productDetail', {
    product,
    category: product.category,
    subcategory: product.subcategory,
  });
});

// display the add product form
exports.product_create_get = asyncHandler(async (req, res) => {
  const [categories, subcategories] = await Promise.all([
    Category.find().sort({ name: 1 }).exec(),
    Subcategory.find().sort({ name: 1 }).exec(),
  ]);

  res.render('productForm', {
    title: 'Add product',
    categories,
    subcategories,
    url: '/products',
  });
});

// validate and add new product to the database
exports.product_create_post = [
  body('name', 'Product name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 }),
  body('price')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Price must not be less than 0'),
  body('stock')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Stock must not be less than 0'),
  body('category', 'You must select a category').trim().isLength({ min: 1 }),
  body('subcategory').custom(async (value, { req }) => {
    if (value.length) {
      const subcategory = await Subcategory.findOne({ _id: value });
      if (subcategory.category._id.toString() !== req.body.category) {
        throw new Error('Chosen subcategory belongs to another category');
      }
    }
  }),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const { name, desc, category, subcategory, price, stock } = req.body;
    const product = new Product({
      name,
      desc,
      category,
    });

    // avoid adding an empty string as the subcategory
    if (subcategory.length > 0) product.subcategory = subcategory;
    // don't add these if null, otherwise the default values won't be used
    if (price) product.price = price;
    if (stock) product.stock = stock;

    if (!errors.isEmpty()) {
      const [categories, subcategories] = await Promise.all([
        Category.find().sort({ name: 1 }).exec(),
        Subcategory.find().sort({ name: 1 }).exec(),
      ]);

      return res.render('productForm', {
        title: 'Edit product',
        product,
        categories,
        subcategories,
        url: '/products',
        errors: errors.array(),
      });
    }

    // convert float to int before saving to avoid rounding errors
    if (price) product.price = Math.floor(price * 100);

    await product.save();
    return res.redirect(product.url);
  }),
];

// display the delete product form
exports.product_delete_get = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).exec();
  if (product === null) {
    return res.redirect('/products');
  }
  return res.render('productDelete', { product });
});

// delete product from the database
exports.product_delete_post = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/products');
});

// display the edit product form
exports.product_edit_get = asyncHandler(async (req, res) => {
  const [product, categories, subcategories] = await Promise.all([
    Product.findById(req.params.id),
    Category.find().sort({ name: 1 }).exec(),
    Subcategory.find().sort({ name: 1 }).exec(),
  ]);

  if (product === null) {
    return res.redirect('/products');
  }

  // cache the URL for redirecting after unsuccessful POST
  // otherwise altered name would break the URL
  const { price, url } = product;

  // convert int to float before editing, for easier parsing
  if (price) product.price = (price / 100).toFixed(2);

  return res.render('productForm', {
    title: 'Edit product',
    product,
    categories,
    subcategories,
    url,
  });
});

// update edited product in the database
exports.product_edit_post = [
  body('name', 'Product name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 }),
  body('price')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Price must not be less than 0'),
  body('stock')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Stock must not be less than 0'),
  body('category', 'You must select a category').trim().isLength({ min: 1 }),
  body('subcategory').custom(async (value, { req }) => {
    if (value.length) {
      const subcategory = await Subcategory.findOne({ _id: value });
      if (subcategory.category._id.toString() !== req.body.category) {
        throw new Error('Chosen subcategory belongs to another category');
      }
    }
  }),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { name, desc, category, subcategory, price, stock, url } = req.body;

    const product = new Product({
      name,
      desc,
      category,
      subcategory: subcategory.length > 0 ? subcategory : null,
      _id: id,
    });

    // avoid adding an empty string as the subcategory
    if (subcategory.length > 0) product.subcategory = subcategory;
    // don't add these if null, otherwise the default values won't be used
    if (price) product.price = price;
    if (stock) product.stock = stock;

    if (!errors.isEmpty()) {
      const [categories, subcategories] = await Promise.all([
        Category.find().sort({ name: 1 }).exec(),
        Subcategory.find().sort({ name: 1 }).exec(),
      ]);

      return res.render('productForm', {
        title: 'Edit product',
        product,
        categories,
        subcategories,
        url,
        errors: errors.array(),
      });
    }

    // convert float to int before saving to avoid rounding errors
    if (price) product.price = Math.floor(price * 100);

    const updatedProduct = await Product.findByIdAndUpdate(id, product, {});
    return res.redirect(updatedProduct.url);
  }),
];
