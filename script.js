// Read Later — Full-Stack Tech Article Organizer
// Data is stored in Google Firestore via Cloud Run backend

// ===================================================================================
// 1. Configuration & State (Lines 1-30)
// ===================================================================================
const BACKEND_API_URL = 'https://read-later-backend-478110.a.run.app';
const VIEW_MODE_KEY = 'techArticles_viewMode';

// Global state variables
let sections = [];
let currentArticles = [];
let currentSectionId = 'unlisted';
let currentFilter = 'all';
let currentTagFilter = '';
let viewMode = 'list';
let currentEditingArticleId = null;
let currentNotesTagsArticleId = null;

// DOM references
let sectionListEl, sectionNameInput, addSectionBtn;
let currentSectionTitleEl;
let articleUrlInput, addArticleBtn, articleListEl;
let showAllBtn, showUnreadBtn, showReadBtn, tagFilterInput;
let listViewBtn, gridViewBtn;
let editModal, editTitleInput, editUrlInput, editSectionSelect, editTagsInput, editNotesInput, saveEditBtn;
let notesTagsModal, notesTagsTagsInput, notesTagsNotesInput, saveNotesTagsBtn;
let burgerMenuBtn, closeSidebarBtn, sidebar, sidebarOverlay;

// Initialize the application once the DOM is fully loaded
window.addEventListener('DOMContentLoaded', init);

