# QUBCloud-FraudGuard — Frontend (web page, served by Node.js)
# fgfrontend40270840

Web page for QUBCloud-FraudGuard. Paste a batch of transactions, then:

- **Screen:** shows a decision for each transaction (OK / SUSPICIOUS / ERROR)
- **Tally by country:** shows how many transactions came from each country
- **Save batch / Recall:** saves the batch and returns an ID, or restores a saved batch by ID

All backend calls go through two custom proxy endpoints. If one is unreachable or returns an error, the page fails over to the other, and shows a clear message if both fail.

Part of [QUBCloud-FraudGuard](https://github.com/QUBFraudGuard).

## How it works

- `server.js` is a small Node server that delivers the page files and generates a `/config.js` file telling the page where the backends are, so addresses can change without a code edit or rebuild.
- The page runs in your browser, so the addresses must be ones your browser can reach (for example `http://localhost:...`), not internal container names.
- Failover: on a network error or non-2xx response, the page moves to the next proxy endpoint. Each new request starts again from the first.

## Run it

```bash
git clone https://github.com/QUBFraudGuard/fgfrontend40270840.git
cd fgfrontend40270840
docker build -t fgfrontend40270840 .
docker run -d --name fgfrontend -p 8080:8080 fgfrontend40270840
```

Open http://localhost:8080. Add `-e` flags for the settings above. The buttons only work when the proxy and the services behind it are running.

To stop and remove it:

```bash
docker rm -f fgfrontend
```
