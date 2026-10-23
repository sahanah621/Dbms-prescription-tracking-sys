/**
 * Graph Intelligence Dashboard Controller
 * Interactive Vis.js Network rendering with advanced physics spacing,
 * clean label typography, interactive neighborhood spotlights, and clutter reduction.
 */

let network = null;
let allNodes = [];
let allEdges = [];
let nodesDataSet = null;
let edgesDataSet = null;
let physicsEnabled = true;
let edgeLabelsVisible = false;
let wideSpacing = false;
let selectedNodeId = null;

document.addEventListener('DOMContentLoaded', function () {
  loadGraphNetwork();
  setupEventListeners();
});

// Clean and shorten display labels to avoid canvas text collisions
function cleanDisplayLabel(node) {
  const raw = (node.label || '').trim();
  const group = node.group || '';

  if (group === 'Medicine') {
    return raw.split('(')[0].trim();
  }
  if (group === 'Manufacturer') {
    return raw
      .replace('Pharmaceutical Industries Ltd', 'Pharma')
      .replace('Pharmaceuticals Inc', 'Pharma')
      .replace('Laboratories Ltd', '')
      .replace('Lifesciences Ltd', 'Life')
      .replace(' Ltd', '')
      .trim();
  }
  if (group === 'Supplier') {
    return raw
      .replace('Healthcare Distributors', 'Healthcare')
      .replace('Pharma Distributors', 'Pharma')
      .replace('Medical Supplies', 'Medical')
      .replace('Logistics', '')
      .replace('Agency', '')
      .trim();
  }
  if (group === 'Pharmacy') {
    return raw
      .replace('Central Pharmacy', '(Delhi)')
      .replace('HealthCity Pharmacy', '(Mumbai)')
      .replace('Express Pharmacy', '(Pune)')
      .trim();
  }
  if (group === 'Hospital') {
    return raw
      .replace('Multispeciality Hospital', 'Hospital')
      .replace('Care Hospital', 'Care')
      .replace('Medical Center', 'Clinic')
      .trim();
  }
  return raw;
}

function loadGraphNetwork() {
  const spinner = document.getElementById('graph-loading-spinner');
  if (spinner) spinner.style.display = 'block';

  fetch('/api/neo4j/graph?limit=150')
    .then(res => res.json())
    .then(data => {
      if (spinner) spinner.style.display = 'none';

      if (data.success && data.data) {
        const rawNodes = data.data.nodes || [];
        const rawEdges = data.data.edges || [];

        // Optimize nodes: clean label typography, preserve full title in tooltips
        allNodes = rawNodes.map(n => {
          const originalLabel = n.label || '';
          const cleaned = cleanDisplayLabel(n);
          return {
            ...n,
            label: cleaned,
            originalLabel: originalLabel,
            title: n.title || `<b>${n.group}:</b> ${originalLabel}`,
            size: 20,
            font: {
              size: 11,
              color: '#f8fafc',
              face: 'Inter, system-ui, sans-serif',
              strokeWidth: 3,
              strokeColor: '#090d16',
              vadjust: 3,
              min: 0,
              max: 30
            },
            borderWidth: 2,
            borderWidthSelected: 4,
            shadow: {
              enabled: true,
              color: 'rgba(0, 0, 0, 0.65)',
              size: 10,
              x: 2,
              y: 2
            }
          };
        });

        // Optimize edges: store original labels and start with clean subtle paths
        allEdges = rawEdges.map(e => ({
          ...e,
          _originalLabel: e.label || '',
          label: edgeLabelsVisible ? (e.label || '') : '',
          width: 1.2,
          color: {
            color: 'rgba(148, 163, 184, 0.28)',
            highlight: '#38bdf8',
            hover: '#00d4b2'
          },
          arrows: {
            to: { enabled: true, scaleFactor: 0.55 }
          },
          font: {
            size: 11,
            color: '#f1f5f9',
            strokeWidth: 2,
            strokeColor: '#0b1120',
            align: 'middle',
            face: 'Inter, system-ui, sans-serif',
            background: 'rgba(15, 23, 42, 0.90)',
            min: 0,
            max: 30
          },
          smooth: {
            type: 'continuous',
            roundness: 0.22
          }
        }));

        // Expose data globally for standalone canvas action handlers
        window.allNodes = allNodes;
        window.allEdges = allEdges;

        // Update count badge
        const badge = document.getElementById('canvas-node-count-badge');
        if (badge) {
          badge.innerText = `${allNodes.length} Nodes | ${allEdges.length} Edges (${data.data.mode.toUpperCase()})`;
        }

        renderVisNetwork(allNodes, allEdges);
      } else {
        console.error('Failed to load graph data:', data.message);
      }
    })
    .catch(err => {
      if (spinner) spinner.style.display = 'none';
      console.error('Graph fetch error:', err);
    });
}

