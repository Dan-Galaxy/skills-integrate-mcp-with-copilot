document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const filterActivitySelect = document.getElementById("filter-activity");
  const filterDaySelect = document.getElementById("filter-day");
  const filterOpenOnlyCheckbox = document.getElementById("filter-open-only");
  const clearFiltersButton = document.getElementById("clear-filters");
  const filterResults = document.getElementById("filter-results");
  const activeFiltersContainer = document.getElementById("active-filters");

  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const availableActivitiesFilterValue = "__available__";

  let activitiesData = {};

  const filters = {
    activity: "all",
    day: "all",
    openOnly: false,
  };

  function normalizeDay(day) {
    const value = day.trim();
    return value.endsWith("s") ? value.slice(0, -1) : value;
  }

  function getScheduleDays(schedule) {
    const matches = schedule.match(
      /Mondays?|Tuesdays?|Wednesdays?|Thursdays?|Fridays?|Saturdays?|Sundays?/g
    );

    if (!matches) {
      return [];
    }

    return matches.map(normalizeDay);
  }

  function populateActivitySelect(activities) {
    activitySelect.innerHTML =
      '<option value="">-- Select an activity --</option>';

    Object.keys(activities).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  function populateActivityFilter(activities) {
    const previousSelection = filterActivitySelect.value || "all";

    filterActivitySelect.innerHTML =
      '<option value="all">All activities</option>';
    filterActivitySelect.innerHTML +=
      `<option value="${availableActivitiesFilterValue}">Available activities</option>`;

    Object.entries(activities)
      .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
      .forEach(([name, details]) => {
      const spotsLeft = details.max_participants - details.participants.length;
      const option = document.createElement("option");
      option.value = name;
      option.textContent = `${name} (${spotsLeft} spots left)`;
      filterActivitySelect.appendChild(option);
    });

    const selectionStillExists =
      previousSelection === "all" || activities[previousSelection];
    filterActivitySelect.value = selectionStillExists
      ? previousSelection
      : "all";
    filters.activity = filterActivitySelect.value;
    updateFilterControlState();
  }

  function updateFilterControlState() {
    const isActivitySelected = filterActivitySelect.value !== "all";
    filterActivitySelect.classList.toggle(
      "filter-select-active",
      isActivitySelected
    );
  }

  function populateDayFilter(activities) {
    const daySet = new Set();

    Object.values(activities).forEach((details) => {
      getScheduleDays(details.schedule).forEach((day) => daySet.add(day));
    });

    const orderedDays = dayOrder.filter((day) => daySet.has(day));

    filterDaySelect.innerHTML = '<option value="all">All days</option>';
    orderedDays.forEach((day) => {
      const option = document.createElement("option");
      option.value = day;
      option.textContent = day;
      filterDaySelect.appendChild(option);
    });
  }

  function getFilteredEntries() {
    return Object.entries(activitiesData).filter(([name, details]) => {
      const spotsLeft = details.max_participants - details.participants.length;
      const matchesActivity =
        filters.activity === "all" ||
        (filters.activity === availableActivitiesFilterValue && spotsLeft > 0) ||
        name === filters.activity;

      const scheduleDays = getScheduleDays(details.schedule);
      const matchesDay =
        filters.day === "all" || scheduleDays.includes(filters.day);

      const matchesAvailability = !filters.openOnly || spotsLeft > 0;

      return matchesActivity && matchesDay && matchesAvailability;
    });
  }

  function getActiveFilterLabels() {
    const labels = [];

    if (filters.activity === availableActivitiesFilterValue) {
      labels.push("Activity: Available activities");
    } else if (filters.activity !== "all") {
      labels.push(`Activity: ${filters.activity}`);
    }

    if (filters.day !== "all") {
      labels.push(`Day: ${filters.day}`);
    }

    if (filters.openOnly) {
      labels.push("Open spots only");
    }

    return labels;
  }

  function updateFilterFeedback(filteredCount, totalCount) {
    const activeLabels = getActiveFilterLabels();

    filterResults.textContent = `Showing ${filteredCount} of ${totalCount} activities`;
    activeFiltersContainer.innerHTML = "";

    if (activeLabels.length === 0) {
      const chip = document.createElement("span");
      chip.className = "active-filter-chip";
      chip.textContent = "No active filters";
      activeFiltersContainer.appendChild(chip);
      clearFiltersButton.disabled = true;
      return;
    }

    activeLabels.forEach((label) => {
      const chip = document.createElement("span");
      chip.className = "active-filter-chip";
      chip.textContent = label;
      activeFiltersContainer.appendChild(chip);
    });

    clearFiltersButton.disabled = false;
  }

  function renderActivities() {
    const filteredEntries = getFilteredEntries();
    const totalCount = Object.keys(activitiesData).length;
    activitiesList.innerHTML = "";
    updateFilterFeedback(filteredEntries.length, totalCount);

    if (filteredEntries.length === 0) {
      activitiesList.innerHTML =
        '<p class="no-results">No activities match your current filters.</p>';
      return;
    }

    filteredEntries.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

      activitiesList.appendChild(activityCard);
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  function applyFilters() {
    renderActivities();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      activitiesData = await response.json();

      populateActivitySelect(activitiesData);
      populateActivityFilter(activitiesData);
      populateDayFilter(activitiesData);
      applyFilters();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  filterActivitySelect.addEventListener("change", (event) => {
    filters.activity = event.target.value;
    updateFilterControlState();
    applyFilters();
  });

  filterDaySelect.addEventListener("change", (event) => {
    filters.day = event.target.value;
    applyFilters();
  });

  filterOpenOnlyCheckbox.addEventListener("change", (event) => {
    filters.openOnly = event.target.checked;
    applyFilters();
  });

  clearFiltersButton.addEventListener("click", () => {
    filters.activity = "all";
    filters.day = "all";
    filters.openOnly = false;

    filterActivitySelect.value = "all";
    filterDaySelect.value = "all";
    filterOpenOnlyCheckbox.checked = false;

    updateFilterControlState();
    applyFilters();
  });

  // Initialize app
  fetchActivities();
});
