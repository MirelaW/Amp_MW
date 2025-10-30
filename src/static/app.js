document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Avoid cached responses so we always get the latest state from the server
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status} ${response.statusText}`);
      }
      const activities = await response.json();

  // Clear loading message and previous content/options
  if (activitiesList) activitiesList.innerHTML = "";
  if (activitySelect) activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Header and main details
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> \${details.schedule}`;

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> \${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);

        // Participants section (no bullets) with delete buttons
        if (details.participants && details.participants.length) {
          const pHeader = document.createElement("h5");
          pHeader.textContent = "Participants";

          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delete-btn";
            btn.title = `Unregister \${p}`;
            btn.dataset.activity = name;
            btn.dataset.email = p;
            btn.innerHTML = "&times;"; // ×

            // Click handler to unregister participant
            btn.addEventListener("click", async (evt) => {
              evt.preventDefault();
              const activityName = btn.dataset.activity;
              const email = btn.dataset.email;
              try {
                const res = await fetch(
                  `/activities/\${encodeURIComponent(activityName)}/signup?email=\${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const body = await res.json();
                if (res.ok) {
                  // Refresh activities list and wait for it to complete so the UI reflects the change
                  await fetchActivities();
                  if (messageDiv) {
                    messageDiv.textContent = body.message;
                    messageDiv.className = "message success";
                    messageDiv.classList.remove("hidden");
                  }
                } else {
                  if (messageDiv) {
                    messageDiv.textContent = body.detail || body.message || "Failed to remove participant";
                    messageDiv.className = "message error";
                    messageDiv.classList.remove("hidden");
                  }
                }
                setTimeout(() => {
                  if (messageDiv) messageDiv.classList.add("hidden");
                }, 4000);
              } catch (err) {
                console.error("Error unregistering participant:", err);
                if (messageDiv) {
                  messageDiv.textContent = "Failed to remove participant. Please try again.";
                  messageDiv.className = "message error";
                  messageDiv.classList.remove("hidden");
                }
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });

          activityCard.appendChild(pHeader);
          activityCard.appendChild(ul);
        } else {
          const noP = document.createElement("p");
          noP.className = "no-participants";
          noP.textContent = "No participants yet";
          activityCard.appendChild(noP);
        }

  if (activitiesList) activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
  if (activitySelect) activitySelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
      if (activitiesList) activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      // ensure the select still has the default option so the form remains usable
      if (activitySelect) {
        activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      }
    }
  }

  // Handle form submission
  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("email").value;
      const activity = document.getElementById("activity").value;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
          {
            method: "POST",
          }
        );

        const result = await response.json();

        if (response.ok) {
          if (messageDiv) {
            messageDiv.textContent = result.message;
            messageDiv.className = "message success";
            messageDiv.classList.remove("hidden");
          }
          signupForm.reset();
          // Refresh activities to show updated participants and wait for it to finish
          await fetchActivities();
        } else {
          if (messageDiv) {
            messageDiv.textContent = result.detail || "An error occurred";
            messageDiv.className = "message error";
            messageDiv.classList.remove("hidden");
          }
        }

        // Hide message after 5 seconds
        setTimeout(() => {
          if (messageDiv) messageDiv.classList.add("hidden");
        }, 5000);
      } catch (error) {
        console.error("Error signing up:", error);
        if (messageDiv) {
          messageDiv.textContent = "Failed to sign up. Please try again.";
          messageDiv.className = "message error";
          messageDiv.classList.remove("hidden");
        }
      }
    });
  }

  // Initialize app
  fetchActivities();
});
