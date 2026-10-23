/**
 * Pharmaceutical Supply Chain Flow Controller
 * Visualizes, inspects, and animates multi-stage pharmaceutical supply provenance
 */

let supplyNetwork = null;
let supplyNodesDataSet = null;
let supplyEdgesDataSet = null;
let currentChainNodes = [];
let currentChainEdges = [];
let isLabelsVisible = true;
let isLinearPipeline = true;
let animationInterval = null;
let animationTimeout = null;
let currentMedicinePayload = null;

const TIER_COLORS = {
  1: { bg: '#312e81', border: '#818cf8', text: '#c7d2fe', tag: 'Stage 1: Manufacturer' },
  2: { bg: '#881337', border: '#f87171', text: '#fca5a5', tag: 'Stage 2: Supplier' },
  3: { bg: '#064e3b', border: '#34d399', text: '#a7f3d0', tag: 'Stage 3: Medicine' },
  4: { bg: '#0c4a6e', border: '#38bdf8', text: '#bae6fd', tag: 'Stage 4: Pharmacy' },
  5: { bg: '#134e4a', border: '#2dd4bf', text: '#5eead4', tag: 'Stage 5: Patient' }
};

document.addEventListener('DOMContentLoaded', function () {
  traceSupplyChain();
});

function setMedicinePreset(medId, presetCardId) {
  document.querySelectorAll('.supply-preset-card').forEach(c => c.classList.remove('active'));
  if (presetCardId) {
    const card = document.getElementById(presetCardId);
    if (card) card.classList.add('active');
  } else {
    const matchingCard = document.getElementById(`preset-med-${medId}`);
    if (matchingCard) matchingCard.classList.add('active');
  }

  const select = document.getElementById('supply-chain-med-select');
  if (select) {
    select.value = medId;
  }
  traceSupplyChain();
}

function onManualMedicineChange() {
  const select = document.getElementById('supply-chain-med-select');
  if (!select) return;
  const medId = select.value;
  document.querySelectorAll('.supply-preset-card').forEach(c => c.classList.remove('active'));
  const matchingCard = document.getElementById(`preset-med-${medId}`);
  if (matchingCard) matchingCard.classList.add('active');
  traceSupplyChain();
}

function wrapText(text, maxChars = 20) {
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

function traceSupplyChain() {
  const select = document.getElementById('supply-chain-med-select');
  const medId = select ? select.value : 504;

  const placeholder = document.getElementById('supply-chain-placeholder');
  if (placeholder) {
    placeholder.style.display = 'block';
    placeholder.innerHTML = `
      <div class="spinner-border text-teal mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
      <div class="fs-6 fw-semibold text-light">Tracing Multi-Tier Provenance...</div>
      <div class="small text-muted mt-1">Discovering manufacturer plant, logistics fleet, inventory, and clinical deliveries</div>
    `;
  }

  fetch(`/api/neo4j/supply-chain?medicine_id=${medId}`)
    .then(res => res.json())
    .then(data => {
      if (placeholder) placeholder.style.display = 'none';

      if (data.success && data.data) {
        currentMedicinePayload = data.data;
        currentChainNodes = data.data.nodes || [];
        currentChainEdges = data.data.edges || [];

        // Update stage count badges
        const counts = data.data.stage_counts || {};
        updateStageBadge('count-stage-1', counts.manufacturers || 0);
        updateStageBadge('count-stage-2', counts.suppliers || 0);
        updateStageBadge('count-stage-3', 1);
        updateStageBadge('count-stage-4', counts.pharmacies || 0);
        updateStageBadge('count-stage-5', counts.patients || 0);

        // Update header badge
        const badge = document.getElementById('supply-chain-badge');
        if (badge) {
          badge.className = 'badge bg-success text-white px-3 py-2';
          badge.innerHTML = `<i class="fas fa-check-circle me-1"></i> ${data.data.medicine_name} &bull; <strong>${currentChainNodes.length} Entities in Pipeline</strong>`;
        }

        renderSupplyChainNetwork(currentChainNodes, currentChainEdges);

        // Display Central Medicine in Dossier by default
        const centerNode = currentChainNodes.find(n => n.tier === 3 || n.is_center) || currentChainNodes[0];
        if (centerNode) {
          displayEntityDossier(centerNode);
        }
      }
    })
    .catch(err => {
      console.error('Supply chain error:', err);
      if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.innerHTML = `
          <i class="fas fa-times-circle fa-3x mb-2 text-danger"></i>
          <div class="fs-6 fw-semibold text-danger">Failed to load supply chain provenance.</div>
        `;
      }
    });
}

