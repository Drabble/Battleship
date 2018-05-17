import http.client
import os
import re
import signal
import http.server
import socketserver
import subprocess
import time

from threading import Thread


WD_PORT = 3666

APP_ADDRESS = 'localhost'
APP_PORT = 4200
APP_PATH = '/status'

DIR = os.path.dirname(os.path.realpath(__file__))+'/../app/'
CMD = r'npm start'

proc = None


class KillerThread(Thread):
    def run(self):
        
        class KillerServer(socketserver.TCPServer):
            allow_reuse_address = True

        class KillerHandler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                global proc
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)  # Send the signal to all the process groups
                print('Bang !')

        with KillerServer(("", WD_PORT), KillerHandler) as httpd:
            httpd.serve_forever()


def start_server():
    global proc

    # The os.setsid() is passed in the argument preexec_fn so
    # it's run after the fork() and before  exec() to run the shell.
    proc = subprocess.Popen(CMD, cwd=DIR, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, preexec_fn=os.setsid) 
    
    print(f'Server started (PID: {proc.pid})')

def restart_server():
    global proc
    if proc:
        proc.terminate()
    start_server()

def is_available():
    conn = http.client.HTTPConnection(APP_ADDRESS, APP_PORT, timeout=2)
    try:
        conn.request('HEAD', APP_PATH)
    except:
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
    print('Checking server ...')
    if not is_available():
        print('Noooo it\'s dead :(')
        restart_server()
    time.sleep(10)
