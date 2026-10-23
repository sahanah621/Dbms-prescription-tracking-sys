/**
 * Relationship Path Finder Controller
 * Calculates, visualizes, and navigates shortest paths across graph entities
 */

let pathNetwork = null;
let pathNodesDataSet = null;
let pathEdgesDataSet = null;
let isLabelsVisible = true;
let isLinearPipeline = true;
let currentPathPayload = null;

const ENTITY_PALETTE = {
  Patient: { bg: '#008080', border: '#2dd4bf', text: '#5eead4' },
  Doctor: { bg: '#4f46e5', border: '#818cf8', text: '#c7d2fe' },
  Hospital: { bg: '#7c3aed', border: '#a78bfa', text: '#ddd6fe' },
  Medicine: { bg: '#059669', border: '#34d399', text: '#a7f3d0' },
  Prescription: { bg: '#d97706', border: '#fbbf24', text: '#fde68a' },
  Pharmacy: { bg: '#0284c7', border: '#38bdf8', text: '#bae6fd' },
  Supplier: { bg: '#dc2626', border: '#f87171', text: '#fca5a5' },
  Manufacturer: { bg: '#6366f1', border: '#a5b4fc', text: '#e0e7ff' },
  WholesaleSupplier: { bg: '#ea580c', border: '#fb923c', text: '#fed7aa' }
};

document.addEventListener('DOMContentLoaded', function () {
  onFromTypeChange();
  onToTypeChange();

  // Auto-execute curated Preset 1 (Rahul Sharma -> Sun Pharma) immediately on load so canvas is never blank!
  setPathPreset('Patient', '401', 'Manufacturer', '701', 'preset-path-1');
});

function onFromTypeChange() {
  const typeSelect = document.getElementById('from-type-select');
  const idSelect = document.getElementById('from-id-select');
  if (!typeSelect || !idSelect || !window.PATH_ENTITIES) return;

  const type = typeSelect.value;
  const badge = document.getElementById('origin-type-badge');
  if (badge) badge.innerText = type;

  idSelect.innerHTML = '';
  const list = window.PATH_ENTITIES[type] || [];

  if (list.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.innerText = `No ${type} entities available`;
    idSelect.appendChild(opt);
    return;
  }

  list.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.innerText = item.label;
    idSelect.appendChild(opt);
  });
}

function onToTypeChange() {
  const typeSelect = document.getElementById('to-type-select');
  const idSelect = document.getElementById('to-id-select');
  if (!typeSelect || !idSelect || !window.PATH_ENTITIES) return;

  const type = typeSelect.value;
  const badge = document.getElementById('dest-type-badge');
  if (badge) badge.innerText = type;

  idSelect.innerHTML = '';
  const list = window.PATH_ENTITIES[type] || [];

  if (list.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.innerText = `No ${type} entities available`;
    idSelect.appendChild(opt);
    return;
  }

  list.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.innerText = item.label;
    idSelect.appendChild(opt);
  });
}

function setPathPreset(fromType, fromId, toType, toId, presetCardId) {
  const fromTypeEl = document.getElementById('from-type-select');
  const toTypeEl = document.getElementById('to-type-select');
  if (!fromTypeEl || !toTypeEl) return;

  fromTypeEl.value = fromType;
  onFromTypeChange();
  const fromIdEl = document.getElementById('from-id-select');
  if (fromIdEl) fromIdEl.value = fromId;

  toTypeEl.value = toType;
  onToTypeChange();
  const toIdEl = document.getElementById('to-id-select');
  if (toIdEl) toIdEl.value = toId;

  // Update active state across preset cards
  document.querySelectorAll('.path-preset-card').forEach(c => c.classList.remove('active'));
  if (presetCardId) {
    const card = document.getElementById(presetCardId);
    if (card) card.classList.add('active');
  }

  submitPathSearch(new Event('submit'));
}

