document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('category');
  const subcategorySelect = document.getElementById('subcategory');
  const subcategoryOptions = subcategorySelect.querySelectorAll('option');

  categorySelect.addEventListener('change', () => {
    const selectedCategory = categorySelect.value;
    // reset options
    subcategorySelect.innerHTML = '<option value=""></option>';
    // filter and display the subcategory options that belong to the selected category
    subcategoryOptions.forEach((option) => {
      if (option.dataset.category === selectedCategory) {
        subcategorySelect.appendChild(option);
      }
    });
  });

  // trigger change on load to update subcategories if a category is already selected
  categorySelect.dispatchEvent(new Event('change'));
});
