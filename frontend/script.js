const itemsList = document.getElementById("itemsList");

function displayItems(items) {
    itemsList.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
        itemsList.innerHTML = "<p>No items found.</p>";
        return;
    }

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "item-card";

        const typeClass = String(item.type || "").toLowerCase();
        const statusClass = String(item.status || "").toLowerCase();

        card.innerHTML = `
            <div class="card-top">
                <span class="type-badge ${typeClass}">
                    ${item.type || "Unknown"}
                </span>

                <span class="status-badge ${statusClass}">
                    ${item.status || "Unknown"}
                </span>
            </div>

            <h3>${item.itemName || "Unnamed Item"}</h3>

            <p>${item.description || "No description available."}</p>

            <p><strong>Category:</strong> ${item.category || "Not specified"}</p>

            <p><strong>Location:</strong> ${item.location || "Not specified"}</p>

            <p class="item-id">
                <strong>Item ID:</strong> ${item._id}
            </p>

            <button
                type="button"
                class="claim-item-button"
                data-item-id="${item._id}">
                Claim This Item
            </button>
        `;

        itemsList.appendChild(card);
    });
}

function updateDashboardStats(items) {
    if (!Array.isArray(items)) return;

    const totalItems = document.getElementById("totalItems");
    const lostItems = document.getElementById("lostItems");
    const foundItems = document.getElementById("foundItems");
    const resolvedItems = document.getElementById("resolvedItems");

    if (totalItems) {
        totalItems.textContent = items.length;
    }

    if (lostItems) {
        lostItems.textContent = items.filter(
            item => String(item.type).toLowerCase() === "lost"
        ).length;
    }

    if (foundItems) {
        foundItems.textContent = items.filter(
            item => String(item.type).toLowerCase() === "found"
        ).length;
    }

    if (resolvedItems) {
        resolvedItems.textContent = items.filter(
            item => String(item.status).toLowerCase() === "resolved"
        ).length;
    }
}


// ========================================
// LOAD ALL ITEMS
// ========================================

async function loadItems() {
    try {
        const response = await fetch("http://localhost:5000/api/items");
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to load items.");
        }

        const items = result.data || result;

        updateDashboardStats(items);
        displayItems(items);

    } catch (error) {
        itemsList.innerHTML =
            "<p>Unable to load items. Please check the backend.</p>";

        console.error(error);
    }
}

loadItems();


// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            }
        );

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem("token", result.token);

            loginMessage.textContent = "Login successful!";
            loginMessage.style.color = "green";

            logoutButton.style.display = "inline-block";
        } else {
            loginMessage.textContent =
                result.message || "Login failed";

            loginMessage.style.color = "red";
        }

    } catch (error) {
        loginMessage.textContent =
            "Cannot connect to the server.";

        loginMessage.style.color = "red";
        console.error(error);
    }
});


// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener("click", function() {
    localStorage.removeItem("token");

    logoutButton.style.display = "none";

    loginMessage.textContent =
        "You have logged out successfully.";

    loginMessage.style.color = "green";
});

if (localStorage.getItem("token")) {
    logoutButton.style.display = "inline-block";
} else {
    logoutButton.style.display = "none";
}


// ========================================
// REGISTER
// ========================================

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(registerForm);

    const userData = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password")
    };

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            }
        );

        const result = await response.json();

        if (response.ok) {
            registerMessage.textContent =
                "Registration successful! Please login.";

            registerMessage.style.color = "green";
            registerForm.reset();

        } else {
            registerMessage.textContent =
                result.message || "Registration failed.";

            registerMessage.style.color = "red";
        }

    } catch (error) {
        registerMessage.textContent =
            "Cannot connect to the server.";

        registerMessage.style.color = "red";
        console.error(error);
    }
});


// ========================================
// SEARCH ITEMS
// ========================================

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const showAllButton = document.getElementById("showAllButton");

