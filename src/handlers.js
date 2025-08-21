import { domElements } from './dom.js';
import { appState, saveState } from './state.js';
import { closeModal, openModal, renderAll, showProjectForm } from './ui.js';
import { createProject } from './project.js';
import { createTodo } from './todo.js';

function toggleSidebar() {
    domElements.sidebar.classList.toggle('open');
}

function buildDueDateISO(dateStr, timeStr) {
    if (!dateStr) return "";
    if (timeStr) {
        return `${dateStr}T${timeStr}`;
    }
    return dateStr;
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
        alert("A project with this name already exists.");
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

    domElements.projectTitle.addEventListener("blur", handleProjectRename);
    domElements.projectTitle.addEventListener("keydown", handleProjectRenameKeydown);

    domElements.showAddTodoFormBtn.addEventListener("click", () => {
        if (appState.activeProject) {
            domElements.todoDetailsForm.reset();
            openModal();
        } else {
            alert("Please select a project first!");
        }
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
    const dueDate = domElements.dueDate.value;
    const dueTime = domElements.dueTime.value;
    const dueDateISO = buildDueDateISO(dueDate, dueTime);
    const priority = domElements.priority.value;

    if (title && appState.activeProject) {
        const newTodo = createTodo(title, description, dueDateISO, priority);
        appState.activeProject.addTodo(newTodo);
        
        saveState();
        renderAll(appState);
        closeModal();
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