function renderVisNetwork(nodes, edges) {
  const container = document.getElementById('network-canvas');
  if (!container) return;

  nodesDataSet = new vis.DataSet(nodes);
  edgesDataSet = new vis.DataSet(edges);

  // Expose DataSets to window for toolbar actions
  window.nodesDataSet = nodesDataSet;
  window.edgesDataSet = edgesDataSet;

  const data = {
    nodes: nodesDataSet,
    edges: edgesDataSet
  };

  // High-dispersion ForceAtlas2 physics for uncrowded, readable layout
  const options = {
    nodes: {
      shape: 'dot',
      font: {
        size: 11,
        color: '#f8fafc',
        face: 'Inter, system-ui, sans-serif',
        strokeWidth: 3,
        strokeColor: '#090d16',
        vadjust: 3,
        min: 0,
        max: 30
      }
    },
    edges: {
      selectionWidth: 2.5,
      hoverWidth: 2.0,
      font: {
        size: 11,
        color: '#f1f5f9',
        strokeWidth: 2,
        strokeColor: '#0b1120',
        align: 'middle',
        face: 'Inter, system-ui, sans-serif',
        background: 'rgba(15, 23, 42, 0.90)',
        min: 0,
        max: 30
      }
    },
    physics: {
      enabled: physicsEnabled,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: wideSpacing ? -260 : -160,
        centralGravity: wideSpacing ? 0.002 : 0.005,
        springLength: wideSpacing ? 300 : 190,
        springConstant: 0.04,
        damping: 0.65,
        avoidOverlap: 1.0
      },
      stabilization: {
        iterations: 120,
        updateInterval: 25,
        fit: true
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 120,
      zoomView: true,
      dragView: true,
      navigationButtons: true,
      keyboard: false
    }
  };

  network = new vis.Network(container, data, options);
  window.network = network;

  // Once stabilized, auto-fit view
  network.once('stabilizationIterationsDone', function () {
    network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
  });

  // Native Trackpad Scroll & Pinch-to-Zoom Gesture Controller
  if (container) {
    if (container._trackpadWheelHandler) {
      container.removeEventListener('wheel', container._trackpadWheelHandler);
    }

    container._trackpadWheelHandler = function (e) {
      if (!network) return;
      e.preventDefault(); // Stop outer browser window from scrolling away

      const currentScale = network.getScale();
      const currentPos = network.getViewPosition();

      // Case 1: Pinch-to-zoom on Mac Trackpad (Chrome/Safari sends ctrlKey = true) OR Ctrl/Cmd + Wheel
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = e.deltaY > 0 ? 0.95 : 1.05;
        const newScale = Math.max(0.12, Math.min(3.5, currentScale * zoomDelta));
        network.moveTo({
          scale: newScale,
          animation: false
        });
        return;
      }

      // Case 2: Discrete mouse wheel steps (typically +/-100 or +/-120 with deltaX = 0)
      if (Math.abs(e.deltaY) >= 50 && e.deltaX === 0) {
        const zoomDelta = e.deltaY > 0 ? 0.92 : 1.08;
        const newScale = Math.max(0.12, Math.min(3.5, currentScale * zoomDelta));
        network.moveTo({
          scale: newScale,
          animation: false
        });
        return;
      }

      // Case 3: Two-finger trackpad swipe -> Pan (Scroll) the graph canvas in real time
      const panFactor = 1.0 / currentScale;
      network.moveTo({
        position: {
          x: currentPos.x + (e.deltaX * panFactor),
          y: currentPos.y + (e.deltaY * panFactor)
        },
        animation: false
      });
    };

    container.addEventListener('wheel', container._trackpadWheelHandler, { passive: false });
  }

  // Node Click Selection: Spotlight Connected Neighborhood
  network.on('click', function (params) {
    if (params.nodes.length > 0) {
      selectedNodeId = params.nodes[0];
      highlightNeighborhood(selectedNodeId);
      const nodeObj = allNodes.find(n => n.id === selectedNodeId);
      if (nodeObj) {
        displayNodeDetails(nodeObj);
      }
    } else {
      selectedNodeId = null;
      resetNeighborhood();
      clearNodeInspector();
    }
  });

  // Hover effect: Spotlight on hover if no node is actively clicked
  network.on('hoverNode', function (params) {
    if (!selectedNodeId) {
      highlightNeighborhood(params.node, true);
    }
  });

  network.on('blurNode', function () {
    if (!selectedNodeId) {
      resetNeighborhood();
    }
  });
}