function swapPathEndpoints() {
  const fromTypeEl = document.getElementById('from-type-select');
  const fromIdEl = document.getElementById('from-id-select');
  const toTypeEl = document.getElementById('to-type-select');
  const toIdEl = document.getElementById('to-id-select');
  if (!fromTypeEl || !toTypeEl) return;

  const curFromType = fromTypeEl.value;
  const curFromId = fromIdEl ? fromIdEl.value : '';
  const curToType = toTypeEl.value;
  const curToId = toIdEl ? toIdEl.value : '';

  fromTypeEl.value = curToType;
  onFromTypeChange();
  if (fromIdEl) fromIdEl.value = curToId;

  toTypeEl.value = curFromType;
  onToTypeChange();
  if (toIdEl) toIdEl.value = curFromId;

  document.querySelectorAll('.path-preset-card').forEach(c => c.classList.remove('active'));
  submitPathSearch(new Event('submit'));
}

function submitPathSearch(e) {
  if (e) e.preventDefault();

  const fromType = document.getElementById('from-type-select').value;
  const fromId = document.getElementById('from-id-select').value;
  const toType = document.getElementById('to-type-select').value;
  const toId = document.getElementById('to-id-select').value;

  if (!fromId || !toId) {
    alert('Please select both Origin and Destination entities.');
    return;
  }

  const placeholder = document.getElementById('path-placeholder-text');
  if (placeholder) {
    placeholder.style.display = 'block';
    placeholder.innerHTML = `
      <div class="spinner-border text-info mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
      <div class="fs-6 fw-semibold text-light">Executing Shortest Path Traversal...</div>
      <div class="small text-muted mt-1">Traversing multi-hop clinical & supply chain edges</div>
    `;
  }

  const submitBtn = document.getElementById('btn-find-path');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Searching...';
  }

  fetch('/api/neo4j/path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from_type: fromType,
      from_id: fromId,
      to_type: toType,
      to_id: toId
    })
  })
    .then(res => res.json())
    .then(data => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-search me-1"></i> Find Path';
      }

      if (data.success && data.data && data.data.found) {
        if (placeholder) placeholder.style.display = 'none';
        currentPathPayload = data.data;

        renderPathBreadcrumbs(currentPathPayload.hops, currentPathPayload.length, currentPathPayload.nodes);
        renderPathNetwork(currentPathPayload.nodes, currentPathPayload.edges);

        const badge = document.getElementById('path-metrics-badge');
        if (badge) {
          const modeTag = currentPathPayload.mode === 'live' ? 'Neo4j Live' : 'Graph Model';
          badge.className = 'badge bg-success px-3 py-2 text-white';
          badge.innerHTML = `<i class="fas fa-check-circle me-1"></i> Path Found: ${currentPathPayload.length} Traversal Hops (${modeTag})`;
        }
      } else {
        const msg = data.data && data.data.message ? data.data.message : (data.message || 'No relational path found between selected entities.');
        if (placeholder) {
          placeholder.style.display = 'block';
          placeholder.innerHTML = `
            <i class="fas fa-exclamation-triangle fa-3x mb-2 text-warning"></i>
            <div class="fs-6 fw-semibold text-warning">${msg}</div>
            <div class="small text-muted mt-1">Try selecting different entities or one of the recommended presets above.</div>
          `;
        }
        document.getElementById('path-breadcrumbs-container').style.display = 'none';
        const badge = document.getElementById('path-metrics-badge');
        if (badge) {
          badge.className = 'badge bg-warning text-dark px-3 py-2';
          badge.innerHTML = '<i class="fas fa-times-circle me-1"></i> No Direct Path';
        }
      }
    })
    .catch(err => {
      console.error('Path error:', err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-search me-1"></i> Find Path';
      }
      if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.innerHTML = `
          <i class="fas fa-times-circle fa-3x mb-2 text-danger"></i>
          <div class="fs-6 fw-semibold text-danger">Failed to compute shortest path.</div>
        `;
      }
    });
}

function wrapText(text, maxChars = 22) {
  if (!text) return '';
  const words = String(text).split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(w => {
    if ((currentLine + ' ' + w).trim().length > maxChars) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine = (currentLine + ' ' + w).trim();
    }
  });
  if (currentLine) lines.push(currentLine.trim());
  return lines.slice(0, 3).join('\n');
}

