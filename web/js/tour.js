// Driver script for the Pharos Sentinel interactive onboarding tour

const tourSteps = [
  {
    title: "Chào mừng đến với Pharos Volatility Sentinel!",
    text: "Hệ thống bảo mật tự động giám sát rủi ro thị trường và bảo vệ các giao dịch DeFi của bạn trên chuỗi khối Vara. Hãy cùng dạo quanh 1 vòng để hiểu cách vận hành.",
    targetId: null
  },
  {
    title: "1. Trạng thái Quyết định Hệ thống",
    text: "Bảng này hiển thị chính sách thực thi hiện tại của Sentinel: ALLOW (Cho phép), RESTRICT (Hạn chế), BLOCK (Chặn giao dịch), hoặc UNWIND (Rút tài sản). Đây là kết quả đánh giá rủi ro tổng hợp.",
    targetId: "global-readiness-banner"
  },
  {
    title: "2. Giám sát Chỉ số Thị trường (Market Regime)",
    text: "Theo dõi 6 tín hiệu bảo mật từ Oracle (Biến động VIX, Giá lệch Divergence, Rút vốn Cầu nối Outflow, Stablecoin Depeg...) và vẽ biểu đồ biến động lịch sử đối chiếu với các ngưỡng cảnh báo.",
    targetId: "market-regime-panel"
  },
  {
    title: "3. Bộ mô phỏng Cú sốc Thị trường (Shock Simulator)",
    text: "Sử dụng các nút mô phỏng này để bơm cú sốc VIX >30%, dòng rút cầu nối đột biến, hoặc dữ liệu Oracle hết hạn... để chứng kiến hệ thống lập tức chuyển sang trạng thái chặn BLOCK.",
    targetId: "market-shocks-container"
  },
  {
    title: "4. Giám sát Suy giảm Lợi nhuận (Yield Decay)",
    text: "Đánh giá mức độ an toàn của lợi nhuận dựa trên TVL, biến động dòng vốn ròng 24h, phí sinh ra, và độ trượt giá đầu ra để cảnh báo rủi ro sụt giảm APY.",
    targetId: "yield-decay-panel"
  },
  {
    title: "5. Giả lập kịch bản Lợi nhuận (Yield Simulator)",
    text: "Giả lập các kịch bản APY suy giảm do hết quỹ thưởng (Subsidy Collapse) hoặc cá mập rút vốn tháo chạy (Mercenary TVL) để thử nghiệm kích hoạt trạng thái giám sát rủi ro WATCH hoặc DECAYING.",
    targetId: "yield-scenarios-container"
  },
  {
    title: "6. Đấu trường Thực thi (Execution Proof)",
    text: "Thử nghiệm gửi các giao dịch nạp/rút tiền. Hệ thống sẽ kiểm tra xem chính sách hiện tại có cho phép không (Check Action), hoặc ký và thực thi giao dịch trực tiếp trên chuỗi khối Vara (Execute Action).",
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
    document.getElementById('tour-step-indicator').textContent = `Bước ${index + 1}/${tourSteps.length}`;
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-text').textContent = step.text;

    // Update navigation buttons state
    btnBack.disabled = index === 0;
    btnNext.textContent = index === tourSteps.length - 1 ? "Hoàn thành" : "Tiếp tục";

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

  // Auto start tour on first load
  const isTourCompleted = localStorage.getItem('pharos_tour_completed');
  if (!isTourCompleted) {
    // Delay slightly on startup to let charts and DOM render cleanly
    setTimeout(startTour, 800);
  }
}
