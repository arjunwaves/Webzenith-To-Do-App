const STORAGE_KEY = "taskflow-tasks";
let tasks = loadTasks();
let currentFilter = "all";


function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch (error) {
    console.error("Could not read saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(title, description, priority) {
  return {
    id: Date.now().toString(),
    title,
    description,
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  };
}

function addTask(event) {
  event.preventDefault();
  const titleInput = document.querySelector("#task-title");
  const descriptionInput = document.querySelector("#task-description");
  const priorityInput = document.querySelector("#task-priority");
  const title = titleInput.value.trim();

  if (!title) {
    showToast("Please enter a task name.");
    titleInput.focus();
    return;
  }

  tasks.unshift(createTask(title, descriptionInput.value.trim(), priorityInput.value));
  saveTasks();
  renderTasks();
  document.querySelector("#task-form").reset();
  showToast("Task added. You've got this!");
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id
    ? { ...task, completed: !task.completed }
    : task);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  showToast("Task removed.");
}

function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  const updatedTitle = prompt("Update task name:", task.title);
  if (updatedTitle === null) return;
  if (!updatedTitle.trim()) {
    showToast("Task name cannot be empty.");
    return;
  }
  task.title = updatedTitle.trim();
  saveTasks();
  renderTasks();
}

function getVisibleTasks() {
  const searchTerm = document.querySelector("#search-input").value.toLowerCase().trim();
  return tasks.filter(task => {
    const matchesFilter = currentFilter === "all"
      || (currentFilter === "active" && !task.completed)
      || (currentFilter === "completed" && task.completed);
    const matchesSearch = task.title.toLowerCase().includes(searchTerm)
      || task.description.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });
}

function renderTasks() {
  const list = document.querySelector("#task-list");
  const visibleTasks = getVisibleTasks();
  list.innerHTML = "";

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item ${task.completed ? "is-done" : ""}`;
    item.innerHTML = `
      <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} complete" ${task.completed ? "checked" : ""}>
      <div class="task-main">
        <span class="task-title">${escapeHTML(task.title)}</span>
        ${task.description ? `<span class="task-description">${escapeHTML(task.description)}</span>` : ""}
      </div>
      <span class="priority priority-${task.priority}">${task.priority}</span>
      <button class="edit-btn" aria-label="Edit task" title="Edit">✎</button>
      <button class="delete-btn" aria-label="Delete task" title="Delete">×</button>`;
    item.querySelector(".task-check").addEventListener("change", () => toggleTask(task.id));
    item.querySelector(".edit-btn").addEventListener("click", () => editTask(task.id));
    item.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));
    list.appendChild(item);
  });

  document.querySelector("#empty-state").classList.toggle("show", visibleTasks.length === 0);
  document.querySelector("#visible-count").textContent = visibleTasks.length;
  updateStats();
}

// Escape user text before placing it in HTML.
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function updateStats() {
  const completed = tasks.filter(task => task.completed).length;
  const active = tasks.length - completed;
  const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  document.querySelector("#total-count").textContent = tasks.length;
  document.querySelector("#active-count").textContent = active;
  document.querySelector("#done-count").textContent = completed;
  document.querySelector("#progress-label").textContent = `${percentage}%`;
  document.querySelector("#progress-fill").style.width = `${percentage}%`;
  document.querySelector("#progress-caption").textContent =
    tasks.length ? `${completed} of ${tasks.length} tasks completed` : "Let's get started!";
}

function showToast(message) {
  const oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

async function fetchQuote() {
  const quoteText = document.querySelector("#quote-text");
  const quoteAuthor = document.querySelector("#quote-author");
  quoteText.textContent = "Finding a little inspiration...";
  try {
    const response = await fetch("https://dummyjson.com/quotes/random");
    if (!response.ok) throw new Error("Quote service is unavailable");
    const data = await response.json();
    quoteText.textContent = data.quote;
    quoteAuthor.textContent = `— ${data.author}`;
  } catch (error) {
    quoteText.textContent = "Great things are done by a series of small things brought together.";
    quoteAuthor.textContent = "— Vincent van Gogh";
    console.error(error);
  }
}

document.querySelector("#task-form").addEventListener("submit", addTask);
document.querySelector("#search-input").addEventListener("input", renderTasks);
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    renderTasks();
  });
});
document.querySelector("#clear-completed").addEventListener("click", () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
});
document.querySelector("#new-quote").addEventListener("click", fetchQuote);

document.querySelector("#date-text").textContent =
  new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
document.querySelector("#today-label").textContent =
  new Date().toLocaleDateString("en-IN", { weekday: "long" }).toUpperCase() + " — LET'S MAKE IT COUNT";
renderTasks();
