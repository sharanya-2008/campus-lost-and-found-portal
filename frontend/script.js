// ========================================
// CAMPUS LOST AND FOUND PORTAL
// ========================================

// Your deployed Render backend URL
const API_BASE_URL =
    "https://campus-lost-and-found-portal-1-ineb.onrender.com";

const itemsList = document.getElementById("itemsList");

// ========================================
// COMMON HELPER FUNCTIONS
// ========================================

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

function getData(result) {
    return result.data ?? result;
}

function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    return {
        "Authorization": "Bearer " + getToken()
    };
}

function setMessage(element, message, color = "red") {
    if (!element) return;

    element.textContent = message;
    element.style.color = color;
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

// ========================================
// DISPLAY ITEMS
// ========================================

function displayItems(items) {
    if (!itemsList) return;

    itemsList.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
        itemsList.textContent = "No items found.";
        return;
    }

    items.forEach(item => {
        const card = createElement("div", "item-card");

        const top = createElement("div", "card-top");

        const typeClass = String(item.type || "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "");

        const statusClass = String(item.status || "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "");

        const typeBadge = createElement(
            "span",
            `type-badge ${typeClass}`,
            item.type || "Unknown"
        );

        const statusBadge = createElement(
            "span",
            `status-badge ${statusClass}`,
            item.status || "Unknown"
        );

        top.append(typeBadge, statusBadge);

        const heading = createElement(
            "h3",
            "",
            item.itemName || "Unnamed Item"
        );

        const description = createElement(
            "p",
            "",
            item.description || "No description available."
        );

        const category = createElement(
            "p",
            "",
            `Category: ${item.category || "Not specified"}`
        );

        const location = createElement(
            "p",
            "",
            `Location: ${item.location || "Not specified"}`
        );

        const itemId = createElement(
            "p",
            "item-id",
            `Item ID: ${item._id || "Unavailable"}`
        );

        const claimButton = createElement(
            "button",
            "claim-item-button",
            "Claim This Item"
        );

        claimButton.type = "button";
        claimButton.dataset.itemId = item._id || "";

        card.append(
            top,
            heading,
            description,
            category,
            location,
            itemId,
            claimButton
        );

        itemsList.appendChild(card);
    });
}

// ========================================
// DASHBOARD STATISTICS
// ========================================

function updateDashboardStats(items) {
    if (!Array.isArray(items)) return;

    const totalItems = document.getElementById("totalItems");
    const lostItems = document.getElementById("lostItems");
    const foundItems = document.getElementById("foundItems");
    const resolvedItems = document.getElementById("resolvedItems");

    if (totalItems) totalItems.textContent = items.length;

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
    if (!itemsList) return;

    try {
        const result = await apiRequest("/api/items");
        const items = getData(result);

        updateDashboardStats(items);
        displayItems(items);

    } catch (error) {
        itemsList.textContent =
            "Unable to load items. Please check the backend.";

        console.error("Load items error:", error);
    }
}

// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = loginForm.elements.email.value.trim();
        const password = loginForm.elements.password.value;

        try {
            const result = await apiRequest("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (!result.token) {
                throw new Error("Login response did not contain a token.");
            }

            localStorage.setItem("token", result.token);

            setMessage(loginMessage, "Login successful!", "green");

            if (logoutButton) {
                logoutButton.style.display = "inline-block";
            }

        } catch (error) {
            setMessage(loginMessage, error.message);
            console.error("Login error:", error);
        }
    });
}

// ========================================
// LOGOUT
// ========================================

if (logoutButton) {
    logoutButton.addEventListener("click", function() {
        localStorage.removeItem("token");

        logoutButton.style.display = "none";

        setMessage(
            loginMessage,
            "You have logged out successfully.",
            "green"
        );
    });

    logoutButton.style.display = getToken()
        ? "inline-block"
        : "none";
}

// ========================================
// REGISTER
// ========================================

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const formData = new FormData(registerForm);

        const userData = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password")
        };

        try {
            await apiRequest("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            setMessage(
                registerMessage,
                "Registration successful! Please login.",
                "green"
            );

            registerForm.reset();

        } catch (error) {
            setMessage(registerMessage, error.message);
            console.error("Registration error:", error);
        }
    });
}

