export const domElements = {
    // App structure
    sidebar: document.querySelector(".sidebar"),
    menuBtn: document.querySelector("#menu-btn"),
    closeSidebarBtn: document.querySelector("#close-sidebar-btn"),

    // Project elements
    addProjectBtn: document.querySelector("#add-project-btn"),
    newProjectForm: document.querySelector(".new-project-form"),
    newProjectInput: document.querySelector("#new-project-input"),
    confirmAddProjectBtn: document.querySelector("#confirm-add-project-btn"),
    cancelAddProjectBtn: document.querySelector("#cancel-add-project-btn"),
    projectListContainer: document.querySelector("#project-list"),
    projectTitle: document.querySelector("#project-title"),

    // To-do elements
    showAddTodoFormBtn: document.querySelector("#show-add-todo-form-btn"),
    todoListContainer: document.querySelector("#todo-list-container"),
    todoModal: document.querySelector("#todo-modal"),
    closeModalBtn: document.querySelector(".close-button"),
    todoDetailsForm: document.querySelector("#todo-details-form"),
    title: document.querySelector('#modal-todo-title'),
    description: document.querySelector('#modal-todo-desc'),
    dueDate: document.querySelector('#modal-todo-date'),
    priority: document.querySelector('#modal-todo-priority'),
};