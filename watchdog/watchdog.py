#!/usr/bin/env python3

import docker
import http.client
import re
import sys
import time

import config


def restart_app():
    config.container.restart()
    try:
        config.network.connect(config.container)
    except docker.errors.APIError:
        pass
    print('App restarted')

def is_available():
    conn = http.client.HTTPConnection(config.APP_ADDRESS, config.APP_PORT, timeout=1)
    try:
        conn.request('HEAD', config.APP_PATH)
        status = conn.getresponse().status
        if re.match("^[23]\d\d$", str(status)) is not None:
            conn.close()
            return True
    except Exception as e:
        print(str(e))
    conn.close()
    return False


if __name__ == '__main__':
    n = 0
    while (True):
        print('Checking app ...')
        if not is_available():
            print('Maybe it\'s dead')
            n = n+1
            if n >= 5:
                print('Noooo it\'s really dead :(')
                restart_app()
                n = 0
        else:
            n = 0
        sys.stdout.flush()
        time.sleep(1)