// ========================================
// SEARCH ITEMS
// ========================================

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const showAllButton = document.getElementById("showAllButton");

async function searchItems() {
    if (!searchInput) return;

    const searchValue = searchInput.value.trim();

    if (!searchValue) {
        await loadItems();
        return;
    }

    try {
        const result = await apiRequest(
            `/api/items/search?name=${encodeURIComponent(searchValue)}`
        );

        displayItems(getData(result));

    } catch (error) {
        if (itemsList) {
            itemsList.textContent = "Search failed.";
        }

        console.error("Search error:", error);
    }
}

if (searchButton) {
    searchButton.addEventListener("click", searchItems);
}

if (showAllButton) {
    showAllButton.addEventListener("click", function() {
        if (searchInput) searchInput.value = "";
        loadItems();
    });
}

// ========================================
// FILTER BY TYPE
// ========================================

const typeFilter = document.getElementById("typeFilter");
const filterButton = document.getElementById("filterButton");

async function filterItems() {
    const selectedType = typeFilter ? typeFilter.value : "";

    if (!selectedType) {
        await loadItems();
        return;
    }

    try {
        const result = await apiRequest(
            `/api/items/filter?type=${encodeURIComponent(selectedType)}`
        );

        displayItems(getData(result));

    } catch (error) {
        if (itemsList) {
            itemsList.textContent = "Filter failed.";
        }

        console.error("Filter error:", error);
    }
}

if (filterButton) {
    filterButton.addEventListener("click", filterItems);
}

// ========================================
// FILTER BY CATEGORY AND TYPE
// ========================================

const categoryFilter = document.getElementById("categoryFilter");
const categoryFilterButton =
    document.getElementById("categoryFilterButton");

async function filterByCategory() {
    const selectedCategory = categoryFilter
        ? categoryFilter.value
        : "";

    const selectedType = typeFilter ? typeFilter.value : "";

    const params = new URLSearchParams();

    if (selectedCategory) {
        params.append("category", selectedCategory);
    }

    if (selectedType) {
        params.append("type", selectedType);
    }

    if (!selectedCategory && !selectedType) {
        await loadItems();
        return;
    }

    try {
        const result = await apiRequest(
            `/api/items/filter?${params.toString()}`
        );

        displayItems(getData(result));

    } catch (error) {
        if (itemsList) {
            itemsList.textContent = "Category filter failed.";
        }

        console.error("Category filter error:", error);
    }
}

if (categoryFilterButton) {
    categoryFilterButton.addEventListener(
        "click",
        filterByCategory
    );
}

// ========================================
// REPORT LOST OR FOUND ITEM
// ========================================

const reportForm = document.getElementById("reportForm");
const reportMessage = document.getElementById("reportMessage");

if (reportForm) {
    reportForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            setMessage(reportMessage, "Please login first.");
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
            await apiRequest("/api/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify(itemData)
            });

            setMessage(
                reportMessage,
                "Item reported successfully!",
                "green"
            );

            reportForm.reset();

            await loadItems();

        } catch (error) {
            setMessage(reportMessage, error.message);
            console.error("Report item error:", error);
        }
    });
}

// ========================================
// SELECT ITEM TO CLAIM
// ========================================

const claimForm = document.getElementById("claimForm");
const claimMessage = document.getElementById("claimMessage");

