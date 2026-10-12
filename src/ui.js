import { parseISO, isValid, format } from 'date-fns';
import { domElements } from './dom.js';
import { appState, filterTodos, getVisibleTodos, getTodosByCategory, searchAllTodos, sortTodos } from './state.js';

const createEmptyState = (container, message, iconName = 'task') => {
    const emptyState = document.createElement('div');
    emptyState.classList.add('empty-state');

    const icon = document.createElement('span');
    icon.classList.add('material-icons');
    icon.textContent = iconName;

    const messageEl = document.createElement('p');
    messageEl.textContent = message;

    emptyState.append(icon, messageEl);
    container.replaceChildren(emptyState);
};

const createProjectActionButton = ({ className, title, iconName, type = 'button' }) => {
    const button = document.createElement('button');
    button.type = type;
    button.classList.add(className);
    button.title = title;

    const icon = document.createElement('span');
    icon.classList.add('material-icons');
    icon.textContent = iconName;
    button.appendChild(icon);
    return button;
};

export const renderTodos = (todos, isDefaultView = false) => {
    const todoListContainer = domElements.todoListContainer;
    todoListContainer.replaceChildren();

    if (!todos || todos.length === 0) {
        const message = isDefaultView
            ? 'No tasks found.'
            : "No tasks yet. Click the '+' button above to add one!";
        createEmptyState(todoListContainer, message, 'task');
        return;
    }

    const filteredTodos = filterTodos(todos);

    if (filteredTodos.length === 0) {
        createEmptyState(todoListContainer, 'No tasks match your filters', 'search_off');
        return;
    }

    const sortedTodos = sortTodos(filteredTodos);

    sortedTodos.forEach(todo => {
        const todoItem = document.createElement('div');
        todoItem.classList.add('todo-item');
        todoItem.dataset.todoId = todo.id;

        if (todo.priority) {
            todoItem.classList.add(`priority-${todo.priority}`);
        }

        const now = new Date();
        if (todo.dueDate && new Date(todo.dueDate) < now && !todo.complete) {
            todoItem.classList.add('overdue');
        }

        const todoSummary = document.createElement('div');
        todoSummary.classList.add('todo-summary');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.complete;

        const title = document.createElement('p');
        title.textContent = todo.title;

        if (todo.complete) {
            todoItem.classList.add('complete');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = '×';

        const editBtn = createProjectActionButton({
            className: 'edit-btn',
            title: 'Edit task',
            iconName: 'edit',
        });

        todoSummary.append(checkbox);
        if (isDefaultView) {
            const projectBadge = document.createElement('span');
            projectBadge.classList.add('project-badge');
            projectBadge.textContent = todo.projectName;
            const project = appState.projects.find(p => p.id === todo.projectId);
            if (project) {
                projectBadge.style.setProperty('--project-color', project.color);
            }
            todoSummary.append(projectBadge);
        }
        todoSummary.append(title, editBtn, deleteBtn);

        const todoDetails = document.createElement('div');
        todoDetails.classList.add('todo-details');

        let formattedDate = 'No due date';
        if (todo.dueDate) {
            try {
                const parsed = parseISO(todo.dueDate);
                formattedDate = isValid(parsed) ? format(parsed, 'PP, p') : todo.dueDate;
            } catch (err) {
                formattedDate = todo.dueDate;
            }
        }

        const description = document.createElement('p');
        description.textContent = todo.description || 'No description';

        const dueDateRow = document.createElement('p');
        dueDateRow.innerHTML = '<strong>Due:</strong> ';
        dueDateRow.append(document.createTextNode(formattedDate));

        const priorityRow = document.createElement('p');
        priorityRow.innerHTML = '<strong>Priority:</strong> ';
        priorityRow.append(document.createTextNode(todo.priority || 'normal'));

        todoDetails.append(description, dueDateRow, priorityRow);

        if (todo.tags && todo.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.classList.add('task-tags-display');
            todo.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.classList.add('tag-item');
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
            todoDetails.appendChild(tagsContainer);
        }

        todoItem.append(todoSummary, todoDetails);
        todoListContainer.appendChild(todoItem);
    });
};

const renderProjects = (projects, activeProject, viewMode) => {
    const activeProjects = projects.filter(p => !p.isArchived);
    const archivedProjects = projects.filter(p => p.isArchived);

    renderProjectList(domElements.projectListContainer, activeProjects, { activeProject, viewMode });
    renderProjectList(domElements.archivedProjectList, archivedProjects, { activeProject, viewMode, isArchived: true });

    const archivedSection = domElements.archivedProjectsSection;
    const toggleBtn = domElements.toggleArchivedBtn;
    if (archivedProjects.length > 0) {
        toggleBtn.style.display = 'flex';
    } else {
        toggleBtn.style.display = 'none';
        archivedSection.style.display = 'none';
        toggleBtn.querySelector('span:last-child').textContent = 'Show Archived';
    }
};

const renderProjectList = (container, projects, options) => {
    container.replaceChildren();

    if (!projects || projects.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.classList.add('empty-state');

        const message = document.createElement('p');
        message.textContent = options.isArchived ? 'No archived projects.' : 'No projects yet.';
        emptyState.appendChild(message);
        container.appendChild(emptyState);
        return;
    }

    projects.forEach(project => {
        const projectEl = document.createElement('div');
        projectEl.classList.add('project-item');
        projectEl.dataset.projectId = project.id;
        projectEl.style.setProperty('--project-color', project.color);

        const projectNameSpan = document.createElement('span');
        projectNameSpan.textContent = project.name;
        projectEl.appendChild(projectNameSpan);

        if (options.isArchived) {
            projectEl.append(
                createProjectActionButton({ className: 'project-action-btn restore-project-btn', title: 'Restore', iconName: 'unarchive' }),
                createProjectActionButton({ className: 'project-action-btn permanent-delete-btn', title: 'Delete Permanently', iconName: 'delete_forever' })
            );
        } else {
            const incompleteTasks = project.todos.filter(todo => !todo.complete).length;
            if (incompleteTasks > 0) {
                const badgeSpan = document.createElement('span');
                badgeSpan.classList.add('task-count');
                badgeSpan.textContent = incompleteTasks;
                projectEl.appendChild(badgeSpan);
            }

            const deleteProjectBtn = document.createElement('button');
            deleteProjectBtn.type = 'button';
            deleteProjectBtn.classList.add('delete-project-btn');
            deleteProjectBtn.title = 'Archive Project';
            deleteProjectBtn.textContent = '×';
            projectEl.appendChild(deleteProjectBtn);
        }

        if (options.viewMode === 'project' && options.activeProject && project.id === options.activeProject.id) {
            projectEl.classList.add('active');
        }

        container.appendChild(projectEl);
    });
};

const renderTagFilterOptions = (projects) => {
    const allTags = [...new Set(projects.flatMap(p => p.todos.flatMap(t => t.tags || [])))].sort((a, b) => a.localeCompare(b));
    const tagFilter = domElements.tagFilter;
    const currentVal = tagFilter.value;

    tagFilter.replaceChildren();

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Tags';
    tagFilter.appendChild(allOption);

    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });

    if (Array.from(tagFilter.options).some(opt => opt.value === currentVal)) {
        tagFilter.value = currentVal;
    } else {
        tagFilter.value = 'all';
    }
};

