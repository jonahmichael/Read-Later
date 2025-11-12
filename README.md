# Read Later

A modern full-stack web application for saving, organizing, and managing technical articles for future reading. Features intelligent metadata extraction, customizable views, and an animated interface powered by WebGL.

**Developed by Jonah Paulin Joyce**

## Overview

Read Later is designed for developers, tech enthusiasts, and lifelong learners who need an efficient way to manage their backlog of online technical articles, tutorials, and documentation. The application combines a powerful Flask backend for metadata extraction with a beautiful, responsive frontend that works seamlessly across all devices.

## Features

### Core Functionality
- **Automatic Metadata Extraction**: Paste any URL and automatically extract article title, description, and preview image
- **Read Status Tracking**: Mark articles as read or unread to track your progress
- **Tagging System**: Organize articles with custom tags for easy categorization
- **Personal Notes**: Add detailed free-form notes to each article
- **Advanced Filtering**: Filter by read status (All, Unread, Read) and search by tags
- **Full CRUD Operations**: Edit and delete articles with complete control
- **Dual View Modes**: Switch between list and grid layouts based on preference
- **Persistent Storage**: All data stored locally in browser localStorage

### User Experience
- **Animated Aurora Background**: WebGL-powered dynamic background using OGL library
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Glassmorphism UI**: Modern interface with backdrop blur effects and smooth animations
- **Professional Color Palette**: Carefully selected colors for optimal readability and aesthetics
- **Montserrat Typography**: Clean, readable font family with multiple weights

## Technology Stack

