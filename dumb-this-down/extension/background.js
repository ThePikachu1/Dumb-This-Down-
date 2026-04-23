importScripts("config.js");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SIMPLIFY_TEXT") {
    return false;
  }

  simplifyText(message.text)
    .then(sendResponse)
    .catch((err) => {
      sendResponse({ error: err.message || "Request failed." });
    });

  return true;
});

async function simplifyText(text) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}
