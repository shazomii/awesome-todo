import { domElements } from './dom.js';

export const renderTodos = (project) => {
    const todoListContainer = document.querySelector("#todo-list-container");
    const projectTitle = document.querySelector("#project-title");

    projectTitle.textContent = project.name;

    todoListContainer.innerHTML = "";

    project.todos.forEach(todo => {
        const todoItem = document.createElement("div");
        todoItem.classList.add("todo-item");
        todoItem.dataset.todoId = todo.id;

        const todoSummary = document.createElement("div");
        todoSummary.classList.add("todo-summary");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.complete;

        const title = document.createElement("span");
        title.textContent = todo.title;
        if (todo.complete) {
            todoItem.classList.add("complete");
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.textContent = "X";

        todoSummary.appendChild(checkbox);
        todoSummary.appendChild(title);
        todoSummary.appendChild(deleteBtn);

        const todoDetails = document.createElement("div");
        todoDetails.classList.add("todo-details");
        todoDetails.innerHTML = `
        <p>${todo.description}</p>
        <p>${todo.dueDate}</p>
        <p>${todo.priority}</p>
        `;

        todoItem.appendChild(todoSummary);
        todoItem.appendChild(todoDetails);

        todoListContainer.appendChild(todoItem);
    });
};

export const renderProjects = (projects, activeProject) => {
    const projectList = document.querySelector("#project-list");
    projectList.innerHTML = "";

    projects.forEach(project => {
        const projectEl = document.createElement("div");
        projectEl.classList.add("project-item");
        projectEl.dataset.projectId = project.id;

        const projectNameSpan = document.createElement("span");
        projectNameSpan.textContent = project.name;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-project-btn");
        deleteBtn.textContent = "X";

        projectEl.appendChild(projectNameSpan);
        projectEl.appendChild(deleteBtn);

        if (activeProject && project.id === activeProject.id) {
            projectEl.classList.add("active");
        }

        projectList.appendChild(projectEl);
    })
}

export function renderAll(app) {
    renderProjects(app.projects, app.activeProject);
    if (app.activeProject) {
        renderTodos(app.activeProject);
    } else {
        domElements.projectTitle.textContent = "No Projects";
        domElements.todoListContainer.innerHTML = "";
    }
}

export function showProjectForm(show) {
    domElements.newProjectForm.style.display = show ? 'block' : 'none';
    domElements.addProjectBtn.style.display = show ? 'none' : 'flex';
    if (show) {
        domElements.newProjectInput.focus();
    }
}

export function showTodoForm(show) {
    domElements.todoForm.style.display = show ? 'block' : 'none';
    domElements.showAddTodoFormBtn.style.display = show ? 'none' : 'flex';
    if (show) {
        domElements.todoTitleInput.focus();
    }
}