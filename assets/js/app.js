const state = { parks: [], filter: "all", current: null };
const $ = (sel, root = document) => root.querySelector(sel);

async function loadParks() {
  const res = await fetch("data/parks.json");
  state.parks = await res.json();
  renderTable();
  renderPacketList();
}

function renderTable() {
  const body = $("#park-rows");
  if (!body) return;
  const rows = state.parks.filter((p) => {
    if (state.filter === "all") return true;
    if (state.filter === "first") return p.priority === "First wave" || p.priority === "High";
    return p.state === state.filter;
  });
  body.innerHTML = rows.map((p) => `
    <tr>
      <td><strong>${p.name}</strong><br><span>${p.state} · ${p.year}</span></td>
      <td>${p.vfgRole}</td>
      <td>${p.likelyCouncil}</td>
      <td>${p.accessLaw}</td>
      <td>${p.priority}</td>
      <td>${p.trainDefault}</td>
    </tr>
  `).join("");
}

function renderPacketList() {
  const list = $("#park-list");
  if (!list) return;
  list.innerHTML = state.parks.map((p) => `
    <button type="button" data-id="${p.id}">
      <strong>${p.name}</strong><br>
      <small>${p.state} · ${p.priority}</small>
    </button>
  `).join("");
  list.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => selectPark(btn.dataset.id));
  });
  if (!state.current && state.parks[0]) selectPark("barham");
}

function selectPark(id) {
  const park = state.parks.find((p) => p.id === id);
  if (!park) return;
  state.current = park;
  document.querySelectorAll("#park-list button").forEach((b) => {
    b.classList.toggle("active", b.dataset.id === id);
  });
  $("#f-name").value = park.name;
  $("#f-state").value = park.state;
  $("#f-council").value = park.likelyCouncil;
  $("#f-law").value = park.accessLaw;
  $("#f-role").value = park.vfgRole;
  $("#f-source").value = "public-page";
  $("#f-form").value = "public-pdf-or-photo";
  $("#f-owner").value = park.vfgRole.toLowerCase().includes("design") ? "VFG (design likely)" : "Designer or council — confirm";
  $("#f-train").value = "no";
  $("#f-notes").value = park.notes;
  renderYaml();
}

function packetObject() {
  const park = state.current || {};
  return {
    id: park.id || "unnamed",
    name: $("#f-name").value,
    state: $("#f-state").value,
    council: $("#f-council").value,
    access_law: $("#f-law").value,
    vfg_role: $("#f-role").value,
    source: $("#f-source").value,
    form_of_access: $("#f-form").value,
    copyright_owner: $("#f-owner").value,
    train: $("#f-train").value,
    notes: $("#f-notes").value,
    collected: new Date().toISOString().slice(0, 10),
    method: "Luke's Relevance 2012 — object of life first, then threads",
    engine: "australian-legal-engine asks and cites; this packet does not invent law"
  };
}

function renderYaml() {
  const o = packetObject();
  const gate = o.train === "yes" ? "OPEN" : "CLOSED";
  const klass = o.train === "yes" ? "gate-yes" : "gate-no";
  $("#yaml").innerHTML = `<span class="${klass}"># training gate: ${gate}</span>
id: ${o.id}
name: ${o.name}
state: ${o.state}
council: ${o.council}
access_law: ${o.access_law}
vfg_role: ${o.vfg_role}
source: ${o.source}
form_of_access: ${o.form_of_access}
copyright_owner: ${o.copyright_owner}
train: ${o.train}
notes: >
  ${o.notes.replace(/\n/g, "\n  ")}
collected: ${o.collected}
method: "${o.method}"
engine: "${o.engine}"`;
}

function downloadPacket() {
  const o = packetObject();
  const blob = new Blob([JSON.stringify(o, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${o.id || "park"}-access-packet.json`;
  a.click();
}

function wireFilters() {
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      renderTable();
    });
  });
}

function wireForm() {
  const form = $("#packet-form");
  if (!form) return;
  form.addEventListener("input", renderYaml);
  $("#download-packet")?.addEventListener("click", downloadPacket);
  $("#copy-packet")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#yaml").innerText);
    $("#copy-packet").textContent = "Copied";
    setTimeout(() => { $("#copy-packet").textContent = "Copy packet"; }, 1200);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadParks();
  wireFilters();
  wireForm();
});
