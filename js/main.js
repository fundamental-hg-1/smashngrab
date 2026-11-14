document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = document.querySelector("header.top");
  const menuSection = document.getElementById("menu");
  const filtersBar = document.getElementById("menu-filters") || document.querySelector(".filters");
  const menuContainer = document.getElementById("menu-container");
  const upgradeContainer = document.getElementById("upgrade-container");

  function syncStickyMetrics() {
    if (!header) return;
    const headerHeight = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-height", headerHeight + "px");

    if (filtersBar) {
      const filtersTop = filtersBar.getBoundingClientRect().top;
      const isStuck = Math.abs(filtersTop - headerHeight) <= 2;
      filtersBar.classList.toggle("is-stuck", isStuck);
    }
  }

  syncStickyMetrics();
  window.addEventListener("scroll", syncStickyMetrics, { passive: true });
  window.addEventListener("resize", syncStickyMetrics, { passive: true });
  window.addEventListener("load", syncStickyMetrics);

  if ("ResizeObserver" in window && header) {
    new ResizeObserver(syncStickyMetrics).observe(header);
  }

  function applyCategoryFilter(filterValue, activeBtn) {
    if (!menuContainer) return;

    if (filtersBar) {
      filtersBar.querySelectorAll("button").forEach((btn) => {
        const isMatch = btn === activeBtn || btn.dataset.filter === filterValue;
        btn.classList.toggle("active", isMatch);
        btn.setAttribute("aria-selected", isMatch ? "true" : "false");
      });
    }

    const isAll = filterValue === "all";
    menuContainer.querySelectorAll(".menu-card").forEach((card) => {
      const show = isAll || card.dataset.categoryIndex === filterValue;
      card.hidden = !show;
    });

    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }

    if (menuSection) {
      const headerOffset = header ? header.getBoundingClientRect().height : 0;
      const menuTop = menuSection.getBoundingClientRect().top + window.scrollY - headerOffset;
      if (window.scrollY > menuTop + 32) {
        window.scrollTo({ top: menuTop, behavior: "smooth" });
      }
    }

    requestAnimationFrame(syncStickyMetrics);
  }

  // Render Menu Items, Dynamic Filter Bar & Separate Upgrades
  const rawMenuData = typeof menuData !== "undefined" ? menuData : window.menuData;

  if (menuContainer && Array.isArray(rawMenuData)) {
    menuContainer.innerHTML = "";
    if (upgradeContainer) upgradeContainer.innerHTML = "";
    if (filtersBar) filtersBar.innerHTML = "";

    const validCategories = rawMenuData.filter(
      (catObj) => catObj && typeof catObj.category === "string" && Array.isArray(catObj.items)
    );

    if (filtersBar) {
      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "active";
      allBtn.dataset.filter = "all";
      allBtn.setAttribute("role", "tab");
      allBtn.setAttribute("aria-selected", "true");
      allBtn.textContent = "ALL ITEMS";
      filtersBar.appendChild(allBtn);
    }

    let filterIdx = 0;

    validCategories.forEach((catObj) => {
      const catName = catObj.category;

      // Render Customize & Upgrade category separately below the main grid
      if (catName.toUpperCase().includes("CUSTOMIZE & UPGRADE")) {
        if (upgradeContainer) {
          let upgradeHTML = `
            <div class="upgrade-section">
              <h3>${escapeHtml(catName)}</h3>
              <div class="upgrade-grid">
          `;
          catObj.items.forEach((item) => {
            if (!item) return;
            upgradeHTML += `
              <div class="upgrade-card">
                <div class="item-top">
                  <h4>${escapeHtml(item.name)}</h4>
                  <strong>${escapeHtml(item.price || "")}</strong>
                </div>
                ${item.description ? `<p>${formatMultiline(item.description)}</p>` : ""}
              </div>
            `;
          });
          upgradeHTML += `</div></div>`;
          upgradeContainer.innerHTML = upgradeHTML;
        }
        return;
      }

      const catIndex = String(filterIdx++);

      if (filtersBar) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.filter = catIndex;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", "false");
        btn.textContent = catName;
        filtersBar.appendChild(btn);
      }

      catObj.items.forEach((item) => {
        if (!item) return;
        const card = document.createElement("div");
        card.className = "menu-card";
        card.dataset.categoryIndex = catIndex;
        card.innerHTML = `
          <span class="category">${escapeHtml(catName)}</span>
          <div class="item-top">
            <h3>${escapeHtml(item.name)}</h3>
            <strong>${escapeHtml(item.price || "")}</strong>
          </div>
          ${item.description ? `<p>${formatMultiline(item.description)}</p>` : ""}
        `;
        menuContainer.appendChild(card);
      });
    });

    if (filtersBar) {
      filtersBar.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || !btn.dataset.filter) return;
        applyCategoryFilter(btn.dataset.filter, btn);
      });
    }
  }

  // Modal Popup Logic
  const modal = document.getElementById("orderModal");
  const proceedBtn = document.getElementById("proceedBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const targetUrl = "https://order.toasttab.com/online/smash-grab-westfield";
  let lastFocusedTrigger = null;

  const closeModal = () => {
    if (modal) modal.classList.remove("active");
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
  };

  document.querySelectorAll(".order-trigger").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      lastFocusedTrigger = trigger;
      if (modal) {
        modal.classList.add("active");
        if (proceedBtn) proceedBtn.focus();
      }
    });
  });

  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      closeModal();
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });
});

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMultiline(str) {
  return escapeHtml(str).split("\r").join("").split("\n").join("<br>");
}
