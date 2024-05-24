function sortProducts(products) {
  return products.sort((a, b) => {
    if (a.category.name !== b.category.name) {
      if (a.category.name === 'Uncategorised') return -1;
      if (b.category.name === 'Uncategorised') return 1;
      return a.category.name.localeCompare(b.category.name);
    }
    return a.subcategory.name.localeCompare(b.subcategory.name);
  });
}

function categoriseProducts(products) {
  const sortedProducts = sortProducts(products);

  return sortedProducts.reduce((acc, product) => {
    const { category } = product;
    let { subcategory } = product;

    // assign a subcategory if it doesn't already exist
    if (!subcategory) {
      subcategory = { name: '_unsubcategorised' }; // underscore ensures it will be sorted first
    }

    // find the category array, or add it if it doesn't already exist
    let categoryArray = acc.find((c) => c.name === category.name);
    if (!categoryArray) {
      categoryArray = { name: category.name, subcategories: [] };
      acc.push(categoryArray);
    }

    // find the subcategory array, or add it if it doesn't already exist
    let subcategoryArray = categoryArray.subcategories.find(
      (s) => s.name === subcategory.name
    );
    if (!subcategoryArray) {
      subcategoryArray = { name: subcategory.name, products: [] };
      categoryArray.subcategories.push(subcategoryArray);
    }

    // add the product
    subcategoryArray.products.push(product);

    return acc;
  }, []);
}

module.exports = categoriseProducts;
