import http.server
import socketserver
import logging
import os
import urllib.request
import urllib.error

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        # Handle API requests
        if self.path.startswith('/api/'):
            self.proxy_request('GET')
            return

        # Serve index.html for all other paths (SPA routing)
        if not "." in self.path:
            self.path = '/index.html'
        
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        # Handle API requests
        if self.path.startswith('/api/'):
            self.proxy_request('POST')
            return

        self.send_error(405, "Method not allowed")

    def proxy_request(self, method):
        api_url = f'http://localhost:8000{self.path}'
        
        try:
            # Get request body for POST requests
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None

            # Create request
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'http://localhost:3001'
            }
            
            if body:
                headers['Content-Length'] = str(len(body))

            # Create request
            req = urllib.request.Request(
                api_url,
                data=body,
                method=method,
                headers=headers
            )

            # Forward request to API server
            with urllib.request.urlopen(req) as response:
                # Copy response headers
                self.send_response(response.status)
                self.send_header('Content-Type', response.headers.get('Content-Type', 'application/json'))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()

                # Copy response body
                self.wfile.write(response.read())

        except urllib.error.URLError as e:
            logger.error(f"Error proxying request to API: {e}")
            self.send_error(502, f"API server error: {str(e)}")
        except Exception as e:
            logger.error(f"Error handling request: {e}")
            self.send_error(500, f"Internal server error: {str(e)}")

    def log_message(self, format, *args):
        logger.info(format % args)

def run_server(port=3000):
    with socketserver.TCPServer(("", port), RequestHandler) as httpd:
        logger.info(f"Starting frontend server on http://localhost:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("Shutting down server")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
