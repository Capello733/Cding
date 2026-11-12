const form = document.getElementById("snippet-form");
const titleInput = document.getElementById("title");
const languageInput = document.getElementById("language");
const descriptionInput = document.getElementById("description");
const codeInput = document.getElementById("code");
const listEl = document.getElementById("snippet-list");
const searchInput = document.getElementById("search");

async function fetchSnippets() {
  const res = await fetch("/api/snippets");
  return res.json();
}

function createSnippetCard(snippet) {
  const card = document.createElement("article");
  card.className = "snippet-card";

  card.innerHTML = `
    <div class="snippet-meta">
      <div>
        <h3>${escapeHtml(snippet.title)}</h3>
        <span class="tag">${escapeHtml(snippet.language)}</span>
      </div>
      <span class="small">${new Date(snippet.createdAt).toLocaleDateString()}</span>
    </div>
    <div class="snippet-description">${escapeHtml(snippet.description || "No description")}</div>
    <pre class="code-preview">${escapeHtml(snippet.code)}</pre>
    <button class="delete-btn" data-id="${snippet.id}">Delete</button>
  `;

  return card;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function renderSnippets() {
  const query = searchInput.value.trim().toLowerCase();
  const snippets = await fetchSnippets();

  const filtered = snippets.filter(snippet => {
    const haystack = `${snippet.title} ${snippet.language} ${snippet.description}`.toLowerCase();
    return haystack.includes(query);
  });

  listEl.innerHTML = "";
  filtered.forEach(snippet => listEl.appendChild(createSnippetCard(snippet)));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    title: titleInput.value.trim(),
    language: languageInput.value.trim() || "plaintext",
    description: descriptionInput.value.trim(),
    code: codeInput.value.trim()
  };

  if (!payload.title || !payload.code) {
    return;
  }

  await fetch("/api/snippets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  form.reset();
  languageInput.value = "javascript";
  await renderSnippets();
});

listEl.addEventListener("click", async (event) => {
  const btn = event.target.closest(".delete-btn");
  if (!btn) return;

  const id = btn.dataset.id;
  await fetch(`/api/snippets/${id}`, { method: "DELETE" });
  await renderSnippets();
});

searchInput.addEventListener("input", renderSnippets);

renderSnippets();