function renderPathBreadcrumbs(hops, length, nodes) {
  const container = document.getElementById('path-breadcrumbs-container');
  const list = document.getElementById('path-hops-list');
  const degreeLabel = document.getElementById('breadcrumb-degree-label');
  if (!container || !list) return;

  container.style.display = 'block';
  list.innerHTML = '';
  if (degreeLabel) {
    degreeLabel.innerHTML = `<strong>${length}</strong> degree${length === 1 ? '' : 's'} of separation &bull; <strong>${hops.length}</strong> nodes visited`;
  }

  hops.forEach((hop, idx) => {
    const isStart = (idx === 0);
    const isEnd = (idx === hops.length - 1);
    const nodeObj = nodes && nodes[idx] ? nodes[idx] : {};
    const group = nodeObj.group || (nodeObj.id ? nodeObj.id.split('_')[0] : 'Entity');

    const hopItem = document.createElement('div');
    hopItem.className = 'd-inline-flex align-items-center p-1 px-2 rounded cursor-pointer border';
    hopItem.style.cursor = 'pointer';

    if (isStart) {
      hopItem.style.background = 'rgba(16, 185, 129, 0.2)';
      hopItem.style.borderColor = '#10b981';
      hopItem.style.color = '#6ee7b7';
      hopItem.innerHTML = `<span class="badge bg-success me-2">1 &bull; START</span> <strong>${hop}</strong> <span class="badge border border-secondary text-info ms-2" style="background: rgba(15, 23, 42, 0.85);">${group}</span>`;
    } else if (isEnd) {
      hopItem.style.background = 'rgba(245, 158, 11, 0.2)';
      hopItem.style.borderColor = '#f59e0b';
      hopItem.style.color = '#fbbf24';
      hopItem.innerHTML = `<span class="badge bg-warning text-dark me-2">${idx + 1} &bull; TARGET</span> <strong>${hop}</strong> <span class="badge border border-secondary text-info ms-2" style="background: rgba(15, 23, 42, 0.85);">${group}</span>`;
    } else {
      hopItem.style.background = 'rgba(30, 41, 59, 0.8)';
      hopItem.style.borderColor = '#475569';
      hopItem.style.color = '#e2e8f0';
      hopItem.innerHTML = `<span class="badge bg-secondary me-2">${idx + 1}</span> ${hop} <span class="badge border border-secondary text-info ms-2" style="background: rgba(15, 23, 42, 0.85);">${group}</span>`;
    }

    hopItem.onclick = function () {
      if (pathNetwork && nodeObj.id) {
        pathNetwork.focus(nodeObj.id, {
          scale: 1.4,
          animation: { duration: 500, easingFunction: 'easeInOutQuad' }
        });
        pathNetwork.selectNodes([nodeObj.id]);
      }
    };

    list.appendChild(hopItem);

    if (idx < hops.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'text-info px-1';
      arrow.innerHTML = '<i class="fas fa-arrow-right"></i>';
      list.appendChild(arrow);
    }
  });
}

function formatVisNode(n, idx, total) {
  const isStart = (idx === 0);
  const isEnd = (idx === total - 1);
  const group = n.group || (n.id ? n.id.split('_')[0] : 'Node');
  const palette = ENTITY_PALETTE[group] || { bg: '#1e293b', border: '#38bdf8', text: '#f8fafc' };

  let labelText = '';
  const cleanName = n.label || n.name || n.id;
  const wrapped = wrapText(cleanName, 20);

  if (isStart) {
    labelText = `🟢 [ORIGIN: ${group.toUpperCase()}]\n${wrapped}`;
  } else if (isEnd) {
    labelText = `🎯 [TARGET: ${group.toUpperCase()}]\n${wrapped}`;
  } else {
    labelText = `[${idx + 1}: ${group.toUpperCase()}]\n${wrapped}`;
  }

  // Node position in horizontal pipeline
  const spacing = 280;
  const nodeX = idx * spacing;
  const nodeY = 0;

  return {
    ...n,
    id: n.id,
    label: labelText,
    shape: 'dot',
    size: (isStart || isEnd) ? 30 : 22,
    level: idx,
    x: isLinearPipeline ? nodeX : undefined,
    y: isLinearPipeline ? nodeY : undefined,
    fixed: isLinearPipeline ? { x: true, y: true } : false,
    color: {
      background: isStart ? '#064e3b' : (isEnd ? '#78350f' : palette.bg),
      border: isStart ? '#10b981' : (isEnd ? '#f59e0b' : palette.border),
      highlight: {
        background: isStart ? '#047857' : (isEnd ? '#b45309' : palette.border),
        border: '#ffffff'
      },
      hover: {
        background: isStart ? '#10b981' : (isEnd ? '#f59e0b' : palette.border),
        border: '#ffffff'
      }
    },
    borderWidth: (isStart || isEnd) ? 4 : 2,
    shadow: {
      enabled: true,
      color: isStart ? 'rgba(16, 185, 129, 0.6)' : (isEnd ? 'rgba(245, 158, 11, 0.6)' : 'rgba(0, 0, 0, 0.5)'),
      size: (isStart || isEnd) ? 16 : 8,
      x: 0,
      y: 0
    },
    font: {
      size: (isStart || isEnd) ? 13 : 11.5,
      face: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#ffffff',
      bold: true,
      strokeWidth: 4,
      strokeColor: '#070b14',
      multi: true
    },
    title: n.title || `<b>${group}:</b> ${cleanName}`
  };
}

