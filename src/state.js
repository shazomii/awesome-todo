import { cleanup1, cleanup2, cleanup3, garden1, garden2, garden3, garden4, launch1, launch2, launch3, launch4, wellness1, wellness2, wellness3 } from "./default";
import { domElements } from "./dom";
import { createProject } from "./project";
import { createTodo } from "./todo";

export const appState = {
    projects: [],
    activeProject: null,
    viewMode: "today",
    sortBy: "dueDate",
    sortAsc: true,
    filters: {
        searchTerm: "",
        priority: "all"
    },
    globalSearchTerm: "",
};

export const searchAllTodos = (searchTerm) => {
    if (!searchTerm) return [];

    const searchResults = appState.projects.flatMap(project =>
        project.todos
            .filter(todo => {
                const matchesTitle = todo.title.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesDescription = todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesTitle || matchesDescription;
            })
            .map(todo => ({
                ...todo,
                projectName: project.name,
                projectId: project.id
            }))
    );
    return searchResults;
}

export const filterTodos = (todos) => {
    if (!todos) return [];

    return todos.filter(todo => {
        const matchesSearch = !appState.filters.searchTerm || todo.title.toLowerCase().includes(appState.filters.searchTerm.toLowerCase()) || (todo.description && todo.description.toLowerCase().includes(appState.filters.searchTerm.toLowerCase()));

        const matchesPriority = appState.filters.priority === "all" ||
            todo.priority === appState.filters.priority;

        return matchesSearch && matchesPriority;
    });
}

export const sortTodos = (todos) => {
    const priorityValues = { high: 0, medium: 1, low: 2 };

    return [...todos].sort((a, b) => {
        let comparison = 0;

        switch (appState.sortBy) {
            case "dueDate":
                if (!a.dueDate && !b.dueDate) comparison = 0;
                else if (!a.dueDate) comparison = 1;
                else if (!b.dueDate) comparison = -1;
                else comparison = new Date(a.dueDate) - new Date(b.dueDate);
                break;

            case "priority":
                comparison = priorityValues[a.priority] - priorityValues[b.priority];
                break;

            case "name":
                comparison = a.title.localeCompare(b.title);
                break;
        }

        return appState.sortAsc ? comparison : -comparison;
    });
}

export const getTodosByCategory = (category) => {
    const allTodos = appState.projects.flatMap(project =>
        project.todos.map(todo => ({ ...todo, projectName: project.name }))
    );

    const now = new Date();

    switch (category) {
        case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            return allTodos.filter(todo => {
                if (!todo.dueDate || todo.complete) return false;
                const dueDate = new Date(todo.dueDate);
                return dueDate >= today && dueDate < tomorrow;
            });
        case 'scheduled':
            return allTodos.filter(todo => {
               if (!todo.dueDate || todo.complete) return false;
               const dueDate = new Date(todo.dueDate);
               return dueDate >= now;
            });
        case 'overdue':
            return allTodos.filter(todo => {
                if (!todo.dueDate || todo.complete) return false;
                const dueDate = new Date(todo.dueDate);
                return dueDate < now;
            })
        case 'completed':
            return allTodos.filter(todo => todo.complete);
        default:
            return [];
    }
}

export const saveState = () => {
    localStorage.setItem("todoapp.projects", JSON.stringify(appState.projects));
    localStorage.setItem("todoapp.prefs", JSON.stringify({
        sortBy: appState.sortBy,
        sortAsc: appState.sortAsc,
        filters: appState.filters
    }));
}

export const loadState = () => {
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

    const prefs = JSON.parse(localStorage.getItem("todoapp.prefs"));
    if (prefs) {
        appState.sortBy = prefs.sortBy;
        appState.sortAsc = prefs.sortAsc;
        appState.filters = prefs.filters || { searchTerm: "", priority: "all" };

        if (domElements.sortSelect) {
            domElements.sortSelect.value = prefs.sortBy;
            domElements.sortDirectionBtn.querySelector('.material-icons').textContent = prefs.sortAsc ? 'arrow_upward' : 'arrow_downward';
        }

        if (domElements.taskFilter) {
            domElements.taskFilter.value = prefs.filters.searchTerm;
            domElements.priorityFilter.value = prefs.filters.priority;
        }
    }
}

export const resetToDefaults = () => {
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

    appState.projects = [gardenProject, launchProject, wellnessProject, cleanupProject];
    appState.activeProject = gardenProject;
    appState.viewMode = "project";

    saveState();
}

export function resetFilters() {
    appState.filters = {
        searchTerm: "",
        priority: "all"
    };
    appState.sortBy = "dueDate";
    appState.sortAsc = true;
}