async function searchItems() {
    const searchValue = searchInput.value.trim();

    if (!searchValue) {
        loadItems();
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/items/search?name=${encodeURIComponent(searchValue)}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Search failed.");
        }

        const items = result.data || result;

        displayItems(items);

    } catch (error) {
        itemsList.innerHTML =
            "<p>Search failed. Check the backend.</p>";

        console.error(error);
    }
}

searchButton.addEventListener("click", searchItems);

showAllButton.addEventListener("click", function() {
    searchInput.value = "";
    loadItems();
});


// ========================================
// FILTER BY TYPE
// ========================================

const typeFilter = document.getElementById("typeFilter");
const filterButton = document.getElementById("filterButton");

async function filterItems() {
    const selectedType = typeFilter.value;

    if (!selectedType) {
        loadItems();
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/items/filter?type=${encodeURIComponent(selectedType)}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Filter failed.");
        }

        const items = result.data || result;

        displayItems(items);

    } catch (error) {
        itemsList.innerHTML =
            "<p>Filter failed. Check the backend.</p>";

        console.error(error);
    }
}

filterButton.addEventListener("click", filterItems);


// ========================================
// FILTER BY CATEGORY AND TYPE
// ========================================

const categoryFilter = document.getElementById("categoryFilter");
const categoryFilterButton = document.getElementById("categoryFilterButton");

async function filterByCategory() {
    const selectedCategory = categoryFilter.value;
    const selectedType = typeFilter.value;

    const params = new URLSearchParams();

    if (selectedCategory) {
        params.append("category", selectedCategory);
    }

    if (selectedType) {
        params.append("type", selectedType);
    }

    if (!selectedCategory && !selectedType) {
        loadItems();
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/items/filter?${params.toString()}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Category filter failed.");
        }

        const items = result.data || result;

        displayItems(items);

    } catch (error) {
        itemsList.innerHTML =
            "<p>Category filter failed.</p>";

        console.error(error);
    }
}

categoryFilterButton.addEventListener("click", filterByCategory);


// ========================================
// REPORT LOST OR FOUND ITEM
// ========================================

const reportForm = document.getElementById("reportForm");
const reportMessage = document.getElementById("reportMessage");

reportForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        reportMessage.textContent = "Please login first.";
        reportMessage.style.color = "red";
        return;
    }

    const formData = new FormData(reportForm);

    const itemData = {
        itemName: formData.get("itemName"),
        description: formData.get("description"),
        category: formData.get("category"),
        type: formData.get("type"),
        location: formData.get("location"),
        date: formData.get("date")
    };

    try {
        const response = await fetch(
            "http://localhost:5000/api/items",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(itemData)
            }
        );

        const result = await response.json();

        if (response.ok) {
            reportMessage.textContent =
                "Item reported successfully!";

            reportMessage.style.color = "green";

            reportForm.reset();

            loadItems();

        } else {
            reportMessage.textContent =
                result.message || "Unable to report item.";

            reportMessage.style.color = "red";
        }

    } catch (error) {
        reportMessage.textContent =
            "Server connection failed.";

        reportMessage.style.color = "red";
        console.error(error);
    }
});


// ========================================
// SUBMIT CLAIM
// ========================================

const claimForm = document.getElementById("claimForm");

itemsList.addEventListener("click", function(event) {
    const button = event.target.closest(".claim-item-button");

    if (!button) return;

    const itemId = button.dataset.itemId;

    claimForm.elements.itemId.value = itemId;

    document.getElementById("claim").scrollIntoView({
        behavior: "smooth"
    });
});

const claimMessage = document.getElementById("claimMessage");

claimForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        claimMessage.textContent = "Please login first.";
        claimMessage.style.color = "red";
        return;
    }

    const formData = new FormData(claimForm);

    const itemId = formData.get("itemId");
    const message = formData.get("message");

    try {
        const response = await fetch(
            `http://localhost:5000/api/claims/${itemId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ message })
            }
        );

        const result = await response.json();

        if (response.ok) {
            claimMessage.textContent =
                "Claim submitted successfully!";

            claimMessage.style.color = "green";
            claimForm.reset();

        } else {
            claimMessage.textContent =
                result.message || "Claim submission failed.";

            claimMessage.style.color = "red";
        }

    } catch (error) {
        claimMessage.textContent =
            "Cannot connect to the server.";

        console.error(error);
    }
});


// ========================================
// VIEW MY CLAIMS
// ========================================

const myClaimsButton = document.getElementById("myClaimsButton");
const myClaimsList = document.getElementById("myClaimsList");

async function loadMyClaims() {
    const token = localStorage.getItem("token");

    if (!token) {
        myClaimsList.innerHTML =
            "<p>Please login first.</p>";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/claims/my-claims",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (response.ok) {
    claimMessage.textContent =
        "Your claim has been submitted successfully!";

    claimMessage.style.color = "green";

    claimForm.reset();

    await loadMyClaims();
}

        const claims = result.data || [];

        myClaimsList.innerHTML = "";

        if (claims.length === 0) {
            myClaimsList.innerHTML =
                "<p>You have not submitted any claims yet.</p>";
            return;
        }

        claims.forEach(claim => {
            const card = document.createElement("div");
            card.className = "item-card";

            card.innerHTML = `
                <h3>${claim.item ? claim.item.itemName : "Item unavailable"}</h3>
                <p>Claim Message: ${claim.message}</p>
                <p>Claim Status: ${claim.status}</p>
            `;

            myClaimsList.appendChild(card);
        });

    } catch (error) {
        myClaimsList.innerHTML =
            "<p>Server connection failed.</p>";

        console.error(error);
    }
}

myClaimsButton.addEventListener("click", loadMyClaims);
// ADMIN CLAIM MANAGEMENT


// ADMIN CLAIM MANAGEMENT

const adminClaimsButton = document.getElementById("adminClaimsButton");
const adminClaimsList = document.getElementById("adminClaimsList");

async function loadAllClaims() {
    const token = localStorage.getItem("token");

    if (!token) {
        adminClaimsList.innerHTML = "<p>Please login as admin first.</p>";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/claims/all",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            adminClaimsList.innerHTML =
                `<p>${result.message || "Unable to load claims."}</p>`;
            return;
        }

        const claims = result.data || [];
        adminClaimsList.innerHTML = "";

        if (claims.length === 0) {
            adminClaimsList.innerHTML = "<p>No claims found.</p>";
            return;
        }

        claims.forEach(claim => {
            const card = document.createElement("div");
            card.className = "item-card";

            const itemName = claim.item
                ? claim.item.itemName
                : "Item unavailable";

            const studentName = claim.claimant
                ? claim.claimant.name
                : "Unknown student";

            card.innerHTML = `
                <h3>${itemName}</h3>
                <p><strong>Student:</strong> ${studentName}</p>
                <p><strong>Message:</strong> ${claim.message}</p>
                <p><strong>Status:</strong> ${claim.status}</p>
                <p><strong>Claim ID:</strong> ${claim._id}</p>

                ${
                    !["Approved", "Rejected"].includes(claim.status)
                    ? `
                        <button class="approve-btn"
                            data-id="${claim._id}"
                            data-status="Approved">
                            Approve
                        </button>

                        <button class="reject-btn"
                            data-id="${claim._id}"
                            data-status="Rejected">
                            Reject
                        </button>
                    `
                    : ""
                }
            `;

            adminClaimsList.appendChild(card);
        });

    } catch (error) {
        adminClaimsList.innerHTML = "<p>Server connection failed.</p>";
        console.error(error);
    }
}

// Approve or Reject a claim
adminClaimsList.addEventListener("click", async function(event) {
    const button = event.target.closest(".approve-btn, .reject-btn");

    if (!button) return;

    const claimId = button.dataset.id;
    const status = button.dataset.status;
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(
            `http://localhost:5000/api/claims/${claimId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ status })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Unable to update claim.");
            return;
        }

        alert(result.message);
        await loadAllClaims();

    } catch (error) {
        alert("Server connection failed.");
        console.error(error);
    }
});

