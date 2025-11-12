// Read Later — Tech Article Organizer (Full Stack Version)
// Data is stored in localStorage under key: 'techArticles'
// Backend API for metadata extraction

const STORAGE_KEY = 'techArticles';
const BACKEND_API_URL = 'http://127.0.0.1:5000/extract-metadata'; // Backend API endpoint

let articles = [];
let currentFilter = 'all'; // 'all' | 'read' | 'unread'
let currentTagFilter = '';

// DOM refs
let articleUrlInput, addArticleBtn, articleListEl;
let showAllBtn, showUnreadBtn, showReadBtn, tagFilterInput;

// Modals and fields
let editModal, editTitleInput, editUrlInput, editTagsInput, editNotesInput, saveEditBtn;
let notesTagsModal, notesTagsTagsInput, notesTagsNotesInput, saveNotesTagsBtn;

// when DOM ready
window.addEventListener('DOMContentLoaded', init);

function init() {
    // DOM refs
    articleUrlInput = document.getElementById('articleUrl');
    addArticleBtn = document.getElementById('addArticleBtn');
    articleListEl = document.getElementById('articleList');

    showAllBtn = document.getElementById('showAll');
    showUnreadBtn = document.getElementById('showUnread');
    showReadBtn = document.getElementById('showRead');
    tagFilterInput = document.getElementById('tagFilter');

    // Modals
    editModal = document.getElementById('editModal');
    editTitleInput = document.getElementById('editTitle');
    editUrlInput = document.getElementById('editUrl');
    editTagsInput = document.getElementById('editTags');
    editNotesInput = document.getElementById('editNotes');
    saveEditBtn = document.getElementById('saveEditBtn');

    notesTagsModal = document.getElementById('notesTagsModal');
    notesTagsTagsInput = document.getElementById('notesTagsTags');
    notesTagsNotesInput = document.getElementById('notesTagsNotes');
    saveNotesTagsBtn = document.getElementById('saveNotesTagsBtn');

    // Load and render
    articles = loadArticles();
    renderArticles();

    // Event listeners
    addArticleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = articleUrlInput.value.trim();
        if (!url) return;
        addArticle(url);
    });

    // Filters
    showAllBtn.addEventListener('click', () => setFilter('all'));
    showUnreadBtn.addEventListener('click', () => setFilter('unread'));
    showReadBtn.addEventListener('click', () => setFilter('read'));
    tagFilterInput.addEventListener('input', (e) => {
        currentTagFilter = e.target.value.trim().toLowerCase();
        renderArticles();
    });

    // Delegated events for article actions
    articleListEl.addEventListener('click', handleArticleListClick);
    articleListEl.addEventListener('change', handleArticleListChange);

    // Modal close handlers (close button and cancel)
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', (e) => hideModal(document.getElementById(btn.dataset.modal)));
    });
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => hideModal(document.getElementById(btn.dataset.modal)));
    });

    // Close when clicking outside modal content
    window.addEventListener('click', (e) => {
        if (e.target === editModal) hideModal(editModal);
        if (e.target === notesTagsModal) hideModal(notesTagsModal);
    });

    // Save handlers for modals
    saveEditBtn.addEventListener('click', () => {
        const id = editModal.dataset.articleId;
        if (!id) return;
        const newTitle = editTitleInput.value.trim() || 'Untitled Article';
        let newUrl = editUrlInput.value.trim();
        try { newUrl = new URL(newUrl).toString(); } catch (err) { /* keep original if invalid */ }
        const newTags = parseTagsString(editTagsInput.value);
        const newNotes = editNotesInput.value || '';
        saveEdit(id, newTitle, newUrl, newNotes, newTags);
        hideModal(editModal);
    });

    saveNotesTagsBtn.addEventListener('click', () => {
        const id = notesTagsModal.dataset.articleId;
        if (!id) return;
        const tags = parseTagsString(notesTagsTagsInput.value);
        const notes = notesTagsNotesInput.value || '';
        saveNotesTags(id, notes, tags);
        hideModal(notesTagsModal);
    });
}

// ---------- Storage ----------
function saveArticles() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

function loadArticles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        return [];
    } catch (err) {
        console.error('Failed to load articles from localStorage', err);
        return [];
    }
}

