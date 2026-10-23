/**
 * Enterprise Graph Explorer Controller
 * Isolates and expands the 1-hop or 2-hop neighborhood of a chosen entity
 * Features: Auto-Centering, ForceAtlas2 Physics, Spotlight, Canvas Controls,
 * Executive Hero Banner, and 1-Click Pivot Exploration.
 */

let explorerNetwork = null;
let currentCenterId = null;
let currentNodesDataSet = null;
let currentEdgesDataSet = null;
let originalNodesList = [];
let originalEdgesList = [];
let showEdgeLabels = false;
let physicsEnabled = true;

document.addEventListener('DOMContentLoaded', function () {
  // Check URL query parameters (e.g. ?label=Doctor&id=304)
  const urlParams = new URLSearchParams(window.location.search);
  const qLabel = urlParams.get('label');
  const qId = urlParams.get('id');

  if (qLabel && qId) {
    const catSelect = document.getElementById('explorer-category-select');
    if (catSelect) {
      catSelect.value = qLabel;
      onExplorerCategoryChange();
      const instSelect = document.getElementById('explorer-instance-select');
      if (instSelect) instSelect.value = qId;
      submitExplorerSearch();
    }
  } else {
    // Default: initialize dropdown to Doctor 304 (Dr. Pooja Rao)
    const catSelect = document.getElementById('explorer-category-select');
    if (catSelect) {
      catSelect.value = 'Doctor';
      onExplorerCategoryChange();
      const instSelect = document.getElementById('explorer-instance-select');
      if (instSelect) {
        instSelect.value = '304';
      }
      submitExplorerSearch();
    }
  }

  // High-contrast radio toggle handlers
  const depthRadios = document.querySelectorAll('input[name="depthRadio"]');
  depthRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      const lbl1 = document.getElementById('label-depth1');
      const lbl2 = document.getElementById('label-depth2');
      if (this.value === '1') {
        if (lbl1) {
          lbl1.classList.add('active');
          lbl1.removeAttribute('style');
        }
        if (lbl2) {
          lbl2.classList.remove('active');
          lbl2.removeAttribute('style');
        }
      } else {
        if (lbl2) {
          lbl2.classList.add('active');
          lbl2.removeAttribute('style');
        }
        if (lbl1) {
          lbl1.classList.remove('active');
          lbl1.removeAttribute('style');
        }
      }
      submitExplorerSearch();
    });
  });
});

function onExplorerCategoryChange() {
  const cat = document.getElementById('explorer-category-select').value;
  const instSelect = document.getElementById('explorer-instance-select');
  if (!instSelect || !window.EXPLORER_DATA) return;

  instSelect.innerHTML = '';
  const list = window.EXPLORER_DATA[cat] || [];
  list.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.innerText = item.label;
    if (cat === 'Doctor' && item.id === '304') {
      opt.selected = true;
    }
    instSelect.appendChild(opt);
  });
}

function exploreEntityPreset(label, id, name) {
  const catSelect = document.getElementById('explorer-category-select');
  if (catSelect) {
    catSelect.value = label;
    onExplorerCategoryChange();
    const instSelect = document.getElementById('explorer-instance-select');
    if (instSelect) {
      instSelect.value = id;
    }
    submitExplorerSearch();
  }
}

function updateActivePresetHighlight(label, id) {
  document.querySelectorAll('.explorer-preset-card').forEach(c => c.classList.remove('active'));
  const targetCard = document.getElementById(`preset-card-${label}-${id}`);
  if (targetCard) {
    targetCard.classList.add('active');
  }
}