function updateStageBadge(elementId, count) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerText = `${count} Active`;
    el.className = count > 0 ? 'badge bg-teal text-white' : 'badge border border-secondary text-light px-2';
  }
}

function formatVisNode(n) {
  const tier = n.tier || 3;
  const palette = TIER_COLORS[tier] || TIER_COLORS[3];
  const group = n.group || 'Node';
  const cleanName = n.label || n.name || n.id;
  const wrapped = wrapText(cleanName, 18);

  let labelText = '';
  if (tier === 1) {
    labelText = `🏭 [MFG: ${group.toUpperCase()}]\n${wrapped}`;
  } else if (tier === 2) {
    labelText = `🚚 [LOGISTICS: ${group.toUpperCase()}]\n${wrapped}`;
  } else if (tier === 3) {
    labelText = `💊 [FORMULARY DRUG]\n${wrapped}\n₹${n.properties?.price || ''}`;
  } else if (tier === 4) {
    const qty = n.stock_info?.quantity;
    const stockSub = qty !== undefined ? `Stock: ${qty} units` : '';
    labelText = `🏬 [DISPENSARY]\n${wrapped}\n${stockSub}`;
  } else if (tier === 5) {
    const rx = n.rx_info?.prescription_id ? `Rx #${n.rx_info.prescription_id}` : '';
    labelText = `👤 [PATIENT]\n${wrapped}\n${rx}`;
  }

  const isCenter = (tier === 3);

  return {
    ...n,
    id: n.id,
    label: labelText,
    shape: 'dot',
    size: isCenter ? 36 : (tier === 4 ? 26 : 22),
    level: tier,
    borderWidth: isCenter ? 4 : 2,
    color: {
      background: palette.bg,
      border: palette.border,
      highlight: {
        background: palette.border,
        border: '#ffffff'
      },
      hover: {
        background: palette.border,
        border: '#ffffff'
      }
    },
    shadow: {
      enabled: true,
      color: isCenter ? 'rgba(16, 185, 129, 0.6)' : 'rgba(0, 0, 0, 0.5)',
      size: isCenter ? 18 : 8,
      x: 0,
      y: 0
    },
    font: {
      size: isCenter ? 13 : 11.5,
      face: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#ffffff',
      bold: true,
      strokeWidth: 4,
      strokeColor: '#070b14',
      multi: true
    },
    title: n.title || `<b>${n.stage || group}:</b> ${cleanName}`
  };
}

