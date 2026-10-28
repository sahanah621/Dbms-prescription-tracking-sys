/**
 * Enterprise Cypher Playground Controller
 * Modern Two-Column Studio Layout with Real-Time Filtering, Schema Reference & CSV Export
 */

let lastQueryResult = null;
let currentActiveFilter = 'all';

document.addEventListener('DOMContentLoaded', function () {
  updateCharCounter();

  // Attach keyboard shortcut (Cmd+Enter or Ctrl+Enter) to execute query
  const editor = document.getElementById('cypher-editor');
  if (editor) {
    editor.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runCypherQuery();
      }
    });

    editor.addEventListener('input', updateCharCounter);
  }

  // Preset queries do not auto-run until user explicitly clicks Execute Cypher
  resetResultCardPrompt('Default query loaded. Click Execute Cypher or press Ctrl+Enter to run.');
});

function resetResultCardPrompt(customMsg) {
  const statusBadge = document.getElementById('result-status-badge');
  const timingBadge = document.getElementById('result-timing-badge');
  const thead = document.getElementById('cypher-result-thead');
  const tbody = document.getElementById('cypher-result-tbody');
  const noteBanner = document.getElementById('result-note-banner');

  if (noteBanner) noteBanner.style.display = 'none';

  if (statusBadge) {
    statusBadge.className = 'badge';
    statusBadge.style.cssText = 'background: #1e293b; color: #f59e0b; border: 1px solid #78350f; font-size: 11px;';
    statusBadge.innerText = 'Ready to Execute';
  }
  if (timingBadge) {
    timingBadge.innerHTML = '<span class="text-teal"><i class="fas fa-play me-1"></i>Click Execute Cypher</span>';
  }
  if (thead) thead.innerHTML = '';
  if (tbody) {
    const msg = customMsg || 'Preset loaded into editor. Click Execute Cypher or press Ctrl+Enter to run.';
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-light opacity-75"><i class="fas fa-code me-2 text-warning"></i>${msg}</td></tr>`;
  }
}

function updateCharCounter() {
  const editor = document.getElementById('cypher-editor');
  const counter = document.getElementById('cypher-char-counter');
  if (editor && counter) {
    const chars = editor.value.length;
    const lines = editor.value.split('\n').length;
    counter.innerText = `${lines} line${lines === 1 ? '' : 's'} • ${chars} chars`;
  }
}

/**
 * Selects a preset query from the library and loads it into the editor
 */
function selectPreset(presetId) {
  const scriptTag = document.getElementById(`raw-cypher-${presetId}`);
  const presetItem = document.getElementById(`preset-item-${presetId}`);
  const editor = document.getElementById('cypher-editor');
  const activeBadgeTitle = document.getElementById('active-preset-title-text');

  if (!scriptTag || !editor) return;

  try {
    const cypherCode = JSON.parse(scriptTag.textContent);
    editor.value = cypherCode;
    updateCharCounter();
    editor.focus();

    // Update active highlight on preset list
    document.querySelectorAll('.cypher-preset-item').forEach(el => el.classList.remove('active'));
    if (presetItem) presetItem.classList.add('active');

    // Update active badge in editor header
    if (activeBadgeTitle && presetItem) {
      const titleEl = presetItem.querySelector('.cypher-preset-item-title');
      if (titleEl) {
        activeBadgeTitle.innerText = titleEl.innerText.trim();
      }
    }

    // Do NOT run automatically — show clean prompt indicating query is staged and ready
    resetResultCardPrompt('Preset loaded into editor. Click Execute Cypher or press Ctrl+Enter to run.');
  } catch (err) {
    console.error('Error loading preset query:', err);
  }
}

/**
 * Loads and immediately runs a preset query
 */
function executePresetDirectly(presetId) {
  selectPreset(presetId);
  runCypherQuery();
}

/**
 * Backward-compatible helper for legacy calls
 */
function loadPresetQuery(cypherText) {
  const editor = document.getElementById('cypher-editor');
  if (editor) {
    editor.value = cypherText;
    updateCharCounter();
    editor.focus();
  }
}

function clearCypherEditor() {
  const editor = document.getElementById('cypher-editor');
  const activeBadgeTitle = document.getElementById('active-preset-title-text');
  if (editor) {
    editor.value = '';
    updateCharCounter();
    editor.focus();
  }
  if (activeBadgeTitle) {
    activeBadgeTitle.innerText = 'Custom Query';
  }
  document.querySelectorAll('.cypher-preset-item').forEach(el => el.classList.remove('active'));
  resetResultCardPrompt('Editor cleared. Type a Cypher query or select a preset and click Execute Cypher.');
}

