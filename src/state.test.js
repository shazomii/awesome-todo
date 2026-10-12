import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./dom.js', () => ({
  domElements: {
    themeToggleIcon: { textContent: '' },
    themeToggleText: { textContent: '' },
    sortSelect: { value: 'dueDate' },
    sortDirectionBtn: { querySelector: () => ({ textContent: 'arrow_upward' }) },
    taskFilter: { value: '' },
    priorityFilter: { value: 'all' },
    tagFilter: { value: 'all' },
  },
}));

const makeTodo = (overrides = {}) => ({
  id: crypto.randomUUID(),
  title: 'Task',
  description: '',
  dueDate: '',
  priority: 'medium',
  complete: false,
  tags: [],
  ...overrides,
});

const makeProject = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'Project',
  description: '',
  color: '#808080',
  isArchived: false,
  todos: [],
  ...overrides,
});

const { appState, filterTodos, getProjectById, getTodosByCategory, getVisibleTodos, searchAllTodos, sortTodos } = await import('./state.js');

if (!globalThis.localStorage) {
  const storage = {};
  globalThis.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null),
    setItem: (key, value) => {
      storage[key] = String(value);
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
  };
}

describe('state helpers', () => {
  beforeEach(() => {
    appState.projects = [];
    appState.activeProject = null;
    appState.viewMode = 'today';
    appState.sortBy = 'dueDate';
    appState.sortAsc = true;
    appState.filters = { searchTerm: '', priority: 'all', tag: 'all' };
    appState.globalSearchTerm = '';
    appState.theme = 'light';
    localStorage.clear();
  });

  it('searches todos across all projects by title and description', () => {
    const alpha = makeProject({ name: 'Alpha', todos: [makeTodo({ title: 'Write report', description: 'Quarterly summary' })] });
    const beta = makeProject({ name: 'Beta', todos: [makeTodo({ title: 'Buy milk', description: 'Only 2 litres' })] });
    appState.projects = [alpha, beta];

    expect(searchAllTodos('report')).toHaveLength(1);
    expect(searchAllTodos('milk')).toHaveLength(1);
    expect(searchAllTodos('summary')).toHaveLength(1);
    expect(searchAllTodos('nope')).toHaveLength(0);
  });

  it('filters by search term, priority and tag', () => {
    const tasks = [
      makeTodo({ title: 'Alpha task', description: 'Wind', priority: 'high', tags: ['work'] }),
      makeTodo({ title: 'Beta task', description: 'Sea', priority: 'low', tags: ['home'] }),
      makeTodo({ title: 'Gamma task', description: 'Rain', priority: 'high', tags: ['work'] }),
    ];

    appState.filters = { searchTerm: 'task', priority: 'high', tag: 'work' };

    expect(filterTodos(tasks)).toHaveLength(2);
    expect(filterTodos(tasks).map(t => t.title)).toEqual(expect.arrayContaining(['Alpha task', 'Gamma task']));

    appState.filters = { searchTerm: 'beta', priority: 'all', tag: 'all' };
    expect(filterTodos(tasks).map(t => t.title)).toEqual(['Beta task']);
  });

  it('sorts tasks by due date, priority and name', () => {
    const tasks = [
      makeTodo({ title: 'Zeta', dueDate: '2025-09-25T16:00', priority: 'low' }),
      makeTodo({ title: 'Alpha', dueDate: '2025-09-18T10:00', priority: 'high' }),
      makeTodo({ title: 'Beta', dueDate: '2025-09-20T09:00', priority: 'medium' }),
    ];

    appState.sortBy = 'dueDate';
    appState.sortAsc = true;
    expect(sortTodos(tasks).map(t => t.title)).toEqual(['Alpha', 'Beta', 'Zeta']);

    appState.sortBy = 'priority';
    appState.sortAsc = true;
    expect(sortTodos(tasks).map(t => t.title)).toEqual(['Alpha', 'Beta', 'Zeta']);

    appState.sortBy = 'name';
    appState.sortAsc = true;
    expect(sortTodos(tasks).map(t => t.title)).toEqual(['Alpha', 'Beta', 'Zeta']);
  });

  it('returns the correct category subsets', () => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(9, 0, 0, 0);

    const earlier = new Date(now);
    earlier.setDate(now.getDate() - 2);
    earlier.setHours(8, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    appState.projects = [
      makeProject({
        name: 'One',
        todos: [
          makeTodo({ title: 'Done task', complete: true, dueDate: earlier.toISOString() }),
          makeTodo({ title: 'Today task', dueDate: today.toISOString() }),
          makeTodo({ title: 'Future task', dueDate: tomorrow.toISOString() }),
          makeTodo({ title: 'Overdue task', dueDate: earlier.toISOString(), complete: false }),
        ],
      }),
    ];

    expect(getTodosByCategory('today').map(t => t.title)).toContain('Today task');
    expect(getTodosByCategory('overdue').map(t => t.title)).toContain('Overdue task');
    expect(getTodosByCategory('completed').map(t => t.title)).toContain('Done task');
    expect(getTodosByCategory('upcoming').map(t => t.title)).toContain('Future task');
  });

  it('falls back to default data when persisted state is malformed', async () => {
    const { loadState } = await import('./state.js');

    localStorage.clear();
    localStorage.setItem('todoapp.projects', JSON.stringify([{ id: 'bad-project', name: 'Broken', todos: null }]));
    localStorage.setItem('todoapp.prefs', '{not valid json');

    expect(() => loadState()).not.toThrow();
    expect(appState.projects.length).toBeGreaterThan(0);
    expect(appState.projects.every(project => Array.isArray(project.todos))).toBe(true);
    expect(appState.activeProject).not.toBeNull();
  });

  it('resolves the active view data through pure state selectors', () => {
    const alpha = makeProject({ id: 'p1', name: 'Alpha', todos: [makeTodo({ id: 't1', title: 'Alpha task' })] });
    const beta = makeProject({ id: 'p2', name: 'Beta', todos: [makeTodo({ id: 't2', title: 'Beta task' })] });

    appState.projects = [alpha, beta];
    appState.activeProject = alpha;
    appState.viewMode = 'project';

    expect(getProjectById('p2')?.name).toBe('Beta');
    expect(getVisibleTodos('project', alpha.id).map(t => t.title)).toEqual(['Alpha task']);
    expect(getVisibleTodos('search', null, 'Beta').map(t => t.title)).toEqual(['Beta task']);
  });
});