// ---------- Rendering ----------
function renderArticles() {
    // Clear
    articleListEl.innerHTML = '';

    // Filter
    const filtered = articles.filter(a => {
        if (currentFilter === 'read' && !a.read) return false;
        if (currentFilter === 'unread' && a.read) return false;
        if (currentTagFilter) {
            const t = currentTagFilter;
            const hasTag = (a.tags || []).some(tag => tag.toLowerCase().includes(t));
            if (!hasTag) return false;
        }
        return true;
    }).sort((a,b) => b.timestamp - a.timestamp); // newest first

    if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No articles yet. Add one above to get started.';
        empty.style.cssText = 'color: #95a5a6; text-align: center; padding: 60px 20px; font-size: 16px; font-weight: 500; opacity: 0.8;';
        articleListEl.appendChild(empty);
        return;
    }

    filtered.forEach((article, index) => {
        const li = document.createElement('li');
        li.className = 'article-item' + (article.read ? ' read' : '');
        li.dataset.id = article.id;
        li.style.animation = `fadeInUp 0.5s ease-out ${index * 0.05}s both`;

        // Header
        const header = document.createElement('div');
        header.className = 'article-header';

        const titleH3 = document.createElement('h3');
        titleH3.className = 'article-title';
        const a = document.createElement('a');
        a.href = article.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = article.title || article.url || 'Untitled Article';
        titleH3.appendChild(a);

        const actions = document.createElement('div');
        actions.className = 'article-actions';

        // Read toggle
        const readLabel = document.createElement('label');
        readLabel.className = 'read-toggle';
        const readCheckbox = document.createElement('input');
        readCheckbox.type = 'checkbox';
        readCheckbox.className = 'read-checkbox';
        readCheckbox.checked = !!article.read;
        readCheckbox.dataset.id = article.id;
        readLabel.appendChild(readCheckbox);
        const readText = document.createTextNode(' Read');
        readLabel.appendChild(readText);

        const notesBtn = document.createElement('button');
        notesBtn.className = 'notes-tags-btn';
        notesBtn.textContent = 'Notes/Tags';
        notesBtn.dataset.id = article.id;

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.dataset.id = article.id;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.dataset.id = article.id;

        actions.appendChild(readLabel);
        actions.appendChild(notesBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        header.appendChild(titleH3);
        header.appendChild(actions);

        // URL
        const urlP = document.createElement('p');
        urlP.className = 'article-url';
        urlP.textContent = article.url;

        // Preview content (image/description from backend)
        if (article.image || article.description) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'article-preview-content';
            
            if (article.image) {
                const img = document.createElement('img');
                img.src = article.image;
                img.alt = 'Article thumbnail';
                img.className = 'article-thumbnail';
                img.onerror = function() { this.style.display = 'none'; }; // Hide if image fails to load
                previewDiv.appendChild(img);
            }
            
            if (article.description) {
                const descP = document.createElement('p');
                descP.className = 'article-description-preview';
                descP.textContent = truncate(article.description, 150);
                previewDiv.appendChild(descP);
            }
            
            li.appendChild(previewDiv);
        }

        // Tags
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'article-tags';
        (article.tags || []).forEach(tag => {
            const s = document.createElement('span');
            s.className = 'tag';
            s.textContent = '#' + tag;
            tagsDiv.appendChild(s);
        });

        // Notes preview
        const notesPreview = document.createElement('p');
        notesPreview.className = 'article-notes-preview';
        const noteText = (article.notes || '').trim();
        notesPreview.textContent = noteText ? truncate(noteText, 180) : '';

        li.appendChild(header);
        li.appendChild(urlP);
        if ((article.tags || []).length) li.appendChild(tagsDiv);
        if (noteText) li.appendChild(notesPreview);

        articleListEl.appendChild(li);
    });
}

function truncate(text, n) {
    return text.length > n ? text.slice(0, n) + '…' : text;
}

