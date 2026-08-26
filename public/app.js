// ============================================================================
// app.js  —  THE WEB PAGE'S BRAIN (JavaScript that runs INSIDE the browser)
// ============================================================================
//
// index.html builds what you SEE (the box, the buttons, the results table).
// This file makes it WORK. There are TWO backend services, and the page calls
// each one DIRECTLY (there is no "gateway" in between any more):
//
//     "Screen" button -> SCREENING_URL/screen -> shows OK / SUSPICIOUS / ERROR
//     "Tally"  button -> TALLY_URL/tally       -> shows a count per country
//
// SCREENING_URL and TALLY_URL (the two backend addresses) come from config.js,
// which the frontend server generates for us. We do not hard-code them here.
// ============================================================================

// ---------------------------------------------------------------------------
// "Screen" button: ask the screening service to judge each transaction.
// ---------------------------------------------------------------------------

async function callViaProxy(backendName, path, items) {
  let lastError;
  for (const base of PROXY_URLS) {
    try {
      const url = base + path + "/" + backendName + "?items=" + encodeURIComponent(items);
      const response = await fetch(url);
      if (!response.ok) throw new Error("status " + response.status);
      return await response.json();
    } catch (err) {
      lastError = err;
      continue; // try the next proxy endpoint
    }
  }
  throw lastError || new Error("all proxy endpoints unreachable");
}

function screenTransactions() {
  const items = readInput();
  clearOutput();

  Promise.all([
    callViaProxy("screening", "screen", items),
    callViaProxy("reputation", "screen", items),
  ])
    .then(([screeningData, reputationData]) => {
      const merged = mergeResults(screeningData.results, reputationData.results, items);
      renderScreenResults(merged);
    })
    .catch((err) => showError(err));
}


function mergeResults(easyResults, repResults, items) {
  const results = easyResults.map((easy, i) => {
    const rep = repResults[i];

    // A malformed transaction is malformed regardless of which service
    // caught it first — but prefer whichever result actually flags ERROR.
    if (easy.decision === "ERROR") return easy;
    if (rep && rep.decision === "ERROR") return rep;

    // Easy checks (amount/blocklist/country) take priority if suspicious.
    if (easy.decision === "SUSPICIOUS") return easy;

    // Otherwise defer to the reputation service's decision.
    if (rep && rep.decision === "SUSPICIOUS") return rep;

    return easy; // both OK
  });

  const flagged = results.filter((r) => r.decision === "SUSPICIOUS").length;

  return {
    results: results,
    total_checked: results.length,
    flagged: flagged,
  };
}



// ---------------------------------------------------------------------------
// "Tally" button: ask the country-tally service to count by country.
// ---------------------------------------------------------------------------
function tallyTransactions() {
  const items = readInput();
  clearOutput();

  callViaProxy("tally", "tally", items)
    .then((data) => renderTallyResults(data))
    .catch((err) => showError(err));
}

// ---------------------------------------------------------------------------
// Draw the SCREENING results: one table row per transaction.
// ---------------------------------------------------------------------------
function renderScreenResults(data) {
  const summary = document.getElementById("summary");
  const table = document.getElementById("results");

  // One-line summary, e.g. "Checked 4, flagged 1."
  summary.textContent =
    "Checked " + data.total_checked + ", flagged " + data.flagged + ".";

  // Header row (column titles).
  addHeaderRow(table, ["Transaction", "Decision", "Reason"]);

  // One row per transaction.
  data.results.forEach((r) => {
    const row = document.createElement("tr");
    addCell(row, r.transaction);
    addCell(row, r.decision, "decision-" + r.decision); // colour by decision
    addCell(row, r.reason || ""); // OK results have no reason
    table.appendChild(row);
  });
}

// ---------------------------------------------------------------------------
// Draw the TALLY results: one table row per country.
// ---------------------------------------------------------------------------
function renderTallyResults(data) {
  const summary = document.getElementById("summary");
  const table = document.getElementById("results");

  // One-line summary, e.g. "Counted 4 transactions across 3 countries."
  const countries = Object.keys(data.counts).length;
  summary.textContent =
    "Counted " + data.total_checked + " transactions across " +
    countries + " countries.";

  // Header row.
  addHeaderRow(table, ["Country", "Count"]);

  // One row per country. Object.entries gives us [country, count] pairs.
  Object.entries(data.counts).forEach(([country, count]) => {
    const row = document.createElement("tr");
    addCell(row, country);
    addCell(row, String(count));
    table.appendChild(row);
  });
}

// ---------------------------------------------------------------------------
// "Clear" button: empty the input box and the results.
// ---------------------------------------------------------------------------
function clearAll() {
  document.getElementById("input-text").value = "";
  clearOutput();
}

// ---------------------------------------------------------------------------
// Small helpers used by the functions above (so we don't repeat ourselves).
// ---------------------------------------------------------------------------

// Read and tidy up the text the user typed.
function readInput() {
  return document.getElementById("input-text").value.trim();
}

// Empty the summary line and the results table.
function clearOutput() {
  document.getElementById("summary").textContent = "";
  document.getElementById("results").innerHTML = "";
}

// Add a header row (the bold column titles) to a table.
function addHeaderRow(table, titles) {
  const row = document.createElement("tr");
  titles.forEach((t) => {
    const th = document.createElement("th");
    th.textContent = t;
    row.appendChild(th);
  });
  table.appendChild(row);
}

// Add one cell to a row. The optional className lets us colour it.
function addCell(row, text, className) {
  const td = document.createElement("td");
  td.textContent = text;
  if (className) td.className = className;
  row.appendChild(td);
}

// Show a friendly error message if a backend can't be reached.
//
// TODO (student Task C): this error handling is intentionally basic — one fixed
// address per service and one generic message. Making it robust (retrying,
// trying a backup service) is your job in the assignment.
function showError(err) {
  document.getElementById("summary").textContent =
    "Something went wrong contacting the service.";
  console.error(err); // print details to the browser console for debugging
}