function submitExplorerSearch() {
  const label = document.getElementById('explorer-category-select').value;
  const entityId = document.getElementById('explorer-instance-select').value;
  const depthInput = document.querySelector('input[name="depthRadio"]:checked');
  const depth = depthInput ? parseInt(depthInput.value) : 2;

  if (!entityId) {
    alert('Please select an entity instance to explore.');
    return;
  }

  updateActivePresetHighlight(label, entityId);

  const placeholder = document.getElementById('explorer-placeholder-text');
  if (placeholder) {
    placeholder.style.display = 'block';
    placeholder.innerHTML = `
      <div class="spinner-border text-info mb-2" style="width: 2.5rem; height: 2.5rem;"></div>
      <h6 class="text-light fw-bold mt-2">Traversing Relational Neighborhood...</h6>
      <div class="small text-muted">Tracing ${depth}-hop clinical pathways across Property Graph Ontology</div>
    `;
  }

  fetch('/api/neo4j/explore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label: label, entity_id: entityId, depth: depth })
  })
    .then(res => res.json())
    .then(data => {
      if (placeholder) placeholder.style.display = 'none';

      if (data.success && data.data) {
        const payload = data.data;
        currentCenterId = payload.center_node_id;
        originalNodesList = payload.nodes || [];
        // Ensure decommissioned drug interactions are never present in explorer
        originalEdgesList = (payload.edges || []).filter(e => e.label !== 'INTERACTS_WITH' && e.type !== 'INTERACTS_WITH');

        renderExplorerGraph(originalNodesList, originalEdgesList, currentCenterId);
        renderExplorerSummary(originalNodesList, originalEdgesList, currentCenterId, depth);

        const badge = document.getElementById('explorer-result-badge');
        if (badge) {
          badge.className = 'badge bg-success text-light fs-7 px-2 py-1';
          badge.innerHTML = `<i class="fas fa-check-circle me-1"></i> ${payload.nodes.length} Nodes & ${originalEdgesList.length} Edges (${depth}-Hop Subgraph)`;
        }
      } else {
        alert('Exploration failed: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Explorer error:', err);
      if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.innerHTML = '<div class="text-danger"><i class="fas fa-exclamation-triangle me-1"></i> Failed to fetch neighborhood data.</div>';
      }
    });
}

// Smart Clean Label Formatter: keeps canvas uncluttered, puts full specs in tooltip
function formatNodeLabel(rawLabel, group) {
  if (!rawLabel) return '';

  // Clean Medicine: Show clean product brand, drop long chemical formula from node canvas
  if (group === 'Medicine') {
    if (rawLabel.includes(' (')) {
      return rawLabel.split(' (')[0].trim();
    }
    if (rawLabel.includes(' Tablet')) return rawLabel.replace(' Tablet', '').trim();
    if (rawLabel.includes(' Capsule')) return rawLabel.replace(' Capsule', '').trim();
    return rawLabel;
  }

  // Clean Hospital: Shorten lengthy hospital names
  if (group === 'Hospital') {
    return rawLabel
      .replace(' & Research Centre', '')
      .replace(' Apex Trauma & Emergency Centre', ' Trauma Centre')
      .replace(' Hospital & Research Institute', '')
      .trim();
  }

  // Clean Pharmacy: Shorten retail branch suffixes
  if (group === 'Pharmacy') {
    return rawLabel
      .replace(' HealthCity Pharmacy', ' Pharmacy')
      .replace(' Community Care', '')
      .replace(' Express', '')
      .trim();
  }

  // Wrap long text (>18 chars) evenly
  if (rawLabel.length > 18 && rawLabel.includes(' ')) {
    const words = rawLabel.split(' ');
    let line1 = '';
    let line2 = '';
    words.forEach(w => {
      if ((line1 + ' ' + w).trim().length <= 15) {
        line1 = (line1 + ' ' + w).trim();
      } else {
        line2 = (line2 + ' ' + w).trim();
      }
    });
    if (line2) return `${line1}\n${line2}`;
  }
  return rawLabel;
}

// Format raw Cypher relationships into clean executive badges
function formatEdgeLabel(rawLabel) {
  if (!rawLabel) return '';
  const mapping = {
    'HAS_PRESCRIPTION': 'prescribes',
    'CONTAINS_MEDICINE': 'contains',
    'CONTAINS': 'contains',
    'STOCKS': 'stocks',
    'WRITES': 'writes',
    'WORKS_AT': 'at',
    'EMPLOYED_AT': 'at',
    'AFFILIATED_WITH': 'affiliated',
    'SUPPLIES_TO': 'supplies',
    'SUPPLIES': 'supplies',
    'PROCURES_FROM': 'procures',
    'DISPENSES': 'dispenses',
    'MANUFACTURES': 'manufactures'
  };
  return mapping[rawLabel] || rawLabel.toLowerCase().replace(/_/g, ' ');
}