// Highlights selected node + immediate neighbors, dims everything else, and reveals edge labels
function highlightNeighborhood(centerId, isHover = false) {
  if (!network) return;

  const connectedNodes = new Set(network.getConnectedNodes(centerId));
  connectedNodes.add(centerId);
  const connectedEdges = new Set(network.getConnectedEdges(centerId));

  const nodeUpdates = allNodes.map(n => {
    const isConn = connectedNodes.has(n.id);
    return {
      id: n.id,
      opacity: isConn ? 1.0 : 0.15,
      font: {
        color: isConn ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
        strokeColor: isConn ? '#090d16' : 'rgba(9, 13, 22, 0.25)'
      }
    };
  });
  nodesDataSet.update(nodeUpdates);

  const isLabelsOn = (typeof window.edgeLabelsVisible !== 'undefined') ? window.edgeLabelsVisible : edgeLabelsVisible;

  const edgeUpdates = allEdges.map(e => {
    const isConn = connectedEdges.has(e.id);
    return {
      id: e.id,
      label: isConn ? (e._originalLabel || e.label || '') : (isLabelsOn ? (e._originalLabel || e.label || '') : ''),
      color: isConn
        ? { color: '#38bdf8', highlight: '#38bdf8', opacity: 1.0 }
        : { color: 'rgba(148, 163, 184, 0.05)', opacity: 0.05 },
      width: isConn ? 2.5 : 0.8
    };
  });
  edgesDataSet.update(edgeUpdates);
}

// Resets view to normal opacity
function resetNeighborhood() {
  if (!nodesDataSet || !edgesDataSet) return;

  const isLabelsOn = (typeof window.edgeLabelsVisible !== 'undefined') ? window.edgeLabelsVisible : edgeLabelsVisible;

  nodesDataSet.update(allNodes.map(n => ({
    id: n.id,
    opacity: 1.0,
    font: {
      color: '#f8fafc',
      strokeColor: '#090d16'
    }
  })));

  edgesDataSet.update(allEdges.map(e => ({
    id: e.id,
    label: isLabelsOn ? (e._originalLabel || e.label || '') : '',
    color: {
      color: 'rgba(148, 163, 184, 0.28)',
      highlight: '#38bdf8',
      hover: '#00d4b2'
    },
    width: 1.2
  })));
}

function displayNodeDetails(node) {
  const placeholder = document.getElementById('inspector-placeholder');
  const content = document.getElementById('inspector-content');
  if (placeholder) placeholder.style.display = 'none';
  if (content) content.style.display = 'block';

  document.getElementById('inspector-label-badge').innerText = node.group || 'Node';
  document.getElementById('inspector-title').innerText = node.originalLabel || node.label || 'Entity';
  document.getElementById('inspector-id').innerText = `ID: ${node.id}`;

  // Render properties
  const propsContainer = document.getElementById('inspector-properties');
  propsContainer.innerHTML = '';
  if (node.properties) {
    for (const [key, val] of Object.entries(node.properties)) {
      if (typeof val === 'object' && val !== null) continue;
      const row = document.createElement('div');
      row.className = 'inspector-prop-row';
      row.innerHTML = `<span class="inspector-prop-key">${key}:</span><span class="inspector-prop-val">${val}</span>`;
      propsContainer.appendChild(row);
    }
  }

  // Find connected relationships
  const edgesContainer = document.getElementById('inspector-edges');
  edgesContainer.innerHTML = '';
  const connectedEdges = allEdges.filter(e => e.from === node.id || e.to === node.id);

  if (connectedEdges.length === 0) {
    edgesContainer.innerHTML = '<span class="text-muted small">No immediate relationships</span>';
  } else {
    connectedEdges.forEach(e => {
      const isOutgoing = e.from === node.id;
      const otherId = isOutgoing ? e.to : e.from;
      const otherNode = allNodes.find(n => n.id === otherId);
      const otherName = otherNode ? (otherNode.originalLabel || otherNode.label) : otherId;

      const badge = document.createElement('div');
      badge.className = 'small p-1 px-2 rounded bg-dark border text-light d-flex justify-content-between align-items-center';
      badge.innerHTML = `
        <span><i class="fas fa-${isOutgoing ? 'arrow-right text-info' : 'arrow-left text-teal'} me-1"></i> ${e._originalLabel || e.label}</span>
        <span class="text-truncate" style="max-width: 120px;" title="${otherName}">${otherName}</span>
      `;
      edgesContainer.appendChild(badge);
    });
  }

  // Set explore button link
  const exploreBtn = document.getElementById('btn-explore-center-node');
  if (exploreBtn) {
    exploreBtn.onclick = function () {
      const rawId = node.raw_id || node.id.split('_')[1];
      window.location.href = `/graph-explorer?label=${node.group}&id=${rawId}`;
    };
  }
}

