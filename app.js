 
const STORE_KEY = "rb_recipes_v1";

 function genId() { 
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); 
}

// sample seed if empty
const seed = [
  {
    id: genId(),
    name: "Panqueca de Banana",
    category: 'doce',
    ingredients: ["1 banana madura", "1 ovo", "2 colheres de sopa de farinha", "Canela a gosto"],
    steps: "Amasse a banana, misture ovo e farinha, frite em frigideira antiaderente."
  },
  {
    id: genId(),
    name: "Bruschetta Rápida",
    category: 'salgada',
    ingredients: ["Pão italiano", "Tomate picado", "Manjericão", "Azeite", "Sal"],
    steps: "Torrar fatias, cobrir com tomate temperado e servir."
  }
];

let recipes = loadRecipes();
let editingId = null;
let currentCategory = "all";

 
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("recipesGrid");
  const favList = document.getElementById("favList");
  const search = document.getElementById("searchInput");
  const btnAdd = document.getElementById("btnAdd");
  const btnClearFav = document.getElementById("btnClearFav");

  renderAll();

  
  search.addEventListener("input", () => renderAll(search.value.trim()));
  btnAdd.addEventListener("click", openModalForCreate);
  btnClearFav.addEventListener("click", () => {
    localStorage.removeItem("rb_favs");
    renderFavs();
  });

  // Botões de categoria
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-cat");
      renderAll(search.value.trim());
    });
  });

   
  document.getElementById("btnCancel").addEventListener("click", closeModal);
  document.getElementById("recipeForm").addEventListener("submit", onSubmitRecipe);
  document.getElementById("viewClose").addEventListener("click", closeView);
  document.getElementById("btnEdit").addEventListener("click", onViewEdit);
  document.getElementById("btnDelete").addEventListener("click", onViewDelete);
});

function loadRecipes() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed.slice();
  }
  try { 
    return JSON.parse(raw); 
  } catch (e) { 
    return seed.slice(); 
  }
}

function saveRecipes() {
  localStorage.setItem(STORE_KEY, JSON.stringify(recipes));
}

function getFavs() {
  try { 
    return JSON.parse(localStorage.getItem("rb_favs") || "[]"); 
  } catch (e) { 
    return []; 
  }
}

function toggleFav(id) {
  const favs = getFavs();
  const idx = favs.indexOf(id);
  if (idx === -1) favs.push(id); 
  else favs.splice(idx, 1);
  localStorage.setItem("rb_favs", JSON.stringify(favs));
  renderFavs();
  renderAll();
}

function renderFavs() {
  const favList = document.getElementById("favList");
  favList.innerHTML = "";
  const favs = getFavs();
  favs.forEach(id => {
    const r = recipes.find(x => x.id === id);
    if (!r) return;
    const div = document.createElement("div");
    div.className = "fav-item";
    div.innerHTML = `<span>${r.name}</span><button onclick="toggleFav('${r.id}')">×</button>`;
    div.onclick = (e) => { 
      if (e.target.tagName !== "BUTTON") openView(r.id); 
    };
    favList.appendChild(div);
  });
}

function renderAll(filter = "") {
  const grid = document.getElementById("recipesGrid");
  grid.innerHTML = "";
  const favs = getFavs();
  const q = filter.toLowerCase();

  recipes.forEach(r => {
    if (q) {
      const inName = r.name.toLowerCase().includes(q);
      const inIng = r.ingredients.join(" ").toLowerCase().includes(q);
      if (!inName && !inIng) return;
    }

    if (currentCategory !== "all" && r.category !== currentCategory) {
      return;
    }

    const card = document.createElement("div");
    card.className = "card";
    const isFav = favs.includes(r.id);
    card.innerHTML = `
      <div>
        <h3>${r.name}</h3>
        <p>${r.ingredients.slice(0, 3).join(", ")}${r.ingredients.length > 3 ? "…" : ""}</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn" onclick="openView('${r.id}')">Ver</button>
        <button class="btn ${isFav ? "" : "ghost"}" onclick="toggleFav('${r.id}')">${isFav ? "★" : "☆"}</button>
      </div>
    `;
    grid.appendChild(card);
  });
  renderFavs();
}

 
function openModalForCreate() {
  editingId = null;
  document.getElementById("modalTitle").textContent = "Nova Receita";
  document.getElementById("rName").value = "";
  document.getElementById("rCategory").value = "doce";
  document.getElementById("rIngredients").value = "";
  document.getElementById("rSteps").value = "";
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() { 
  document.getElementById("modal").classList.add("hidden"); 
  editingId = null; 
}
 
function onSubmitRecipe(e) {
  e.preventDefault();
  
  const name = document.getElementById("rName").value.trim();
  const category = document.getElementById("rCategory").value;
  const ingredients = document.getElementById("rIngredients").value
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);
  const steps = document.getElementById("rSteps").value.trim();
  
  if (!name || ingredients.length === 0 || !steps) {
    alert("Preencha todos os campos!");
    return;
  }

  if (editingId) {
    const idx = recipes.findIndex(r => r.id === editingId);
    if (idx !== -1) {
      recipes[idx].name = name;
      recipes[idx].category = category;
      recipes[idx].ingredients = ingredients;
      recipes[idx].steps = steps;
    }
  } else {
    recipes.unshift({ 
      id: genId(), 
      name, 
      category, 
      ingredients, 
      steps 
    });
  }
  
  saveRecipes(); 
  closeModal(); 
  renderAll();
}

 
function openView(id) {
  const r = recipes.find(x => x.id === id); 
  if (!r) return;
  document.getElementById("viewName").textContent = r.name;
  const ingr = document.getElementById("viewIngredients"); 
  ingr.innerHTML = "";
  r.ingredients.forEach(i => { 
    const li = document.createElement("li"); 
    li.textContent = i; 
    ingr.appendChild(li); 
  });
  document.getElementById("viewSteps").textContent = r.steps;
  document.getElementById("viewModal").classList.remove("hidden");
  document.getElementById("btnEdit").dataset.id = r.id;
  document.getElementById("btnDelete").dataset.id = r.id;
}

function closeView() { 
  document.getElementById("viewModal").classList.add("hidden"); 
}

function onViewEdit() {
  const id = this.dataset.id || document.getElementById("btnEdit").dataset.id;
  const r = recipes.find(x => x.id === id); 
  if (!r) return;
  editingId = r.id;
  document.getElementById("modalTitle").textContent = "Editar Receita";
  document.getElementById("rName").value = r.name;
  document.getElementById("rCategory").value = r.category || "doce";
  document.getElementById("rIngredients").value = r.ingredients.join("\n");
  document.getElementById("rSteps").value = r.steps;
  closeView();
  document.getElementById("modal").classList.remove("hidden");
}

function onViewDelete() {
  const id = this.dataset.id || document.getElementById("btnDelete").dataset.id;
  if (!confirm("Excluir esta receita?")) return;
  recipes = recipes.filter(r => r.id !== id);
  saveRecipes(); 
  closeView(); 
  renderAll();

}