adminClaimsButton.addEventListener("click", loadAllClaims);
// MY REPORTED ITEMS

const myReportedItemsButton =
    document.getElementById("myReportedItemsButton");

const myReportedItemsList =
    document.getElementById("myReportedItemsList");

async function loadMyReportedItems() {
    const token = localStorage.getItem("token");

    if (!token) {
        myReportedItemsList.textContent = "Please login first.";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/items/my-items",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            myReportedItemsList.textContent =
                result.message || "Unable to load your items.";
            return;
        }

        const items = result.data || [];

        myReportedItemsList.innerHTML = "";

        if (items.length === 0) {
            myReportedItemsList.textContent =
                "You have not reported any items yet.";
            return;
        }

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "item-card";

            const heading = document.createElement("h3");
            heading.textContent = item.itemName;

            const details = document.createElement("p");
            details.textContent =
                "Type: " + item.type +
                " | Category: " + item.category;

            const location = document.createElement("p");
            location.textContent = "Location: " + item.location;

            const status = document.createElement("p");
            status.textContent = "Status: " + item.status;

            card.append(heading, details, location, status);
            myReportedItemsList.appendChild(card);
        });

    } catch (error) {
        myReportedItemsList.textContent =
            "Server connection failed.";

        console.error(error);
    }
}

myReportedItemsButton.addEventListener(
    "click",
    loadMyReportedItems
);
// ADMIN ITEM MANAGEMENT

const adminItemsButton =
    document.getElementById("adminItemsButton");

const adminItemsList =
    document.getElementById("adminItemsList");

async function loadAllItems() {
    const token = localStorage.getItem("token");

    if (!token) {
        adminItemsList.textContent = "Please login as admin first.";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/items",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            adminItemsList.textContent =
                result.message || "Unable to load items.";
            return;
        }

        const items = Array.isArray(result)
            ? result
            : result.data || [];

        adminItemsList.innerHTML = "";

        if (items.length === 0) {
            adminItemsList.textContent = "No items found.";
            return;
        }

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "item-card";

            const heading = document.createElement("h3");
            heading.textContent = item.itemName;

            const details = document.createElement("p");
            details.textContent =
                "Type: " + item.type +
                " | Category: " + item.category;

            const location = document.createElement("p");
            location.textContent = "Location: " + item.location;

            const status = document.createElement("p");
            status.textContent = "Status: " + item.status;

            const itemId = document.createElement("p");
            itemId.textContent = "Item ID: " + item._id;

           // Create Delete button
const deleteButton = document.createElement("button");

deleteButton.textContent = "Delete Item";
deleteButton.className = "delete-item-btn";
deleteButton.dataset.id = item._id;

// Add all elements to the card
card.append(
    heading,
    details,
    location,
    status,
    itemId,
    deleteButton
);

adminItemsList.appendChild(card);
        });

    } catch (error) {
        adminItemsList.textContent = "Server connection failed.";
        console.error(error);
    }
}

adminItemsButton.addEventListener("click", loadAllItems);
// DELETE ITEM (ADMIN ONLY)

adminItemsList.addEventListener("click", async function(event) {

    const button = event.target.closest(".delete-item-btn");

    if (!button) return;

    const confirmDelete = confirm(
        "Are you sure you want to delete this item?"
    );

    if (!confirmDelete) return;

    const itemId = button.dataset.id;
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(
            `http://localhost:5000/api/items/${itemId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            alert(result.message || "Unable to delete item.");
            return;
        }

        alert("Item deleted successfully!");

        await loadAllItems();
        await loadItems();

    } catch (error) {
        alert("Server connection failed.");
        console.error(error);
    }
});