function clearNodeInspector() {
  const placeholder = document.getElementById('inspector-placeholder');
  const content = document.getElementById('inspector-content');
  if (placeholder) placeholder.style.display = 'block';
  if (content) content.style.display = 'none';
}

function setupEventListeners() {
  // 1. Toggle Edge Labels
  const labelsBtn = document.getElementById('btn-toggle-labels');
  if (labelsBtn) {
    labelsBtn.onclick = function (e) {
      if (typeof window.toggleEdgeLabels === 'function') {
        window.toggleEdgeLabels(e);
      }
    };
  }

  // 2. Wide Spacing Toggle
  const spacingBtn = document.getElementById('btn-spread-spacing');
  if (spacingBtn) {
    spacingBtn.onclick = function (e) {
      if (typeof window.toggleWideSpacing === 'function') {
        window.toggleWideSpacing(e);
      }
    };
  }

  // 3. Fit View
  const fitBtn = document.getElementById('btn-fit-canvas');
  if (fitBtn) {
    fitBtn.onclick = function (e) {
      if (typeof window.fitGraphView === 'function') {
        window.fitGraphView(e);
      } else if (network) {
        network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
      }
    };
  }

  // 4b. Maximize View (Presentation Mode)
  const maxBtn = document.getElementById('btn-maximize-canvas');
  const canvasCard = document.getElementById('tabPane-canvas');
  if (maxBtn && canvasCard) {
    maxBtn.addEventListener('click', function () {
      toggleMaximizeGraph();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && canvasCard.classList.contains('maximized-mode')) {
        toggleMaximizeGraph();
      }
    });

    // Support ?maximized=1 or #maximize query param for direct presentation mode
    if (window.location.search.includes('maximized=1') || window.location.hash === '#maximize') {
      setTimeout(toggleMaximizeGraph, 400);
    }
  }

  // 5. Reset Graph
  const resetBtn = document.getElementById('btn-reset-graph');
  if (resetBtn) {
    resetBtn.onclick = function (e) {
      if (typeof window.resetGraphState === 'function') {
        window.resetGraphState(e);
      } else {
        edgeLabelsVisible = false;
        wideSpacing = false;
        selectedNodeId = null;
        loadGraphNetwork();
        clearNodeInspector();
      }
    };
  }

  // 6. Category Filter Pills
  document.querySelectorAll('.graph-filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.graph-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const filter = this.getAttribute('data-filter');
      if (filter === 'all') {
        nodesDataSet.update(allNodes.map(n => ({ id: n.id, hidden: false, opacity: 1 })));
        edgesDataSet.update(allEdges.map(e => ({ id: e.id, hidden: false })));
      } else {
        nodesDataSet.update(allNodes.map(n => ({
          id: n.id,
          hidden: n.group !== filter,
          opacity: n.group === filter ? 1 : 0.1
        })));
        edgesDataSet.update(allEdges.map(e => {
          const fromNode = allNodes.find(n => n.id === e.from);
          const toNode = allNodes.find(n => n.id === e.to);
          const isConnected = (fromNode && fromNode.group === filter) || (toNode && toNode.group === filter);
          return { id: e.id, hidden: !isConnected };
        }));
      }
    });
  });
}

