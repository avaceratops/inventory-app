function sortProducts(products) {
  return products.sort((a, b) => {
    const aCategory = a.category.name;
    const bCategory = b.category.name;
    if (aCategory !== bCategory) {
      if (aCategory === 'Uncategorised') return -1;
      if (bCategory === 'Uncategorised') return 1;
      return aCategory.localeCompare(bCategory);
    }

    const aSubcategory = a.subcategory
      ? a.subcategory.name
      : '_unsubcategorised';
    const bSubcategory = b.subcategory
      ? b.subcategory.name
      : '_unsubcategorised';
    return aSubcategory.localeCompare(bSubcategory);
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
