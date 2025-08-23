import { domElements } from './dom.js';
import { appState, saveState } from './state.js';
import { closeModal, openModal, renderAll, showProjectForm } from './ui.js';
import { createProject } from './project.js';
import { createTodo } from './todo.js';
import { showConfirmDialog } from './confirm.js';
import { showNotification } from './notifications.js';

function toggleSidebar() {
    domElements.sidebar.classList.toggle('open');
}

function handleProjectRename(event) {
    const projectTitleEl = event.target;
    const newName = projectTitleEl.textContent.trim();

    if (!appState.activeProject) return;

    if (!newName || newName === appState.activeProject.name) {
        projectTitleEl.textContent = appState.activeProject.name;
        return;
    }

    const isNameTaken = appState.projects.some(
        p => p.id !== appState.activeProject.id && p.name === newName
    );

    if (isNameTaken) {
        showNotification(`A project with this name already exists`, "error");
        projectTitleEl.textContent = appState.activeProject.name;
        return;
    }

    appState.activeProject.name = newName;
    saveState();
    renderAll(appState);
}

function handleProjectRenameKeydown(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.target.blur();
    } else if (event.key === "Escape") {
        if (appState.activeProject) {
            event.target.textContent = appState.activeProject.name;
        }
        event.target.blur();
    }
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
        if (projectName) {
            if (appState.projects.find(p => p.name === projectName)) {
                showNotification(`Project "${projectName}" already exists`, "error");
                return;
            }
            const newProject = createProject(projectName);
            appState.projects.push(newProject);
            appState.activeProject = newProject;
            domElements.newProjectInput.value = "";
            saveState();
            renderAll(appState);
            showProjectForm(false);
            showNotification(`Project "${projectName}" has been created`, "success");
        }
    });

    domElements.projectListContainer.addEventListener("click", async (e) => {
        const projectItem = e.target.closest(".project-item");
        if (!projectItem) return;

        const projectId = projectItem.dataset.projectId;
        const project = appState.projects.find(p => p.id === projectId);

        if (e.target.matches(".delete-project-btn")) {
            const todoCount = project.todos.length;
            const title = "Delete Project";
            const message = todoCount > 0
                ? `Are you sure you want to delete "${project.name}" and its ${todoCount} task${todoCount === 1 ? '' : 's'}?`
                : `Are you sure you want to delete "${project.name}"?`;

            const confirmed = await showConfirmDialog(title, message);

            if (confirmed) {
                const projectIndex = appState.projects.findIndex(p => p.id === projectId);
                if (projectIndex > -1) {
                    appState.projects.splice(projectIndex, 1);
                    if (appState.activeProject && appState.activeProject.id === projectId) {
                        appState.activeProject = appState.projects[0] || null;
                    }
                    saveState();
                    renderAll(appState);
                    showNotification(`Project "${project.name}" has been deleted`, "warning");
                }
            }
        } else {
            const newActiveProject = appState.projects.find(p => p.id === projectId);
            if (newActiveProject) {
                appState.activeProject = newActiveProject;
                appState.viewMode = "project";
                renderAll(appState);
                if (window.innerWidth <= 768) {
                    toggleSidebar();
                }
            }
        }
    });

    domElements.projectTitle.addEventListener("blur", handleProjectRename);
    domElements.projectTitle.addEventListener("keydown", handleProjectRenameKeydown);

    domElements.showTodoModalBtn.addEventListener("click", () => {
        domElements.todoDetailsForm.reset();
        openModal();

    });

    domElements.closeModalBtn.addEventListener("click", closeModal);

    window.addEventListener("click", (e) => {
        if (e.target == domElements.todoModal) {
            closeModal();
        }
    });

    domElements.todoDetailsForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = domElements.title.value.trim();
        const description = domElements.description.value;
        const dueDate = domElements.datetime.value;
        const priority = domElements.priority.value;
        const todoId = e.target.dataset.todoId;
        const projectId = e.target.dataset.projectId;

        let targetProject = appState.activeProject;
        if (projectId) {
            targetProject = appState.projects.find(p => p.id === projectId);
        }

        if (title && targetProject) {
            if (todoId) {
                const todo = targetProject.todos.find(t => t.id === todoId);
                if (todo) {
                    todo.title = title;
                    todo.description = description;
                    todo.dueDate = dueDate;
                    todo.priority = priority;
                    showNotification(`Task "${title}" has been updated`, "success");
                }
            } else {
                const newTodo = createTodo(title, description, dueDate, priority);
                targetProject.addTodo(newTodo);
                showNotification(`New task "${title}" has been created`, "success");
            }

            saveState();
            renderAll(appState);
            closeModal();
        }
    });

    domElements.todoListContainer.addEventListener("click", async (e) => {
        const todoItem = e.target.closest(".todo-item");
        if (!todoItem) return;

        const todoId = todoItem.dataset.todoId;
        const target = e.target;

        let targetProject, targetTodo;

        if (appState.viewMode === "project") {
            targetProject = appState.activeProject;
            if (targetProject) {
                targetTodo = targetProject.todos.find(t => t.id === todoId);
            }
        } else {
            for (const project of appState.projects) {
                const todo = project.todos.find(t => t.id === todoId);
                if (todo) {
                    targetProject = project;
                    targetTodo = todo;
                    break;
                }
            }
        }

        if (!targetProject || !targetTodo) return;

        if (target.type === "checkbox") {
            targetTodo.complete = !targetTodo.complete;
            saveState();
            renderAll(appState);
            return;
        }

        if (target.closest(".edit-btn")) {
            if (appState.viewMode === "project") {
                openModal(targetTodo)
            } else {
                openModal(targetTodo, targetProject.id);
            }
            return;
        }

        if (target.classList.contains("delete-btn")) {
            const title = "Delete Task";
            const message = `Are you sure you want to delete "${targetTodo.title}"?`;

            const confirmed = await showConfirmDialog(title, message);

            if (confirmed) {
                targetProject.removeTodo(todoId);
                saveState();
                renderAll(appState);
                showNotification(`Task "${targetTodo.title}" has been deleted`);
            }
            return;
        }

        todoItem.classList.toggle('expanded');
    });

    domElements.defaultCategoryList.addEventListener("click", (e) => {
        const navItem = e.target.closest(".nav-item");
        if (!navItem) return;

        const category = navItem.dataset.category;
        appState.viewMode = category;
        appState.activeProject = null;
        renderAll(appState);

        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
}