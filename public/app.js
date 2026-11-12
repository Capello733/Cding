const form = document.getElementById("snippet-form");
const titleInput = document.getElementById("title");
const languageInput = document.getElementById("language");
const descriptionInput = document.getElementById("description");
const codeInput = document.getElementById("code");
const listEl = document.getElementById("snippet-list");
const searchInput = document.getElementById("search");

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

async function fetchSnippets() {
  return requestJson("/api/snippets");
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createSnippetCard(snippet) {
  const card = makeElement("article", "snippet-card");
  const meta = makeElement("div", "snippet-meta");
  const details = document.createElement("div");
  const title = makeElement("h3", "", snippet.title || "Untitled");
  const language = makeElement("span", "tag", snippet.language || "plaintext");
  const date = makeElement(
    "span",
    "small",
    snippet.createdAt ? new Date(snippet.createdAt).toLocaleDateString() : ""
  );
  const description = makeElement(
    "div",
    "snippet-description",
    snippet.description || "No description"
  );
  const code = makeElement("code", "", snippet.code || "");
  const preview = makeElement("pre", "code-preview");
  const actions = makeElement("div", "snippet-actions");
  const copyButton = makeElement("button", "copy-btn", "Copy code");
  const deleteButton = makeElement("button", "delete-btn", "Delete");

  details.append(title, language);
  meta.append(details, date);
  preview.append(code);

  copyButton.type = "button";
  copyButton.dataset.action = "copy";
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";

  // Store the ID as an attribute and access it through dataset in the delegated handler.
  copyButton.dataset.id = snippet.id;
  deleteButton.dataset.id = snippet.id;
  actions.append(copyButton, deleteButton);
  card.append(meta, description, preview, actions);

  return card;
}

function renderMessage(message, className = "empty-state") {
  listEl.replaceChildren(makeElement("p", className, message));
}

async function renderSnippets() {
  try {
    const query = searchInput.value.trim().toLowerCase();
    const snippets = await fetchSnippets();
    const filtered = snippets.filter((snippet) => {
      const haystack = [snippet.title, snippet.language, snippet.description, snippet.code]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      renderMessage(query ? "No snippets match your search." : "No snippets yet. Add one to get started.");
      return;
    }

    listEl.replaceChildren(...filtered.map(createSnippetCard));
  } catch (error) {
    console.error("Could not load snippets:", error);
    renderMessage("Could not load snippets. Check that the server is running and try again.", "error-state");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    title: titleInput.value.trim(),
    language: languageInput.value.trim() || "plaintext",
    description: descriptionInput.value.trim(),
    code: codeInput.value.trim()
  };

  if (!payload.title || !payload.code) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Saving…";

  try {
    await requestJson("/api/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    form.reset();
    languageInput.value = "javascript";
    await renderSnippets();
  } catch (error) {
    console.error("Could not save snippet:", error);
    alert("Could not save the snippet. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});

listEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { id, action } = button.dataset;
  if (!id) return;

  if (action === "copy") {
    const code = button.closest(".snippet-card")?.querySelector(".code-preview code")?.textContent || "";
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "Copied!";
      setTimeout(() => { button.textContent = "Copy code"; }, 1500);
    } catch (error) {
      console.error("Could not copy code:", error);
      alert("Clipboard access is unavailable in this browser.");
    }
    return;
  }

  if (action === "delete") {
    if (!window.confirm("Delete this snippet? This cannot be undone.")) return;

    button.disabled = true;
    try {
      await requestJson(`/api/snippets/${encodeURIComponent(id)}`, { method: "DELETE" });
      await renderSnippets();
    } catch (error) {
      console.error("Could not delete snippet:", error);
      alert("Could not delete the snippet. Please try again.");
      button.disabled = false;
    }
  }
});

searchInput.addEventListener("input", renderSnippets);
renderSnippets();