function formatVisEdge(e) {
  return {
    ...e,
    id: e.id,
    from: e.from,
    to: e.to,
    label: isLabelsVisible ? (e.label || '') : '',
    width: 2.5,
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
    smooth: isLinearPipeline ? false : { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.25 },
    font: {
      size: 10,
      face: 'Inter, system-ui, sans-serif',
      color: '#38bdf8',
      bold: true,
      background: '#0a0f1d',
      strokeWidth: 1.5,
      strokeColor: '#0284c7',
      align: 'top',
      vadjust: -5
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

function renderSupplyChainNetwork(nodes, edges) {
  const container = document.getElementById('supply-chain-canvas');
  if (!container) return;

  const formattedNodes = nodes.map(n => formatVisNode(n));
  const formattedEdges = edges.map(e => formatVisEdge(e));

  supplyNodesDataSet = new vis.DataSet(formattedNodes);
  supplyEdgesDataSet = new vis.DataSet(formattedEdges);

  const data = {
    nodes: supplyNodesDataSet,
    edges: supplyEdgesDataSet
  };

  const options = {
    physics: false,
    interaction: {
      zoomView: true,
      dragView: true,
      hover: true,
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
        nodeSpacing: 75,
        treeSpacing: 100
      }
    };
  } else {
    options.layout = { hierarchical: { enabled: false } };
    options.physics = {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -80,
        centralGravity: 0.015,
        springLength: 180,
        springConstant: 0.08,
        damping: 0.85
      },
      stabilization: { iterations: 120 }
    };
  }

  // Destroy previous network instance cleanly
  if (supplyNetwork) {
    try { supplyNetwork.destroy(); } catch (err) {}
    supplyNetwork = null;
  }

  supplyNetwork = new vis.Network(container, data, options);

  // Freeze physics once stabilized in dynamic layout, then fit
  supplyNetwork.once('stabilizationIterationsDone', function () {
    if (!isLinearPipeline) {
      supplyNetwork.setOptions({ physics: { enabled: false } });
    }
    supplyNetwork.fit({
      animation: { duration: 500, easingFunction: 'easeInOutQuad' }
    });
  });

  if (isLinearPipeline) {
    supplyNetwork.once('afterDrawing', function () {
      supplyNetwork.fit({
        animation: { duration: 500, easingFunction: 'easeInOutQuad' }
      });
    });
  }

  // Interactive Node Click -> Display Entity Dossier
  supplyNetwork.on('click', function (params) {
    if (params.nodes && params.nodes.length > 0) {
      const clickedId = params.nodes[0];
      const nodeObj = currentChainNodes.find(n => n.id === clickedId);
      if (nodeObj) {
        displayEntityDossier(nodeObj);
      }
    }
  });
}

let currentSupplySpotlightStage = null;

function spotlightByStage(stageNum) {
  if (!supplyNodesDataSet || !supplyNetwork) return;

  if (currentSupplySpotlightStage === stageNum) {
    resetSupplySpotlight();
    return;
  }

  currentSupplySpotlightStage = stageNum;
  const updates = [];
  supplyNodesDataSet.forEach(node => {
    const isTargetStage = (node.level === stageNum || node.tier === stageNum);
    const isCenter = (node.level === 3 || node.tier === 3);

    if (isTargetStage || isCenter) {
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
  supplyNodesDataSet.update(updates);

  // Focus on the first node of this stage if found
  const matchingNode = currentChainNodes.find(n => n.tier === stageNum);
  if (matchingNode) {
    supplyNetwork.focus(matchingNode.id, {
      scale: 1.15,
      animation: { duration: 400, easingFunction: 'easeInOutQuad' }
    });
    const foundFullNode = currentChainNodes.find(n => n.id === matchingNode.id);
    if (foundFullNode) {
      displayEntityDossier(foundFullNode);
    }
  }
}

function resetSupplySpotlight() {
  if (!supplyNodesDataSet) return;
  currentSupplySpotlightStage = null;
  const updates = [];
  supplyNodesDataSet.forEach(node => {
    updates.push({
      id: node.id,
      opacity: 1.0,
      font: { ...node.font, color: '#ffffff' }
    });
  });
  supplyNodesDataSet.update(updates);
  if (supplyNetwork) {
    supplyNetwork.fit({
      animation: { duration: 450, easingFunction: 'easeInOutQuad' }
    });
  }
}

function displayEntityDossier(node) {
  const stageTag = document.getElementById('dossier-stage-tag');
  const content = document.getElementById('dossier-content');
  if (!stageTag || !content) return;

  const tier = node.tier || 3;
  const palette = TIER_COLORS[tier] || TIER_COLORS[3];
  stageTag.innerText = palette.tag;
  stageTag.style.color = palette.text;
  stageTag.style.borderColor = palette.border;

  const props = node.properties || {};
  let specificHtml = '';

  if (tier === 1) {
    // Manufacturer
    specificHtml = `
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Industrial Plant Location:</div>
        <div class="fw-semibold text-light">${props.city || 'India'}</div>
      </div>
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Quality & Regulatory Compliance:</div>
        <div class="badge bg-success">WHO-GMP Certified</div>
        <div class="badge bg-info text-dark">FDA 21 CFR Part 11</div>
      </div>
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Supply Channel:</div>
        <div class="small text-light">Bulk synthesis & API shipping to certified regional distributors</div>
      </div>
    `;
  } else if (tier === 2) {
    // Supplier
    specificHtml = `
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Regional Logistics Hub:</div>
        <div class="fw-semibold text-light">${props.city || 'India'}</div>
      </div>
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Logistics Certification:</div>
        <div class="badge bg-primary">Cold Chain Validated</div>
        <div class="badge border border-info border-opacity-50 text-info" style="background: rgba(14, 165, 233, 0.15);">ISO 9001:2015</div>
      </div>
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Fleet Routing:</div>
        <div class="small text-light">Direct transport to licensed hospital dispensaries and community pharmacies</div>
      </div>
    `;
  } else if (tier === 3) {
    // Medicine
    specificHtml = `
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Unit Price (MRP):</div>
        <div class="fs-5 fw-bold text-success">₹${props.price || '0.00'}</div>
      </div>
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Formulary Category:</div>
        <div class="badge bg-teal text-white">Central Formulary Asset</div>
      </div>
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Storage & Provenance:</div>
        <div class="small text-light">Batch verified against tamper-evident serials with unbroken distribution log</div>
      </div>
    `;
  } else if (tier === 4) {
    // Pharmacy
    const stock = node.stock_info || {};
    specificHtml = `
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Dispensary Location:</div>
        <div class="fw-semibold text-light">${props.city || 'India'}</div>
        <div class="small text-light opacity-75">${props.street || ''}</div>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6">
          <div class="p-2 bg-dark rounded border border-secondary border-opacity-25 text-center">
            <div class="small fw-bold mb-1" style="font-size: 10px; color: #94a3b8;">IN STOCK</div>
            <div class="fs-6 fw-bold text-info">${stock.quantity !== undefined ? stock.quantity : '--'} units</div>
          </div>
        </div>
        <div class="col-6">
          <div class="p-2 bg-dark rounded border border-secondary border-opacity-25 text-center">
            <div class="small fw-bold mb-1" style="font-size: 10px; color: #94a3b8;">REORDER AT</div>
            <div class="fs-6 fw-bold text-warning">${stock.reorder !== undefined ? stock.reorder : '--'} units</div>
          </div>
        </div>
      </div>
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Contact & Emergency Line:</div>
        <div class="small text-info"><i class="fas fa-phone me-1"></i> ${props.contact || '+91 22 2640 5555'}</div>
      </div>
    `;
  } else if (tier === 5) {
    // Patient
    const rx = node.rx_info || {};
    specificHtml = `
      <div class="mb-3">
        <div class="small fw-medium mb-1" style="color: #94a3b8; font-size: 11.5px;">Patient Demographics:</div>
        <div class="fw-semibold text-light">${props.city || 'India'} &bull; Gender: ${props.sex || 'M'}</div>
      </div>
      <div class="p-2 bg-dark rounded border border-secondary border-opacity-25 mb-3">
        <div class="small fw-bold text-warning mb-1"><i class="fas fa-file-prescription me-1"></i> Prescription #${rx.prescription_id || '--'}</div>
        <div class="small text-light"><strong>Dosage:</strong> ${rx.dosage || '--'}</div>
        <div class="small text-light"><strong>Frequency:</strong> ${rx.frequency || '--'}</div>
        <div class="small text-light"><strong>Duration:</strong> ${rx.duration || '--'}</div>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="mb-3">
      <div class="fs-6 fw-bold text-light mb-1">${node.label || node.name}</div>
      <div class="small" style="color: #94a3b8;">Node ID: <code>${node.id}</code></div>
    </div>
    ${specificHtml}
    <button class="btn btn-sm btn-outline-info w-100 mt-2" onclick="focusOnNode('${node.id}')">
      <i class="fas fa-crosshairs me-1"></i> Focus in Canvas
    </button>
  `;
}

function focusOnNode(nodeId) {
  if (supplyNetwork) {
    supplyNetwork.focus(nodeId, {
      scale: 1.4,
      animation: { duration: 500, easingFunction: 'easeInOutQuad' }
    });
    supplyNetwork.selectNodes([nodeId]);
  }
}

function stopPipelineAnimation() {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
  if (animationTimeout) {
    clearTimeout(animationTimeout);
    animationTimeout = null;
  }

  const stageCards = [
    document.getElementById('stage-card-1'),
    document.getElementById('stage-card-2'),
    document.getElementById('stage-card-3'),
    document.getElementById('stage-card-4'),
    document.getElementById('stage-card-5')
  ];
  stageCards.forEach(c => c && c.classList.remove('border-warning', 'shadow', 'flow-step-active'));

  const btn = document.getElementById('btn-animate-flow');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-bolt text-warning"></i> Animate Pipeline Flow';
    btn.style.borderColor = 'rgba(245, 158, 11, 0.45)';
    btn.classList.remove('active');
  }

  // Smoothly zoom out and re-fit the entire 5-tier pipeline
  if (supplyNetwork) {
    supplyNetwork.unselectAll();
    supplyNetwork.fit({
      animation: { duration: 600, easingFunction: 'easeInOutQuad' }
    });
  }
}

function startPipelineAnimation() {
  // If already running, clicking acts as a STOP toggle
  if (animationInterval) {
    stopPipelineAnimation();
    return;
  }

  const btn = document.getElementById('btn-animate-flow');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-stop text-danger"></i> Stop Animation';
    btn.style.borderColor = '#ef4444';
    btn.classList.add('active');
  }

  const stageCards = [
    document.getElementById('stage-card-1'),
    document.getElementById('stage-card-2'),
    document.getElementById('stage-card-3'),
    document.getElementById('stage-card-4'),
    document.getElementById('stage-card-5')
  ];

  let currentStage = 0;
  stageCards.forEach(c => c && c.classList.remove('border-warning', 'shadow', 'flow-step-active'));

  function runAnimationStep() {
    stageCards.forEach(c => c && c.classList.remove('border-warning', 'shadow', 'flow-step-active'));

    const targetStageNum = currentStage + 1;
    if (stageCards[currentStage]) {
      stageCards[currentStage].classList.add('border-warning', 'shadow', 'flow-step-active');
    }

    // Dynamic camera framing: zoom in on focal node, zoom out on multi-node layers
    if (supplyNetwork && currentChainNodes.length > 0) {
      const tierNodes = currentChainNodes.filter(n => n.tier === targetStageNum).map(n => n.id);
      if (tierNodes.length > 0) {
        supplyNetwork.selectNodes(tierNodes);
        if (tierNodes.length === 1) {
          // Focal Medicine: zoom in smoothly
          supplyNetwork.focus(tierNodes[0], {
            scale: 1.15,
            animation: { duration: 500, easingFunction: 'easeInOutQuad' }
          });
        } else {
          // Multiple nodes (e.g. Stage 1, 2, 4, 5): ZOOM OUT and fit all nodes in this layer!
          supplyNetwork.fit({
            nodes: tierNodes,
            animation: { duration: 550, easingFunction: 'easeInOutQuad' }
          });
        }
      }
    }

    currentStage = (currentStage + 1) % stageCards.length;
  }

  // Run first step immediately
  runAnimationStep();

  animationInterval = setInterval(() => {
    runAnimationStep();
  }, 1600);

  // Automatically finish after 3 complete cycles (24s)
  animationTimeout = setTimeout(() => {
    stopPipelineAnimation();
  }, 24000);
}

// Fullscreen Studio Maximizer for Supply Chain Canvas
window.toggleMaximizeSupplyChain = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const card = document.getElementById('supply-chain-canvas-card');
  const btn = document.getElementById('btn-maximize-canvas');
  const icon = document.getElementById('max-btn-icon');
  const label = document.getElementById('max-btn-label');
  if (!card) return;

  const isMax = card.classList.contains('maximized-mode') || 
                document.fullscreenElement === card || 
                document.webkitFullscreenElement === card;

  if (isMax) {
    // Exit maximize mode
    card.classList.remove('maximized-mode');
    document.body.classList.remove('graph-canvas-maximized');
    if (btn) btn.classList.remove('active');
    if (icon) icon.className = 'fas fa-expand text-success me-1';
    if (label) label.innerText = 'Maximize View';
    if (btn) btn.setAttribute('title', 'Maximize view to full screen (Esc to exit)');

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(function() {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  } else {
    // Enter maximize mode
    card.classList.add('maximized-mode');
    document.body.classList.add('graph-canvas-maximized');
    if (btn) btn.classList.add('active');
    if (icon) icon.className = 'fas fa-compress text-warning me-1';
    if (label) label.innerText = 'Minimize View';
    if (btn) btn.setAttribute('title', 'Exit maximized view (or press Esc to exit)');

    try {
      if (card.requestFullscreen) {
        card.requestFullscreen().catch(function() {});
      } else if (card.webkitRequestFullscreen) {
        card.webkitRequestFullscreen();
      }
    } catch (err) {}
  }

  // Smoothly resize Vis.js canvas
  setTimeout(function() {
    if (supplyNetwork) {
      supplyNetwork.setSize('100%', '100%');
      supplyNetwork.redraw();
      supplyNetwork.fit({
        animation: {
          duration: 350,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  }, 120);
};

// Global escape key listener to exit maximize mode
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const card = document.getElementById('supply-chain-canvas-card');
    if (card && card.classList.contains('maximized-mode')) {
      toggleMaximizeSupplyChain();
    }
  }
});

// Global supplyControls toolbar actions
window.supplyControls = {
  fitView: function () {
    if (!supplyNetwork) return;
    supplyNetwork.fit({
      animation: { duration: 500, easingFunction: 'easeInOutQuad' }
    });
  },

  zoomIn: function () {
    if (!supplyNetwork) return;
    const currentScale = supplyNetwork.getScale();
    supplyNetwork.moveTo({
      scale: Math.min(3.5, currentScale * 1.3),
      animation: { duration: 300, easingFunction: 'easeInOutQuad' }
    });
  },

  zoomOut: function () {
    if (!supplyNetwork) return;
    const currentScale = supplyNetwork.getScale();
    supplyNetwork.moveTo({
      scale: Math.max(0.15, currentScale * 0.77),
      animation: { duration: 300, easingFunction: 'easeInOutQuad' }
    });
  },

  reCenter: function () {
    if (!supplyNetwork || !currentChainNodes) return;
    const centerNode = currentChainNodes.find(n => n.tier === 3 || n.is_center);
    if (centerNode) {
      supplyNetwork.focus(centerNode.id, {
        scale: 1.2,
        animation: { duration: 500, easingFunction: 'easeInOutQuad' }
      });
      displayEntityDossier(centerNode);
    } else {
      this.fitView();
    }
  },

  toggleLabels: function () {
    if (!supplyEdgesDataSet || !currentMedicinePayload) return;
    isLabelsVisible = !isLabelsVisible;

    const btn = document.getElementById('btn-toggle-labels');
    if (btn) {
      btn.className = isLabelsVisible
        ? 'btn btn-sm btn-dark border border-secondary text-light py-1 px-2 active'
        : 'btn btn-sm btn-dark border border-secondary text-light opacity-75 py-1 px-2';
    }

    const updatedEdges = currentChainEdges.map(e => formatVisEdge(e));
    supplyEdgesDataSet.update(updatedEdges);
  },

  toggleLayout: function () {
    if (!currentMedicinePayload) return;
    isLinearPipeline = !isLinearPipeline;

    const modeLabel = document.getElementById('layout-mode-label');
    if (modeLabel) {
      modeLabel.innerText = isLinearPipeline ? 'Linear Pipeline' : 'Free Physics';
    }

    renderSupplyChainNetwork(currentChainNodes, currentChainEdges);
  }
};

window.focusStageOnCanvas = function(tier) {
  if (!supplyNetwork || !currentChainNodes || currentChainNodes.length === 0) return;
  const tierNodes = currentChainNodes.filter(n => n.tier === tier).map(n => n.id);
  if (tierNodes.length > 0) {
    supplyNetwork.selectNodes(tierNodes);
    supplyNetwork.fit({
      nodes: tierNodes,
      animation: { duration: 450, easingFunction: 'easeInOutQuad' }
    });
  }
};