if (itemsList && claimForm) {
    itemsList.addEventListener("click", function(event) {
        const button = event.target.closest(".claim-item-button");

        if (!button) return;

        const itemId = button.dataset.itemId;

        const itemIdInput = claimForm.elements.itemId;

        if (itemIdInput) {
            itemIdInput.value = itemId;
        }

        const claimSection = document.getElementById("claim");

        if (claimSection) {
            claimSection.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
}

// ========================================
// SUBMIT CLAIM
// ========================================

if (claimForm) {
    claimForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            setMessage(claimMessage, "Please login first.");
            return;
        }

        const formData = new FormData(claimForm);

        const itemId = formData.get("itemId");
        const message = formData.get("message");

        if (!itemId) {
            setMessage(claimMessage, "Please select an item first.");
            return;
        }

        try {
            await apiRequest(
                `/api/claims/${encodeURIComponent(itemId)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({ message })
                }
            );

            setMessage(
                claimMessage,
                "Claim submitted successfully!",
                "green"
            );

            claimForm.reset();

            await loadMyClaims();

        } catch (error) {
            setMessage(claimMessage, error.message);
            console.error("Claim submission error:", error);
        }
    });
}

// ========================================
// VIEW MY CLAIMS
// ========================================

const myClaimsButton = document.getElementById("myClaimsButton");
const myClaimsList = document.getElementById("myClaimsList");

async function loadMyClaims() {
    if (!myClaimsList) return;

    const token = getToken();

    if (!token) {
        myClaimsList.textContent = "Please login first.";
        return;
    }

    try {
        const result = await apiRequest("/api/claims/my-claims", {
            headers: authHeaders()
        });

        const claims = getData(result);

        myClaimsList.innerHTML = "";

        if (!Array.isArray(claims) || claims.length === 0) {
            myClaimsList.textContent =
                "You have not submitted any claims yet.";
            return;
        }

        claims.forEach(claim => {
            const card = createElement("div", "item-card");

            const itemName = claim.item
                ? claim.item.itemName
                : "Item unavailable";

            card.append(
                createElement("h3", "", itemName),
                createElement("p", "", `Claim Message: ${claim.message || ""}`),
                createElement("p", "", `Claim Status: ${claim.status || "Pending"}`)
            );

            myClaimsList.appendChild(card);
        });

    } catch (error) {
        myClaimsList.textContent = error.message;
        console.error("My claims error:", error);
    }
}

if (myClaimsButton) {
    myClaimsButton.addEventListener("click", loadMyClaims);
}

// ========================================
// ADMIN CLAIM MANAGEMENT
// ========================================

const adminClaimsButton =
    document.getElementById("adminClaimsButton");

const adminClaimsList =
    document.getElementById("adminClaimsList");

async function loadAllClaims() {
    if (!adminClaimsList) return;

    if (!getToken()) {
        adminClaimsList.textContent = "Please login as admin first.";
        return;
    }

    try {
        const result = await apiRequest("/api/claims/all", {
            headers: authHeaders()
        });

        const claims = getData(result);

        adminClaimsList.innerHTML = "";

        if (!Array.isArray(claims) || claims.length === 0) {
            adminClaimsList.textContent = "No claims found.";
            return;
        }

        claims.forEach(claim => {
            const card = createElement("div", "item-card");

            const itemName = claim.item
                ? claim.item.itemName
                : "Item unavailable";

            const studentName = claim.claimant
                ? claim.claimant.name
                : "Unknown student";

            card.append(
                createElement("h3", "", itemName),
                createElement("p", "", `Student: ${studentName}`),
                createElement("p", "", `Message: ${claim.message || ""}`),
                createElement("p", "", `Status: ${claim.status || "Pending"}`),
                createElement("p", "", `Claim ID: ${claim._id}`)
            );

            if (!["Approved", "Rejected"].includes(claim.status)) {
                const approveButton = createElement(
                    "button",
                    "approve-btn",
                    "Approve"
                );

                approveButton.type = "button";
                approveButton.dataset.id = claim._id;
                approveButton.dataset.status = "Approved";

                const rejectButton = createElement(
                    "button",
                    "reject-btn",
                    "Reject"
                );

                rejectButton.type = "button";
                rejectButton.dataset.id = claim._id;
                rejectButton.dataset.status = "Rejected";

                card.append(approveButton, rejectButton);
            }

            adminClaimsList.appendChild(card);
        });

    } catch (error) {
        adminClaimsList.textContent = error.message;
        console.error("Admin claims error:", error);
    }
}

if (adminClaimsButton) {
    adminClaimsButton.addEventListener("click", loadAllClaims);
}

// APPROVE OR REJECT CLAIM

if (adminClaimsList) {
    adminClaimsList.addEventListener("click", async function(event) {
        const button = event.target.closest(
            ".approve-btn, .reject-btn"
        );

        if (!button) return;

        const claimId = button.dataset.id;
        const status = button.dataset.status;

        if (!getToken()) {
            alert("Please login as admin first.");
            return;
        }

        try {
            const result = await apiRequest(
                `/api/claims/${encodeURIComponent(claimId)}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({ status })
                }
            );

            alert(result.message || `Claim ${status.toLowerCase()}.`);

            await loadAllClaims();

        } catch (error) {
            alert(error.message);
            console.error("Update claim error:", error);
        }
    });
}

