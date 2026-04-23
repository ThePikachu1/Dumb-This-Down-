// popup.js — renders whatever content.js stored in chrome.storage.local

const statusArea = document.getElementById("status-area");
const resultText = document.getElementById("result-text");
const copyBtn = document.getElementById("copy-btn");
const buttonToggle = document.getElementById("button-toggle");
const buttonToggleLabel = document.getElementById("button-toggle-label");
const BUTTON_ENABLED_KEY = "buttonEnabled";

function renderButtonToggle(enabled) {
  buttonToggle.checked = enabled;
  buttonToggleLabel.textContent = enabled ? "Enabled" : "Disabled";
}

function render(status, result) {
  statusArea.className = "";

  if (status === "loading") {
    statusArea.className = "loading";
    statusArea.textContent = "Simplifying... please wait.";
    resultText.style.display = "none";
    copyBtn.style.display = "none";
    return;
  }

  if (status === "error") {
    statusArea.className = "error";
    statusArea.textContent = result || "Something went wrong.";
    resultText.style.display = "none";
    copyBtn.style.display = "none";
    return;
  }

  if (status === "done" && result) {
    statusArea.textContent = "Here's your simplified version:";
    resultText.style.display = "block";
    resultText.textContent = result;
    copyBtn.style.display = "block";
    return;
  }

  // Default idle state
  statusArea.innerHTML =
    'Highlight text on the page and click <strong>Dumb It Down</strong>.';
  resultText.style.display = "none";
  copyBtn.style.display = "none";
}

// Read current state when popup opens
chrome.storage.local.get(
  ["status", "result", BUTTON_ENABLED_KEY],
  ({ status, result, buttonEnabled }) => {
    renderButtonToggle(buttonEnabled !== false);
    render(status, result);
  }
);

// Listen for updates while popup is open (e.g. result comes in)
chrome.storage.onChanged.addListener((changes) => {
  const status =
    changes.status?.newValue ?? null;
  const result =
    changes.result?.newValue ?? null;

  if (status !== null) {

    chrome.storage.local.get(["status", "result"], ({ status, result }) => {
      render(status, result);
    });
  }

  if (changes[BUTTON_ENABLED_KEY]) {
    renderButtonToggle(changes[BUTTON_ENABLED_KEY].newValue !== false);
  }
});

buttonToggle.addEventListener("change", () => {
  chrome.storage.local.set({ [BUTTON_ENABLED_KEY]: buttonToggle.checked });
  renderButtonToggle(buttonToggle.checked);
});

// Copy button
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(resultText.textContent).then(() => {
    copyBtn.textContent = "Copied!";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "Copy to Clipboard";
      copyBtn.classList.remove("copied");
    }, 2000);
  });
});
