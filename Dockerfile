FROM python:3.6

RUN apt-get update && apt-get install curl -y --force-yes python-software-properties
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y --force-yes nodejs

RUN mkdir /app
WORKDIR /app
COPY app /app
RUN npm install

RUN mkdir /watchdog
WORKDIR /watchdog
COPY watchdog /watchdog
RUN chmod +x /watchdog/watchdog.py

EXPOSE 4200 3666

WORKDIR /

CMD ["python3", "/watchdog/watchdog.py"]
