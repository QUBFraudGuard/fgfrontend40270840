// ============================================================================
// server.js  —  THE FRONTEND WEB SERVER (Node.js, no extra libraries)
// ============================================================================
//
// This little server's only job is to hand the web page files (the HTML, CSS,
// and JavaScript inside the ./public folder) to a browser when someone opens
// http://localhost:8080. It does NOT do any fraud checking.
//
// It uses ONLY Node's built-in tools (http, fs, path) — no downloaded
// libraries — so there is nothing extra to install.
//
// One clever bit: it also creates a small file called /config.js on the fly,
// which tells the web page WHERE the two backend services are. That way we can
// point the page at different backends just by changing a setting, without
// editing the page itself.
// ============================================================================

const http = require("http"); // lets us run a web server
const fs = require("fs"); // lets us read files from disk
const path = require("path"); // helps build safe file paths

// Settings, read from environment variables with sensible defaults.
const PORT = parseInt(process.env.PORT || "8080", 10);
// The two backend services the web page calls directly (no gateway in between).
// The browser must be able to reach these, so they use host addresses.
const SCREENING_URL = process.env.SCREENING_URL || "http://localhost:8070";
const TALLY_URL = process.env.TALLY_URL || "http://localhost:8071";

// The folder that holds the web page files.
const PUBLIC_DIR = path.join(__dirname, "public");

// A lookup table so we can tell the browser what KIND of file we're sending.
// (Browsers need this so they treat .png as an image, .css as a stylesheet, etc.)
const CONTENT_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

// This function runs for EVERY request the browser makes.
const server = http.createServer((req, res) => {
  // Remove anything after "?" and treat the home page "/" as index.html.
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/") urlPath = "/index.html";

  // Special case: when the page asks for /config.js, we don't read a file —
  // we generate it right here, inserting both backend addresses. The page then
  // knows where to send its "Screen" and "Tally" requests.
  if (urlPath === "/config.js") {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(
      `const SCREENING_URL = ${JSON.stringify(SCREENING_URL)};\n` +
        `const TALLY_URL = ${JSON.stringify(TALLY_URL)};`
    );
    return;
  }

  // Work out which file on disk was requested.
  const filePath = path.join(PUBLIC_DIR, urlPath);

  // SECURITY: make sure the path is still inside the public folder. This stops
  // a sneaky request like "/../server.js" from reaching files it shouldn't.
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); // 403 = Forbidden
    res.end("Forbidden");
    return;
  }

  // Try to read the file and send it back.
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); // 404 = Not Found
      res.end("Not found");
      return;
    }
    // Look up the right content type from the file's extension (default to text).
    const type = CONTENT_TYPES[path.extname(filePath)] || "text/plain";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

// Start listening. "0.0.0.0" lets the container be reached from outside.
server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `frontend serving ./public on :${PORT} ` +
      `(screening=${SCREENING_URL}, tally=${TALLY_URL})`
  );
});
