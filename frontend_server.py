import os
import json
import logging
import socketserver
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def do_GET(self):
        # Parse the URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        # Handle API requests by proxying to backend
        if path.startswith('/api/'):
            self.proxy_to_backend()
            return

        # Handle data requests by proxying to backend
        if path.startswith('/data/'):
            self.proxy_to_backend()
            return

        # Try to serve the requested file
        try:
            super().do_GET()
        except Exception:
            # If file not found, serve index.html for SPA routing
            self.serve_index_html()

    def do_POST(self):
        # Handle API and data requests by proxying to backend
        if self.path.startswith('/api/') or self.path.startswith('/data/'):
            self.proxy_to_backend()
            return
        
        self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_cors_headers()
        self.end_headers()

    def serve_index_html(self):
        try:
            self.send_response(HTTPStatus.OK)
            self.send_header('Content-type', 'text/html')
            self.send_cors_headers()
            self.end_headers()
            
            with open(os.path.join(self.directory, 'index.html'), 'rb') as f:
                self.wfile.write(f.read())
        except Exception as e:
            logger.error(f"Error serving index.html: {e}")
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR)

    def proxy_to_backend(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        backend_url = f'http://localhost:8000{self.path}'
        try:
            response = requests.request(
                method=self.command,
                url=backend_url,
                data=body,
                headers={k: v for k, v in self.headers.items() if k.lower() not in ['host', 'content-length']},
                allow_redirects=False
            )

            self.send_response(response.status_code)
            self.send_cors_headers()
            
            # Forward response headers
            for key, value in response.headers.items():
                if key.lower() not in ['server', 'date', 'transfer-encoding']:
                    self.send_header(key, value)
            
            self.end_headers()
            self.wfile.write(response.content)

        except Exception as e:
            logger.error(f"Error proxying request to backend: {e}")
            self.send_error(HTTPStatus.BAD_GATEWAY)

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        logger.info(format % args)

def run_server():
    port = 3001  # Temporary for debugging
    print(f"Starting server on port {port}...")
    with socketserver.TCPServer(("", port), RequestHandler) as httpd:
        logger.info(f"Starting frontend server on http://localhost:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("Shutting down server...")
            httpd.shutdown()

if __name__ == '__main__':
    run_server()
