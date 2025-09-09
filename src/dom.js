export const domElements = {
    // App structure
    sidebar: document.querySelector(".sidebar"),
    menuBtn: document.querySelector("#menu-btn"),
    closeSidebarBtn: document.querySelector("#close-sidebar-btn"),
    defaultCategoryList: document.querySelector(".default-categories"),
    restoreDefaultsBtn: document.querySelector("#restore-defaults-btn"),

    // Project elements
    addProjectBtn: document.querySelector("#add-project-btn"),
    newProjectForm: document.querySelector(".new-project-form"),
    newProjectInput: document.querySelector("#new-project-input"),
    confirmAddProjectBtn: document.querySelector("#confirm-add-project-btn"),
    cancelAddProjectBtn: document.querySelector("#cancel-add-project-btn"),
    projectListContainer: document.querySelector("#project-list"),
    projectTitle: document.querySelector("#project-title"),

    // To-do elements
    showTodoModalBtn: document.querySelector("#show-todo-modal-btn"),
    todoListContainer: document.querySelector("#todo-list-container"),
    todoModal: document.querySelector("#todo-modal"),
    closeModalBtn: document.querySelector(".close-button"),
    todoDetailsForm: document.querySelector("#todo-details-form"),
    title: document.querySelector('#modal-todo-title'),
    description: document.querySelector('#modal-todo-desc'),
    datetime: document.querySelector('#modal-todo-datetime'),
    priority: document.querySelector('#modal-todo-priority'),
    sortSelect: document.querySelector("#sort-select"),
    sortDirectionBtn: document.querySelector("#sort-direction-btn"),
    taskFilter: document.querySelector("#task-filter"),
    priorityFilter: document.querySelector("#priority-filter"),
    resetFiltersBtn: document.querySelector("#reset-filters-btn"),
    filterControls: document.querySelector(".filter-controls"),
    globalSearch: document.querySelector("#global-search"),
};