from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
from google.cloud import firestore

app = Flask(__name__)
# Enable CORS for all routes
# In production, you should restrict this to your frontend domain
CORS(app)

# Initialize Firestore Client
# It will automatically use the project's credentials when running on GCP
db = firestore.Client(project='read-later-478110')

# Collection names
SECTIONS_COLLECTION = 'sections'
ARTICLES_COLLECTION = 'articles'

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def extract_metadata_from_url(url):
    """
    Helper function to extract metadata from a given URL.
    Returns a dictionary with title, description, image, or error information.
    """
    # Basic URL validation
    if not re.match(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', url):
        return {"success": False, "error": "Invalid URL format"}

    try:
        # Set a User-Agent header to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # Fetch the URL content with a timeout
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract Title
        title = "Untitled Article"
        og_title_tag = soup.find("meta", property="og:title")
        if og_title_tag and og_title_tag.get("content"):
            title = og_title_tag["content"]
        else:
            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.get_text(strip=True)

        # Extract Description
        description = None
        og_description_tag = soup.find("meta", property="og:description")
        if og_description_tag and og_description_tag.get("content"):
            description = og_description_tag["content"]
        else:
            meta_description_tag = soup.find("meta", attrs={"name": "description"})
            if meta_description_tag and meta_description_tag.get("content"):
                description = meta_description_tag["content"]

        # Extract Image
        image = None
        og_image_tag = soup.find("meta", property="og:image")
        if og_image_tag and og_image_tag.get("content"):
            image = og_image_tag["content"]

        return {
            "success": True,
            "title": title,
            "description": description,
            "image": image,
            "original_url": url
        }

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Request failed for {url}: {e}")
        return {"success": False, "error": f"Failed to fetch URL: {str(e)}"}
    except Exception as e:
        app.logger.error(f"Error processing URL {url}: {e}")
        return {"success": False, "error": f"An unexpected error occurred: {str(e)}"}

# ============================================================================
# BASIC ROUTES
# ============================================================================

@app.route('/')
def index():
    """Basic route to check if the backend is running."""
    return "Read Later Backend (Firestore-enabled) is running!"

@app.route('/extract-metadata', methods=['POST'])
def extract_metadata():
    """
    Standalone endpoint to extract metadata from a URL.
    Kept for testing purposes, but the main logic is now in extract_metadata_from_url().
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    result = extract_metadata_from_url(url)
    
    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 500

# ============================================================================
# SECTIONS ENDPOINTS
# ============================================================================

@app.route('/sections', methods=['GET'])
def get_sections():
    """
    GET /sections
    Fetch all sections from Firestore.
    Returns: JSON array of section objects with id and name.
    """
    try:
        sections_ref = db.collection(SECTIONS_COLLECTION)
        sections = []
        
        for doc in sections_ref.stream():
            section_data = doc.to_dict()
            sections.append({
                'id': doc.id,
                'name': section_data.get('name', ''),
                'createdAt': section_data.get('createdAt', '')
            })
        
        # Sort by creation date (newest first)
        sections.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        return jsonify(sections), 200

    except Exception as e:
        app.logger.error(f"Error fetching sections: {e}")
        return jsonify({"error": f"Failed to fetch sections: {str(e)}"}), 500

@app.route('/sections', methods=['POST'])
def create_section():
    """
    POST /sections
    Create a new section.
    Request Body: {"name": "Section Name"}
    Returns: The newly created section object with its generated ID.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    name = data.get('name', '').strip()

    if not name:
        return jsonify({"error": "Section name is required"}), 400

    try:
        # Create new section document
        section_data = {
            'name': name,
            'createdAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Add to Firestore and get the document reference
        doc_ref = db.collection(SECTIONS_COLLECTION).add(section_data)
        section_id = doc_ref[1].id
        
        # Return the created section with its ID
        return jsonify({
            'id': section_id,
            'name': name,
            'createdAt': section_data['createdAt']
        }), 201

    except Exception as e:
        app.logger.error(f"Error creating section: {e}")
        return jsonify({"error": f"Failed to create section: {str(e)}"}), 500

@app.route('/sections/<section_id>', methods=['DELETE'])
def delete_section(section_id):
    """
    DELETE /sections/<section_id>
    Delete a section and all articles associated with it.
    Returns: Success message.
    """
    try:
        # Don't allow deleting the special "unlisted" section
        if section_id == 'unlisted':
            return jsonify({"error": "Cannot delete the Unlisted section"}), 400

        # Delete the section document
        section_ref = db.collection(SECTIONS_COLLECTION).document(section_id)
        section_ref.delete()

        # Query and delete all articles in this section
        articles_ref = db.collection(ARTICLES_COLLECTION)
        articles_query = articles_ref.where('sectionId', '==', section_id)
        
        # Delete articles in batches
        batch = db.batch()
        deleted_count = 0
        
        for doc in articles_query.stream():
            batch.delete(doc.reference)
            deleted_count += 1
            
            # Firestore has a batch limit of 500 operations
            if deleted_count % 500 == 0:
                batch.commit()
                batch = db.batch()
        
        # Commit any remaining deletes
        if deleted_count % 500 != 0:
            batch.commit()

        return jsonify({
            "success": True,
            "message": f"Section and {deleted_count} article(s) deleted."
        }), 200

    except Exception as e:
        app.logger.error(f"Error deleting section {section_id}: {e}")
        return jsonify({"error": f"Failed to delete section: {str(e)}"}), 500

# ============================================================================
# ARTICLES ENDPOINTS
# ============================================================================

@app.route('/articles', methods=['POST'])
def add_article():
    """
    POST /articles
    Add a new article to a section.
    Request Body: {"url": "...", "sectionId": "..."} (sectionId defaults to "unlisted")
    Returns: The newly created article object.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    url = data.get('url', '').strip()
    section_id = data.get('sectionId', 'unlisted')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        # Extract metadata from the URL
        metadata = extract_metadata_from_url(url)
        
        if not metadata.get("success"):
            # If metadata extraction fails, still save the article with minimal data
            metadata = {
                "title": url,
                "description": None,
                "image": None
            }

        # Create article document
        article_data = {
            'url': url,
            'title': metadata.get('title', url),
            'description': metadata.get('description'),
            'image': metadata.get('image'),
            'read': False,
            'notes': '',
            'tags': [],
            'sectionId': section_id,
            'createdAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Add to Firestore
        doc_ref = db.collection(ARTICLES_COLLECTION).add(article_data)
        article_id = doc_ref[1].id
        
        # Return the created article with its ID
        article_data['id'] = article_id
        return jsonify(article_data), 201

    except Exception as e:
        app.logger.error(f"Error adding article: {e}")
        return jsonify({"error": f"Failed to add article: {str(e)}"}), 500

@app.route('/articles/section/<section_id>', methods=['GET'])
def get_articles_for_section(section_id):
    """
    GET /articles/section/<section_id>
    Fetch all articles for a given section (including "unlisted").
    Returns: JSON array of article objects, ordered by creation date (newest first).
    """
    try:
        articles_ref = db.collection(ARTICLES_COLLECTION)
        articles_query = articles_ref.where('sectionId', '==', section_id).order_by('createdAt', direction=firestore.Query.DESCENDING)
        
        articles = []
        for doc in articles_query.stream():
            article_data = doc.to_dict()
            article_data['id'] = doc.id
            articles.append(article_data)
        
        return jsonify(articles), 200

    except Exception as e:
        app.logger.error(f"Error fetching articles for section {section_id}: {e}")
        return jsonify({"error": f"Failed to fetch articles: {str(e)}"}), 500

@app.route('/articles/<article_id>', methods=['PUT'])
def update_article(article_id):
    """
    PUT /articles/<article_id>
    Update an article (read status, section, notes, tags, etc.).
    Request Body: Any combination of {"read": bool, "sectionId": str, "notes": str, "tags": list, "title": str}
    Returns: The updated article object.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    
    try:
        article_ref = db.collection(ARTICLES_COLLECTION).document(article_id)
        article_doc = article_ref.get()
        
        if not article_doc.exists:
            return jsonify({"error": "Article not found"}), 404

        # Build update dictionary with only provided fields
        update_data = {}
        
        if 'read' in data:
            update_data['read'] = bool(data['read'])
        if 'sectionId' in data:
            update_data['sectionId'] = data['sectionId']
        if 'notes' in data:
            update_data['notes'] = data['notes']
        if 'tags' in data:
            update_data['tags'] = data['tags'] if isinstance(data['tags'], list) else []
        if 'title' in data:
            update_data['title'] = data['title']
        if 'url' in data:
            update_data['url'] = data['url']

        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400

        # Update the document
        article_ref.update(update_data)
        
        # Fetch and return the updated article
        updated_doc = article_ref.get()
        updated_article = updated_doc.to_dict()
        updated_article['id'] = article_id
        
        return jsonify(updated_article), 200

    except Exception as e:
        app.logger.error(f"Error updating article {article_id}: {e}")
        return jsonify({"error": f"Failed to update article: {str(e)}"}), 500

@app.route('/articles/<article_id>', methods=['DELETE'])
def delete_article(article_id):
    """
    DELETE /articles/<article_id>
    Delete a single article.
    Returns: Success message.
    """
    try:
        article_ref = db.collection(ARTICLES_COLLECTION).document(article_id)
        article_ref.delete()
        
        return jsonify({
            "success": True,
            "message": "Article deleted successfully."
        }), 200

    except Exception as e:
        app.logger.error(f"Error deleting article {article_id}: {e}")
        return jsonify({"error": f"Failed to delete article: {str(e)}"}), 500

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    # For local development only
    # In production, Gunicorn will serve the app
    app.run(debug=True, port=8080)