// ============================================================================
// GRAPH MAIN TAB NAVIGATION CONTROLLER
// ============================================================================
let disruptionNetwork = null;

function switchGraphMainTab(tab) {
  ['canvas', 'disruption', 'anomalies', 'centrality'].forEach(t => {
    const pane = document.getElementById(`tabPane-${t}`);
    const nav = document.getElementById(`tabNav-${t}`);
    if (pane) pane.classList.toggle('d-none', t !== tab);
    if (nav) nav.classList.toggle('active', t === tab);
  });

  if (tab === 'disruption') {
    updateSimTargetOptions();
    if (!disruptionNetwork) {
      runDisruptionSimulation();
    }
  } else if (tab === 'anomalies') {
    loadGraphAnomalies();
  } else if (tab === 'centrality') {
    loadGraphCentrality();
  } else if (tab === 'canvas' && network) {
    setTimeout(() => network.fit(), 200);
  }
}

// Filter Target Options in Disruption Simulator
function updateSimTargetOptions() {
  const typeSelect = document.getElementById('simEntityTypeSelect');
  const targetSelect = document.getElementById('simTargetSelect');
  if (!typeSelect || !targetSelect) return;

  const selectedType = typeSelect.value;
  let firstFound = false;

  Array.from(targetSelect.options).forEach(opt => {
    const optType = opt.getAttribute('data-type');
    const match = (optType === selectedType);
    opt.style.display = match ? '' : 'none';
    if (match && !firstFound) {
      targetSelect.value = opt.value;
      firstFound = true;
    }
  });
}

// ----------------------------------------------------------------------------
// DISRUPTION SIMULATOR CONTROLLER
// ----------------------------------------------------------------------------
async function runDisruptionSimulation() {
  const typeSelect = document.getElementById('simEntityTypeSelect');
  const targetSelect = document.getElementById('simTargetSelect');
  const btn = document.getElementById('btnRunDisruption');
  const resultsSec = document.getElementById('simResultsSection');
  if (!typeSelect || !targetSelect) return;

  const nodeType = typeSelect.value;
  const nodeId = targetSelect.value;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Simulating Cascade...';
  }

  try {
    const res = await fetch(`/api/neo4j/simulation/disruption?type=${nodeType}&id=${nodeId}`);
    const json = await res.json();
    if (!json.success || !json.data) {
      showToast('Disruption simulation failed', 'error');
      return;
    }

    const data = json.data;
    if (resultsSec) resultsSec.style.display = 'block';

    // Populate Metrics
    document.getElementById('sim-vulnerability-score').innerText = `${data.summary.vulnerability_index}%`;
    document.getElementById('sim-pharmacies-count').innerText = `${data.summary.impacted_pharmacies_count}`;
    document.getElementById('sim-medicines-count').innerText = `${data.summary.stockout_medicines_count}`;
    document.getElementById('sim-patients-count').innerText = `${data.summary.impacted_patients_count}`;

    const criticalBottlenecks = data.impacted_pharmacies.filter(p => p.is_critical_bottleneck).length;
    document.getElementById('sim-bottlenecks-text').innerText = `${criticalBottlenecks} zero-redundancy SPOF pharmacies`;

    // Populate Failure Points List
    const listContainer = document.getElementById('simBottlenecksList');
    if (listContainer) {
      let html = '';
      html += `<div class="mb-3 p-2 rounded bg-danger bg-opacity-25 border border-danger border-opacity-50 text-white small">
        <div class="fw-bold"><i class="fas fa-radiation me-1"></i> Target Outage: ${data.target.name} (${data.target.type})</div>
        <div class="text-light text-opacity-75 mt-1">${data.summary.total_nodes_affected} total healthcare network nodes affected by supply cascade failure.</div>
      </div>`;

      // Impacted Pharmacies
      html += '<h6 class="text-warning small fw-bold text-uppercase mt-3 mb-2"><i class="fas fa-clinic-medical me-1"></i> Disrupted Dispensaries:</h6>';
      if (data.impacted_pharmacies.length === 0) {
        html += '<div class="text-muted small">No pharmacies impacted.</div>';
      } else {
        data.impacted_pharmacies.forEach(ph => {
          const badge = ph.is_critical_bottleneck 
            ? '<span class="badge bg-danger">SPOF Bottleneck</span>' 
            : `<span class="badge bg-success">${ph.alternate_suppliers_count} Fallbacks</span>`;
          html += `
            <div class="p-2 mb-2 rounded bg-dark border border-secondary border-opacity-25 d-flex justify-content-between align-items-center small">
              <div>
                <span class="text-white fw-semibold">${ph.name}</span>
                <span class="text-muted small d-block">${ph.city}</span>
              </div>
              <div>${badge}</div>
            </div>
          `;
        });
      }

      // Stockout Medicines
      html += '<h6 class="text-teal small fw-bold text-uppercase mt-3 mb-2"><i class="fas fa-pills me-1"></i> Stockout Formulary Formulations:</h6>';
      if (data.stockout_medicines.length === 0) {
        html += '<div class="text-muted small">No formulations depleted.</div>';
      } else {
        data.stockout_medicines.forEach(m => {
          html += `
            <div class="p-2 mb-1 rounded bg-dark border border-secondary border-opacity-25 d-flex justify-content-between align-items-center small">
              <span class="text-light">${m.name}</span>
              <span class="badge bg-secondary">Stock Depleted</span>
            </div>
          `;
        });
      }

      listContainer.innerHTML = html;
    }

    // Render Vis.js Disruption Canvas
    const canvasContainer = document.getElementById('disruption-canvas');
    if (canvasContainer && data.simulation_graph) {
      const simNodes = new vis.DataSet(data.simulation_graph.nodes);
      const simEdges = new vis.DataSet(data.simulation_graph.edges);

      const options = {
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -140,
            centralGravity: 0.003,
            springLength: 160,
            springConstant: 0.08,
            damping: 0.6
          }
        },
        interaction: { hover: true, tooltipDelay: 100 }
      };

      if (disruptionNetwork) disruptionNetwork.destroy();
      disruptionNetwork = new vis.Network(canvasContainer, { nodes: simNodes, edges: simEdges }, options);
    }
  } catch (err) {
    console.error('Error running disruption simulation:', err);
    showToast('Network error running simulation', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-bolt me-1"></i> Run Outage Simulation';
    }
  }
}

