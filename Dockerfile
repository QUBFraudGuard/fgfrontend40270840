# Node-served frontend — static HTML/CSS/JS served by a tiny Node server.
# Built and run as its own individual container (no docker-compose).
FROM node:20-alpine
WORKDIR /app

# No runtime dependencies, but keep the install step so the pattern matches the
# other services and stays ready if a dependency is ever added.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# The browser reaches the two backend services over host-reachable URLs.
# (These defaults suit local running; override them when deploying.)
ENV SCREENING_URL=http://screening.40270840.qpc.qubcloud.uk/
ENV TALLY_URL=http://countrytally.40270840.qpc.qubcloud.uk/
EXPOSE 8080

# server.js serves ./public on 0.0.0.0:8080.
CMD ["node", "server.js"]
