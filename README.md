# QUBCloud-FraudGuard — Frontend (web page, served by Node.js)

This is **the web page** of the QUBCloud-FraudGuard app — the part you see in
the browser. You paste a batch of transactions, then click a button:

- **Screen** → shows a decision for each transaction (OK / SUSPICIOUS / ERROR).
- **Tally by country** → shows how many transactions came from each country.

Each button calls a **different backend service directly** — there is no
"gateway" or middle man.

> The app is made of three separate repositories:
>
> ```
>                       ┌──▶ screening-service  ("Screen" button)
>   frontend (THIS repo)┤
>                       └──▶ country-tally-service  ("Tally" button)
> ```
>
> The page itself loads on its own, but a button only returns results when the
> backend it calls is running and reachable from your browser.

---

## How it works

- `server.js` is a tiny Node server whose only job is to deliver the page files
  (HTML, CSS, JavaScript, the logo) to the browser.
- The page does **not** hard-code the backend addresses. Instead, `server.js`
  generates a small `/config.js` file that tells the page where the two backends
  are. So you can point the page at different backends just by changing a
  setting — no code edit, no rebuild.
- Because the page runs **inside your browser**, the backend addresses must be
  ones your browser can reach (e.g. `http://localhost:8070`), not internal
  container names.

---

## Settings (environment variables)

Read when the server starts, so nothing is hard-coded:

| Setting         | Default                  | What it does                                     |
|-----------------|--------------------------|--------------------------------------------------|
| `SCREENING_URL` | `http://localhost:8070`  | Address of the **screening** service (Screen button). |
| `TALLY_URL`     | `http://localhost:8071`  | Address of the **country-tally** service (Tally button). |
| `PORT`          | `8080`                   | The port the page is served on.                  |

---

## How to build and run it (Docker)

From inside this repository:

```bash
# 1. Build the image
docker build -t frontend .

# 2. Run it (served on port 8080, pointing at the two backends on localhost)
docker run -d --name frontend -p 8080:8080 \
  -e SCREENING_URL=http://localhost:8070 \
  -e TALLY_URL=http://localhost:8071 \
  frontend

# 3. Open the page
#    http://localhost:8080
```

The page will load on its own. For the **Screen** button to work, the screening
service must be running on `http://localhost:8070`; for the **Tally** button,
the country-tally service must be running on `http://localhost:8071`. See those
repositories for how to start them.

Stop and remove when done:

```bash
docker rm -f frontend
```

---

## The code (what each file is)

| File                | What it does                                                 |
|---------------------|--------------------------------------------------------------|
| `public/index.html` | The page layout and styling (the QUB-branded look).          |
| `public/app.js`     | The page's behaviour — calls the backends, draws the tables. |
| `public/QUB_*.png`  | The QUB logo shown in the header.                           |
| `server.js`         | The tiny server that delivers the page files + `config.js`.  |
| `Dockerfile`        | How to build the container image.                            |

This service uses **only Node's built-in tools** — there are no libraries to
install. Every file has plain-English comments — open them and read along.

---

## Note for students

The page's error handling is deliberately basic: each button uses **one fixed
backend address** and shows a single generic "something went wrong" message.
Making it robust (trying a backup service, retrying, etc.) is **your task** in
the assignment — see the `TODO (student Task C)` comment in `public/app.js`.