// ----------------------------------------------------------------------------
// DOCTOR-SHOPPING & ANOMALY DETECTOR CONTROLLER
// ----------------------------------------------------------------------------
async function loadGraphAnomalies(showFeedback = false) {
  const tbody = document.getElementById('anomaliesTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/neo4j/anomalies');
    const json = await res.json();
    if (!json.success || !json.data || !json.data.anomalies) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Failed to scan anomalies</td></tr>';
      return;
    }

    const anomalies = json.data.anomalies;
    if (anomalies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-success"><i class="fas fa-check-circle me-1"></i> No doctor-shopping or polypharmacy anomalies detected across graph.</td></tr>';
      return;
    }

    let html = '';
    anomalies.forEach(a => {
      const conflictsHtml = a.conflicts.length > 0 
        ? `<div class="text-danger small fw-semibold mt-1"><i class="fas fa-triangle-exclamation me-1"></i>Conflicts: ${a.conflicts.join(', ')}</div>` 
        : '';
      const factorsHtml = a.risk_factors.map(f => `<div class="small text-light text-opacity-75">&bull; ${f}</div>`).join('');

      html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td class="ps-3">
            <span class="fw-bold text-white fs-6">${a.patient_name}</span>
            <span class="text-muted small d-block font-monospace">${a.patient_id} • ${a.city}</span>
          </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <span class="badge ${a.badge_class} fs-6">${a.risk_tier}</span>
              <span class="fw-bold text-white font-monospace">${a.risk_score}/100</span>
            </div>
          </td>
          <td>
            <span class="badge bg-dark border border-secondary text-light fs-6">${a.doctors_count} doctors</span>
            <span class="text-muted small d-block mt-1 text-truncate" style="max-width:160px;" title="${a.doctor_names.join(', ')}">${a.doctor_names.join(', ')}</span>
          </td>
          <td>
            <span class="text-white">${a.hospitals_count} hospital(s)</span>
          </td>
          <td>
            <span class="badge bg-secondary text-light">${a.prescriptions_count} Rx Regimens</span>
            <span class="text-muted small d-block mt-1">${a.medicines_count} distinct drugs</span>
          </td>
          <td style="max-width: 320px;">
            ${factorsHtml}
            ${conflictsHtml}
          </td>
          <td class="text-end pe-3">
            <button type="button" class="btn btn-sm btn-outline-info py-1 px-2" onclick="isolateAnomalyInCanvas('${a.patient_id}')">
              <i class="fas fa-search-location me-1"></i> View in Graph
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    if (showFeedback) showToast('Graph anomaly scan completed successfully.', 'success');
  } catch (err) {
    console.error('Error loading anomalies:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error analyzing graph anomalies</td></tr>';
  }
}

function isolateAnomalyInCanvas(patientId) {
  switchGraphMainTab('canvas');
  setTimeout(() => {
    highlightNeighborhood(patientId);
    if (network) {
      network.focus(patientId, { scale: 1.2, animation: { duration: 800 } });
    }
  }, 300);
}

// ----------------------------------------------------------------------------
// CENTRALITY & INFLUENCE LEADERBOARD CONTROLLER
// ----------------------------------------------------------------------------
async function loadGraphCentrality(showFeedback = false) {
  const tbody = document.getElementById('centralityTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/neo4j/centrality');
    const json = await res.json();
    if (!json.success || !json.data || !json.data.leaderboard) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Failed to calculate centrality</td></tr>';
      return;
    }

    const leaderboard = json.data.leaderboard;
    let html = '';
    leaderboard.forEach((node, idx) => {
      const isTop3 = idx < 3;
      const rankBadge = isTop3 
        ? `<span class="badge bg-warning text-dark"><i class="fas fa-crown me-1"></i>#${idx + 1}</span>` 
        : `<span class="badge bg-secondary">#${idx + 1}</span>`;

      html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td class="ps-3">
            <div class="d-flex align-items-center gap-2">
              ${rankBadge}
              <span class="fw-bold text-white fs-6">${node.label}</span>
            </div>
            <span class="text-muted small font-monospace d-block mt-1">${node.id}</span>
          </td>
          <td>
            <span class="badge bg-dark border border-secondary text-light">${node.group}</span>
          </td>
          <td>
            <span class="badge ${node.role_badge} px-2 py-1">${node.systemic_role}</span>
          </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-grow-1" style="height: 6px; background:#334155; min-width: 60px;">
                <div class="progress-bar bg-info" style="width: ${node.influence_index}%;"></div>
              </div>
              <span class="fw-bold text-white small font-monospace">${node.influence_index}</span>
            </div>
          </td>
          <td>
            <span class="text-danger fw-bold font-monospace">${node.betweenness}</span>
          </td>
          <td>
            <span class="text-teal fw-bold font-monospace">${node.pagerank}</span>
          </td>
          <td>
            <span class="badge bg-secondary font-monospace">${node.degree} edges</span>
          </td>
          <td class="text-end pe-3">
            <button type="button" class="btn btn-sm btn-outline-info py-1 px-2" onclick="isolateAnomalyInCanvas('${node.id}')">
              <i class="fas fa-crosshairs me-1"></i> Spotlight
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    if (showFeedback) showToast('Centrality rankings recalculated.', 'success');
  } catch (err) {
    console.error('Error loading centrality rankings:', err);
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-danger">Error computing centrality metrics</td></tr>';
  }
}

/**
 * Toggles maximized presentation mode for the property graph canvas
 */
function toggleMaximizeGraph() {
  const maxBtn = document.getElementById('btn-maximize-canvas');
  const canvasCard = document.getElementById('tabPane-canvas');
  if (!maxBtn || !canvasCard) return;

  const isMaximized = canvasCard.classList.toggle('maximized-mode');
  document.body.classList.toggle('graph-canvas-maximized', isMaximized);

  if (isMaximized) {
    maxBtn.innerHTML = '<i class="fas fa-compress text-warning"></i> Minimize View';
    maxBtn.classList.add('active');
    maxBtn.setAttribute('title', 'Exit maximized view (or press Esc)');
  } else {
    maxBtn.innerHTML = '<i class="fas fa-expand text-success"></i> Maximize View';
    maxBtn.classList.remove('active');
    maxBtn.setAttribute('title', 'Maximize view to full screen (Esc to exit)');
  }

  // Trigger vis.js redraw & fit to seamlessly adapt to the enlarged container
  setTimeout(() => {
    if (network) {
      network.setSize('100%', '100%');
      network.redraw();
      network.fit({
        animation: {
          duration: 400,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  }, 120);
}

window.toggleMaximizeGraph = toggleMaximizeGraph;

