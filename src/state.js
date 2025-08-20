import { cleanup1, cleanup2, cleanup3, garden1, garden2, garden3, garden4, launch1, launch2, launch3, launch4, wellness1, wellness2, wellness3 } from "./default";
import { createProject } from "./project";
import { createTodo } from "./todo";

export const appState = {
    projects: [],
    activeProject: null,
};

export function saveState() {
    localStorage.setItem("todoapp.projects", JSON.stringify(appState.projects));
}

export function loadState() {
    const projectsJSON = localStorage.getItem("todoapp.projects");
    if (projectsJSON == null) {
        const gardenProject = createProject("Garden");
        const launchProject = createProject("Launch");
        const wellnessProject = createProject("Wellness");
        const cleanupProject = createProject("Cleanup");
        gardenProject.addTodo(garden1);
        gardenProject.addTodo(garden2);
        gardenProject.addTodo(garden3);
        gardenProject.addTodo(garden4);

        launchProject.addTodo(launch1);
        launchProject.addTodo(launch2);
        launchProject.addTodo(launch3);
        launchProject.addTodo(launch4);

        wellnessProject.addTodo(wellness1);
        wellnessProject.addTodo(wellness2);
        wellnessProject.addTodo(wellness3);

        cleanupProject.addTodo(cleanup1);
        cleanupProject.addTodo(cleanup2);
        cleanupProject.addTodo(cleanup3);

        appState.projects.push(gardenProject, launchProject, wellnessProject, cleanupProject);
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
                todo.complete = todoData.complete;
                todo.id = todoData.id;
                project.addTodo(todo)
            });
            return project;
        });
    }
    appState.activeProject = appState.projects[0] || null;
}