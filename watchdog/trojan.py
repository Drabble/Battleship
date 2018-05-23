#!/usr/bin/env python3

import docker
import http.server
import socketserver
import sys
import time

import config


def deconnect_app(big=False):
    try:
        config.network.disconnect(config.container)
    except docker.errors.APIError:
        pass

    if not big:
        time.sleep(3)
        try:
            config.network.connect(config.container)
        except docker.errors.APIError:
            pass


class TrojanServer(socketserver.TCPServer):
    allow_reuse_address = True


class TrojanServerHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type','text/html')
        self.end_headers()

        if self.path == '/trojan/bigbang':
            self.wfile.write(b'BIG BANG !')
            deconnect_app(big=True)
        else:
            self.wfile.write(b'Bang !')
            deconnect_app(big=False)

        self.wfile.close()
        return


if __name__ == '__main__':
    server = TrojanServer(('', config.TROJAN_PORT), TrojanServerHandler)
    server.serve_forever()
