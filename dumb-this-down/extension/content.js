// content.js — runs on every page the user visits

const DTD_BUTTON_ENABLED_KEY = "buttonEnabled";

document.getElementById("dtd-button")?.remove();

chrome.storage.local.get([DTD_BUTTON_ENABLED_KEY], ({ buttonEnabled }) => {
  if (buttonEnabled !== false) {
    createDtdButton();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[DTD_BUTTON_ENABLED_KEY]) {
    return;
  }

  if (changes[DTD_BUTTON_ENABLED_KEY].newValue === false) {
    document.getElementById("dtd-button")?.remove();
    document.getElementById("dtd-result-panel")?.remove();
    return;
  }

  createDtdButton();
});

function createDtdButton() {
  if (document.getElementById("dtd-button")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "dtd-button";
  button.innerText = "D";

  Object.assign(button.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "999999",
    width: "48px",
    height: "48px",
    padding: "0",
    background: "#c1121f",
    color: "#ffffff",
    border: "1px solid #9f0f1a",
    borderRadius: "50%",
    fontSize: "22px",
    fontWeight: "800",
    fontFamily:
      '"Helvetica Neue", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    letterSpacing: "0",
    lineHeight: "1",
    textAlign: "center",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(70, 10, 14, 0.22)",
    transition: "transform 0.18s ease, background-color 0.18s ease",
  });

  button.addEventListener("mouseenter", () => {
    button.style.transform = "translateY(-1px)";
    button.style.backgroundColor = "#a30d19";
  });
  button.addEventListener("mouseleave", () => {
    button.style.transform = "translateY(0)";
    button.style.backgroundColor = "#c1121f";
  });

  button.addEventListener("click", async () => {
    // Read selected text, fall back to first 1000 chars of body
    const selected = window.getSelection().toString().trim();
    const text = selected || document.body.innerText.slice(0, 1000);

    if (!text) {
      alert("Nothing to simplify — highlight some text first.");
      return;
    }

    chrome.storage.local.set({ status: "loading", result: "" });

    showDtdPanel("Simplifying...", "loading");
    button.innerText = "...";
    button.disabled = true;
    button.style.cursor = "wait";
    button.style.backgroundColor = "#8f1018";

    try {
      const data = await chrome.runtime.sendMessage({
        type: "SIMPLIFY_TEXT",
        text,
      });

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.simplified) {
        throw new Error("The API response did not include simplified text.");
      }

      // Cache the result so the popup can read it
      chrome.storage.local.set({ status: "done", result: data.simplified });
      showDtdPanel(data.simplified, "done");
    } catch (err) {
      const message = `Error: ${err.message}`;
      chrome.storage.local.set({
        status: "error",
        result: message,
      });
      showDtdPanel(message, "error");
    } finally {
      button.innerText = "D";
      button.disabled = false;
      button.style.cursor = "pointer";
      button.style.backgroundColor = "#c1121f";
    }
  });

  document.body.appendChild(button);
}

function showDtdPanel(message, status) {
  let panel = document.getElementById("dtd-result-panel");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "dtd-result-panel";

    const closeButton = document.createElement("button");
    closeButton.id = "dtd-result-close";
    closeButton.type = "button";
    closeButton.innerText = "x";
    closeButton.addEventListener("click", () => {
      panel.style.display = "none";
    });

    const title = document.createElement("div");
    title.id = "dtd-result-title";
    title.innerText = "Dumbed Down";

    const body = document.createElement("div");
    body.id = "dtd-result-body";

    panel.append(closeButton, title, body);
    document.body.appendChild(panel);

    Object.assign(panel.style, {
      position: "fixed",
      right: "24px",
      bottom: "84px",
      zIndex: "999999",
      width: "min(340px, calc(100vw - 40px))",
      maxHeight: "min(420px, calc(100vh - 40px))",
      overflowY: "auto",
      padding: "18px 18px 16px",
      background: "#fffdf7",
      color: "#321614",
      border: "1px solid #efdcc6",
      borderRadius: "18px",
      boxShadow: "0 14px 34px rgba(70, 10, 14, 0.22)",
      transformOrigin: "calc(100% - 24px) 100%",
      fontFamily:
        '"Helvetica Neue", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    });

    Object.assign(closeButton.style, {
      position: "absolute",
      top: "10px",
      right: "12px",
      width: "24px",
      height: "24px",
      border: "0",
      borderRadius: "50%",
      background: "#f8ead9",
      color: "#6f1d1b",
      cursor: "pointer",
      fontSize: "14px",
      lineHeight: "1",
    });

    Object.assign(title.style, {
      marginBottom: "10px",
      paddingRight: "30px",
      color: "#a71318",
      fontSize: "14px",
      fontWeight: "800",
      letterSpacing: "0",
    });

    Object.assign(body.style, {
      color: "#321614",
      fontSize: "14px",
      lineHeight: "1.6",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    });
  }

  const title = panel.querySelector("#dtd-result-title");
  const body = panel.querySelector("#dtd-result-body");

  title.innerText = status === "error" ? "Something went wrong" : "Dumbed Down";
  body.innerText = message;
  panel.style.display = "block";
  panel.style.borderColor = status === "error" ? "#c1121f" : "#efdcc6";
  panel.animate(
    [
      {
        opacity: 0,
        transform: "translateY(18px) scaleX(0.2) scaleY(0.08)",
        borderRadius: "999px",
      },
      {
        opacity: 0.9,
        transform: "translateY(-4px) scaleX(0.92) scaleY(1.03)",
        borderRadius: "22px",
      },
      {
        opacity: 1,
        transform: "translateY(0) scaleX(1) scaleY(1)",
        borderRadius: "18px",
      },
    ],
    {
      duration: 360,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    }
  );
}
