// js-api is loaded via UMD, available as window.pitcher

// Fake data matching the screenshot
const FAKE_DATA = {
  goals: [
    {
      id: 1,
      label: "Sales Goal #1",
      title: "Goal Title",
      period: "This Week",
      amount: 1329,
      changePercent: 25,
      changeLabel: "from last week",
      progress: 40,
    },
    {
      id: 2,
      label: "Sales Goal #2",
      title: "Goal Title",
      period: "This Month",
      amount: 5329,
      changePercent: 25,
      changeLabel: "from last month",
      progress: 55,
    },
  ],
  cyclePlan: {
    attainmentPercent: 70,
  },
  communicationUpdates: [
    {
      id: 1,
      type: "task",
      title: "Overdue Task",
      description: "Task 123 is now overdue by X days",
      time: "9:42",
      isNew: true,
    },
    {
      id: 2,
      type: "order",
      title: "Sample Delivered",
      description: "Sample order 12345 was delivered",
      time: "Yesterday",
      isNew: false,
    },
    {
      id: 3,
      type: "order",
      title: "Sample Delivered",
      description: "Sample order 12345 was delivered",
      time: "Yesterday",
      isNew: false,
    },
  ],
};

// Simulate async data fetch with 500ms delay
async function fetchData() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("[API] fetchData response:", FAKE_DATA);
  return FAKE_DATA;
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Create update item HTML
function createUpdateItem(update) {
  const iconSvg =
    update.type === "task"
      ? `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <circle cx="12" cy="12" r="10"/>
               <path d="M12 8v4M12 16h.01"/>
           </svg>`
      : `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
               <path d="M9 12l2 2 4-4"/>
           </svg>`;

  const iconClass =
    update.type === "task"
      ? "bg-red-50 text-red-500"
      : "bg-emerald-50 text-emerald-500";
  const badgeText = update.type === "task" ? "Task" : "Order Update";

  return `
        <div class="flex items-start gap-3 py-2">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconClass}">${iconSvg}</div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-sm font-semibold text-gray-900">${
                      update.title
                    }</span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">${badgeText}</span>
                </div>
                <p class="text-sm text-gray-500 truncate">${
                  update.description
                }</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-xs text-gray-400">${update.time}</span>
                ${
                  update.isNew
                    ? '<span class="w-2 h-2 bg-primary rounded-full"></span>'
                    : ""
                }
            </div>
        </div>
    `;
}

// Animate progress bar
function animateProgress(element, targetPercent, duration = 800) {
  const start = performance.now();
  const animate = (currentTime) => {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.style.width = `${targetPercent * eased}%`;
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
}

// Animate cycle ring
function animateCycleRing(
  element,
  percentElement,
  targetPercent,
  duration = 1000
) {
  const circumference = 2 * Math.PI * 52;
  const start = performance.now();
  const animate = (currentTime) => {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentPercent = Math.round(targetPercent * eased);
    const offset = circumference - (circumference * currentPercent) / 100;
    element.style.strokeDashoffset = offset;
    percentElement.textContent = `${currentPercent}%`;
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
}

// Update iframe height to match content
function updateIframeHeight() {
  const height = document.body.scrollHeight;
  console.log("[Iframe] Setting height to:", height);
  // Find the iframe in parent and set its container div height
  const iframe = window.parent.document.querySelector(
    'iframe[data-app="canvas-header-overview"]'
  );
  if (iframe && iframe.parentElement) {
    iframe.parentElement.style.height = height + "px";
  }
}

// Render the UI with data
function renderUI(data, primaryColor) {
  document.documentElement.style.setProperty("--primary-color", primaryColor);

  // Goal 1
  document.getElementById("goal1-label").textContent = data.goals[0].label;
  document.getElementById("goal1-title").textContent = data.goals[0].title;
  document.getElementById("goal1-period").textContent = data.goals[0].period;
  document.getElementById("goal1-amount").textContent = formatCurrency(
    data.goals[0].amount
  );
  document.getElementById(
    "goal1-change"
  ).textContent = `+${data.goals[0].changePercent}% ${data.goals[0].changeLabel}`;

  // Goal 2
  document.getElementById("goal2-label").textContent = data.goals[1].label;
  document.getElementById("goal2-title").textContent = data.goals[1].title;
  document.getElementById("goal2-period").textContent = data.goals[1].period;
  document.getElementById("goal2-amount").textContent = formatCurrency(
    data.goals[1].amount
  );
  document.getElementById(
    "goal2-change"
  ).textContent = `+${data.goals[1].changePercent}% ${data.goals[1].changeLabel}`;

  // Communication Updates
  const updatesList = document.getElementById("updates-list");
  updatesList.innerHTML = data.communicationUpdates
    .map(createUpdateItem)
    .join("");

  // Hide loading, show content
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("content").classList.remove("hidden");

  // Trigger animations
  requestAnimationFrame(() => {
    animateProgress(
      document.getElementById("goal1-progress"),
      data.goals[0].progress
    );
    animateProgress(
      document.getElementById("goal2-progress"),
      data.goals[1].progress
    );
    animateCycleRing(
      document.getElementById("cycle-progress"),
      document.getElementById("cycle-percent"),
      data.cyclePlan.attainmentPercent
    );

    // Update iframe height after content is rendered
    updateIframeHeight();
  });
}

// Main initialization
async function init() {
  try {
    let primaryColor = "#0057B8"; // Default

    try {
      pitcher.useUi().appLoaded();
      pitcher.useUi().onAppSetData((data) => {
        // adapt the UI according to the sfdc data etc.
        console.log("[UI] App set data hook:", data);
      });
      console.log("[API] Calling getEnv()...");
      const env = await pitcher.useApi().getEnv();
      console.log("[API] getEnv response:", env);
      if (env?.instance_color) {
        primaryColor = env.instance_color;
      }
      console.log("[API] Running in", env?.mode || "unknown", "context");
    } catch (e) {
      console.log("[API] Could not fetch environment, using default color:", e);
    }

    const data = await fetchData();
    renderUI(data, primaryColor);

    document.getElementById("view-all-btn").addEventListener("click", () => {
      console.log("[UI] View All clicked - placeholder");
    });

    // Listen for window resize to update iframe height
    window.addEventListener("resize", updateIframeHeight);
  } catch (error) {
    console.error("[Error] Failed to initialize:", error);
    document.getElementById("loading").innerHTML = `
            <div class="text-red-500 text-sm text-center">Failed to load data</div>
        `;
  }
}

init();
