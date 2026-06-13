// Custom SVG-based Market Regime Chart
// Renders VIX historical levels, horizontal threshold lines, and hysteresis states

const SVG_NS = 'http://www.w3.org/2000/svg';

export class MarketRegimeChart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Chart container #${containerId} not found.`);
    }
  }

  // Create an SVG element with attributes
  createEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }
    return el;
  }

  // Render the chart based on history
  render(history = [], currentRegime = 'NORMAL') {
    if (!this.container) return;

    // Clear container
    this.container.textContent = '';

    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 160;
    const leftPad = 25;
    const rightPad = 135; // Extra padding for threshold labels with larger text
    const topPad = 15;
    const bottomPad = 25;
    const effWidth = width - leftPad - rightPad;
    const effHeight = height - topPad - bottomPad;

    // Create main SVG element
    const svg = this.createEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      width: '100%',
      height: '100%',
      class: 'overflow-visible'
    });

    // Color definitions
    const colors = {
      normal: '#00ff66',   // Vara signature green
      volatile: '#ffcc00', // warning amber
      panic: '#ff3366',    // warning red
      textMuted: '#a3a3a3',
      gridLine: 'rgba(255, 255, 255, 0.08)'
    };

    // Determine current regime color
    const activeColor = currentRegime === 'PANIC' 
      ? colors.panic 
      : (currentRegime === 'VOLATILE' ? colors.volatile : colors.normal);

    // 1. Create Defs for gradients & filters
    const defs = this.createEl('defs');

    // Linear gradient for area fill
    const grad = this.createEl('linearGradient', {
      id: 'chart-area-grad',
      x1: '0', y1: '0', x2: '0', y2: '1'
    });
    grad.appendChild(this.createEl('stop', { offset: '0%', 'stop-color': activeColor, 'stop-opacity': '0.25' }));
    grad.appendChild(this.createEl('stop', { offset: '100%', 'stop-color': activeColor, 'stop-opacity': '0.00' }));
    defs.appendChild(grad);

    // Glow filter for line path
    const filter = this.createEl('filter', { id: 'glow', x: '-20%', y: '-20%', width: '140%', height: '140%' });
    filter.appendChild(this.createEl('feGaussianBlur', { stdDeviation: '3', result: 'blur' }));
    filter.appendChild(this.createEl('feMergeNode', { in: 'blur' }));
    filter.appendChild(this.createEl('feMergeNode', { in: 'SourceGraphic' }));
    defs.appendChild(filter);

    svg.appendChild(defs);

    // 2. Draw background grid
    const gridYPositions = [0.2, 0.4, 0.6, 0.8];
    gridYPositions.forEach(ratio => {
      const y = topPad + ratio * effHeight;
      const line = this.createEl('line', {
        x1: leftPad,
        y1: y,
        x2: leftPad + effWidth,
        y2: y,
        stroke: colors.gridLine,
        'stroke-width': '1'
      });
      svg.appendChild(line);
    });

    // Helper: Map VIX basis points to Y coordinate (Range 0 - 5500 bps)
    const mapY = (bps) => {
      const clamped = Math.max(0, Math.min(5500, Number(bps)));
      return height - bottomPad - (clamped / 5500) * effHeight;
    };

    // Helper: Map index to X coordinate
    const mapX = (index, total) => {
      if (total <= 1) return leftPad;
      return leftPad + (index / (total - 1)) * effWidth;
    };

    // 3. Draw horizontal thresholds
    const thresholds = [
      { name: 'PANIC ENTRY', val: 4500, color: '#ff3366', dash: '3,3', desc: '>=45%' },
      { name: 'PANIC EXIT', val: 4000, color: '#f43f5e', dash: '3,6', desc: '<40%' },
      { name: 'VOLATILE ENTRY', val: 3000, color: '#ffcc00', dash: '3,3', desc: '>=30%' },
      { name: 'VOLATILE EXIT', val: 2500, color: '#d97706', dash: '3,6', desc: '<25%' }
    ];

    thresholds.forEach(t => {
      const y = mapY(t.val);
      
      // Horizontal dotted line
      const line = this.createEl('line', {
        x1: leftPad,
        y1: y,
        x2: leftPad + effWidth,
        y2: y,
        stroke: t.color,
        'stroke-width': '1',
        'stroke-dasharray': t.dash,
        opacity: '0.6'
      });
      svg.appendChild(line);

      // Label text on the right
      const text = this.createEl('text', {
        x: leftPad + effWidth + 6,
        y: y + 3,
        fill: t.color,
        'font-size': '10px',
        'font-family': 'var(--font-mono, Geist Mono, monospace)',
        'font-weight': 'semibold',
        opacity: '0.85'
      });
      text.textContent = `${t.name} (${t.desc})`;
      svg.appendChild(text);
    });

    // 4. Draw data path if history exists
    if (history.length > 0) {
      let linePathD = '';
      let areaPathD = '';

      history.forEach((snap, idx) => {
        const x = mapX(idx, history.length);
        const y = mapY(snap.volatilityBps);

        if (idx === 0) {
          linePathD += `M ${x} ${y}`;
          areaPathD += `M ${x} ${height - bottomPad} L ${x} ${y}`;
        } else {
          linePathD += ` L ${x} ${y}`;
          areaPathD += ` L ${x} ${y}`;
        }

        if (idx === history.length - 1) {
          areaPathD += ` L ${x} ${height - bottomPad} Z`;
        }
      });

      // Draw Area
      const areaPath = this.createEl('path', {
        d: areaPathD,
        fill: 'url(#chart-area-grad)'
      });
      svg.appendChild(areaPath);

      // Draw Line
      const linePath = this.createEl('path', {
        d: linePathD,
        fill: 'none',
        stroke: activeColor,
        'stroke-width': '2.5',
        filter: 'url(#glow)'
      });
      svg.appendChild(linePath);

      // Draw Data points (circles) for the last 20 elements to avoid clutter
      const drawPoints = history.slice(-20);
      const startIdx = history.length - drawPoints.length;

      drawPoints.forEach((snap, i) => {
        const idx = startIdx + i;
        const x = mapX(idx, history.length);
        const y = mapY(snap.volatilityBps);

        // Determine point color based on its local value
        let ptColor = colors.normal;
        if (snap.volatilityBps >= 4500) {
          ptColor = colors.panic;
        } else if (snap.volatilityBps >= 3000) {
          ptColor = colors.volatile;
        }

        const circle = this.createEl('circle', {
          cx: x,
          cy: y,
          r: '3.5',
          fill: ptColor,
          stroke: '#ffffff',
          'stroke-width': '1.5'
        });
        
        // Add hover effect or tooltip tag
        const title = document.createElementNS(SVG_NS, 'title');
        title.textContent = `VIX: ${(snap.volatilityBps / 100).toFixed(2)}% at ${new Date(snap.observedAt * 1000).toLocaleTimeString()}`;
        circle.appendChild(title);
        
        svg.appendChild(circle);
      });
    }

    // 5. Draw Axes labels
    // X Axis Label
    const xLabel = this.createEl('text', {
      x: leftPad + effWidth / 2,
      y: height - 5,
      fill: colors.textMuted,
      'font-size': '9px',
      'text-anchor': 'middle',
      'font-family': 'var(--font-mono, Geist Mono, monospace)'
    });
    xLabel.textContent = 'SECURITY ORACLE OBSERVATION TIMELINE';
    svg.appendChild(xLabel);

    // Y Axis Label
    const yLabel = this.createEl('text', {
      x: leftPad,
      y: topPad - 5,
      fill: colors.textMuted,
      'font-size': '9px',
      'font-family': 'var(--font-mono, Geist Mono, monospace)'
    });
    yLabel.textContent = 'VIX INDEX (BPS)';
    svg.appendChild(yLabel);

    this.container.appendChild(svg);
  }
}
