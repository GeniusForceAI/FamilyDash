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
            logger.info(f"Received API request: {self.path}")
            self.proxy_to_backend()
            return

        # Handle data requests by proxying to backend
        if path.startswith('/data/'):
            logger.info(f"Received data request: {self.path}")
            self.proxy_to_backend()
            return

        # Handle root path
        if path == '/' or path == '/index.html':
            try:
                self.send_response(HTTPStatus.OK)
                self.send_header('Content-type', 'text/html')
                self.send_cors_headers()
                self.end_headers()
                
                with open(os.path.join(self.directory, 'index.html'), 'rb') as f:
                    self.wfile.write(f.read())
                return
            except Exception as e:
                logger.error(f"Error serving index.html: {e}")
                self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR)
                return

        # Try to serve static files
        try:
            # If the file exists, serve it directly
            file_path = os.path.join(self.directory, path.lstrip('/'))
            if os.path.exists(file_path) and os.path.isfile(file_path):
                self.send_response(HTTPStatus.OK)
                
                # Set content type based on file extension
                if path.endswith('.html'):
                    self.send_header('Content-type', 'text/html')
                elif path.endswith('.css'):
                    self.send_header('Content-type', 'text/css')
                elif path.endswith('.js'):
                    self.send_header('Content-type', 'application/javascript')
                elif path.endswith('.json'):
                    self.send_header('Content-type', 'application/json')
                elif path.endswith('.png'):
                    self.send_header('Content-type', 'image/png')
                elif path.endswith('.jpg') or path.endswith('.jpeg'):
                    self.send_header('Content-type', 'image/jpeg')
                else:
                    self.send_header('Content-type', 'application/octet-stream')
                
                self.send_cors_headers()
                self.end_headers()
                
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
        except Exception as e:
            logger.error(f"Error serving static file {path}: {e}")
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        # For all other paths, serve 404
        self.send_error(HTTPStatus.NOT_FOUND)

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

    def proxy_to_backend(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        backend_url = f'http://localhost:8000{self.path}'
        logger.info(f"Proxying request to backend: {self.command} {backend_url}")
        
        try:
            # Forward all headers except host and content-length
            headers = {
                k: v for k, v in self.headers.items() 
                if k.lower() not in ['host', 'content-length']
            }
            
            # Add content type for POST requests if not present
            if self.command == 'POST' and 'content-type' not in {k.lower(): v for k, v in headers.items()}:
                headers['Content-Type'] = 'application/json'

            logger.info(f"Request headers: {headers}")
            if body:
                logger.info(f"Request body: {body.decode()}")
            
            # Print detailed request information for debugging
            logger.info(f"Making {self.command} request to {backend_url}")
            logger.info(f"With headers: {json.dumps(headers, indent=2)}")
            if body:
                try:
                    body_json = json.loads(body.decode())
                    logger.info(f"With body: {json.dumps(body_json, indent=2)}")
                except:
                    logger.info(f"With raw body: {body.decode()}")
            
            response = requests.request(
                method=self.command,
                url=backend_url,
                data=body,
                headers=headers,
                allow_redirects=False,
                timeout=10  # Add timeout to prevent hanging
            )

            logger.info(f"Backend response status: {response.status_code}")
            logger.info(f"Response headers: {response.headers}")
            
            # Log response content in a readable format
            try:
                response_json = response.json()
                logger.info(f"Response content (JSON): {json.dumps(response_json, indent=2)}")
            except:
                logger.info(f"Response content: {response.content.decode()}")

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
            import traceback
            logger.error(traceback.format_exc())
            self.send_error(HTTPStatus.BAD_GATEWAY)

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Max-Age', '86400')  # Cache preflight for 24 hours

    def log_message(self, format, *args):
        logger.info(format % args)

def run_server():
    port = 3000
    print(f"Starting server on port {port}...")
    
    # Allow socket reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", port), RequestHandler) as httpd:
        logger.info(f"Starting frontend server on http://localhost:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("Shutting down server...")
            httpd.shutdown()

if __name__ == '__main__':
    run_server()
