const TABS = ["Notes (PDF)", "Web page", "Video", "Quiz"];
let TOPICS = [], QUIZ = [];
let tab = 0, query = "", notes = [], openId = null, qi = 0, score = 0, picked = null, done = false;
const $ = s => document.querySelector(s), view = $("#view");
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const match = t => t.toLowerCase().includes(query.toLowerCase());

try { $("#sname").value = localStorage.getItem("dsa-name") || ""; } catch (e) {}
$("#sname").oninput = e => { try { localStorage.setItem("dsa-name", e.target.value); } catch (x) {} };
$("#q").oninput = e => { query = e.target.value.trim(); render(); };
$("#logo").ondblclick = () => { tab = 1; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };

function renderTabs() {
  $("#tabs").innerHTML = TABS.map((t, i) => `<button class="tab ${i === tab ? "on" : ""}" data-i="${i}">${t}</button>`).join("");
  document.querySelectorAll(".tab").forEach(b => b.onclick = () => { tab = +b.dataset.i; render(); });
}

function renderNotes() {
  const list = notes.filter(n => match(n.name));
  let h = `<div class="card"><h3>Upload notes</h3><p>Choose one or more PDF files.</p>
    <div class="row"><input type="file" id="file" accept="application/pdf" multiple></div></div>`;
  h += list.length ? list.map(n => `<div class="card"><div class="item"><div><h3>📄 ${esc(n.name)}</h3><p>${n.size} KB</p></div>
    <div class="row" style="margin:0"><button class="btn" data-see="${n.id}">${openId === n.id ? "Hide" : "See"}</button>
    <a class="btn o" href="${n.url}" target="_blank" rel="noopener">New tab</a>
    <button class="btn d" data-rm="${n.id}">Remove</button></div></div>
    ${openId === n.id ? `<iframe src="${n.url}" title="${esc(n.name)}"></iframe>` : ""}</div>`).join("")
    : `<div class="empty">${notes.length ? "No notes match your search." : "No notes yet. Upload a PDF to begin."}</div>`;
  view.innerHTML = h;
  $("#file").onchange = e => {
    [...e.target.files].forEach(f => {
      if (f.type === "application/pdf" || /\.pdf$/i.test(f.name))
        notes.push({ id: Date.now() + Math.random(), name: f.name, size: Math.round(f.size / 1024), url: URL.createObjectURL(f) });
    });
    render();
  };
  view.querySelectorAll("[data-see]").forEach(b => b.onclick = () => { const id = +b.dataset.see; openId = openId === id ? null : id; render(); });
  view.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => {
    const id = +b.dataset.rm, n = notes.find(x => x.id === id);
    if (n) URL.revokeObjectURL(n.url);
    notes = notes.filter(x => x.id !== id);
    if (openId === id) openId = null;
    render();
  });
}

function renderWeb() {
  const l = TOPICS.filter(t => match(t[0] + " " + t[1]));
  view.innerHTML = l.length ? l.map(t => `<div class="card"><h3>${t[0]}</h3><p>${t[1]}</p></div>`).join("") : `<div class="empty">No topics found.</div>`;
}

function renderVideo() {
  const l = TOPICS.filter(t => match(t[0]));
  view.innerHTML = l.length ? l.map(t => `<div class="card item"><div><h3>🎬 ${t[0]}</h3><p>Video lessons on YouTube</p></div>
    <a class="btn" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(t[0] + " data structures and algorithms")}">Watch</a></div>`).join("")
    : `<div class="empty">No videos found.</div>`;
}

function renderQuiz() {
  if (!QUIZ.length) { view.innerHTML = `<div class="empty">Loading quiz…</div>`; return; }
  if (done) {
    view.innerHTML = `<div class="card"><h3>Quiz finished</h3><p>Your score: <b>${score} / ${QUIZ.length}</b></p><div class="row"><button class="btn" id="again">Try again</button></div></div>`;
    $("#again").onclick = () => { qi = 0; score = 0; picked = null; done = false; render(); };
    return;
  }
  const { q, options, answer } = QUIZ[qi];
  view.innerHTML = `<div class="card"><p>Question ${qi + 1} of ${QUIZ.length}</p><h3>${q}</h3>
    ${options.map((x, i) => `<button class="opt ${picked === null ? "" : i === answer ? "ok" : i === picked ? "no" : ""}" data-o="${i}">${x}</button>`).join("")}
    ${picked !== null ? `<div class="row"><button class="btn" id="next">${qi + 1 === QUIZ.length ? "Finish" : "Next"}</button></div>` : ""}</div>`;
  view.querySelectorAll("[data-o]").forEach(b => b.onclick = () => { if (picked !== null) return; picked = +b.dataset.o; if (picked === answer) score++; render(); });
  const n = $("#next");
  if (n) n.onclick = () => { picked = null; qi++; if (qi >= QUIZ.length) done = true; render(); };
}

function render() { renderTabs(); [renderNotes, renderWeb, renderVideo, renderQuiz][tab](); }

fetch("data.json")
  .then(r => r.json())
  .then(d => { TOPICS = d.topics; QUIZ = d.quiz; render(); })
  .catch(() => { render(); view.insertAdjacentHTML("afterbegin", `<div class="empty">Could not load data.json. Open the app through GitHub Pages or a local server.</div>`); });
