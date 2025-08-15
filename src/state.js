import { createProject } from './project.js';
import { createTodo } from './todo.js';
import { todo1, todo2 } from './default.js';

export const appState = {
    projects: [],
    activeProject: null,
};

export function saveState() {
    localStorage.setItem("awesome-todo.projects", JSON.stringify(appState.projects));
}

export function loadState() {
    const projectsJSON = localStorage.getItem("awesome-todo.projects");
    if (projectsJSON == null) {
        const todayProject = createProject("Today");
        const workProject = createProject("Work");
        todayProject.addTodo(todo1);
        workProject.addTodo(todo2);
        appState.projects.push(todayProject, workProject);
    } else {
        const projectsData = JSON.parse(projectsJSON);
        appState.projects = projectsData.map(projectData => {
            const project = createProject(projectData.name);
            project.id = projectData.id;
            projectData.todos.forEach(todoData => {
                const todo = createTodo(
                    todoData.title,
                    todoData.description,
                    todoData.dueDate,
                    todoData.priority
                );
                todo.id = todoData.id;
                todo.complete = todoData.complete;
                project.addTodo(todo);
            });
            return project;
        });
    }
    appState.activeProject = appState.projects[0] || null;
}