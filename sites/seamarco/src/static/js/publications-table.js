(function () {
  var table = document.getElementById('publications-table');
  if (!table) return;

  var tbody = table.querySelector('tbody');
  var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr[data-search]'));
  var noResultsRow = document.getElementById('publications-no-results');
  var searchInput = document.getElementById('publications-search');
  var categorySelect = document.getElementById('publications-category');
  var countEl = document.getElementById('publications-count');
  var headers = Array.prototype.slice.call(table.querySelectorAll('th[data-sort]'));

  var sortState = { key: 'year', direction: 'desc' };

  function applyFilters() {
    var query = (searchInput.value || '').trim().toLowerCase();
    var category = categorySelect.value;
    var visibleCount = 0;

    rows.forEach(function (row) {
      var matchesQuery = !query || row.dataset.search.indexOf(query) !== -1;
      var matchesCategory = !category || row.dataset.category === category;
      var visible = matchesQuery && matchesCategory;
      row.classList.toggle('hidden', !visible);
      if (visible) visibleCount++;
    });

    if (noResultsRow) {
      noResultsRow.classList.toggle('hidden', visibleCount !== 0);
    }

    if (countEl && countEl.dataset.template) {
      countEl.textContent = countEl.dataset.template
        .replace('{count}', visibleCount)
        .replace('{total}', rows.length);
    }
  }

  function sortRows(key, forcedDirection) {
    var direction =
      forcedDirection || (sortState.key === key && sortState.direction === 'asc' ? 'desc' : 'asc');
    sortState = { key: key, direction: direction };

    rows.sort(function (a, b) {
      if (key === 'year') {
        var aYear = parseInt(a.dataset.year, 10) || 0;
        var bYear = parseInt(b.dataset.year, 10) || 0;
        return direction === 'asc' ? aYear - bYear : bYear - aYear;
      }

      var aVal = (a.dataset[key] || '').toLowerCase();
      var bVal = (b.dataset[key] || '').toLowerCase();
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    rows.forEach(function (row) {
      tbody.insertBefore(row, noResultsRow || null);
    });

    headers.forEach(function (header) {
      header.removeAttribute('data-direction');
    });

    var activeHeader = table.querySelector('th[data-sort="' + key + '"]');
    if (activeHeader) {
      activeHeader.setAttribute('data-direction', direction);
    }
  }

  headers.forEach(function (header) {
    header.addEventListener('click', function () {
      sortRows(header.dataset.sort);
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (categorySelect) {
    categorySelect.addEventListener('change', applyFilters);
  }

  sortRows('year', 'desc');
  applyFilters();
})();