// Smart Radial Layout Coordinate Generator: generously spaced constellation
function computeRadialLayout(nodes, edges, centerId) {
  const hop1Set = new Set();
  edges.forEach(e => {
    if (e.from === centerId) hop1Set.add(e.to);
    else if (e.to === centerId) hop1Set.add(e.from);
  });

  const hop1Nodes = nodes.filter(n => hop1Set.has(n.id) && n.id !== centerId);
  const hop2Nodes = nodes.filter(n => !hop1Set.has(n.id) && n.id !== centerId);

  const coords = {};
  // Anchor focal center node at origin (0, 0)
  coords[centerId] = { x: 0, y: 0, fixed: { x: true, y: true } };

  const n1 = hop1Nodes.length;
  const r1 = Math.max(260, Math.min(420, 52 * n1));
  const hop1Angles = {};

  hop1Nodes.forEach((n, idx) => {
    const angle = (2 * Math.PI * idx / n1) - (Math.PI / 2);
    hop1Angles[n.id] = angle;
    coords[n.id] = {
      x: Math.round(r1 * Math.cos(angle)),
      y: Math.round(r1 * Math.sin(angle)),
      fixed: false
    };
  });

  // Map hop2 nodes to parent hop1 nodes
  const groupedHop2 = {};
  hop2Nodes.forEach(n => {
    const parents = [];
    edges.forEach(e => {
      if (e.from === n.id && hop1Set.has(e.to)) parents.push(e.to);
      else if (e.to === n.id && hop1Set.has(e.from)) parents.push(e.from);
    });
    const parentId = parents[0] || (hop1Nodes[0] ? hop1Nodes[0].id : null);
    if (!groupedHop2[parentId]) groupedHop2[parentId] = [];
    groupedHop2[parentId].push(n.id);
  });

  const r2 = r1 + 240;
  Object.entries(groupedHop2).forEach(([parentId, children]) => {
    const baseAngle = hop1Angles[parentId] !== undefined ? hop1Angles[parentId] : 0;
    const nc = children.length;
    const arcSpread = Math.min(Math.PI * 0.9, 0.35 * nc);
    const startAngle = baseAngle - (arcSpread / 2);
    const step = nc > 1 ? arcSpread / (nc - 1) : 0;

    children.forEach((cid, j) => {
      const cAngle = nc > 1 ? startAngle + (j * step) : baseAngle;
      coords[cid] = {
        x: Math.round(r2 * Math.cos(cAngle)),
        y: Math.round(r2 * Math.sin(cAngle)),
        fixed: false
      };
    });
  });

  return coords;
}

