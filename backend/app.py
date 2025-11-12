from flask import Flask, request, jsonify
from flask_cors import CORS  # To handle Cross-Origin Resource Sharing
import requests
from bs4 import BeautifulSoup
import re  # For basic URL validation

app = Flask(__name__)
# Enable CORS for all routes, allowing frontend to access this API
# In a production environment, you would restrict this to specific origins (e.g., your frontend domain)
CORS(app)

@app.route('/')
def index():
    """Basic route to check if the backend is running."""
    return "Read Later Backend is running!"

@app.route('/extract-metadata', methods=['POST'])
def extract_metadata():
    """
    API endpoint to extract title and other metadata from a given URL.
    Expects a JSON payload: {"url": "https://example.com/article"}
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    # Basic URL validation (can be more robust)
    if not re.match(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', url):
        return jsonify({"error": "Invalid URL format"}), 400

    try:
        # Set a User-Agent header to mimic a real browser.
        # Some websites block requests without a user-agent.
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # Fetch the URL content
        response = requests.get(url, headers=headers, timeout=10)  # 10-second timeout
        response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)

        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')

        # --- Extract Title ---
        title = "Untitled Article"  # Fallback title

        # 1. Try Open Graph title
        og_title_tag = soup.find("meta", property="og:title")
        if og_title_tag and og_title_tag.get("content"):
            title = og_title_tag["content"]
        else:
            # 2. Fallback to <title> tag
            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.get_text(strip=True)

        # --- Extract Description ---
        description = None
        # 1. Try Open Graph description
        og_description_tag = soup.find("meta", property="og:description")
        if og_description_tag and og_description_tag.get("content"):
            description = og_description_tag["content"]
        else:
            # 2. Fallback to meta description
            meta_description_tag = soup.find("meta", attrs={"name": "description"})
            if meta_description_tag and meta_description_tag.get("content"):
                description = meta_description_tag["content"]

        # --- Extract Image ---
        image = None
        # 1. Try Open Graph image
        og_image_tag = soup.find("meta", property="og:image")
        if og_image_tag and og_image_tag.get("content"):
            image = og_image_tag["content"]

        return jsonify({
            "success": True,
            "title": title,
            "description": description,
            "image": image,
            "original_url": url  # Include the original URL for verification
        }), 200

    except requests.exceptions.RequestException as e:
        # Catch network-related errors (DNS failure, refused connection, timeout, etc.)
        app.logger.error(f"Request failed for {url}: {e}")
        return jsonify({"success": False, "error": f"Failed to fetch URL: {str(e)}"}), 500
    except Exception as e:
        # Catch any other unexpected errors during parsing or processing
        app.logger.error(f"Error processing URL {url}: {e}")
        return jsonify({"success": False, "error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    # You can change the port if 5000 is in use
    app.run(debug=True, port=5000)
