import { parseISO, isValid, format } from 'date-fns';
import { domElements } from './dom.js';

export const renderTodos = (project) => {
    const todoListContainer = domElements.todoListContainer;
    const projectTitle = domElements.projectTitle;

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
    renderProjects(app.projects, app.activeProject);
    if (app.activeProject) {
        domElements.projectTitle.classList.add("editable");
        domElements.projectTitle.contentEditable = true;
        renderTodos(app.activeProject);
    } else {
        domElements.projectTitle.textContent = "No Projects";
        domElements.projectTitle.classList.remove("editable");
        domElements.projectTitle.contentEditable = false;
        domElements.todoListContainer.innerHTML = "";
    }
}

export const showProjectForm = (show) => {
    domElements.newProjectForm.style.display = show ? 'block' : 'none';
    domElements.addProjectBtn.style.display = show ? 'none' : 'flex';
    if (show) {
        domElements.newProjectInput.focus();
    }
}

export const openModal = (todo = null) => {
    const modalTitle = domElements.todoModal.querySelector("h2");
    modalTitle.textContent = todo ? "Edit Task" : "New Task";

    if (todo) {
        domElements.title.value = todo.title;
        domElements.description.value = todo.description || "";
        domElements.datetime.value = todo.dueDate;
        domElements.priority.value = todo.priority;
        domElements.todoDetailsForm.dataset.todoId = todo.id;
    } else {
        domElements.todoDetailsForm.reset();
        delete domElements.todoDetailsForm.dataset.todoId;
    }
    domElements.todoModal.style.display = "block";
    domElements.title.focus();
}

export const closeModal = () => {
    domElements.todoModal.style.display = "none";
}