import { domElements } from './dom.js';
import { appState, saveState } from './state.js';
import { renderAll, showProjectForm, showTodoForm } from './ui.js';
import { createProject } from './project.js';
import { createTodo } from './todo.js';

function toggleSidebar() {
    domElements.sidebar.classList.toggle('open');
}

export function initializeEventListeners() {
    domElements.menuBtn.addEventListener('click', toggleSidebar);
    domElements.closeSidebarBtn.addEventListener('click', toggleSidebar);

    domElements.addProjectBtn.addEventListener("click", () => showProjectForm(true));

    domElements.cancelAddProjectBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showProjectForm(false);
        domElements.newProjectInput.value = "";
    });

    domElements.confirmAddProjectBtn.addEventListener("click", () => {
        const projectName = domElements.newProjectInput.value.trim();
        if (projectName && !appState.projects.find(p => p.name === projectName)) {
            const newProject = createProject(projectName);
            appState.projects.push(newProject);
            appState.activeProject = newProject;
            domElements.newProjectInput.value = "";
            saveState();
            renderAll(appState);
            showProjectForm(false);
        }
    });

    domElements.projectListContainer.addEventListener("click", (e) => {
        const projectItem = e.target.closest(".project-item");
        if (!projectItem) return;

        const projectId = projectItem.dataset.projectId;

        if (e.target.matches(".delete-project-btn")) {
            const projectIndex = appState.projects.findIndex(p => p.id === projectId);
            if (projectIndex > -1) {
                appState.projects.splice(projectIndex, 1);
                if (appState.activeProject && appState.activeProject.id === projectId) {
                    appState.activeProject = appState.projects[0] || null;
                }
                saveState();
                renderAll(appState);
            }
        } else {
            const newActiveProject = appState.projects.find(p => p.id === projectId);
            if (newActiveProject) {
                appState.activeProject = newActiveProject;
                renderAll(appState);
                if (window.innerWidth <= 768) {
                    toggleSidebar();
                }
            }
        }
    });

    domElements.showAddTodoFormBtn.addEventListener("click", () => showTodoForm(true));

    domElements.cancelAddTodoBtn.addEventListener("click", () => showTodoForm(false));

    domElements.addTodoBtn.addEventListener("click", () => {
        const title = domElements.todoTitleInput.value.trim();
        const description = domElements.todoDescriptionInput.value.trim();
        const dueDate = domElements.todoDueDateInput.value;
        const priority = domElements.todoPriorityInput.value;

        if (title && appState.activeProject) {
            const newTodo = createTodo(title, description, dueDate, priority);
            appState.activeProject.addTodo(newTodo);
            saveState();
            renderAll(appState);
            
            domElements.todoTitleInput.value = "";
            domElements.todoDescriptionInput.value = "";
            domElements.todoDueDateInput.value = "";
            domElements.todoPriorityInput.value = "low";
            showTodoForm(false);
        }
    });

    domElements.todoListContainer.addEventListener("click", (e) => {
        if (!appState.activeProject) return;
        const todoItem = e.target.closest(".todo-item");
        if (!todoItem) return;

        const todoId = todoItem.dataset.todoId;
        const target = e.target;

        if (target.type === "checkbox") {
            const todo = appState.activeProject.todos.find(t => t.id === todoId);
            if (todo) {
                todo.complete = !todo.complete;
                saveState();
                renderAll(appState);
            }
            return;
        }

        if (target.classList.contains("delete-btn")) {
            appState.activeProject.removeTodo(todoId);
            saveState();
            renderAll(appState);
            return;
        }

        todoItem.classList.toggle('expanded');
    });
}