// ---------- Article Actions ----------
async function addArticle(url) {
    // Basic URL validation
    try {
        const u = new URL(url);
        url = u.toString();
    } catch (err) {
        alert('Please enter a valid URL.');
        return;
    }

    articleUrlInput.disabled = true; // Disable input while fetching
    addArticleBtn.disabled = true;
    addArticleBtn.textContent = 'Adding...';

    let title = 'Untitled Article';
    let description = null;
    let image = null;

    try {
        // Call backend API to extract metadata
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            title = data.title || title; // Use extracted title, fallback to default
            description = data.description;
            image = data.image;
        } else {
            console.warn(`Backend failed to extract metadata for ${url}: ${data.error}`);
            alert(`Could not extract full metadata. Added with fallback title. Error: ${data.error}`);
        }

    } catch (error) {
        console.error('Error contacting backend or extracting metadata:', error);
        alert('Failed to get article details from backend. Make sure the Flask backend is running on http://127.0.0.1:5000\n\nAdding with fallback title. Check console for details.');
    } finally {
        articleUrlInput.disabled = false;
        addArticleBtn.disabled = false;
        addArticleBtn.textContent = 'Add Article';
    }

    const article = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        url: url,
        title: title,
        description: description, // Store description from backend
        image: image,             // Store image from backend
        read: false,
        tags: [],
        notes: '',
        timestamp: Date.now()
    };

    articles.push(article);
    saveArticles();
    renderArticles();
    
    articleUrlInput.value = '';
    articleUrlInput.focus();
}

function toggleReadStatus(id) {
    const idx = articles.findIndex(a => a.id === id);
    if (idx === -1) return;
    articles[idx].read = !articles[idx].read;
    saveArticles();
    renderArticles();
}

function deleteArticle(id) {
    if (!confirm('Delete this article?')) return;
    articles = articles.filter(a => a.id !== id);
    saveArticles();
    renderArticles();
}

function openEditModal(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    editModal.dataset.articleId = id;
    editTitleInput.value = article.title || '';
    editUrlInput.value = article.url || '';
    editTagsInput.value = (article.tags || []).join(',');
    editNotesInput.value = article.notes || '';
    showModal(editModal);
}

function saveEdit(id, newTitle, newUrl, newNotes, newTags) {
    const idx = articles.findIndex(a => a.id === id);
    if (idx === -1) return;
    articles[idx].title = newTitle;
    if (newUrl) articles[idx].url = newUrl;
    articles[idx].notes = newNotes;
    articles[idx].tags = newTags;
    saveArticles();
    renderArticles();
}

function openNotesTagsModal(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    notesTagsModal.dataset.articleId = id;
    notesTagsTagsInput.value = (article.tags || []).join(',');
    notesTagsNotesInput.value = article.notes || '';
    showModal(notesTagsModal);
}

function saveNotesTags(id, newNotes, newTags) {
    const idx = articles.findIndex(a => a.id === id);
    if (idx === -1) return;
    articles[idx].notes = newNotes;
    articles[idx].tags = newTags;
    saveArticles();
    renderArticles();
}

// ---------- Helpers & Events ----------
function parseTagsString(s) {
    if (!s) return [];
    return s.split(',').map(t => t.trim()).filter(Boolean);
}

function handleArticleListClick(e) {
    const id = e.target.dataset.id || e.target.closest('[data-id]')?.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('delete-btn')) {
        deleteArticle(id);
        return;
    }
    if (e.target.classList.contains('edit-btn')) {
        openEditModal(id);
        return;
    }
    if (e.target.classList.contains('notes-tags-btn')) {
        openNotesTagsModal(id);
        return;
    }
}

function handleArticleListChange(e) {
    // Toggle read checkbox
    if (e.target.classList.contains('read-checkbox')) {
        const id = e.target.dataset.id;
        toggleReadStatus(id);
    }
}

function setFilter(filter) {
    currentFilter = filter;
    // manage active class
    [showAllBtn, showUnreadBtn, showReadBtn].forEach(btn => btn.classList.remove('active'));
    if (filter === 'all') showAllBtn.classList.add('active');
    if (filter === 'unread') showUnreadBtn.classList.add('active');
    if (filter === 'read') showReadBtn.classList.add('active');
    renderArticles();
}

function showModal(modal) {
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
}
function hideModal(modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    delete modal.dataset.articleId;
}

// ---------- Utilities ----------
// Simple logging helper (could be enhanced)
function log(...args) { console.log('[ReadLater]', ...args); }

// Optional: expose articles for debugging in console
window._readLater = { getAll: () => articles };

// End of script
// Note on Backend: This version uses a Flask backend API to extract article metadata
// (title, description, image) from URLs. This overcomes browser CORS restrictions.
// Make sure to run the Flask backend (python backend/app.py) before using the app.
// The backend fetches page content server-side and extracts Open Graph metadata.

