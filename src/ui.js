import { parseISO, isValid, format } from 'date-fns';
import { domElements } from './dom.js';
import { getTodosByCategory } from './state.js';

export const renderTodos = (todos, isDefaultView = false) => {
    const todoListContainer = domElements.todoListContainer;
    todoListContainer.innerHTML = "";

    todos.forEach(todo => {
        const todoItem = document.createElement("div");
        todoItem.classList.add("todo-item");
        todoItem.dataset.todoId = todo.id;

        const todoSummary = document.createElement("div");
        todoSummary.classList.add("todo-summary");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.complete;

        const title = document.createElement("p");
        title.textContent = todo.title;
        if (todo.complete) {
            todoItem.classList.add("complete");
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerHTML = "&times;";

        const editBtn = document.createElement("button");
        editBtn.classList.add("edit-btn");
        editBtn.innerHTML = '<span class="material-icons">edit</span>';


        todoSummary.appendChild(checkbox);
        if (isDefaultView) {
            const projectBadge = document.createElement("span");
            projectBadge.classList.add("project-badge");
            projectBadge.textContent = todo.projectName;
            todoSummary.appendChild(projectBadge);
        }
        todoSummary.appendChild(title);
        todoSummary.appendChild(editBtn);
        todoSummary.appendChild(deleteBtn);

        const todoDetails = document.createElement("div");
        todoDetails.classList.add("todo-details");

        let formattedDate = "No due date";
        if (todo.dueDate) {
            try {
                const parsed = parseISO(todo.dueDate);
                if (isValid(parsed)) {
                    formattedDate = format(parsed, 'PP, p');
                } else {
                    formattedDate = todo.dueDate;
                }
            } catch (err) {
                formattedDate = todo.dueDate;
            }
        }

        todoDetails.innerHTML = `
        <p>${todo.description}</p>
        <p><strong>Due:</strong> ${formattedDate}</p>
        <p><strong>Priority:</strong> ${todo.priority}</p>
        `;

        todoItem.appendChild(todoSummary);
        todoItem.appendChild(todoDetails);

        todoListContainer.appendChild(todoItem);
    });
};

export const renderProjects = (projects, activeProject) => {
    const projectList = domElements.projectListContainer;
    projectList.innerHTML = "";

    projects.forEach(project => {
        const projectEl = document.createElement("div");
        projectEl.classList.add("project-item");
        projectEl.dataset.projectId = project.id;

        const projectNameSpan = document.createElement("span");
        projectNameSpan.textContent = project.name;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-project-btn");
        deleteBtn.innerHTML = "&times;";

        projectEl.appendChild(projectNameSpan);
        projectEl.appendChild(deleteBtn);

        if (activeProject && project.id === activeProject.id) {
            projectEl.classList.add("active");
        }

        projectList.appendChild(projectEl);
    })
}

export const renderAll = (app) => {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.dataset.category === app.viewMode) {
            item.classList.add("active");
        }
    });

    renderProjects(app.projects, app.activeProject);

    if (app.viewMode === "project" && app.activeProject) {
        domElements.projectTitle.textContent = app.activeProject.name
        domElements.projectTitle.classList.add("editable");
        domElements.projectTitle.contentEditable = true;
        domElements.showTodoModalBtn.style.display = "block";
        renderTodos(app.activeProject.todos);
    } else {
        const categoryTitle = {
            today: "Today",
            scheduled: "Scheduled",
            completed: "Completed"
        }[app.viewMode];

        domElements.projectTitle.textContent = categoryTitle;
        domElements.projectTitle.classList.remove("editable");
        domElements.projectTitle.contentEditable = false;
        domElements.showTodoModalBtn.style.display = "none";
        renderTodos(getTodosByCategory(app.viewMode), true);
    }
}

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
    domElements.todoModal.style.display = "block";
    domElements.title.focus();
}

export const closeModal = () => {
    domElements.todoModal.style.display = "none";
}