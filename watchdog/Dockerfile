FROM python:3.6

# docker prerequisitses
RUN apt-get update && \
    apt-get install -y \
      apt-transport-https \
      ca-certificates \
      curl \
      gnupg2 \
      software-properties-common
RUN curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg > /tmp/dkey
RUN apt-key add /tmp/dkey
RUN add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
   $(lsb_release -cs) \
   stable"

# install docker client
RUN apt-get update && \
    apt-get install -y docker-ce && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir /watchdog
WORKDIR /watchdog

# init watchdog
COPY requirements.txt ./
RUN pip install -r requirements.txt

# add watchdog scripts
COPY . .
RUN chmod +x *.py
RUN chmod +x *.sh

EXPOSE 3666

CMD ["bash", "/watchdog/run.sh"]