function formatVisEdge(e) {
  return {
    ...e,
    id: e.id,
    from: e.from,
    to: e.to,
    label: isLabelsVisible ? (e.label || '') : '',
    width: 3,
    color: {
      color: '#38bdf8',
      highlight: '#00d4b2',
      hover: '#7dd3fc'
    },
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 1.15,
        type: 'arrow'
      }
    },
    smooth: isLinearPipeline ? false : { type: 'continuous', roundness: 0.2 },
    font: {
      size: 11,
      face: 'Inter, system-ui, sans-serif',
      color: '#38bdf8',
      bold: true,
      background: '#0a0f1d',
      strokeWidth: 1.5,
      strokeColor: '#0284c7',
      align: 'top',
      vadjust: -6
    },
    shadow: {
      enabled: true,
      color: 'rgba(56, 189, 248, 0.3)',
      size: 6,
      x: 0,
      y: 0
    }
  };
}

function renderPathNetwork(nodes, edges) {
  const container = document.getElementById('path-canvas');
  if (!container) return;

  const totalNodes = nodes.length;
  const formattedNodes = nodes.map((n, i) => formatVisNode(n, i, totalNodes));
  const formattedEdges = edges.map(e => formatVisEdge(e));

  pathNodesDataSet = new vis.DataSet(formattedNodes);
  pathEdgesDataSet = new vis.DataSet(formattedEdges);

  const data = {
    nodes: pathNodesDataSet,
    edges: pathEdgesDataSet
  };

  const options = {
    interaction: {
      dragNodes: true,
      dragView: true,
      zoomView: true,
      hover: true,
      tooltipDelay: 100,
      navigationButtons: false,
      keyboard: false
    }
  };

  if (isLinearPipeline) {
    options.physics = false;
    options.layout = {
      hierarchical: {
        enabled: true,
        direction: 'LR',
        sortMethod: 'directed',
        levelSeparation: 260,
        nodeSpacing: 110
      }
    };
  } else {
    options.physics = {
      enabled: true,
      solver: 'barnesHut',
      barnesHut: {
        gravitationalConstant: -5000,
        centralGravity: 0.1,
        springLength: 200,
        springConstant: 0.05,
        damping: 0.85
      },
      stabilization: {
        enabled: true,
        iterations: 100,
        fit: true
      }
    };
  }

  // Destroy previous network instance safely to avoid memory leak and event contention
  if (pathNetwork) {
    try { pathNetwork.destroy(); } catch (err) {}
    pathNetwork = null;
  }

  pathNetwork = new vis.Network(container, data, options);

  // Auto-center and fit upon rendering
  pathNetwork.once('afterDrawing', function () {
    pathNetwork.fit({
      animation: { duration: 500, easingFunction: 'easeInOutQuad' }
    });
  });

  if (!isLinearPipeline) {
    // In dynamic layout, freeze physics once stable to achieve 0% CPU consumption
    pathNetwork.once('stabilizationIterationsDone', function () {
      pathNetwork.setOptions({ physics: { enabled: false } });
      pathNetwork.fit({
        animation: { duration: 400, easingFunction: 'easeInOutQuad' }
      });
    });
  }

  // Interactive node spotlight & camera focus on click
  pathNetwork.on('click', function (params) {
    if (params.nodes && params.nodes.length > 0) {
      const selectedId = params.nodes[0];
      spotlightPathNode(selectedId);
    } else {
      resetPathSpotlight();
    }
  });
}

