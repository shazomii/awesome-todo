export const createProject = (name, description = "") => {
    const todos = [];

    const addTodo = (todo) => {
        todos.push(todo);
    };

    const removeTodo = (todoId) => {
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex > -1) {
            todos.splice(todoIndex, 1);
        }
    };

    return {
        id: crypto.randomUUID(),
        name, description, get todos() { return todos }, addTodo, removeTodo,
    };
};