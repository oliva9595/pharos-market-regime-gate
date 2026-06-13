// Custom SVG-based Yield Charts
// Renders APY historical decomposition (Base vs Reward APY) and Factor Contributions

const SVG_NS = 'http://www.w3.org/2000/svg';

export class YieldApyChart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Yield chart container #${containerId} not found.`);
    }
  }

  createEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }
    return el;
  }

  render(history = []) {
    if (!this.container) return;
    this.container.textContent = '';

    if (history.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-xs text-white/30 font-mono text-center pt-12';
      emptyMsg.textContent = 'No historical APY data available.';
      this.container.appendChild(emptyMsg);
      return;
    }

    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 160;
    const leftPad = 50;
    const rightPad = 15;
    const topPad = 15;
    const bottomPad = 25;
    const effWidth = width - leftPad - rightPad;
    const effHeight = height - topPad - bottomPad;

    const svg = this.createEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      width: '100%',
      height: '100%',
      class: 'overflow-visible'
    });

    // Color definitions
    const colors = {
      baseApy: '#00ff66',   // Vara signature green
      rewardApy: '#737373',     // neutral gray
      totalLine: '#ffffff',     // high-contrast white
      textMuted: '#a3a3a3',
      gridLine: 'rgba(255, 255, 255, 0.08)'
    };


    // 1. Create Defs for gradients & filters
    const defs = this.createEl('defs');

    // Base APY Gradient
    const baseGrad = this.createEl('linearGradient', { id: 'base-apy-grad', x1: '0', y1: '0', x2: '0', y2: '1' });
    baseGrad.appendChild(this.createEl('stop', { offset: '0%', 'stop-color': colors.baseApy, 'stop-opacity': '0.3' }));
    baseGrad.appendChild(this.createEl('stop', { offset: '100%', 'stop-color': colors.baseApy, 'stop-opacity': '0.0' }));
    defs.appendChild(baseGrad);

    // Reward APY Gradient
    const rewardGrad = this.createEl('linearGradient', { id: 'reward-apy-grad', x1: '0', y1: '0', x2: '0', y2: '1' });
    rewardGrad.appendChild(this.createEl('stop', { offset: '0%', 'stop-color': colors.rewardApy, 'stop-opacity': '0.3' }));
    rewardGrad.appendChild(this.createEl('stop', { offset: '100%', 'stop-color': colors.rewardApy, 'stop-opacity': '0.0' }));
    defs.appendChild(rewardGrad);

    // Glow filter
    const filter = this.createEl('filter', { id: 'yield-glow', x: '-20%', y: '-20%', width: '140%', height: '140%' });
    filter.appendChild(this.createEl('feGaussianBlur', { stdDeviation: '2', result: 'blur' }));
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

    // Find max APY in history to scale Y axis (default to 2000 bps / 20%)
    let maxApy = 2000;
    history.forEach(snap => {
      if (snap.totalApyBps > maxApy) maxApy = snap.totalApyBps;
    });
    // Add 20% headroom
    maxApy = Math.ceil(maxApy * 1.2 / 500) * 500;

    const mapY = (bps) => {
      const clamped = Math.max(0, Math.min(maxApy, bps));
      return height - bottomPad - (clamped / maxApy) * effHeight;
    };

    const mapX = (index, total) => {
      if (total <= 1) return leftPad;
      return leftPad + (index / (total - 1)) * effWidth;
    };

    // 3. Draw stacked areas
    let baseAreaD = '';
    let totalLineD = '';

    history.forEach((snap, idx) => {
      const x = mapX(idx, history.length);
      const yBase = mapY(snap.baseApyBps);
      const yTotal = mapY(snap.totalApyBps);

      if (idx === 0) {
        baseAreaD += `M ${x} ${height - bottomPad} L ${x} ${yBase}`;
        totalLineD += `M ${x} ${yTotal}`;
      } else {
        baseAreaD += ` L ${x} ${yBase}`;
        totalLineD += ` L ${x} ${yTotal}`;
      }

      if (idx === history.length - 1) {
        baseAreaD += ` L ${x} ${height - bottomPad} Z`;
      }
    });

    // Let's draw base APY area first
    const baseArea = this.createEl('path', {
      d: baseAreaD,
      fill: 'url(#base-apy-grad)'
    });
    svg.appendChild(baseArea);

    // To make stacked areas correct, let's draw reward APY stacked on top of base
    let stackedRewardD = '';
    if (history.length > 0) {
      const startX = mapX(0, history.length);
      const startYBase = mapY(history[0].baseApyBps);
      const startYTotal = mapY(history[0].totalApyBps);
      
      stackedRewardD += `M ${startX} ${startYBase} L ${startX} ${startYTotal}`;
      for (let i = 1; i < history.length; i++) {
        stackedRewardD += ` L ${mapX(i, history.length)} ${mapY(history[i].totalApyBps)}`;
      }
      for (let i = history.length - 1; i >= 0; i--) {
        stackedRewardD += ` L ${mapX(i, history.length)} ${mapY(history[i].baseApyBps)}`;
      }
      stackedRewardD += ' Z';

      const rewardArea = this.createEl('path', {
        d: stackedRewardD,
        fill: 'url(#reward-apy-grad)'
      });
      svg.appendChild(rewardArea);
    }

    // 4. Draw lines
    // Base APY line
    let baseLineD = history.map((s, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i, history.length)} ${mapY(s.baseApyBps)}`).join(' ');
    const baseLine = this.createEl('path', {
      d: baseLineD,
      fill: 'none',
      stroke: colors.baseApy,
      'stroke-width': '1.5',
      opacity: '0.8'
    });
    svg.appendChild(baseLine);

    // Total APY line
    const totalLine = this.createEl('path', {
      d: totalLineD,
      fill: 'none',
      stroke: colors.totalLine,
      'stroke-width': '2',
      filter: 'url(#yield-glow)'
    });
    svg.appendChild(totalLine);

    // 5. Draw data points for the latest snapshots
    const pointsToDraw = history.slice(-15);
    const startIdx = history.length - pointsToDraw.length;
    pointsToDraw.forEach((snap, i) => {
      const idx = startIdx + i;
      const x = mapX(idx, history.length);
      const y = mapY(snap.totalApyBps);

      const circle = this.createEl('circle', {
        cx: x,
        cy: y,
        r: '3',
        fill: colors.totalLine,
        stroke: '#161618',
        'stroke-width': '1'
      });

      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = `Total: ${(snap.totalApyBps / 100).toFixed(2)}% (Base: ${(snap.baseApyBps / 100).toFixed(2)}%, Reward: ${(snap.rewardApyBps / 100).toFixed(2)}%) at ${new Date(snap.observedAt * 1000).toLocaleTimeString()}`;
      circle.appendChild(title);
      svg.appendChild(circle);
    });

    // 6. Labels and Axes
    // Y-Axis tick labels
    const yTicks = [0, maxApy / 2, maxApy];
    yTicks.forEach(val => {
      const y = mapY(val);
      const text = this.createEl('text', {
        x: leftPad - 5,
        y: y + 3,
        fill: colors.textMuted,
        'font-size': '12px',
        'text-anchor': 'end',
        'font-family': 'var(--font-mono, Geist Mono, monospace)'
      });
      text.textContent = `${(val / 100).toFixed(0)}%`;
      svg.appendChild(text);
    });

    // Y Axis Title
    const yLabel = this.createEl('text', {
      x: leftPad,
      y: topPad - 5,
      fill: colors.textMuted,
      'font-size': '12px',
      'font-family': 'var(--font-mono, Geist Mono, monospace)'
    });
    yLabel.textContent = 'APY (%)';
    svg.appendChild(yLabel);

    // X Axis Title
    const xLabel = this.createEl('text', {
      x: leftPad + effWidth / 2,
      y: height - 5,
      fill: colors.textMuted,
      'font-size': '12px',
      'text-anchor': 'middle',
      'font-family': 'var(--font-mono, Geist Mono, monospace)'
    });
    xLabel.textContent = 'OBSERVATION TIMELINE';
    svg.appendChild(xLabel);

    this.container.appendChild(svg);
  }
}

export class YieldFactorsChart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Factors chart container #${containerId} not found.`);
    }
  }

  createEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }
    return el;
  }

  render(factors = {}) {
    if (!this.container) return;
    this.container.textContent = '';

    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 140;
    const leftPad = 150; // Increased padding to prevent label truncation
    const rightPad = 55;  // Increased padding for value labels
    const topPad = 10;
    const bottomPad = 10;
    const effWidth = width - leftPad - rightPad;
    const effHeight = height - topPad - bottomPad;

    const svg = this.createEl('svg', {
      viewBox: `0 0 ${width} ${height}`,
      width: '100%',
      height: '100%',
      class: 'overflow-visible'
    });

    const factorList = [
      { key: 'apySlopeRisk', label: 'APY Slope (25%)', score: factors.apySlopeRisk ?? 0 },
      { key: 'subsidyDependency', label: 'Subsidy Dep (20%)', score: factors.subsidyDependency ?? 0 },
      { key: 'tvlNetFlow', label: 'TVL Net Flow (20%)', score: factors.tvlNetFlow ?? 0 },
      { key: 'feeSustainability', label: 'Fee Sustain (15%)', score: factors.feeSustainability ?? 0 },
      { key: 'exitLiquidity', label: 'Exit Slippage (10%)', score: factors.exitLiquidity ?? 0 },
      { key: 'rewardToken', label: 'Reward Token (10%)', score: factors.rewardToken ?? 0 }
    ];

    const rowHeight = effHeight / factorList.length;

    factorList.forEach((f, idx) => {
      const y = topPad + idx * rowHeight + (rowHeight - 10) / 2;

      // Draw Label
      const text = this.createEl('text', {
        x: leftPad - 10,
        y: y + 8,
        fill: '#a3a3a3',
        'font-size': '12px',
        'text-anchor': 'end',
        'font-family': 'var(--font-mono, Geist Mono, monospace)',
        'font-weight': 'semibold'
      });
      text.textContent = f.label;
      svg.appendChild(text);

      // Draw Background bar
      const bgBar = this.createEl('rect', {
        x: leftPad,
        y: y,
        width: effWidth,
        height: '8',
        rx: '4',
        fill: 'rgba(255, 255, 255, 0.08)',
        stroke: 'rgba(255, 255, 255, 0.02)',
        'stroke-width': '1'
      });
      svg.appendChild(bgBar);

      // Draw Fill bar
      const fillWidth = (f.score / 100) * effWidth;
      if (fillWidth > 0) {
        const barColor = f.score >= 50 
          ? '#ff3366' 
          : (f.score >= 30 ? '#ffcc00' : '#00ff66');

        const fillBar = this.createEl('rect', {
          x: leftPad,
          y: y,
          width: fillWidth,
          height: '8',
          rx: '4',
          fill: barColor,
          opacity: f.score >= 50 ? '0.95' : '0.7'
        });
        svg.appendChild(fillBar);
      }

      // Draw Value text
      const valText = this.createEl('text', {
        x: leftPad + effWidth + 6,
        y: y + 8,
        fill: f.score >= 50 ? '#ff3366' : '#ffffff',
        'font-size': '12px',
        'font-family': 'var(--font-mono, Geist Mono, monospace)',
        'font-weight': f.score >= 50 ? 'bold' : 'normal'
      });
      valText.textContent = `${f.score}%`;
      svg.appendChild(valText);
    });

    this.container.appendChild(svg);
  }
}
