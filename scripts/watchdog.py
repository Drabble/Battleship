import http.client
import os
import re
import signal
import http.server
import socketserver
import subprocess
import time
from threading import Thread


ADDRESS = 'localhost'
PORT = 4200
PATH = '/status'

DIR = os.path.dirname(os.path.realpath(__file__))+'/../'
CMD = r'npm start'

proc = None


class KillerThread(Thread):
    def run(self):
        
        class Handler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                global proc
                os.kill(proc.pid, signal.SIGTERM)

        with socketserver.TCPServer(("", 4242), Handler) as httpd:
            httpd.serve_forever()


def start_server():
    global proc
    proc = subprocess.Popen(CMD, cwd=DIR, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f'Server started (PID: {proc.pid})')

def restart_server():
    global proc
    if proc:
        print(f'Server killed')
        proc.terminate()
    start_server()

def is_available():
    conn = http.client.HTTPConnection(ADDRESS, PORT, timeout=2)
    try:
        conn.request('HEAD', PATH)
    except ConnectionRefusedError:
        conn.close()
        return False
    if re.match("^[23]\d\d$", str(conn.getresponse().status)):
        conn.close()
        return True
    conn.close()
    return False

start_server()

kt = KillerThread()
kt.start()

time.sleep(2)

while (True):
    if not is_available():
        restart_server()
    time.sleep(10)