### Frontend
- HTML5
- CSS3 (Custom Properties, Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- OGL Library v0.0.88 (WebGL rendering)

### Backend
- Python 3.7+
- Flask (Web framework)
- BeautifulSoup4 (HTML parsing)
- Requests (HTTP library)
- Flask-CORS (Cross-origin resource sharing)

## Live Application

The application is hosted on Vercel and can be accessed directly through your web browser. Simply visit the application URL and start adding articles immediately.

### System Requirements
- Modern web browser with JavaScript and WebGL support
- Internet connection for metadata extraction and article management

## Usage Guide

### Adding Articles
1. Paste a valid article URL into the input field
2. Click "Add Article" or press Enter
3. The application will automatically fetch and extract metadata
4. The article appears in your list with title, description, and preview image

### Managing Articles
- **Mark as Read/Unread**: Click the checkmark button to toggle read status
- **Edit Details**: Click the edit button to modify title, URL, tags, or notes
- **Add Notes/Tags**: Click "Add Tags" for quick access to tagging and note-taking
- **Delete Articles**: Click the trash button to remove articles (confirmation required)

### Filtering and Views
- **Filter by Status**: Use "All", "Unread", or "Read" buttons at the top
- **Search by Tags**: Type in the tag filter input to find tagged articles
- **Switch View Modes**: Toggle between list view and grid view using view buttons
- **View Preference**: Your selected view mode is automatically saved

## Project Structure

```
01-Read Later/
├── backend/
│   ├── app.py              # Flask API server with metadata extraction
│   └── requirements.txt    # Python dependencies
├── index.html              # Main HTML structure
├── style.css               # Complete styling and animations
├── script.js               # Application logic and state management
├── aurora.js               # WebGL aurora background effect
└── README.md               # Project documentation
```

## API Documentation

### POST /extract-metadata

Extracts metadata from a given article URL.

**Endpoint**: `/api/extract-metadata`

**Request Body**:
```json
{
  "url": "https://example.com/article"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "title": "Article Title",
  "description": "Article description or excerpt...",
  "image": "https://example.com/preview-image.jpg",
  "original_url": "https://example.com/article"
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "error": "Error message description"
}
```

## How It Works

### Metadata Extraction Process

When you add a URL, the following process occurs:

1. Frontend sends POST request to Flask backend with the article URL
2. Backend fetches webpage content using `requests` library with browser-like headers
3. BeautifulSoup4 parses the HTML document
4. Metadata is extracted in order of preference:
   - **Title**: Open Graph `og:title` → HTML `<title>` tag → "Untitled Article"
   - **Description**: Open Graph `og:description` → meta description tag → null
   - **Image**: Open Graph `og:image` → null
5. Extracted data is returned as JSON to the frontend
6. Frontend stores the article in localStorage and updates the UI

This server-side approach bypasses browser CORS restrictions that would prevent client-side fetching from external domains.

### Data Persistence

Articles are stored in browser localStorage under the key `techArticles`. View mode preference is stored under `techArticles_viewMode`.

**Key Features**:
- Data persists across browser sessions
- No server-side database or authentication required
- Data is device and browser-specific (does not sync across devices)
- Clearing browser data will delete saved articles
- Storage limit typically 5-10MB depending on browser

## Design System

### Color Palette
- **Pumpkin** (#ff6700): Primary accent color for active states and highlights
- **Antiflash White** (#ebebeb): Light backgrounds and primary text
- **Silver** (#c0c0c0): Borders and secondary elements
- **Bice Blue** (#3a6ea5): Interactive elements and hover states
- **Polynesian Blue** (#004e98): Deep accents and shadows

### Typography
- **Font Family**: Montserrat
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold)
- **Primary Use**: Sans-serif for clean, modern readability

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Note**: WebGL support is required for the aurora background effect. The application will function without it, but the animated background will not render.

## Known Limitations

1. **Website Restrictions**: Some websites block automated scraping or require authentication
2. **Storage Limits**: localStorage typically limited to 5-10MB depending on browser
3. **Single Device**: No cloud synchronization; data tied to specific browser and device
4. **CORS Constraints**: Some sites may have strict content policies
5. **Image Loading**: Some preview images may fail to load due to CORS or relative paths

## Troubleshooting

### Missing Metadata
**Problem**: Article added but no title/description

**Possible Causes**:
- Target website blocks automated requests
- Website lacks Open Graph or standard meta tags
- Website requires JavaScript rendering (not supported)

**Workaround**: Article is still saved with URL as title; manually edit details afterward

### Images Not Displaying
**Problem**: Preview images broken or missing

**Causes**:
- Image URLs may be relative paths
- CORS restrictions on image resources
- Image links may have expired

**Note**: Application automatically hides broken images

## Deployment

This application is deployed on Vercel with serverless functions handling the backend API. The Flask backend has been adapted to work as a Vercel serverless function.

### For Developers

If you want to deploy your own instance:

1. Fork or clone this repository
2. Create a Vercel account at [vercel.com](https://vercel.com)
3. Import your repository in Vercel
4. Vercel will automatically detect and deploy the application
5. The backend API will be available at `/api/extract-metadata`

### Customizing Colors

All colors are defined as CSS custom properties in `style.css`:
```css
:root {
    --pumpkin: #ff6700;
    --antiflash-white: #ebebeb;
    --silver: #c0c0c0;
    --bice-blue: #3a6ea5;
    --polynesian-blue: #004e98;
}
```

### Modifying Aurora Effect

Aurora colors and animation settings can be adjusted in `aurora.js`:
```javascript
const colorStops = [
    { color: hexToRgb('#004e98'), stop: 0.0 },
    { color: hexToRgb('#3a6ea5'), stop: 0.5 },
    { color: hexToRgb('#ff6700'), stop: 1.0 }
];
```

## Future Enhancements

Potential improvements for future development:
- Database integration (PostgreSQL/MongoDB) for multi-device sync
- User authentication and multi-user support
- Cloud storage and backup functionality
- Export/import capabilities (JSON, CSV formats)
- Browser extension for quick article saving
- Full-text search across article content and notes
- Reading time estimation
- Dark mode toggle
- Collections/folders for advanced organization
- Article sharing and collaboration features
- Offline reading mode with cached content

## Data Privacy

All article data is stored exclusively in your browser's localStorage. No personal data is transmitted to external servers except for:
- Article URLs sent to the backend API for metadata extraction
- HTTP requests from backend to target article URLs during extraction

The application does not collect, store, or transmit any personal information to third parties. Your reading list and notes remain private on your device.

## License

This project is open source and available for personal and educational use.

## Credits

**Developed by Jonah Paulin Joyce**

Built for developers and learners who want an efficient, beautiful way to manage their reading backlog without losing track of valuable technical resources.

---

For issues, questions, or contributions, please refer to the project repository.