// ===================================================================================
// 2. API Service Layer (Lines 32-170)
// ===================================================================================
const api = {
    async _handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    async fetchSections() {
        try {
            const response = await fetch(`${BACKEND_API_URL}/sections`);
            return await this._handleResponse(response);
        } catch (error) {
            showNotification(`Error fetching sections: ${error.message}`, 'error');
            return [];
        }
    },

    async createSection(name) {
        try {
            const response = await fetch(`${BACKEND_API_URL}/sections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            return await this._handleResponse(response);
        } catch (error) {
            showNotification(`Error creating section: ${error.message}`, 'error');
            return null;
        }
    },
    
    async deleteSection(sectionId) {
        try {
            const response = await fetch(`${BACKEND_API_URL}/sections/${sectionId}`, { method: 'DELETE' });
            return await this._handleResponse(response);
        } catch (error) {
            showNotification(`Error deleting section: ${error.message}`, 'error');
            return null;
        }
    },

    async fetchArticlesForSection(sectionId) {
        try {
            const response = await fetch(`${BACKEND_API_URL}/articles/section/${sectionId}`);
            return await this._handleResponse(response);
        } catch (error) {
            showNotification(`Error fetching articles: ${error.message}`, 'error');
            return [];
        }
    },

    async addArticle(url, sectionId) {
        try {
            const response = await fetch(`${BACKEND_API_URL}/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, sectionId }),
            });
            return await this._handleResponse(response);
        } catch (error) {
            showNotification(`Error adding article: ${error.message}`, 'error');
            return null;
        }
    },

    async updateArticle(articleId, updates) {
        try {
            const response = await fetch(`${BACKEND_API_URL}/articles/${articleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            return await this._handleResponse(response);
        } catch (error) {
            showNotification(`Error updating article: ${error.message}`, 'error');
            return null;
        }
    },

    async deleteArticle(articleId) {
        try {
            const response = await fetch(`${BACKEND_API_URL}/articles/${articleId}`, { method: 'DELETE' });
            return await this._handleResponse(response);
        } catch (error) {
            showNotification(`Error deleting article: ${error.message}`, 'error');
            return null;
        }
    }
};

// ===================================================================================
// 3. Initialization (Lines 172-250)
// ===================================================================================
async function init() {
    // Assign all DOM references
    sectionListEl = document.getElementById('sectionList');
    sectionNameInput = document.getElementById('sectionNameInput');
    addSectionBtn = document.getElementById('addSectionBtn');
    currentSectionTitleEl = document.getElementById('currentSectionTitle');
    articleUrlInput = document.getElementById('articleUrl');
    addArticleBtn = document.getElementById('addArticleBtn');
    articleListEl = document.getElementById('articleList');
    showAllBtn = document.getElementById('showAll');
    showUnreadBtn = document.getElementById('showUnread');
    showReadBtn = document.getElementById('showRead');
    tagFilterInput = document.getElementById('tagFilter');
    listViewBtn = document.getElementById('listView');
    gridViewBtn = document.getElementById('gridView');
    editModal = document.getElementById('editModal');
    editTitleInput = document.getElementById('editTitle');
    editUrlInput = document.getElementById('editUrl');
    editSectionSelect = document.getElementById('editSection');
    editTagsInput = document.getElementById('editTags');
    editNotesInput = document.getElementById('editNotes');
    saveEditBtn = document.getElementById('saveEditBtn');
    notesTagsModal = document.getElementById('notesTagsModal');
    notesTagsTagsInput = document.getElementById('notesTagsTags');
    notesTagsNotesInput = document.getElementById('notesTagsNotes');
    saveNotesTagsBtn = document.getElementById('saveNotesTagsBtn');
    
    // Sidebar elements
    burgerMenuBtn = document.getElementById('burgerMenuBtn');
    closeSidebarBtn = document.getElementById('closeSidebarBtn');
    sidebar = document.getElementById('sidebar');
    
    // Create sidebar overlay element
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
    
    setupEventListeners();
    loadViewMode();
    await loadInitialData();
    console.log('Read Later app initialized');
}

async function loadInitialData() {
    showLoading(true);
    sections = await api.fetchSections();
    renderSections();
    await loadArticlesForCurrentSection();
    showLoading(false);
}

async function loadArticlesForCurrentSection() {
    showLoading(true);
    currentArticles = await api.fetchArticlesForSection(currentSectionId);
    renderArticles();
    showLoading(false);
}

function setupEventListeners() {
    addSectionBtn.addEventListener('click', handleAddSection);
    addArticleBtn.addEventListener('click', handleAddArticle);
    
    // Enter key support
    sectionNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddSection();
    });
    articleUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddArticle();
    });

    showAllBtn.addEventListener('click', () => setFilter('all'));
    showUnreadBtn.addEventListener('click', () => setFilter('unread'));
    showReadBtn.addEventListener('click', () => setFilter('read'));
    tagFilterInput.addEventListener('input', handleTagFilterChange);
    
    listViewBtn.addEventListener('click', () => setViewMode('list'));
    gridViewBtn.addEventListener('click', () => setViewMode('grid'));

    saveEditBtn.addEventListener('click', handleSaveEdit);
    saveNotesTagsBtn.addEventListener('click', handleSaveNotesTags);
    
    // Sidebar toggle
    burgerMenuBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebarMenu);
    sidebarOverlay.addEventListener('click', closeSidebarMenu);
    
    // Close modals with close button, cancel button, or clicking outside
    editModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || 
            e.target.classList.contains('close-button') || 
            e.target.classList.contains('cancel-btn')) {
            closeModal(editModal);
        }
    });
    notesTagsModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || 
            e.target.classList.contains('close-button') || 
            e.target.classList.contains('cancel-btn')) {
            closeModal(notesTagsModal);
        }
    });
}

// ===================================================================================
// 4. Section Management (Lines 252-400)
// ===================================================================================
async function handleAddSection() {
    const name = sectionNameInput.value.trim();
    if (!name) {
        showNotification('Section name cannot be empty.', 'error');
        return;
    }

    addSectionBtn.disabled = true;
    const newSection = await api.createSection(name);
    addSectionBtn.disabled = false;

    if (newSection) {
        sections.push(newSection);
        renderSections();
        sectionNameInput.value = '';
        showNotification(`Section "${name}" created.`, 'success');
    }
}

async function handleDeleteSection(sectionId, sectionName) {
    if (!confirm(`Are you sure you want to delete the section "${sectionName}" and all its articles? This cannot be undone.`)) {
        return;
    }

    showLoading(true);
    const result = await api.deleteSection(sectionId);
    showLoading(false);

    if (result) {
        sections = sections.filter(s => s.id !== sectionId);
        if (currentSectionId === sectionId) {
            await handleSelectSection('unlisted');
        } else {
            renderSections();
        }
        showNotification(`Section "${sectionName}" deleted.`, 'success');
    }
}

async function handleSelectSection(sectionId) {
    currentSectionId = sectionId;
    const selectedSection = sections.find(s => s.id === sectionId);
    currentSectionTitleEl.textContent = selectedSection ? selectedSection.name : 'Unlisted';
    
    renderSections(); // To update the active class
    await loadArticlesForCurrentSection();
    
    // Close sidebar on mobile after selection
    closeSidebarMenu();
}

function renderSections() {
    sectionListEl.innerHTML = '';
    
    // Add the static "Unlisted" section
    const unlistedEl = createSectionElement({ id: 'unlisted', name: 'Unlisted' });
    sectionListEl.appendChild(unlistedEl);

    // Add user-created sections
    sections.forEach(section => {
        const sectionEl = createSectionElement(section, true); // true for deletable
        sectionListEl.appendChild(sectionEl);
    });
    updateEditSectionDropdown();
}

function createSectionElement(section, deletable = false) {
    const li = document.createElement('li');
    li.className = 'section-item';
    li.dataset.id = section.id;
    if (section.id === currentSectionId) {
        li.classList.add('active');
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = section.name;
    nameSpan.onclick = () => handleSelectSection(section.id);
    li.appendChild(nameSpan);

    if (deletable) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-section-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            handleDeleteSection(section.id, section.name);
        };
        li.appendChild(deleteBtn);
    }
    return li;
}

function updateEditSectionDropdown() {
    editSectionSelect.innerHTML = `<option value="unlisted">Unlisted</option>`;
    sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section.id;
        option.textContent = section.name;
        editSectionSelect.appendChild(option);
    });
}

// ===================================================================================
// 5. Article Management (Lines 402-550)
// ===================================================================================
async function handleAddArticle() {
    const url = articleUrlInput.value.trim();
    if (!isValidUrl(url)) {
        showNotification('Please enter a valid URL.', 'error');
        return;
    }

    addArticleBtn.disabled = true;
    addArticleBtn.textContent = 'Adding...';
    
    const newArticle = await api.addArticle(url, currentSectionId);
    
    addArticleBtn.disabled = false;
    addArticleBtn.textContent = 'Add Article';

    if (newArticle) {
        currentArticles.unshift(newArticle);
        renderArticles();
        articleUrlInput.value = '';
        showNotification('Article added successfully.', 'success');
    }
}

async function handleToggleRead(articleId, isRead) {
    const updatedArticle = await api.updateArticle(articleId, { read: isRead });
    if (updatedArticle) {
        const index = currentArticles.findIndex(a => a.id === articleId);
        if (index !== -1) {
            currentArticles[index] = updatedArticle;
            renderArticles();
        }
    }
}

async function handleDeleteArticle(articleId) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const result = await api.deleteArticle(articleId);
    if (result && result.success) {
        currentArticles = currentArticles.filter(a => a.id !== articleId);
        renderArticles();
        showNotification('Article deleted.', 'success');
    }
}

function openEditModal(articleId) {
    const article = currentArticles.find(a => a.id === articleId);
    if (!article) return;
    
    currentEditingArticleId = articleId;
    editTitleInput.value = article.title;
    editUrlInput.value = article.url;
    editSectionSelect.value = article.sectionId;
    editTagsInput.value = article.tags.join(', ');
    editNotesInput.value = article.notes;
    
    editModal.classList.add('active');
}

async function handleSaveEdit() {
    const articleId = currentEditingArticleId;
    const updates = {
        title: editTitleInput.value.trim(),
        url: editUrlInput.value.trim(),
        sectionId: editSectionSelect.value,
        tags: editTagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
        notes: editNotesInput.value.trim(),
    };
    
    if (!updates.title || !isValidUrl(updates.url)) {
        showNotification('Title and a valid URL are required.', 'error');
        return;
    }

    const updatedArticle = await api.updateArticle(articleId, updates);
    if (updatedArticle) {
        // If section was changed, remove from current view
        if (updatedArticle.sectionId !== currentSectionId) {
            currentArticles = currentArticles.filter(a => a.id !== articleId);
        } else {
            const index = currentArticles.findIndex(a => a.id === articleId);
            if (index !== -1) currentArticles[index] = updatedArticle;
        }
        renderArticles();
        closeModal(editModal);
        showNotification('Article updated.', 'success');
    }
}

function openNotesTagsModal(articleId) {
    const article = currentArticles.find(a => a.id === articleId);
    if (!article) return;

    currentNotesTagsArticleId = articleId;
    notesTagsTagsInput.value = article.tags.join(', ');
    notesTagsNotesInput.value = article.notes;
    notesTagsModal.classList.add('active');
}

async function handleSaveNotesTags() {
    const articleId = currentNotesTagsArticleId;
    const updates = {
        tags: notesTagsTagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
        notes: notesTagsNotesInput.value.trim()
    };
    
    const updatedArticle = await api.updateArticle(articleId, updates);
    if (updatedArticle) {
        const index = currentArticles.findIndex(a => a.id === articleId);
        if (index !== -1) currentArticles[index] = updatedArticle;
        renderArticles();
        closeModal(notesTagsModal);
        showNotification('Notes and tags updated.', 'success');
    }
}

// ===================================================================================
// 6. Rendering (Lines 552-750)
// ===================================================================================
function renderArticles() {
    articleListEl.innerHTML = '';
    
    let filteredArticles = currentArticles;

    // Apply read/unread filter
    if (currentFilter === 'read') {
        filteredArticles = filteredArticles.filter(a => a.read);
    } else if (currentFilter === 'unread') {
        filteredArticles = filteredArticles.filter(a => !a.read);
    }

    // Apply tag filter
    if (currentTagFilter) {
        filteredArticles = filteredArticles.filter(a => 
            a.tags.some(tag => tag.toLowerCase().includes(currentTagFilter))
        );
    }

    if (filteredArticles.length === 0) {
        articleListEl.innerHTML = '<li class="no-articles">No articles found.</li>';
        return;
    }

    filteredArticles.forEach(article => {
        const articleEl = createArticleElement(article);
        articleListEl.appendChild(articleEl);
    });
}

function createArticleElement(article) {
    const li = document.createElement('li');
    li.className = 'article-item';
    li.classList.toggle('read', article.read);
    li.dataset.id = article.id;
    
    const tagsHTML = article.tags.map(tag => `<span class="tag">#${tag}</span>`).join(' ');

    li.innerHTML = `
        ${article.image ? `<img src="${article.image}" alt="Article thumbnail" class="article-thumbnail">` : ''}
        <div class="article-content">
            <div class="article-header">
                <h3 class="article-title">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
                </h3>
                <div class="article-actions">
                    <button class="action-btn edit-btn" title="Edit Article">&#9998;</button>
                    <button class="action-btn notes-btn" title="Notes & Tags">&#128221;</button>
                    <button class="action-btn delete-btn" title="Delete Article">&#128465;</button>
                </div>
            </div>
            <p class="article-url">${new URL(article.url).hostname}</p>
            ${article.description ? `<p class="article-description">${article.description}</p>` : ''}
            <div class="article-meta">
                <div class="article-tags">${tagsHTML}</div>
                <label class="read-toggle">
                    <input type="checkbox" class="read-checkbox" ${article.read ? 'checked' : ''}>
                    Mark as Read
                </label>
            </div>
        </div>
    `;

    // Attach event listeners
    li.querySelector('.read-checkbox').addEventListener('change', (e) => handleToggleRead(article.id, e.target.checked));
    li.querySelector('.delete-btn').addEventListener('click', () => handleDeleteArticle(article.id));
    li.querySelector('.edit-btn').addEventListener('click', () => openEditModal(article.id));
    li.querySelector('.notes-btn').addEventListener('click', () => openNotesTagsModal(article.id));

    return li;
}

// ===================================================================================
// 7. Filters & View Mode (Lines 752-820)
// ===================================================================================
function setFilter(filter) {
    currentFilter = filter;
    
    [showAllBtn, showUnreadBtn, showReadBtn].forEach(btn => btn.classList.remove('active'));
    
    if (filter === 'all') showAllBtn.classList.add('active');
    else if (filter === 'read') showReadBtn.classList.add('active');
    else if (filter === 'unread') showUnreadBtn.classList.add('active');
    
    renderArticles();
}

function handleTagFilterChange(event) {
    currentTagFilter = event.target.value.toLowerCase().trim();
    renderArticles();
}

function setViewMode(mode) {
    viewMode = mode;
    applyViewMode();
    saveViewMode();
}

function applyViewMode() {
    if (viewMode === 'grid') {
        articleListEl.classList.add('grid-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    } else {
        articleListEl.classList.remove('grid-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    }
}

function saveViewMode() {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
}

function loadViewMode() {
    const savedMode = localStorage.getItem(VIEW_MODE_KEY) || 'list';
    setViewMode(savedMode);
}

// ===================================================================================
// 8. Utility Functions (Lines 822-900)
// ===================================================================================
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function closeModal(modalElement) {
    modalElement.classList.remove('active');
    currentEditingArticleId = null;
    currentNotesTagsArticleId = null;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showLoading(isLoading) {
    let loader = document.getElementById('loading-overlay');
    if (isLoading && !loader) {
        loader = document.createElement('div');
        loader.id = 'loading-overlay';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    } else if (!isLoading && loader) {
        loader.remove();
    }
}

// ===================================================================================
// 9. Sidebar Toggle Functions (Lines 901-930)
// ===================================================================================
function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
}

function closeSidebarMenu() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
}