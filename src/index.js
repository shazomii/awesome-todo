import './styles.css';
import { createTodo } from './todo.js';
import { todo1, todo2 } from './default.js';
import { createProject } from './project.js';
import { renderProjects, renderTodos } from './ui.js';

const app = {
  projects: [],
  activeProject: null,
}

function saveState() {
  localStorage.setItem("awesome-todo.projects", JSON.stringify(app.projects));
}

function loadState() {
  const projectsJSON = localStorage.getItem("awesome-todo.projects");
  if (projectsJSON == null) {
    const todayProject = createProject("Today");
    const workProject = createProject("Work");

    todayProject.addTodo(todo1);
    workProject.addTodo(todo2);

    app.projects.push(todayProject, workProject);
  } else {
    const projectsData = JSON.parse(projectsJSON);
    app.projects = projectsData.map(projectData => {
      const project = createProject(projectData.name);
      projectData.todos.forEach(todoData => {
        const todo = createTodo(
          todoData.title,
          todoData.description,
          todoData.dueDate,
          todoData.priority
        );
        todo.id = todoData.id;
        todo.complete = todoData.complete;
        project.addTodo(todo);
      });
      return project;
    });
  }
  app.activeProject = app.projects[0] || null
}

function renderAll() {
  renderProjects(app.projects, app.activeProject);
  if (app.activeProject) {
    renderTodos(app.activeProject);
  } else {
    document.querySelector("#project-title").textContent = "No Projects";
    document.querySelector("#todo-list-container").innerHTML = "";
  }
}

function showProjectForm(show) {
  newProjectForm.style.display = show ? 'block' : 'none';
  addProjectBtn.style.display = show ? 'none' : 'flex';
  if (show) {
    newProjectInput.focus();
  }
}

function showTodoForm(show) {
  todoForm.style.display = show ? 'block' : 'none';
  showAddTodoFormBtn.style.display = show ? 'none' : 'flex';
  if (show) {
    todoTitleInput.focus();
  }
}

const addProjectBtn = document.querySelector("#add-project-btn");
const newProjectForm = document.querySelector(".new-project-form");
const newProjectInput = document.querySelector("#new-project-input");
const confirmAddProjectBtn = document.querySelector("#confirm-add-project-btn");
const cancelAddProjectBtn = document.querySelector("#cancel-add-project-btn");
const projectListContainer = document.querySelector("#project-list");
const showAddTodoFormBtn = document.querySelector("#show-add-todo-form-btn");
const todoForm = document.querySelector(".todo-form");
const addTodoBtn = document.querySelector("#add-todo-btn");
const cancelAddTodoBtn = document.querySelector("#cancel-add-todo-btn");
const todoTitleInput = document.querySelector("#todo-title");
const todoDescriptionInput = document.querySelector("#todo-description");
const todoDueDateInput = document.querySelector("#todo-due-date");
const todoPriorityInput = document.querySelector("#todo-priority");
const todoListContainer = document.querySelector("#todo-list-container");

addProjectBtn.addEventListener("click", () => {
  showProjectForm(true);
})

cancelAddProjectBtn.addEventListener("click", (e) => {
  e.preventDefault();
  showProjectForm(false);
  newProjectInput.value = "";
})

confirmAddProjectBtn.addEventListener("click", () => {
  const projectName = newProjectInput.value.trim();
  if (projectName && !app.projects.find(p => p.name === projectName)) {
    const newProject = createProject(projectName);
    app.projects.push(newProject);
    app.activeProject = newProject;
    newProjectInput.value = "";
    saveState();
    renderAll();
    showProjectForm(false);
  }
});

projectListContainer.addEventListener("click", (e) => {
  const projectItem = e.target.closest(".project-item");
  if (!projectItem) return;

  const projectId = projectItem.dataset.projectId;

  if (e.target.matches(".delete-project-btn")) {
    const projectIndex = app.projects.findIndex(p => p.id === projectId);
    if (projectIndex > -1) {
      app.projects.splice(projectIndex, 1);

      if (app.activeProject && app.activeProject.id === projectId) {
        app.activeProject = app.projects[0] || null;
      }

      saveState();
      renderAll();
    }
  } else {
    const newActiveProject = app.projects.find(p => p.id === projectId);
    if (newActiveProject) {
      app.activeProject = newActiveProject;
      renderAll();
    }
  }
});

showAddTodoFormBtn.addEventListener("click", () => {
  showTodoForm(true);
});

cancelAddTodoBtn.addEventListener("click", () => {
  showTodoForm(false);
})

addTodoBtn.addEventListener("click", () => {
  const title = todoTitleInput.value.trim();
  const description = todoDescriptionInput.value.trim();
  const dueDate = todoDueDateInput.value;
  const priority = todoPriorityInput.value;

  if (title && app.activeProject) {
    const newTodo = createTodo(title, description, dueDate, priority);
    app.activeProject.addTodo(newTodo);

    saveState();
    renderTodos(app.activeProject);
    
    todoTitleInput.value = "";
    todoDescriptionInput.value = "";
    todoDueDateInput.value = "";
    todoPriorityInput.value = "low";
    showTodoForm(false);
  }
});

todoListContainer.addEventListener("click", (e) => {
  if (!app.activeProject) return;

  const todoItem = e.target.closest(".todo-item");

  if (!todoItem) return;

  const todoId = todoItem.dataset.todoId;
  const target = e.target;

  if (target.type === "checkbox") {
    const todo = app.activeProject.todos.find(t => t.id ===  todoId);

    if (todo) {
      todo.complete = !todo.complete;
      saveState();
      renderTodos(app.activeProject);
    }
    return;
  }

  if (target.classList.contains("delete-btn")) {
    app.activeProject.removeTodo(todoId);
    saveState();
    renderTodos(app.activeProject);
    return;
  }

  todoItem.classList.toggle('expanded');
});

loadState();
renderAll();