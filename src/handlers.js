import { domElements } from './dom.js';
import { appState, saveState, resetToDefaults, resetFilters } from './state.js';
import { closeModal, openModal, renderAll, renderModalTags, showProjectForm } from './ui.js';
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function initializeEventListeners() {

    domElements.projectDescription.addEventListener('click', (e) => {
        if (e.target.classList.contains('empty')) {
            e.target.textContent = '';
            e.target.classList.remove('empty');
        }
    });

    domElements.projectDescription.addEventListener('blur', (e) => {
        const newDescription = e.target.textContent.trim();

        if (appState.activeProject) {
            if (!newDescription) {
                e.target.textContent = 'Add project description...';
                e.target.classList.add('empty');
                appState.activeProject.description = '';
            } else {
                appState.activeProject.description = newDescription;
                e.target.classList.remove('empty');
            }
            saveState();
        }
    }, true);

    domElements.projectDescription.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });

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
        const projectDescription = domElements.newProjectDescription.value.trim();

        if (projectName) {
            if (appState.projects.find(p => p.name === projectName)) {
                showNotification(`Project "${projectName}" already exists`, "error");
                return;
            }
            const newProject = createProject(projectName, projectDescription);
            appState.projects.push(newProject);
            appState.activeProject = newProject;

            domElements.newProjectInput.value = "";
            domElements.newProjectDescription.value = "";

            saveState();
            appState.viewMode = "project";
            renderAll(appState);
            showProjectForm(false);
            showNotification(`Project "${projectName}" has been created`, "success");
        }
    });

    domElements.globalSearch.addEventListener("input", debounce((e) => {
        const searchTerm = e.target.value.trim();

        if (searchTerm) {
            appState.globalSearchTerm = searchTerm;
            appState.viewMode = "search";
            appState.activeProject = null;
            renderAll(appState);
        } else if (appState.viewMode === "search") {
            appState.viewMode = "today";
            appState.globalSearchTerm = "";
            renderAll(appState);
        }
    }, 300));

    domElements.globalSearch.addEventListener("focus", () => {
        if (domElements.globalSearch.value.trim()) {
            appState.viewMode = "search";
            appState.globalSearchTerm = domElements.globalSearch.value.trim();
            renderAll(appState);
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
                if (window.innerWidth <= 768) {
                    toggleSidebar();
                    setTimeout(() => {
                        renderAll(appState);
                    }, 50);
                } else {
                    renderAll(appState);
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

        const tags = Array.from(document.querySelectorAll("#modal-tag-container .tag-item")).map(tagEl => tagEl.dataset.tag);

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
                    todo.tags = tags;
                    showNotification(`Task "${title}" has been updated`, "success");
                }
            } else {
                const newTodo = createTodo(title, description, dueDate, priority);
                newTodo.tags = tags;
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

    domElements.restoreDefaultsBtn.addEventListener("click", async () => {
        const title = "Restore Demo";
        const message = "This will delete all your current projects and tasks and restore the demo content. Are you sure?";
        const action = "Restore";

        const confirmed = await showConfirmDialog(title, message, action);

        if (confirmed) {
            resetToDefaults();
            renderAll(appState);
            showNotification("Demo content has been restored", "success");
        }
    });

    domElements.sortSelect.addEventListener("change", (e) => {
        appState.sortBy = e.target.value;
        renderAll(appState);
    });

    domElements.sortDirectionBtn.addEventListener("click", () => {
        appState.sortAsc = !appState.sortAsc;
        domElements.sortDirectionBtn.querySelector('.material-icons').textContent =
            appState.sortAsc ? 'arrow_upward' : 'arrow_downward';
        renderAll(appState);
    });


    domElements.taskFilter.addEventListener("input", debounce((e) => {
        appState.filters.searchTerm = e.target.value.trim();
        saveState();
        renderAll(appState);
    }, 300));

    domElements.priorityFilter.addEventListener("change", (e) => {
        appState.filters.priority = e.target.value;
        saveState();
        renderAll(appState);
    });

    domElements.resetFiltersBtn.addEventListener("click", () => {
        resetFilters();

        domElements.taskFilter.value = "";
        domElements.priorityFilter.value = "all";
        domElements.sortSelect.value = "dueDate";
        domElements.sortDirectionBtn.querySelector('.material-icons').textContent = 'arrow_upward';

        saveState();
        renderAll(appState);
    });

    domElements.tagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const newTag = domElements.tagInput.value.trim();
            if (newTag) {
                const currentTags = Array.from(domElements.tagContainer.querySelectorAll(".tag-item")).map(el => el.dataset.tag);
                if (!currentTags.includes(newTag)) {
                    renderModalTags([...currentTags, newTag]);
                }
                domElements.tagInput.value = "";
            }
        }
    });

    domElements.tagContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("tag-delete-btn")) {
            e.target.closest(".tag-item").remove();
        } else {
            domElements.tagInput.focus();
        }
    })
}