const syncViewState = (app) => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.category === app.viewMode);
    });

    renderProjects(app.projects, app.activeProject, app.viewMode);
    renderTagFilterOptions(app.projects);
    domElements.tagFilter.value = app.filters.tag;
    domElements.filterControls.style.display = app.viewMode === 'search' ? 'none' : 'flex';
};

export const renderAll = (app) => {
    syncViewState(app);

    if (app.viewMode === 'project' && app.activeProject) {
        domElements.projectTitle.classList.add('editable');
        domElements.projectTitle.contentEditable = true;
        domElements.projectTitle.textContent = app.activeProject.name;

        domElements.projectDescription.classList.add('editable');
        domElements.projectDescription.contentEditable = true;
        domElements.projectDescription.textContent = app.activeProject.description || 'Add project description...';
        if (!app.activeProject.description) {
            domElements.projectDescription.classList.add('empty');
        }

        domElements.projectDescription.style.display = 'block';
        domElements.showTodoModalBtn.style.display = 'block';
        renderTodos(getVisibleTodos(app.viewMode, app.activeProject.id), false);
        return;
    }

    if (app.viewMode === 'search') {
        domElements.projectTitle.textContent = `Search Results for: "${app.globalSearchTerm}"`;
        domElements.projectTitle.classList.remove('editable');
        domElements.projectTitle.contentEditable = false;
        domElements.projectDescription.style.display = 'none';
        domElements.showTodoModalBtn.style.display = 'none';

        renderTodos(getVisibleTodos(app.viewMode, null, app.globalSearchTerm), true);
        return;
    }

    const categoryTitle = {
        today: 'Today',
        upcoming: 'Upcoming',
        overdue: 'Overdue',
        completed: 'Completed'
    }[app.viewMode];

    domElements.projectTitle.textContent = categoryTitle;
    domElements.projectTitle.classList.remove('editable');
    domElements.projectTitle.contentEditable = false;
    domElements.projectDescription.style.display = 'none';
    domElements.showTodoModalBtn.style.display = 'none';
    renderTodos(getVisibleTodos(app.viewMode), true);
};

export const showProjectForm = (show) => {
    domElements.newProjectForm.style.display = show ? 'block' : 'none';
    domElements.addProjectBtn.style.display = show ? 'none' : 'flex';
    if (show) {
        domElements.newProjectInput.focus();
    }
}

export const openModal = (todo = null, projectId = null) => {
    const modalTitle = domElements.todoModal.querySelector("h2");
    modalTitle.textContent = todo ? "Edit Task" : "New Task";
    delete domElements.todoDetailsForm.dataset.projectId;

    if (todo) {
        domElements.title.value = todo.title;
        domElements.description.value = todo.description || "";
        domElements.datetime.value = todo.dueDate;
        domElements.priority.value = todo.priority;
        domElements.todoDetailsForm.dataset.todoId = todo.id;
        if (projectId) {
            domElements.todoDetailsForm.dataset.projectId = projectId;
        }
    } else {
        domElements.todoDetailsForm.reset();
        delete domElements.todoDetailsForm.dataset.todoId;
        delete domElements.todoDetailsForm.dataset.projectId;
    }

    renderModalTags(todo ? todo.tags : []);
    domElements.todoModal.style.display = "block";
    domElements.title.focus();
}

export const renderModalTags = (tags = []) => {
    const container = document.querySelector("#modal-tag-container");
    container.innerHTML = "";
    tags.forEach(tag => {
        const tagEl = document.createElement("span");
        tagEl.classList.add("tag-item");
        tagEl.dataset.tag = tag;
        tagEl.textContent = tag;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.classList.add("tag-delete-btn");
        deleteBtn.innerHTML = "&times;";
        tagEl.appendChild(deleteBtn);

        container.appendChild(tagEl)
    });
}

export const closeModal = () => {
    domElements.todoModal.style.display = "none";
}