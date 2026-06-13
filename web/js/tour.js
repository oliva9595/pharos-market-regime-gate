// Driver script for the Pharos Sentinel interactive onboarding tour

const tourSteps = [
  {
    title: "Welcome to Pharos Volatility Sentinel!",
    text: "An automated security system monitoring market risks and protecting your DeFi transactions on the Vara Network. Let's take a quick tour to see how it works.",
    targetId: null
  },
  {
    title: "1. System Decision Banner",
    text: "This banner displays the current Sentinel execution policy: ALLOW, RESTRICT, BLOCK, or UNWIND. This represents the consolidated real-time risk assessment.",
    targetId: "global-readiness-banner"
  },
  {
    title: "2. Market Regime Monitor",
    text: "Monitors 6 core security oracle signals (VIX Volatility, Price Divergence, Bridge Outflow, Stablecoin Depeg, etc.) and visualizes historical volatility against alert thresholds.",
    targetId: "market-regime-panel"
  },
  {
    title: "3. Deterministic Shock Simulator",
    text: "Use these simulation injectors to trigger a VIX shock (>30%), bridge panic outflow, or stale oracle data, and witness the system instantly transition to BLOCK/RESTRICT.",
    targetId: "market-shocks-container"
  },
  {
    title: "4. Yield Decay Monitor",
    text: "Evaluates vault yield safety based on TVL, 24h net flow, fees, and slippage to detect and alert on APY decay and mercenary capital flight.",
    targetId: "yield-decay-panel"
  },
  {
    title: "5. Yield Decay Simulator",
    text: "Simulate decay scenarios like reward depletion (Subsidy Collapse) or rapid capital exit (Mercenary TVL) to test WATCH and DECAYING state transitions.",
    targetId: "yield-scenarios-container"
  },
  {
    title: "6. Execution Proof Arena",
    text: "Simulate or execute Web3 transactions on Vara. Check Action queries the policy, while Execute Action signs and dispatches transactions directly on-chain.",
    targetId: "execution-proof-panel"
  }
];

let currentStep = 0;

export function initTour() {
  const backdrop = document.getElementById('tour-backdrop');
  const popup = document.getElementById('tour-popup');
  const btnNext = document.getElementById('tour-next');
  const btnBack = document.getElementById('tour-back');
  const btnSkip = document.getElementById('tour-skip');
  const btnClose = document.getElementById('tour-close');
  const btnRestart = document.getElementById('restart-tour');

  if (!backdrop || !popup) return;

  function showStep(index) {
    // Clear previous highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });

    currentStep = index;
    const step = tourSteps[index];

    // Update popup texts
    document.getElementById('tour-step-indicator').textContent = `Step ${index + 1}/${tourSteps.length}`;
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-text').textContent = step.text;

    // Update navigation buttons state
    btnBack.disabled = index === 0;
    btnNext.textContent = index === tourSteps.length - 1 ? "Finish" : "Next";

    // Highlight target
    let targetEl = null;
    if (step.targetId) {
      targetEl = document.getElementById(step.targetId);
      if (targetEl) {
        targetEl.classList.add('tour-highlight');
      }
    }

    // Position popup next to target
    positionPopup(targetEl);
  }

  function positionPopup(targetEl) {
    popup.classList.remove('hidden');
    popup.classList.add('flex');

    if (!targetEl) {
      // Center in screen
      popup.style.position = 'fixed';
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
      return;
    }

    popup.style.position = 'absolute';
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Position popup card after scroll finishes
    setTimeout(() => {
      const rect = targetEl.getBoundingClientRect();
      const popupWidth = popup.offsetWidth || 340;
      const popupHeight = popup.offsetHeight || 180;
      
      // Default to bottom-center of target
      let top = window.scrollY + rect.bottom + 16;
      let left = window.scrollX + rect.left + (rect.width - popupWidth) / 2;

      // Adjust if it goes below screen bottom or overlaps
      const isOffScreenBottom = (rect.bottom + popupHeight + 32) > window.innerHeight;
      if (isOffScreenBottom && rect.top > popupHeight + 32) {
        // Position above the element
        top = window.scrollY + rect.top - popupHeight - 16;
      }

      // Check left/right screen bounds
      left = Math.max(16, Math.min(left, window.innerWidth - popupWidth - 16));
      top = Math.max(16, top);

      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
      popup.style.transform = 'none';
    }, 250);
  }

  function startTour() {
    backdrop.classList.remove('hidden');
    // Force a reflow to make the transition work
    backdrop.offsetWidth;
    backdrop.style.opacity = '1';
    showStep(0);
  }

  function endTour() {
    backdrop.style.opacity = '0';
    setTimeout(() => {
      backdrop.classList.add('hidden');
    }, 250);
    popup.classList.remove('flex');
    popup.classList.add('hidden');
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    localStorage.setItem('pharos_tour_completed', 'true');
  }

  // Next click handler
  btnNext.addEventListener('click', () => {
    if (currentStep < tourSteps.length - 1) {
      showStep(currentStep + 1);
    } else {
      endTour();
    }
  });

  // Back click handler
  btnBack.addEventListener('click', () => {
    if (currentStep > 0) {
      showStep(currentStep - 1);
    }
  });

  // Skip handlers
  btnSkip.addEventListener('click', endTour);
  btnClose.addEventListener('click', endTour);

  // Restart tutorial handler
  if (btnRestart) {
    btnRestart.addEventListener('click', (e) => {
      e.preventDefault();
      startTour();
    });
  }

  // Handle window resizing (re-render positioning)
  window.addEventListener('resize', () => {
    if (!popup.classList.contains('hidden')) {
      const step = tourSteps[currentStep];
      const targetEl = step.targetId ? document.getElementById(step.targetId) : null;
      positionPopup(targetEl);
    }
  });

  // Auto start tour on page load
  setTimeout(startTour, 800);
}
