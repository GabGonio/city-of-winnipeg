const form = document.getElementById('searchForm');
const statusMessage = document.getElementById('statusMessage');
const tableWrapper = document.getElementById('tableWrapper');
const resultsBody = document.getElementById('resultsBody');
const tableCaption = document.getElementById('tableCaption');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const commonName = document.getElementById('commonName').value.trim();

  if (!commonName) {
    return;
  }

  searchTrees(commonName);
});

async function searchTrees(commonName) {
  setStatus('Searching tree inventory…', false);
  tableWrapper.hidden = true;
  resultsBody.innerHTML = '';

  const apiUrl =
    'https://data.winnipeg.ca/resource/d3jk-hb6j.json?' +
    `$where=lower(common_name) LIKE lower('%${commonName}%')` +
    '&$order=diameter_at_breast_height DESC' +
    '&$limit=100';

  const encodedURL = encodeURI(apiUrl);

  try {
    const response = await fetch(encodedURL);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status} (${response.statusText})`);
    }

    const trees = await response.json();

    renderTable(trees, commonName);
  } catch (error) {
    console.error('Tree search error:', error);
    setStatus(
      `Could not load tree data. Please check your connection and try again. (${error.message})`,
      true
    );
  }
}

function renderTable(trees, searchTerm) {
  if (trees.length === 0) {
    setStatus(`No trees found matching "${searchTerm}". Try a different name.`, false);
    return;
  }

  setStatus('', false);
  tableCaption.textContent = `Top ${trees.length} largest trees matching "${searchTerm}" — sorted by diameter at breast height`;

  trees.forEach((tree, index) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(tree.common_name ?? '—')}</td>
      <td><em>${escapeHtml(tree.botanical_name ?? '—')}</em></td>
      <td>${tree.diameter_at_breast_height ?? '—'}</td>
      <td>${escapeHtml(tree.neighbourhood ?? '—')}</td>
      <td>${escapeHtml(tree.electoral_ward ?? '—')}</td>
      <td>${escapeHtml(tree.street ?? '—')}</td>
      <td>${escapeHtml(tree.location_class ?? '—')}</td>
      <td>${escapeHtml(tree.park ?? '—')}</td>
    `;

    resultsBody.appendChild(row);
  });

  tableWrapper.hidden = false;
}

function setStatus(message, isError) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message' + (isError ? ' error' : '');
}

// Prevent XSS by escaping user-sourced text before inserting it into the DOM
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
