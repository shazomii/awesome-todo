import { cleanup1, cleanup2, cleanup3, garden1, garden2, garden3, garden4, launch1, launch2, launch3, launch4, wellness1, wellness2, wellness3 } from "./default";
import { domElements } from "./dom";
import { createProject } from "./project";
import { createTodo } from "./todo";

const DEFAULT_FILTERS = { searchTerm: "", priority: "all", tag: "all" };

const safeStorage = {
    getItem(key) {
        try {
            return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        } catch {
            return null;
        }
    },
    setItem(key, value) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } catch {
            // Ignore storage failures so state updates remain resilient in private mode or restricted contexts.
        }
    }
};

const createDefaultProjects = () => {
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

    return [gardenProject, launchProject, wellnessProject, cleanupProject];
};

const parseStoredValue = (rawValue, fallback) => {
    if (rawValue === null || rawValue === undefined) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(rawValue);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

const normalizePriority = (priority) => (['high', 'medium', 'low'].includes(priority) ? priority : 'medium');

const normalizeFilters = (filters = DEFAULT_FILTERS) => ({
    searchTerm: typeof filters.searchTerm === 'string' ? filters.searchTerm : '',
    priority: filters.priority === 'high' || filters.priority === 'medium' || filters.priority === 'low' ? filters.priority : 'all',
    tag: typeof filters.tag === 'string' ? filters.tag : 'all',
});

const normalizeTodo = (todoData = {}) => {
    const todo = createTodo(
        typeof todoData.title === 'string' && todoData.title.trim() ? todoData.title : 'Untitled task',
        typeof todoData.description === 'string' ? todoData.description : '',
        typeof todoData.dueDate === 'string' ? todoData.dueDate : '',
        normalizePriority(todoData.priority)
    );

    todo.id = typeof todoData.id === 'string' ? todoData.id : todo.id;
    todo.complete = Boolean(todoData.complete);
    todo.tags = Array.isArray(todoData.tags) ? todoData.tags.filter(tag => typeof tag === 'string') : [];
    return todo;
};

const normalizeProject = (projectData = {}) => {
    const project = createProject(
        typeof projectData.name === 'string' && projectData.name.trim() ? projectData.name : 'Untitled Project',
        typeof projectData.description === 'string' ? projectData.description : '',
        typeof projectData.color === 'string' && projectData.color ? projectData.color : '#808080'
    );

    project.id = typeof projectData.id === 'string' ? projectData.id : project.id;
    project.isArchived = Boolean(projectData.isArchived);

    const rawTodos = Array.isArray(projectData.todos) ? projectData.todos : [];
    rawTodos.forEach(todoData => project.addTodo(normalizeTodo(todoData)));

    return project;
};

export const appState = {
    projects: [],
    activeProject: null,
    viewMode: "today",
    sortBy: "dueDate",
    sortAsc: true,
    filters: {
        searchTerm: "",
        priority: "all",
        tag: "all"
    },
    globalSearchTerm: "",
    theme: "light",
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

        const matchesPriority = appState.filters.priority === "all" || todo.priority === appState.filters.priority;

        const matchesTag = appState.filters.tag === "all" || (todo.tags && todo.tags.includes(appState.filters.tag));

        return matchesSearch && matchesPriority && matchesTag;
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
        project.todos.map(todo => ({ ...todo, projectName: project.name, projectId: project.id }))
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
        case 'upcoming':
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

export const getProjectById = (projectId) => {
    if (!projectId) return null;
    return appState.projects.find(project => project.id === projectId) || null;
};

export const getTodoById = (projectId, todoId) => {
    const project = getProjectById(projectId);
    if (!project || !todoId) return null;
    return project.todos.find(todo => todo.id === todoId) || null;
};

export const getVisibleTodos = (viewMode, projectId = null, searchTerm = appState.globalSearchTerm) => {
    switch (viewMode) {
        case 'project': {
            const project = getProjectById(projectId ?? appState.activeProject?.id);
            return project ? project.todos : [];
        }
        case 'search': {
            const term = (searchTerm ?? appState.globalSearchTerm ?? '').trim();
            return term ? searchAllTodos(term) : [];
        }
        default:
            return getTodosByCategory(viewMode);
    }
};

export const saveState = () => {
    const serializableProjects = appState.projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        color: project.color || '#808080',
        isArchived: Boolean(project.isArchived),
        todos: (project.todos || []).map(todo => ({
            id: todo.id,
            title: todo.title,
            description: todo.description || '',
            dueDate: todo.dueDate || '',
            priority: normalizePriority(todo.priority),
            complete: Boolean(todo.complete),
            tags: Array.isArray(todo.tags) ? todo.tags.filter(tag => typeof tag === 'string') : [],
        }))
    }));

    safeStorage.setItem("todoapp.projects", JSON.stringify(serializableProjects));
    safeStorage.setItem("todoapp.prefs", JSON.stringify({
        sortBy: appState.sortBy,
        sortAsc: appState.sortAsc,
        filters: normalizeFilters(appState.filters),
        theme: appState.theme === 'dark' ? 'dark' : 'light'
    }));
}