let activePathSpotlight = null;

function spotlightPathNode(selectedId) {
  if (!pathNodesDataSet || !pathNetwork) return;

  const updates = [];
  pathNodesDataSet.forEach(node => {
    if (node.id === selectedId) {
      updates.push({
        id: node.id,
        opacity: 1.0,
        font: { ...node.font, color: '#ffffff' }
      });
    } else {
      updates.push({
        id: node.id,
        opacity: 0.2,
        font: { ...node.font, color: 'rgba(255,255,255,0.25)' }
      });
    }
  });
  pathNodesDataSet.update(updates);
}

function spotlightByPathGroup(groupName) {
  if (!pathNodesDataSet || !currentPathPayload) return;

  if (activePathSpotlight === groupName) {
    resetPathSpotlight();
    activePathSpotlight = null;
    return;
  }
  activePathSpotlight = groupName;

  const total = currentPathPayload.nodes.length;
  const updates = [];

  pathNodesDataSet.forEach((node, i) => {
    const isStart = (i === 0);
    const isEnd = (i === total - 1);
    const nodeGroup = node.group || (node.id ? node.id.split('_')[0] : '');

    let matches = false;
    if (groupName === 'Origin') matches = isStart;
    else if (groupName === 'Target') matches = isEnd;
    else matches = (nodeGroup.toLowerCase() === groupName.toLowerCase());

    if (matches) {
      updates.push({
        id: node.id,
        opacity: 1.0,
        font: { ...node.font, color: '#ffffff' }
      });
    } else {
      updates.push({
        id: node.id,
        opacity: 0.18,
        font: { ...node.font, color: 'rgba(255,255,255,0.2)' }
      });
    }
  });
  pathNodesDataSet.update(updates);
}

function resetPathSpotlight() {
  if (!pathNodesDataSet) return;
  const updates = [];
  pathNodesDataSet.forEach(node => {
    updates.push({
      id: node.id,
      opacity: 1.0,
      font: { ...node.font, color: '#ffffff' }
    });
  });
  pathNodesDataSet.update(updates);
  activePathSpotlight = null;
}

// Global pathControls toolbar actions
window.pathControls = {
  fitView: function () {
    if (!pathNetwork) return;
    pathNetwork.fit({
      animation: { duration: 500, easingFunction: 'easeInOutQuad' }
    });
  },

  zoomIn: function () {
    if (!pathNetwork) return;
    const currentScale = pathNetwork.getScale();
    pathNetwork.moveTo({
      scale: Math.min(3.5, currentScale * 1.3),
      animation: { duration: 250, easingFunction: 'easeInOutQuad' }
    });
  },

  zoomOut: function () {
    if (!pathNetwork) return;
    const currentScale = pathNetwork.getScale();
    pathNetwork.moveTo({
      scale: Math.max(0.15, currentScale * 0.77),
      animation: { duration: 250, easingFunction: 'easeInOutQuad' }
    });
  },

  reCenter: function () {
    if (!pathNetwork || !currentPathPayload) return;
    if (currentPathPayload.nodes && currentPathPayload.nodes.length > 0) {
      const firstId = currentPathPayload.nodes[0].id;
      pathNetwork.focus(firstId, {
        scale: 1.0,
        animation: { duration: 450, easingFunction: 'easeInOutQuad' }
      });
    } else {
      this.fitView();
    }
  },

  toggleLabels: function () {
    if (!pathEdgesDataSet || !currentPathPayload) return;
    isLabelsVisible = !isLabelsVisible;

    const btn = document.getElementById('btn-toggle-labels');
    if (btn) {
      btn.classList.toggle('active', isLabelsVisible);
    }

    const updatedEdges = currentPathPayload.edges.map(e => formatVisEdge(e));
    pathEdgesDataSet.update(updatedEdges);
  },

  toggleLayout: function () {
    if (!currentPathPayload) return;
    isLinearPipeline = !isLinearPipeline;

    const modeLabel = document.getElementById('layout-mode-label');
    if (modeLabel) {
      modeLabel.innerText = isLinearPipeline ? 'Linear' : 'Dynamic';
    }

    renderPathNetwork(currentPathPayload.nodes, currentPathPayload.edges);
  }
};