function renderExplorerGraph(nodes, edges, centerId) {
  const container = document.getElementById('explorer-canvas');
  if (!container) return;

  // Defensive filter: Ensure decommissioned drug interactions are never rendered
  edges = (edges || []).filter(e => e.label !== 'INTERACTS_WITH' && e.type !== 'INTERACTS_WITH');

  const coords = computeRadialLayout(nodes, edges, centerId);

  // Clean formatted nodes with multiline labels and radial coordinate seeds
  const formattedNodes = nodes.map(n => {
    const isCenter = (n.id === centerId || n.is_center === true);
    const pos = coords[n.id] || { x: 0, y: 0, fixed: false };
    const wrappedLabel = formatNodeLabel(n.label || n.name || n.id, n.group);

    // Build rich hover tooltip title
    const tooltipTitle = `<b>${n.label || n.name || n.id}</b><br><span style="color:#94a3b8">Type: ${n.group || 'Entity'}</span>`;

    if (isCenter) {
      return {
        ...n,
        x: pos.x,
        y: pos.y,
        fixed: true, // Anchor during stabilization so constellation builds around center
        label: wrappedLabel,
        title: tooltipTitle,
        size: 34,
        color: {
          background: '#f59e0b',
          border: '#ffffff',
          highlight: { background: '#fbbf24', border: '#ffffff' },
          hover: { background: '#fbbf24', border: '#ffffff' }
        },
        borderWidth: 4,
        shadow: { enabled: true, color: 'rgba(245, 158, 11, 0.75)', size: 14, x: 0, y: 0 },
        font: {
          size: 13.5,
          color: '#ffffff',
          bold: true,
          face: 'Inter, sans-serif',
          strokeWidth: 4,
          strokeColor: '#030712',
          multi: true
        }
      };
    } else {
      return {
        ...n,
        x: pos.x,
        y: pos.y,
        fixed: false,
        label: wrappedLabel,
        title: tooltipTitle,
        size: 22,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 6, x: 1, y: 1 },
        font: {
          size: 11.5,
          color: '#f8fafc',
          bold: true,
          face: 'Inter, sans-serif',
          strokeWidth: 3.5,
          strokeColor: '#030712',
          multi: true
        }
      };
    }
  });

  // Clean formatted edges with dark background pills
  const formattedEdges = edges.map(e => {
    const cleanLabel = formatEdgeLabel(e.label);

    return {
      ...e,
      label: showEdgeLabels ? cleanLabel : '',
      title: `${cleanLabel} (${e.from} → ${e.to})`,
      width: 1.8,
      dashes: false,
      color: { color: 'rgba(56, 189, 248, 0.45)', highlight: '#38bdf8', hover: '#67e8f9' },
      arrows: { to: { enabled: true, scaleFactor: 0.75 } },
      font: {
        size: 10,
        color: '#e2e8f0',
        face: 'Inter, sans-serif',
        background: 'rgba(11, 17, 34, 0.92)',
        strokeWidth: 0,
        align: 'middle'
      },
      smooth: { type: 'continuous', roundness: 0.2 }
    };
  });

  currentNodesDataSet = new vis.DataSet(formattedNodes);
  currentEdgesDataSet = new vis.DataSet(formattedEdges);

  const data = {
    nodes: currentNodesDataSet,
    edges: currentEdgesDataSet
  };

  const options = {
    nodes: {
      shape: 'dot',
      borderWidth: 2
    },
    physics: {
      enabled: true,
      solver: 'barnesHut',
      barnesHut: {
        gravitationalConstant: -22000,
        centralGravity: 0.08,
        springLength: 280,
        springConstant: 0.035,
        damping: 0.88,
        avoidOverlap: 1.0
      },
      stabilization: {
        enabled: true,
        iterations: 150,
        updateInterval: 25,
        fit: true
      }
    },
    interaction: {
      dragNodes: true,
      dragView: true,
      zoomView: true,
      hover: true,
      tooltipDelay: 100,
      hideEdgesOnDrag: false
    }
  };

  // Destroy previous network instance to release memory and canvas bindings
  if (explorerNetwork) {
    try { explorerNetwork.destroy(); } catch (err) {}
    explorerNetwork = null;
  }

  explorerNetwork = new vis.Network(container, data, options);

  // Auto-Center & Freeze physics upon stabilization (0% CPU load, silky-smooth 60fps interaction)
  explorerNetwork.once('stabilizationIterationsDone', function () {
    // Unfix center node so user can drag it freely
    if (currentNodesDataSet && centerId) {
      currentNodesDataSet.update({ id: centerId, fixed: false });
    }

    // Freeze physics to eliminate CPU load and prevent node jitter/drift
    explorerNetwork.setOptions({ physics: { enabled: false } });
    physicsEnabled = false;

    const btnFreeze = document.getElementById('btn-toggle-physics');
    if (btnFreeze) {
      btnFreeze.innerHTML = `<i class="fas fa-play text-warning me-1"></i> Resume`;
      btnFreeze.classList.remove('active');
    }

    // Fit entire balanced graph cleanly within canvas margins
    explorerNetwork.fit({
      animation: { duration: 500, easingFunction: 'easeInOutQuad' }
    });
  });

  // Interactive Spotlight on single click
  explorerNetwork.on('click', function (params) {
    if (params.nodes.length > 0) {
      const selectedId = params.nodes[0];
      spotlightNeighborhood(selectedId);
    } else {
      resetSpotlight();
    }
  });

  // Double-click to pivot and isolate new entity neighborhood
  explorerNetwork.on('doubleClick', function (params) {
    if (params.nodes && params.nodes.length > 0) {
      const clickedId = params.nodes[0];
      const nodeObj = originalNodesList.find(n => n.id === clickedId);
      if (nodeObj && nodeObj.group) {
        const rawId = nodeObj.properties
          ? (nodeObj.properties.patient_id || nodeObj.properties.doctor_id || nodeObj.properties.medicine_id || nodeObj.properties.hospital_id || nodeObj.properties.pharmacy_id || nodeObj.properties.prescription_id || nodeObj.raw_id || nodeObj.id.split('_')[1])
          : nodeObj.id.split('_')[1];
        if (rawId) {
          exploreEntityPreset(nodeObj.group, String(rawId), nodeObj.label);
        }
      }
    }
  });
}

