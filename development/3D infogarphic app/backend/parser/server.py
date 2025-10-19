#!/usr/bin/env python3
"""Simple static HTTP server for serving the frontend preview directory."""
import argparse
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

def main():
    ap = argparse.ArgumentParser(description='Serve a directory over HTTP')
    ap.add_argument('--dir', required=True, help='Directory to serve')
    ap.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    ap.add_argument('--port', type=int, default=8000, help='Port to bind to')
    args = ap.parse_args()

    serve_dir = args.dir
    host = args.host
    port = args.port

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=serve_dir, **kw)

    server = ThreadingHTTPServer((host, port), Handler)
    print(f'Serving {serve_dir} at http://{host}:{port}/')
    print('Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('Shutting down server...')
        server.shutdown()
        server.server_close()

if __name__ == '__main__':
    main()