function copyCypherQuery() {
  const editor = document.getElementById('cypher-editor');
  const copyBtn = document.getElementById('btn-copy-query');
  if (!editor) return;

  const text = editor.value;
  if (!text.trim()) return;

  navigator.clipboard.writeText(text).then(() => {
    if (copyBtn) {
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check text-success me-1"></i> Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = originalHtml;
      }, 1800);
    }
  }).catch(err => {
    console.error('Clipboard copy failed:', err);
  });
}

/**
 * Filters preset query items by search keyword and category chip
 */
function filterPresetLibrary() {
  const searchInput = document.getElementById('preset-search-input');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const items = document.querySelectorAll('.cypher-preset-item');

  items.forEach(item => {
    const name = item.getAttribute('data-name') || '';
    const category = item.getAttribute('data-category') || '';
    const group = item.getAttribute('data-group') || 'general';

    const matchesSearch = !query || name.includes(query) || category.includes(query);
    const matchesFilter = currentActiveFilter === 'all' || group === currentActiveFilter;

    if (matchesSearch && matchesFilter) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

function clearPresetSearch() {
  const searchInput = document.getElementById('preset-search-input');
  if (searchInput) {
    searchInput.value = '';
    filterPresetLibrary();
  }
}

function setCategoryFilter(category, chipEl) {
  currentActiveFilter = category;

  // Update chip active states
  const chips = document.querySelectorAll('.cypher-filter-chip');
  chips.forEach(c => c.classList.remove('active'));
  if (chipEl) chipEl.classList.add('active');

  filterPresetLibrary();
}

/**
 * Executes the Cypher query via backend /api/neo4j/cypher
 */
function runCypherQuery() {
  const editor = document.getElementById('cypher-editor');
  const query = editor ? editor.value.trim() : '';

  if (!query) {
    alert('Please enter a Cypher query.');
    return;
  }

  const resultCard = document.getElementById('cypher-result-card');
  const statusBadge = document.getElementById('result-status-badge');
  const timingBadge = document.getElementById('result-timing-badge');
  const thead = document.getElementById('cypher-result-thead');
  const tbody = document.getElementById('cypher-result-tbody');
  const noteBanner = document.getElementById('result-note-banner');

  if (resultCard) resultCard.style.display = 'block';
  if (statusBadge) {
    statusBadge.className = 'badge bg-warning text-dark';
    statusBadge.innerText = 'Evaluating...';
  }
  if (timingBadge) {
    timingBadge.innerText = 'Executing query';
  }
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-light"><div class="spinner-border text-teal spinner-border-sm me-2" role="status"></div>Evaluating Cypher Graph Pattern...</td></tr>';
  }

  fetch('/api/neo4j/cypher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data) {
        lastQueryResult = data.data;
        if (statusBadge) {
          statusBadge.className = 'badge bg-success shadow-sm';
          statusBadge.innerText = `Success (${data.data.count} rows)`;
        }
        if (timingBadge) {
          const modeLabel = (data.data.mode || 'LIVE').toUpperCase();
          timingBadge.innerHTML = `${data.data.execution_time_ms} ms &bull; <span class="text-info">${modeLabel} GRAPH</span>`;
        }

        // Note banner for fallback or special hints
        if (noteBanner) {
          if (data.data.note) {
            noteBanner.style.display = 'block';
            noteBanner.innerHTML = `<i class="fas fa-info-circle me-1.5"></i> ${data.data.note}`;
          } else {
            noteBanner.style.display = 'none';
          }
        }

        renderTableResults(data.data.columns, data.data.rows);
        renderJsonResults(data.data.rows);
      } else {
        if (statusBadge) {
          statusBadge.className = 'badge bg-danger shadow-sm';
          statusBadge.innerText = 'Execution Failed';
        }
        if (timingBadge) {
          timingBadge.innerText = '0.00 ms';
        }
        if (noteBanner) {
          noteBanner.style.display = 'none';
        }
        if (thead) thead.innerHTML = '';
        if (tbody) {
          tbody.innerHTML = `<tr><td class="text-danger py-4 px-3" colspan="10"><div class="d-flex align-items-center gap-2"><i class="fas fa-exclamation-triangle fs-5"></i><div><div class="fw-bold">Cypher Execution Error</div><div class="small text-light opacity-75">${data.message || 'The graph engine rejected or could not parse this query.'}</div></div></div></td></tr>`;
        }
      }
    })
    .catch(err => {
      console.error('Cypher execution error:', err);
      if (statusBadge) {
        statusBadge.className = 'badge bg-danger shadow-sm';
        statusBadge.innerText = 'Network Error';
      }
      if (tbody) {
        tbody.innerHTML = '<tr><td class="text-danger py-4 text-center" colspan="10">Failed to connect to backend server.</td></tr>';
      }
    });
}

