class CustomSearch {
  constructor(searchBarSelector, gridItemSelector, tagDataAttribute) {
    this.searchBar = document.querySelector(searchBarSelector);
    this.gridItems = document.querySelectorAll(gridItemSelector);
    this.tagDataAttribute = tagDataAttribute;

    this.init();
  }

  init() {
    this.searchBar.addEventListener("input", () => {
      this.filterItems();
    });
  }

  filterItems() {
    const searchParam = this.searchBar.value.trim().toLowerCase();

    this.gridItems.forEach((item) => {
      const tags = item.dataset[this.tagDataAttribute].toLowerCase();
      if (tags.includes(searchParam)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

  setSearchValue(value) {
    this.searchBar.value = value;
    this.filterItems();
  }
}

window.CustomSearch = CustomSearch;
