const yaml = require('yaml');
const fs = require('fs');
const jsonKeysSort = require('json-keys-sort');

const jsonFile = './src/_data/publications.json';
const yamlFile = './src/_data/publications.yaml';

const getList = () => {
  return JSON.parse(fs.readFileSync(jsonFile));
};

const itemsByCategory = (items) => {
  const categories = [...new Set(items.map((item) => item.category))];

  return categories.map((category) => {
    let itemsOfCategory = items.filter((item) => item.category === category);

    let subcategories = [...new Set(itemsOfCategory.map((item) => item.subcategory))];

    return {
      name: category,
      subcategories: subcategories.map((subcat) => {
        return {
          name: subcat,
          items: items.filter((item) => item.category === category && item.subcategory === subcat),
        };
      }),
    };
  });
};

const sortList = (list) =>
  new Promise(function (resolve, reject) {
    try {
      resolve(
        list.sort((a, b) => {
          return (
            a.category.localeCompare(b.category) ||
            a.year.toString().localeCompare(b.year.toString())
          );
        }),
      );
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });

try {
  const list = getList();

  jsonKeysSort.sortAsync(list, true).then((list) => {
    sortList(list).then((list) => {
      console.log(`Writing ${list.length} items to ${jsonFile}`);

      fs.writeFile(jsonFile, JSON.stringify(list, null, 2), (error) => {
        console.log(`Wrote ${list.length} items to ${jsonFile}`);
        if (error) {
          reject(error);
        }
      });

      const doc = new yaml.Document();
      doc.contents = {
        categories: itemsByCategory(list),
      };

      fs.writeFile(yamlFile, doc.toString(), (error) => {
        if (error) {
          reject(error);
        }
      });
    });
  });
} catch (error) {
  console.error(error);
}