function renderTableResults(columns, rows) {
  const thead = document.getElementById('cypher-result-thead');
  const tbody = document.getElementById('cypher-result-tbody');
  if (!thead || !tbody) return;

  // Render headers
  thead.innerHTML = '';
  const trHead = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.className = 'py-2.5 px-3 font-monospace';
    th.innerText = col;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  // Render rows
  tbody.innerHTML = '';
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${columns.length || 1}" class="text-center py-4 text-muted"><i class="fas fa-inbox me-2"></i>Query executed successfully but returned 0 rows.</td></tr>`;
    return;
  }

  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      td.className = 'py-2.5 px-3';
      const val = r[col];
      const colLower = col.toLowerCase();

      if (val === null || val === undefined) {
        td.innerHTML = '<span class="text-secondary fst-italic">NULL</span>';
      } else if (Array.isArray(val)) {
        td.innerHTML = val.map(v => `<span class="badge border border-info text-info me-1" style="background: rgba(14, 165, 233, 0.22); font-size: 11px; font-weight: 700;">${v}</span>`).join('');
      } else if (colLower.endsWith('id') || colLower === 'id') {
        td.innerHTML = `<span class="badge border border-info border-opacity-50 text-info font-monospace px-2.5 py-1" style="background: rgba(14, 165, 233, 0.2); font-size: 12px; font-weight: 700;">#${val}</span>`;
      } else if (typeof val === 'number') {
        td.className += ' font-monospace';
        td.innerHTML = `<span class="fw-bold" style="color: #00f2fe; text-shadow: 0 0 10px rgba(0, 242, 254, 0.4); font-size: 13.5px;">${val.toLocaleString()}</span>`;
      } else if (colLower.includes('city') || colLower.includes('location')) {
        td.innerHTML = `<span class="badge" style="background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.45); color: #93c5fd; font-size: 12px; font-weight: 600;"><i class="fas fa-map-marker-alt me-1 text-primary"></i>${val}</span>`;
      } else if (colLower.includes('status')) {
        td.innerHTML = `<span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-2.5 py-1">${val}</span>`;
      } else {
        td.innerHTML = `<span class="text-light fw-semibold">${val}</span>`;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function renderJsonResults(rows) {
  const pre = document.getElementById('cypher-result-json');
  if (pre) {
    pre.innerText = JSON.stringify(rows, null, 2);
  }
}

function toggleResultView(viewType) {
  const tableContainer = document.getElementById('result-table-container');
  const jsonContainer = document.getElementById('result-json-container');
  const btnTable = document.getElementById('btn-view-table');
  const btnJson = document.getElementById('btn-view-json');

  if (viewType === 'table') {
    if (tableContainer) tableContainer.style.display = 'block';
    if (jsonContainer) jsonContainer.style.display = 'none';
    if (btnTable) btnTable.classList.add('active');
    if (btnJson) btnJson.classList.remove('active');
  } else {
    if (tableContainer) tableContainer.style.display = 'none';
    if (jsonContainer) jsonContainer.style.display = 'block';
    if (btnTable) btnTable.classList.remove('active');
    if (btnJson) btnJson.classList.add('active');
  }
}

/**
 * Exports the active query results to CSV
 */
function exportResultsCSV() {
  if (!lastQueryResult || !lastQueryResult.rows || lastQueryResult.rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const columns = lastQueryResult.columns || [];
  const rows = lastQueryResult.rows || [];

  const csvRows = [];
  // Header row
  csvRows.push(columns.map(c => `"${c.replace(/"/g, '""')}"`).join(','));

  // Data rows
  rows.forEach(r => {
    const rowValues = columns.map(col => {
      let val = r[col];
      if (val === null || val === undefined) val = '';
      else if (Array.isArray(val)) val = val.join('; ');
      else val = String(val);
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(rowValues.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cypher_query_results_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
