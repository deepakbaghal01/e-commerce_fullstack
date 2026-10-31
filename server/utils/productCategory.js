const CATEGORY_ALIASES = Object.freeze({
  Electronics: ['Electronics', 'Electronic', 'Mobiles', 'Mobiles & electronics'],
  Clothing: ['Clothing', 'Fashion'],
  Shoes: ['Shoes', 'Shoe'],
  Accessories: ['Accessories'],
  Home: ['Home'],
  Other: ['Other']
});

const categoryByAlias = new Map(
  Object.entries(CATEGORY_ALIASES).flatMap(([category, aliases]) =>
    aliases.map((alias) => [normalizeCategoryValue(alias), category])
  )
);

function normalizeCategoryValue(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLowerCase()
    : '';
}

function normalizeProductCategory(value) {
  return categoryByAlias.get(normalizeCategoryValue(value)) || 'Other';
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function categoryRegex(aliases) {
  return new RegExp(`^\\s*(?:${aliases.map(escapeRegex).join('|')})\\s*$`, 'i');
}

const supportedCategoriesRegex = categoryRegex(
  Object.values(CATEGORY_ALIASES).flat()
);

const categoryRegexByName = Object.fromEntries(
  Object.entries(CATEGORY_ALIASES).map(([category, aliases]) => [
    category,
    categoryRegex(aliases)
  ])
);

function buildCategoryFilter(value) {
  const category = normalizeProductCategory(value);

  if (category === 'Other') {
    return {
      $or: [
        { category: categoryRegexByName.Other },
        { category: { $not: supportedCategoriesRegex } }
      ]
    };
  }

  return { category: categoryRegexByName[category] };
}

module.exports = {
  normalizeProductCategory,
  buildCategoryFilter
};