export const loadState = () => {
    const rawProjects = parseStoredValue(safeStorage.getItem("todoapp.projects"), null);
    const projectsData = Array.isArray(rawProjects) && rawProjects.length > 0 ? rawProjects : createDefaultProjects();

    appState.projects = Array.isArray(projectsData)
        ? projectsData.map(projectData => normalizeProject(projectData))
        : createDefaultProjects();

    appState.activeProject = appState.projects.find(p => !p.isArchived) || appState.projects[0] || null;
    appState.viewMode = appState.activeProject ? 'project' : 'today';

    const prefs = parseStoredValue(safeStorage.getItem("todoapp.prefs"), {});
    const validPrefs = prefs && typeof prefs === 'object' ? prefs : {};

    appState.sortBy = validPrefs.sortBy === 'priority' || validPrefs.sortBy === 'name' ? validPrefs.sortBy : 'dueDate';
    appState.sortAsc = typeof validPrefs.sortAsc === 'boolean' ? validPrefs.sortAsc : true;
    appState.filters = normalizeFilters(validPrefs.filters);
    appState.theme = validPrefs.theme === 'dark' ? 'dark' : 'light';
    appState.globalSearchTerm = '';

    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', appState.theme);

        if (domElements.themeToggleIcon) {
            domElements.themeToggleIcon.textContent = appState.theme === 'dark' ? 'light_mode' : 'dark_mode';
            domElements.themeToggleText.textContent = appState.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }

        if (domElements.sortSelect) {
            domElements.sortSelect.value = appState.sortBy;
            if (domElements.sortDirectionBtn?.querySelector) {
                domElements.sortDirectionBtn.querySelector('.material-icons').textContent = appState.sortAsc ? 'arrow_upward' : 'arrow_downward';
            }
        }

        if (domElements.taskFilter) {
            domElements.taskFilter.value = appState.filters.searchTerm;
            domElements.priorityFilter.value = appState.filters.priority;
        }
    }
}

export const resetToDefaults = () => {
    const projectColors = ['#db4c3f', '#f5a623', '#4a90e2', '#4caf50', '#9b59b6'];
    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const gardenProject = createProject("Garden", "A project to cultivate and maintain a beautiful garden.", getRandomItem(projectColors));
    const launchProject = createProject("Launch", "Tasks related to launching a new website or product.", getRandomItem(projectColors));
    const wellnessProject = createProject("Wellness", "Activities focused on personal health and wellness.", getRandomItem(projectColors));
    const cleanupProject = createProject("Cleanup", "A plan to declutter and organize a specific area.", getRandomItem(projectColors));


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
        priority: "all",
        tag: "all"
    };
    appState.sortBy = "dueDate";
    appState.sortAsc = true;
}