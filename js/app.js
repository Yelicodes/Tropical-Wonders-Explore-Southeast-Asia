(() => {
  "use strict";
  const data = window.TROPICAL_DATA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const imageUrl = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
  const destinationById = id => data.destinations.find(place => place.id === id);
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("shown"), 3200);
  }
  function readStorage(key, fallback, validator) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      if (!validator(parsed)) throw new Error("Stored data has an unexpected shape.");
      return parsed;
    } catch (error) {
      console.error(`Could not read ${key} from localStorage.`, error);
      try { localStorage.removeItem(key); } catch (removeError) { console.error(`Could not clear invalid ${key}.`, removeError); }
      notify("Some saved browser data could not be read and was cleared.");
      return fallback;
    }
  }
  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Could not save ${key} to localStorage.`, error);
      notify("Your browser could not save this change. Check available storage and privacy settings.");
      return false;
    }
  }
  const favoriteIds = new Set(readStorage("tropical-wonders-favorites", [], value =>
    Array.isArray(value) && value.every(id => typeof id === "string" && destinationById(id))));
  let trips = readStorage("tropical-wonders-trips", [], value =>
    Array.isArray(value) && value.every(trip => trip && typeof trip.id === "string" && typeof trip.name === "string" &&
      typeof trip.country === "string" && typeof trip.date === "string" && typeof trip.notes === "string" &&
      Array.isArray(trip.destinationIds) && trip.destinationIds.every(id => typeof id === "string" && destinationById(id))));

  function makeImage(id, alt, width = 900) {
    const img = document.createElement("img");
    img.src = imageUrl(id, width);
    img.alt = alt;
    img.loading = "lazy";
    img.addEventListener("error", () => {
      img.removeAttribute("src");
      img.classList.add("image-unavailable");
      img.alt = `${alt} (image unavailable)`;
    }, { once: true });
    return img;
  }
  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function setFavorite(id, shouldFavorite) {
    if (shouldFavorite) favoriteIds.add(id);
    else favoriteIds.delete(id);
    if (!writeStorage("tropical-wonders-favorites", [...favoriteIds])) {
      shouldFavorite ? favoriteIds.delete(id) : favoriteIds.add(id);
      return;
    }
    updateFavoriteCount();
    renderDestinations();
    if (!favoritesModal.hidden) renderFavorites();
    if (!$("#detail-modal").hidden && $("#detail-modal").dataset.destinationId === id) renderDetail(id);
    notify(shouldFavorite ? "Added to your favorites." : "Removed from your favorites.");
  }
  function updateFavoriteCount() { $("#favorite-count").textContent = String(favoriteIds.size); }

  const destinationGrid = $("#destination-grid");
  const searchInput = $("#destination-search");
  const destinationFilter = $("#destination-filter");
  function renderDestinations() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const filter = destinationFilter.value;
    const places = data.destinations.filter(place => {
      const matchesQuery = [place.name, place.country, place.region, place.category, place.description]
        .some(value => value.toLocaleLowerCase().includes(query));
      const matchesFilter = filter === "all" || place.country === filter || place.category === filter;
      return matchesQuery && matchesFilter;
    });
    destinationGrid.replaceChildren();
    places.forEach(place => {
      const card = create("article", "destination-card reveal");
      const media = create("div", "card-image");
      media.append(makeImage(place.image, place.alt));
      const country = create("span", "country-tag", place.country);
      const favorite = create("button", `favorite-toggle${favoriteIds.has(place.id) ? " is-favorite" : ""}`);
      favorite.type = "button";
      favorite.setAttribute("aria-label", `${favoriteIds.has(place.id) ? "Remove" : "Add"} ${place.name} ${favoriteIds.has(place.id) ? "from" : "to"} favorites`);
      favorite.setAttribute("aria-pressed", String(favoriteIds.has(place.id)));
      favorite.innerHTML = `<i class="fa-${favoriteIds.has(place.id) ? "solid" : "regular"} fa-heart" aria-hidden="true"></i>`;
      favorite.addEventListener("click", () => setFavorite(place.id, !favoriteIds.has(place.id)));
      media.append(country, favorite);
      const body = create("div", "card-body");
      const meta = create("div", "card-meta");
      meta.append(create("span", "", place.category), create("span", "", place.country === "Thailand" ? "TH" : "MY"));
      body.append(meta, create("h3", "", place.name), create("p", "card-region", place.region), create("p", "card-desc", place.description));
      const bottom = create("div", "card-bottom");
      bottom.append(create("span", "card-highlight", place.activities[0]));
      const details = create("button", "details-link", "View details ");
      details.type = "button";
      details.append(document.createElement("i"));
      details.lastChild.className = "fa-solid fa-arrow-right";
      details.addEventListener("click", () => openDetail(place.id));
      bottom.append(details);
      body.append(bottom);
      card.append(media, body);
      destinationGrid.append(card);
    });
    $("#results-count").textContent = `${places.length} ${places.length === 1 ? "destination" : "destinations"} to explore`;
    $("#destination-empty").hidden = places.length !== 0;
    observeReveals();
  }
  function resetFilters() {
    searchInput.value = "";
    destinationFilter.value = "all";
    renderDestinations();
  }
  searchInput.addEventListener("input", renderDestinations);
  destinationFilter.addEventListener("change", renderDestinations);
  $("#reset-filters").addEventListener("click", resetFilters);
  $("#empty-reset").addEventListener("click", resetFilters);

  const activityGrid = $("#activity-grid");
  data.activities.forEach(activity => {
    const card = create("article", `activity-card ${activity.layout}`.trim());
    card.style.setProperty("--activity-image", `url("${imageUrl(activity.image, 900)}")`);
    const info = create("div", "activity-info");
    const icon = create("span", "activity-icon");
    icon.innerHTML = `<i class="fa-solid ${activity.icon}" aria-hidden="true"></i>`;
    info.append(icon, create("h3", "", activity.title), create("p", "", activity.description));
    const links = create("div", "activity-places");
    activity.places.forEach(id => {
      const place = destinationById(id);
      const button = create("button", "", place.name);
      button.type = "button";
      button.addEventListener("click", () => openDetail(id));
      links.append(button);
    });
    info.append(links);
    card.append(info);
    activityGrid.append(card);
  });

  const detailModal = $("#detail-modal");
  let lastFocusedElement = null;
  function openModal(modal) {
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $(".modal-close", modal)?.focus();
  }
  function closeModal(modal) {
    modal.hidden = true;
    if ($("#detail-modal").hidden && $("#favorites-modal").hidden) document.body.classList.remove("modal-open");
    lastFocusedElement?.focus();
  }
  function renderDetail(id) {
    const place = destinationById(id);
    if (!place) return;
    detailModal.dataset.destinationId = id;
    const content = $("#detail-content");
    content.replaceChildren();
    const hero = create("div", "detail-hero");
    hero.append(makeImage(place.image, place.alt, 1200), create("h2", "", place.name));
    const body = create("div", "detail-content-body");
    body.append(create("p", "detail-meta", `${place.country} · ${place.region} · ${place.category}`));
    body.append(create("p", "", place.description));
    const columns = create("div", "detail-columns");
    const activityBlock = create("div");
    activityBlock.append(create("h3", "", "Ideas for your visit"));
    const activityList = create("ul");
    place.activities.forEach(item => activityList.append(create("li", "", item)));
    activityBlock.append(activityList);
    const timingBlock = create("div");
    timingBlock.append(create("h3", "", "Make time for"));
    timingBlock.append(create("p", "", place.duration));
    timingBlock.append(create("p", "", `Category: ${place.category}`));
    columns.append(activityBlock, timingBlock);
    body.append(columns, create("p", "detail-tip", `Travel tip: ${place.tip}`));
    const related = data.destinations.filter(item => item.id !== id && (item.category === place.category || item.country === place.country)).slice(0, 3);
    const relatedBlock = create("div");
    relatedBlock.append(create("h3", "", "You might also love"));
    const relatedList = create("div", "related-list");
    related.forEach(item => {
      const button = create("button", "", item.name);
      button.type = "button";
      button.addEventListener("click", () => renderDetail(item.id));
      relatedList.append(button);
    });
    relatedBlock.append(relatedList);
    body.append(relatedBlock);
    const actions = create("div", "detail-actions");
    const favorite = create("button", "button button-outline button-small", favoriteIds.has(id) ? "Saved to favorites" : "Add to favorites");
    favorite.type = "button";
    favorite.prepend(document.createElement("i"));
    favorite.firstChild.className = `fa-${favoriteIds.has(id) ? "solid" : "regular"} fa-heart`;
    favorite.addEventListener("click", () => setFavorite(id, !favoriteIds.has(id)));
    const plan = create("button", "button button-primary button-small", "Add to Trip Planner");
    plan.type = "button";
    plan.prepend(document.createElement("i"));
    plan.firstChild.className = "fa-solid fa-plus";
    plan.addEventListener("click", () => {
      $("#trip-country").value = place.country;
      updateDestinationOptions();
      addTripDestination(id);
      closeModal(detailModal);
      $("#planner").scrollIntoView({ behavior: "smooth" });
    });
    actions.append(favorite, plan);
    body.append(actions);
    content.append(hero, body);
  }
  function openDetail(id) {
    renderDetail(id);
    openModal(detailModal);
  }
  $$(".modal-close").forEach(button => button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop"))));
  $$(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal(backdrop);
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!$("#lightbox").hidden) closeLightbox();
      else if (!detailModal.hidden) closeModal(detailModal);
      else if (!$("#favorites-modal").hidden) closeModal($("#favorites-modal"));
    }
    if (event.key === "Tab" && (!detailModal.hidden || !$("#favorites-modal").hidden)) {
      const modal = !detailModal.hidden ? detailModal : $("#favorites-modal");
      const focusable = $$('button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', modal).filter(el => el.offsetParent !== null);
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    }
  });

  const favoritesModal = $("#favorites-modal");
  function renderFavorites() {
    const list = $("#favorites-list");
    list.replaceChildren();
    const places = data.destinations.filter(place => favoriteIds.has(place.id));
    if (!places.length) {
      list.append(create("p", "favorites-empty", "No favorites yet. Tap the heart on a destination to save it here."));
      return;
    }
    places.forEach(place => {
      const row = create("div", "favorite-row");
      row.append(makeImage(place.image, place.alt, 200));
      const info = create("div");
      info.append(create("strong", "", place.name), create("span", "", `${place.region} · ${place.country}`));
      const details = create("button", "", "View");
      details.type = "button";
      details.addEventListener("click", () => { closeModal(favoritesModal); openDetail(place.id); });
      const remove = create("button", "", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => setFavorite(place.id, false));
      row.append(info, details, remove);
      list.append(row);
    });
  }
  $$("[data-open-favorites]").forEach(button => button.addEventListener("click", () => {
    closeMobileNav();
    renderFavorites();
    openModal(favoritesModal);
  }));

  const tripCountry = $("#trip-country");
  const tripDestination = $("#trip-destination");
  const selectedIds = [];
  function updateDestinationOptions() {
    const options = data.destinations.filter(place => place.country === tripCountry.value);
    tripDestination.replaceChildren();
    tripDestination.append(new Option("Choose a destination...", ""));
    options.forEach(place => tripDestination.append(new Option(`${place.name} — ${place.region}`, place.id)));
    selectedIds.splice(0, selectedIds.length, ...selectedIds.filter(id => destinationById(id)?.country === tripCountry.value));
    renderSelectedDestinations();
  }
  function renderSelectedDestinations() {
    const container = $("#selected-destinations");
    container.replaceChildren();
    selectedIds.forEach(id => {
      const place = destinationById(id);
      if (!place) return;
      const chip = create("span", "selected-chip", place.name);
      const remove = create("button", "", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${place.name} from this trip`);
      remove.addEventListener("click", () => {
        selectedIds.splice(selectedIds.indexOf(id), 1);
        renderSelectedDestinations();
      });
      chip.append(remove);
      container.append(chip);
    });
  }
  function addTripDestination(id = tripDestination.value) {
    const place = destinationById(id);
    if (!place || place.country !== tripCountry.value) {
      $("#planner-message").textContent = "Choose a destination in the selected country first.";
      $("#planner-message").className = "form-message error";
      return false;
    }
    if (selectedIds.includes(id)) {
      $("#planner-message").textContent = `${place.name} is already in this trip.`;
      $("#planner-message").className = "form-message error";
      return false;
    }
    selectedIds.push(id);
    renderSelectedDestinations();
    $("#planner-message").textContent = `${place.name} added to your trip.`;
    $("#planner-message").className = "form-message";
    return true;
  }
  tripCountry.addEventListener("change", () => {
    const previousCount = selectedIds.length;
    updateDestinationOptions();
    if (selectedIds.length < previousCount) {
      $("#planner-message").textContent = "Destinations from the other country were removed from this draft.";
      $("#planner-message").className = "form-message";
    }
  });
  $("#add-destination").addEventListener("click", () => addTripDestination());
  $("#planner-form").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("#trip-name").value.trim();
    const date = $("#trip-date").value;
    const dateParts = date.split("-").map(Number);
    const parsedDate = dateParts.length === 3 ? new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])) : null;
    const validDate = Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date) && parsedDate &&
      parsedDate.getUTCFullYear() === dateParts[0] && parsedDate.getUTCMonth() === dateParts[1] - 1 &&
      parsedDate.getUTCDate() === dateParts[2]);
    const message = $("#planner-message");
    if (!name) {
      message.textContent = "Give your trip a name before saving.";
      message.className = "form-message error";
      $("#trip-name").focus();
      return;
    }
    if (!selectedIds.length) {
      message.textContent = "Add at least one destination to your trip.";
      message.className = "form-message error";
      tripDestination.focus();
      return;
    }
    if (!validDate) {
      message.textContent = "Choose a valid start date for your trip.";
      message.className = "form-message error";
      $("#trip-date").focus();
      return;
    }
    const trip = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name, country: tripCountry.value, date, notes: $("#trip-notes").value.trim(), destinationIds: [...selectedIds]
    };
    const updatedTrips = [...trips, trip];
    if (!writeStorage("tropical-wonders-trips", updatedTrips)) return;
    trips = updatedTrips;
    selectedIds.splice(0);
    $("#planner-form").reset();
    tripCountry.value = "Thailand";
    updateDestinationOptions();
    message.textContent = "Your trip is saved on this device. No bookings have been made.";
    message.className = "form-message";
    renderTrips();
  });
  $("#clear-planner").addEventListener("click", () => {
    if (!trips.length && !selectedIds.length && !$("#trip-name").value.trim() && !$("#trip-notes").value.trim()) {
      notify("There is no trip plan to clear.");
      return;
    }
    if (!window.confirm("Clear all saved trips and the current draft from this device?")) return;
    if (!writeStorage("tropical-wonders-trips", [])) return;
    trips = [];
    selectedIds.splice(0);
    $("#planner-form").reset();
    tripCountry.value = "Thailand";
    updateDestinationOptions();
    $("#planner-message").textContent = "Saved trips and the current draft have been cleared.";
    $("#planner-message").className = "form-message";
    renderTrips();
  });
  function renderTrips() {
    const container = $("#saved-trips");
    container.replaceChildren();
    $("#saved-trip-count").textContent = `${trips.length} ${trips.length === 1 ? "trip" : "trips"}`;
    if (!trips.length) {
      container.append(create("p", "no-saved-trips", "Your saved itineraries will appear here. Plans are stored only in this browser."));
      return;
    }
    trips.forEach(trip => {
      const card = create("article", "saved-trip");
      card.append(create("h4", "", trip.name));
      const formattedDate = new Date(`${trip.date}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      card.append(create("p", "", `${trip.country} · Starts ${formattedDate}`));
      const names = trip.destinationIds.map(id => destinationById(id)?.name).filter(Boolean).join(" · ");
      card.append(create("div", "saved-trip-places", names));
      if (trip.notes) card.append(create("p", "", trip.notes));
      const remove = create("button", "", "Remove this trip");
      remove.type = "button";
      remove.addEventListener("click", () => {
        if (!window.confirm(`Remove "${trip.name}" from saved trips?`)) return;
        const updated = trips.filter(item => item.id !== trip.id);
        if (!writeStorage("tropical-wonders-trips", updated)) return;
        trips = updated;
        renderTrips();
      });
      card.append(remove);
      container.append(card);
    });
  }

  const galleryGrid = $("#gallery-grid");
  let visibleGallery = [];
  function renderGallery() {
    const country = $("#gallery-country").value;
    const category = $("#gallery-category").value;
    visibleGallery = data.gallery.filter(item => (country === "all" || item[2] === country) && (category === "all" || item[3] === category));
    galleryGrid.replaceChildren();
    visibleGallery.forEach((item, index) => {
      const button = create("button", "gallery-item");
      button.type = "button";
      button.setAttribute("aria-label", `Open photo: ${item[0]}, ${item[1]}`);
      button.append(makeImage(item[4], item[5], 700));
      const overlay = create("span", "gallery-overlay");
      overlay.append(create("strong", "", item[0]), create("span", "", item[1]));
      button.append(overlay);
      button.addEventListener("click", () => openLightbox(index));
      galleryGrid.append(button);
    });
  }
  $("#gallery-country").addEventListener("change", renderGallery);
  $("#gallery-category").addEventListener("change", renderGallery);
  const lightbox = $("#lightbox");
  let galleryIndex = 0;
  function updateLightbox() {
    const item = visibleGallery[galleryIndex];
    if (!item) return;
    $("#lightbox-image").src = imageUrl(item[4], 1600);
    $("#lightbox-image").alt = item[5];
    $("#lightbox-caption").textContent = `${item[0]} · ${item[1]}`;
    $("#lightbox-count").textContent = `${galleryIndex + 1} / ${visibleGallery.length}`;
  }
  function openLightbox(index) {
    galleryIndex = index;
    lightbox.hidden = false;
    document.body.classList.add("modal-open");
    updateLightbox();
    $(".lightbox-close").focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    if (detailModal.hidden && favoritesModal.hidden) document.body.classList.remove("modal-open");
  }
  function moveLightbox(amount) {
    if (!visibleGallery.length) return;
    galleryIndex = (galleryIndex + amount + visibleGallery.length) % visibleGallery.length;
    updateLightbox();
  }
  $(".lightbox-close").addEventListener("click", closeLightbox);
  $(".lightbox-prev").addEventListener("click", () => moveLightbox(-1));
  $(".lightbox-next").addEventListener("click", () => moveLightbox(1));
  lightbox.addEventListener("click", event => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", event => {
    if (lightbox.hidden) return;
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });
  $("#lightbox-image").addEventListener("error", event => {
    event.currentTarget.removeAttribute("src");
    event.currentTarget.alt = `${event.currentTarget.alt} (image unavailable)`;
  });

  const contactForm = $("#contact-form");
  const contactFields = [
    { id: "contact-name", error: "error-name", message: "Please enter your name." },
    { id: "contact-email", error: "error-email", message: "Please enter a valid email address." },
    { id: "contact-subject", error: "error-subject", message: "Please enter a subject." },
    { id: "contact-message", error: "error-message", message: "Please write a message." }
  ];
  contactForm.addEventListener("submit", event => {
    event.preventDefault();
    let firstInvalid = null;
    contactFields.forEach(field => {
      const input = $(`#${field.id}`);
      const empty = !input.value.trim();
      const invalidEmail = field.id === "contact-email" && (!input.validity.valid || !input.value.trim());
      const invalid = empty || invalidEmail;
      $(`#${field.error}`).textContent = invalid ? field.message : "";
      input.setAttribute("aria-invalid", String(invalid));
      if (invalid && !firstInvalid) firstInvalid = input;
    });
    const status = $("#contact-status");
    if (firstInvalid) {
      status.textContent = "Please correct the highlighted fields.";
      status.className = "contact-status error";
      firstInvalid.focus();
      return;
    }
    status.textContent = "Thanks for your note! This demo does not send messages to a server.";
    status.className = "contact-status";
    contactForm.reset();
    contactFields.forEach(field => $(`#${field.id}`).setAttribute("aria-invalid", "false"));
  });
  contactFields.forEach(field => $(`#${field.id}`).addEventListener("input", event => {
    if (!event.currentTarget.value.trim() || (field.id === "contact-email" && !event.currentTarget.validity.valid)) return;
    $(`#${field.error}`).textContent = "";
    event.currentTarget.setAttribute("aria-invalid", "false");
  }));

  const menuToggle = $(".menu-toggle");
  const navLinks = $(".nav-links");
  function closeMobileNav() {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    menuToggle.innerHTML = `<i class="fa-solid fa-${isOpen ? "xmark" : "bars"}"></i>`;
  });
  $$("a", navLinks).forEach(link => link.addEventListener("click", closeMobileNav));
  window.addEventListener("scroll", () => $(".site-header").classList.toggle("scrolled", window.scrollY > 8), { passive: true });
  $("#year").textContent = String(new Date().getFullYear());
  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .12 })
    : null;
  function observeReveals() {
    $$(".reveal:not(.is-visible)").forEach(element => revealObserver ? revealObserver.observe(element) : element.classList.add("is-visible"));
  }
  updateFavoriteCount();
  renderDestinations();
  updateDestinationOptions();
  renderTrips();
  renderGallery();
  observeReveals();
})();