function spotlightNeighborhood(selectedId) {
  if (!currentNodesDataSet || !explorerNetwork) return;

  const connectedNodes = explorerNetwork.getConnectedNodes(selectedId);
  const connectedSet = new Set(connectedNodes);
  connectedSet.add(selectedId);

  const updates = [];
  currentNodesDataSet.forEach(node => {
    if (connectedSet.has(node.id)) {
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
  currentNodesDataSet.update(updates);
}

function resetSpotlight() {
  if (!currentNodesDataSet) return;
  const updates = [];
  currentNodesDataSet.forEach(node => {
    updates.push({
      id: node.id,
      opacity: 1.0,
      font: { ...node.font, color: node.id === currentCenterId ? '#ffffff' : '#cbd5e1' }
    });
  });
  currentNodesDataSet.update(updates);
}

let currentSpotlightFilter = null;
function spotlightByNodeType(labelType) {
  if (!currentNodesDataSet || !explorerNetwork) return;

  if (currentSpotlightFilter === labelType) {
    resetSpotlight();
    currentSpotlightFilter = null;
    return;
  }

  currentSpotlightFilter = labelType;
  const updates = [];
  currentNodesDataSet.forEach(node => {
    const isFocal = (node.id === currentCenterId || node.is_center);
    const nodeLabel = (node.group || node.label || node.id || '').toLowerCase();
    const target = labelType.toLowerCase();
    const matches = (labelType === 'Focal' && isFocal) || nodeLabel.includes(target) || (node.id && node.id.toLowerCase().startsWith(target));

    if (matches || isFocal) {
      updates.push({
        id: node.id,
        opacity: 1.0,
        font: { ...node.font, color: '#ffffff' }
      });
    } else {
      updates.push({
        id: node.id,
        opacity: 0.16,
        font: { ...node.font, color: 'rgba(255,255,255,0.2)' }
      });
    }
  });
  currentNodesDataSet.update(updates);
}

// Canvas Controls Toolbar methods
window.explorerControls = {
  reCenterFocus: function () {
    if (!explorerNetwork || !currentCenterId) return;
    explorerNetwork.focus(currentCenterId, {
      scale: 1.2,
      animation: { duration: 500, easingFunction: 'easeInOutQuad' }
    });
  },

  fitView: function () {
    if (!explorerNetwork) return;
    explorerNetwork.fit({
      animation: { duration: 500, easingFunction: 'easeInOutQuad' }
    });
  },

  zoomIn: function () {
    if (!explorerNetwork) return;
    const scale = explorerNetwork.getScale();
    explorerNetwork.moveTo({
      scale: scale * 1.3,
      animation: { duration: 300, easingFunction: 'easeInOutQuad' }
    });
  },

  zoomOut: function () {
    if (!explorerNetwork) return;
    const scale = explorerNetwork.getScale();
    explorerNetwork.moveTo({
      scale: scale * 0.75,
      animation: { duration: 300, easingFunction: 'easeInOutQuad' }
    });
  },

  toggleLabels: function () {
    showEdgeLabels = !showEdgeLabels;
    if (currentEdgesDataSet && originalEdgesList) {
      const updates = originalEdgesList.map(e => ({
        id: e.id,
        label: showEdgeLabels ? formatEdgeLabel(e.label) : ''
      }));
      currentEdgesDataSet.update(updates);
    }
    const btn = document.getElementById('btn-toggle-labels');
    if (btn) {
      btn.classList.toggle('active', showEdgeLabels);
      btn.innerHTML = `<i class="fas fa-tag ${showEdgeLabels ? 'text-teal' : 'text-light opacity-75'} me-1"></i> Edge Labels`;
    }
  },

  togglePhysics: function () {
    physicsEnabled = !physicsEnabled;
    if (explorerNetwork) {
      explorerNetwork.setOptions({ physics: { enabled: physicsEnabled } });
    }
    const btn = document.getElementById('btn-toggle-physics');
    if (btn) {
      btn.innerHTML = physicsEnabled
        ? `<i class="fas fa-pause text-cyan me-1"></i> Freeze`
        : `<i class="fas fa-play text-warning me-1"></i> Resume`;
      btn.classList.toggle('active', physicsEnabled);
    }
  }
};

function renderExplorerSummary(nodes, edges, centerId, depth) {
  const summarySec = document.getElementById('explorer-summary-section');
  const heroBanner = document.getElementById('explorer-hero-banner');
  const cardsContainer = document.getElementById('explorer-neighbors-cards');
  const statsPill = document.getElementById('explorer-stats-pill');
  if (!summarySec || !cardsContainer) return;

  summarySec.style.display = 'block';
  cardsContainer.innerHTML = '';

  const centerNode = nodes.find(n => n.id === centerId) || {};
  const centerProps = centerNode.properties || {};
  const centerGroup = centerNode.group || 'Entity';

  // Choose icon based on center category
  const iconMap = {
    Doctor: 'fa-user-md',
    Patient: 'fa-user',
    Medicine: 'fa-pills',
    Hospital: 'fa-hospital',
    Pharmacy: 'fa-clinic-medical',
    Pharmacist: 'fa-id-badge',
    Prescription: 'fa-file-prescription',
    Manufacturer: 'fa-industry',
    Supplier: 'fa-truck-moving',
    WholesaleSupplier: 'fa-warehouse'
  };
  const heroIcon = iconMap[centerGroup] || 'fa-circle-nodes';

  // Build Executive Hero Banner
  if (heroBanner) {
    let metaChips = '';
    if (centerGroup === 'Doctor') {
      metaChips = `
        <span class="badge bg-dark border border-secondary text-info"><i class="fas fa-graduation-cap me-1"></i> ${centerProps.qualification || 'MBBS'}</span>
        <span class="badge bg-dark border border-secondary text-warning"><i class="fas fa-clock me-1"></i> ${centerProps.experience || 8} Yrs Clinical Exp</span>
        <span class="badge bg-dark border border-secondary text-light"><i class="fas fa-hospital me-1"></i> Hospital ID: ${centerProps.hospital_id || 202}</span>
        ${centerProps.contact ? `<span class="badge bg-dark border border-secondary text-light"><i class="fas fa-phone me-1"></i> ${centerProps.contact}</span>` : ''}
      `;
    } else if (centerGroup === 'Patient') {
      metaChips = `
        <span class="badge bg-dark border border-secondary text-info"><i class="fas fa-venus-mars me-1"></i> Sex: ${centerProps.sex || 'N/A'}</span>
        <span class="badge bg-dark border border-secondary text-light"><i class="fas fa-calendar me-1"></i> DOB: ${centerProps.dob || 'N/A'}</span>
        <span class="badge bg-dark border border-secondary text-light"><i class="fas fa-map-marker-alt me-1"></i> ${centerProps.city || ''}, ${centerProps.state || ''}</span>
      `;
    } else if (centerGroup === 'Medicine') {
      metaChips = `
        <span class="badge bg-dark border border-secondary text-success"><i class="fas fa-tag me-1"></i> ₹${centerProps.price || '0.00'}</span>
        <span class="badge bg-dark border border-secondary text-info"><i class="fas fa-pills me-1"></i> ID: ${centerProps.medicine_id || ''}</span>
      `;
    } else if (centerGroup === 'Hospital') {
      metaChips = `
        <span class="badge bg-dark border border-secondary text-info"><i class="fas fa-map-marker-alt me-1"></i> ${centerProps.city || ''}, ${centerProps.state || ''}</span>
        <span class="badge bg-dark border border-secondary text-light"><i class="fas fa-clinic-medical me-1"></i> Pharmacy ID: ${centerProps.pharmacy_id || ''}</span>
      `;
    } else if (centerGroup === 'Pharmacy') {
      metaChips = `
        <span class="badge bg-dark border border-secondary text-warning"><i class="fas fa-star me-1"></i> ${centerProps.rating || '4.5'} Rating</span>
        <span class="badge bg-dark border border-secondary text-light"><i class="fas fa-map-marker-alt me-1"></i> ${centerProps.city || ''}</span>
      `;
    }

    heroBanner.innerHTML = `
      <div class="card bg-dark border border-warning border-opacity-50 p-3 shadow-lg" style="background: radial-gradient(circle at top left, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%);">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="d-flex align-items-center gap-3">
            <div class="d-flex align-items-center justify-content-center rounded-circle" style="width: 52px; height: 52px; background: rgba(245, 158, 11, 0.2); border: 2px solid #f59e0b;">
              <i class="fas ${heroIcon} text-warning fs-4"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-warning text-dark fw-bold text-uppercase">★ Focal Entity</span>
                <span class="badge bg-primary bg-opacity-75">${centerGroup}</span>
              </div>
              <h4 class="fw-bold text-light mb-1 mt-1">${centerNode.label || centerId}</h4>
              <div class="d-flex flex-wrap gap-2 mt-1">
                ${metaChips}
              </div>
            </div>
          </div>
          <div class="text-end">
            <div class="text-muted small">Traversed Scope:</div>
            <div class="fs-6 fw-bold text-light">${depth} Hops &bull; ${nodes.length} Entities &bull; ${edges.length} Links</div>
          </div>
        </div>
      </div>
    `;
  }

  if (statsPill) {
    statsPill.innerText = `${nodes.length - 1} Connected Entities in Subgraph`;
  }

  // Group connected nodes by label
  const grouped = {};
  nodes.forEach(n => {
    if (n.id === centerId) return;
    const g = n.group || 'Other';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(n);
  });

  const categoryBorderColors = {
    Doctor: '#4f46e5',
    Patient: '#008080',
    Medicine: '#059669',
    Hospital: '#7c3aed',
    Pharmacy: '#0284c7',
    Pharmacist: '#db2777',
    Prescription: '#d97706',
    Manufacturer: '#e11d48',
    Supplier: '#ea580c',
    WholesaleSupplier: '#64748b'
  };

  for (const [groupName, groupNodes] of Object.entries(grouped)) {
    const borderColor = categoryBorderColors[groupName] || '#64748b';
    const groupIcon = iconMap[groupName] || 'fa-circle-nodes';

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card h-100 bg-dark border p-3" style="border-top: 3px solid ${borderColor} !important;">
        <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
          <div class="fw-bold text-light d-flex align-items-center gap-2">
            <i class="fas ${groupIcon}" style="color: ${borderColor};"></i>
            <span>${groupName}s</span>
          </div>
          <span class="badge border border-light border-opacity-25 text-white" style="background: rgba(148, 163, 184, 0.25);">${groupNodes.length}</span>
        </div>
        <ul class="list-unstyled mb-0 small text-light">
          ${groupNodes.map(gn => {
            // Find edges connecting to this node
            const relEdges = edges.filter(e => e.from === gn.id || e.to === gn.id);
            const relLabels = Array.from(new Set(relEdges.map(e => e.label))).slice(0, 2);
            const relBadge = relLabels.length > 0 
              ? `<span class="badge border border-info border-opacity-50 text-info me-1" style="background: rgba(14, 165, 233, 0.15);">${relLabels.join(', ')}</span>`
              : '';

            // Extract raw ID for pivot button
            const rawId = gn.properties 
              ? (gn.properties.patient_id || gn.properties.doctor_id || gn.properties.medicine_id || gn.properties.hospital_id || gn.properties.pharmacy_id || gn.properties.prescription_id || gn.raw_id || gn.id.split('_')[1])
              : gn.id.split('_')[1];

            return `
              <li class="py-2 border-bottom border-secondary border-opacity-25 d-flex justify-content-between align-items-center gap-2">
                <div>
                  <div class="fw-semibold text-light">${gn.label}</div>
                  <div class="text-slate-300" style="font-size: 11.5px; color: #cbd5e1;">
                    ${relBadge}
                    ${gn.properties && gn.properties.city ? `<span class="me-2 text-slate-300"><i class="fas fa-map-marker-alt text-info me-1"></i>${gn.properties.city}</span>` : ''}
                    ${gn.properties && gn.properties.price ? `<span class="text-success fw-semibold"><i class="fas fa-tag me-1"></i>₹${gn.properties.price}</span>` : ''}
                    ${gn.properties && gn.properties.date ? `<span class="text-slate-300 ms-1"><i class="fas fa-calendar text-warning me-1"></i>${gn.properties.date}</span>` : ''}
                  </div>
                </div>
                <div>
                  <button class="btn btn-xs btn-outline-info text-nowrap py-1 px-2" style="font-size: 11px;" onclick="exploreEntityPreset('${gn.group}', '${rawId}', '${gn.label.replace(/'/g, "\\'")}')" title="Pivot and explore this entity">
                    <i class="fas fa-crosshairs me-1"></i> Explore
                  </button>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
    cardsContainer.appendChild(col);
  }
}

