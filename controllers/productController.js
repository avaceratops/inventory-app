const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

const categoriseProducts = require('../utils/categoriseProducts');
const imageParser = require('../utils/uploadImage');

const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const Product = require('../models/product');

// display list of all products
exports.product_list = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate('category subcategory')
    .sort({ name: 1 })
    .exec();

  res.render('productList', {
    title: 'Products',
    products: categoriseProducts(products),
  });
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
  imageParser.single('image-select'),
  body('name', 'Product name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 }),
  body('price')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Price must not be less than 0')
    .matches(/^\d*(\.\d{0,2})?$/)
    .withMessage(
      'Enter the price in pounds, using up to 2 decimal places for pence (e.g. 100 or 20.99)'
    ),
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
    const { name, desc, image, category, subcategory, price, stock } = req.body;
    const product = new Product({
      name,
      desc,
      image,
      category,
    });

    // avoid adding an empty string as the subcategory
    if (subcategory.length > 0) product.subcategory = subcategory;
    // don't add these if null, otherwise the default values won't be used
    if (price) product.price = price;
    if (stock) product.stock = stock;
    // update image if it was successfully uploaded to Cloudinary
    if (req.file) product.image = req.file.path;

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
        image: product.image,
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
  const { price, url, image } = product;

  // convert int to float before editing, for easier parsing
  if (price) product.price = (price / 100).toFixed(2);

  return res.render('productForm', {
    title: 'Edit product',
    product,
    categories,
    subcategories,
    url,
    image,
  });
});

// update edited product in the database
exports.product_edit_post = [
  imageParser.single('image-select'),
  body('name', 'Product name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 }),
  body('price')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Price must not be less than 0')
    .matches(/^\d*(\.\d{0,2})?$/)
    .withMessage(
      'Enter the price in pounds, using up to 2 decimal places for pence (e.g. 100 or 20.99)'
    ),
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
    const { name, desc, image, category, subcategory, price, stock, url } =
      req.body;

    const product = new Product({
      name,
      desc,
      image,
      category,
      subcategory: subcategory.length > 0 ? subcategory : null,
      _id: id,
    });

    // avoid adding an empty string as the subcategory
    if (subcategory.length > 0) product.subcategory = subcategory;
    // don't add these if null, otherwise the default values won't be used
    if (price) product.price = price;
    if (stock) product.stock = stock;
    // update image if it was successfully uploaded to Cloudinary
    if (req.file) product.image = req.file.path;

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
        image: product.image,
        errors: errors.array(),
      });
    }

    // convert float to int before saving to avoid rounding errors
    if (price) product.price = Math.floor(price * 100);

    const updatedProduct = await Product.findByIdAndUpdate(id, product, {});
    return res.redirect(updatedProduct.url);
  }),
];