// ========================================
// MY REPORTED ITEMS
// ========================================

const myReportedItemsButton =
    document.getElementById("myReportedItemsButton");

const myReportedItemsList =
    document.getElementById("myReportedItemsList");

async function loadMyReportedItems() {
    if (!myReportedItemsList) return;

    if (!getToken()) {
        myReportedItemsList.textContent = "Please login first.";
        return;
    }

    try {
        const result = await apiRequest("/api/items/my-items", {
            headers: authHeaders()
        });

        const items = getData(result);

        myReportedItemsList.innerHTML = "";

        if (!Array.isArray(items) || items.length === 0) {
            myReportedItemsList.textContent =
                "You have not reported any items yet.";
            return;
        }

        items.forEach(item => {
            const card = createElement("div", "item-card");

            card.append(
                createElement("h3", "", item.itemName || "Unnamed Item"),
                createElement("p", "", `Type: ${item.type || ""} | Category: ${item.category || ""}`),
                createElement("p", "", `Location: ${item.location || ""}`),
                createElement("p", "", `Status: ${item.status || ""}`)
            );

            myReportedItemsList.appendChild(card);
        });

    } catch (error) {
        myReportedItemsList.textContent = error.message;
        console.error("My reported items error:", error);
    }
}

if (myReportedItemsButton) {
    myReportedItemsButton.addEventListener(
        "click",
        loadMyReportedItems
    );
}

// ========================================
// ADMIN ITEM MANAGEMENT
// ========================================

const adminItemsButton =
    document.getElementById("adminItemsButton");

const adminItemsList =
    document.getElementById("adminItemsList");

async function loadAllItems() {
    if (!adminItemsList) return;

    if (!getToken()) {
        adminItemsList.textContent = "Please login as admin first.";
        return;
    }

    try {
        const result = await apiRequest("/api/items", {
            headers: authHeaders()
        });

        const items = getData(result);

        adminItemsList.innerHTML = "";

        if (!Array.isArray(items) || items.length === 0) {
            adminItemsList.textContent = "No items found.";
            return;
        }

        items.forEach(item => {
            const card = createElement("div", "item-card");

            const deleteButton = createElement(
                "button",
                "delete-item-btn",
                "Delete Item"
            );

            deleteButton.type = "button";
            deleteButton.dataset.id = item._id;

            card.append(
                createElement("h3", "", item.itemName || "Unnamed Item"),
                createElement("p", "", `Type: ${item.type || ""} | Category: ${item.category || ""}`),
                createElement("p", "", `Location: ${item.location || ""}`),
                createElement("p", "", `Status: ${item.status || ""}`),
                createElement("p", "", `Item ID: ${item._id}`),
                deleteButton
            );

            adminItemsList.appendChild(card);
        });

    } catch (error) {
        adminItemsList.textContent = error.message;
        console.error("Admin items error:", error);
    }
}

if (adminItemsButton) {
    adminItemsButton.addEventListener("click", loadAllItems);
}

// ========================================
// DELETE ITEM (ADMIN ONLY)
// ========================================

if (adminItemsList) {
    adminItemsList.addEventListener("click", async function(event) {
        const button = event.target.closest(".delete-item-btn");

        if (!button) return;

        const confirmDelete = confirm(
            "Are you sure you want to delete this item?"
        );

        if (!confirmDelete) return;

        const itemId = button.dataset.id;

        if (!getToken()) {
            alert("Please login as admin first.");
            return;
        }

        try {
            const result = await apiRequest(
                `/api/items/${encodeURIComponent(itemId)}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            alert(result.message || "Item deleted successfully!");

            await loadAllItems();
            await loadItems();

        } catch (error) {
            alert(error.message);
            console.error("Delete item error:", error);
        }
    });
}

// ========================================
// INITIAL PAGE LOAD
// ========================================

loadItems();
