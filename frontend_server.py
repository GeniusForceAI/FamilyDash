from http.server import HTTPServer, SimpleHTTPRequestHandler
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FrontendHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)
    
    def do_GET(self):
        # Always serve index.html for any path that doesn't match a file
        if not os.path.exists(self.translate_path(self.path)[1:]):
            self.path = '/index.html'
        return super().do_GET()
    
    def log_message(self, format, *args):
        logger.info(format%args)

if __name__ == "__main__":
    PORT = 3000
    server = HTTPServer(('localhost', PORT), FrontendHandler)
    logger.info(f'Starting frontend server on http://localhost:{PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info('Shutting down frontend server')
        server.server_close()
