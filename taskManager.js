class TaskManager {
  constructor() {
    this.tasks = [];
    this.init();
  }

  // Initialize tasks asynchronously
  async init() {
    try {
      const storedTasks = localStorage.getItem("tasks");
      this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
    } catch (error) {
      console.error("Failed to initialize tasks:", error);
      this.tasks = [];
    }
  }

  // Task Add Function
  async addTask(title, description, priority) {
    if (!title?.trim()) {
      throw new Error("Task title cannot be empty");
    }

    const newTask = {
      id: Date.now(),
      title: title.trim(),
      description: description?.trim() ?? "",
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    try {
      this.tasks = [...this.tasks, newTask];
      await this.saveTasks();
      return newTask;
    } catch (error) {
      console.error("Failed to add task:", error);
      throw new Error("Failed to add task");
    }
  }

  // Task Delete Function
  async deleteTask(taskId) {
    try {
      const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return false;

      this.tasks = this.tasks.filter((task) => task.id !== taskId);
      await this.saveTasks();
      return true;
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw new Error("Failed to delete task");
    }
  }

  // Task Update Function
  async updateTask(taskId, updates) {
    try {
      const taskToUpdate = this.tasks.find((task) => task.id === taskId);
      if (!taskToUpdate) throw new Error("Task not found");

      const updatedTask = {
        ...taskToUpdate,
        ...Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== undefined)
        ),
      };

      this.tasks = this.tasks.map((task) =>
        task.id === taskId ? updatedTask : task
      );

      await this.saveTasks();
      return updatedTask;
    } catch (error) {
      console.error("Failed to update task:", error);
      throw new Error("Failed to update task");
    }
  }

  // Task Completion Toggle Function
  async toggleTaskCompletion(taskId) {
    try {
      const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) throw new Error("Task not found");

      const updatedTask = {
        ...this.tasks[taskIndex],
        completed: !this.tasks[taskIndex].completed,
      };

      this.tasks = this.tasks.map((task) =>
        task.id === taskId ? updatedTask : task
      );

      await this.saveTasks();
      return updatedTask;
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
      throw new Error("Failed to toggle task completion");
    }
  }

  // Save Tasks Function
  async saveTasks() {
    try {
      await new Promise((resolve) => {
        localStorage.setItem("tasks", JSON.stringify(this.tasks));
        resolve();
      });
    } catch (error) {
      console.error("Failed to save tasks:", error);
      throw new Error("Failed to save tasks");
    }
  }

  // Task Filter Function - using arrow function and modern array methods
  filterTasks = (filterType) => {
    const filters = {
      completed: (task) => task.completed,
      incomplete: (task) => !task.completed,
      "high-priority": (task) => task.priority === "high",
      "medium-priority": (task) => task.priority === "medium",
      "low-priority": (task) => task.priority === "low",
    };

    return filters[filterType]
      ? this.tasks.filter(filters[filterType])
      : this.tasks;
  };

  // Task Search Function - using arrow function and modern string methods
  searchTasks = (searchTerm = "") => {
    const term = searchTerm.toLowerCase();
    return this.tasks.filter(
      ({ title, description }) =>
        title.toLowerCase().includes(term) ||
        description.toLowerCase().includes(term)
    );
  };
}

class TaskManagerUI {
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.taskForm = document.getElementById("taskForm");
    this.taskList = document.getElementById("taskList");
    this.init();
  }

  async init() {
    this.createFilterAndSearchUI();
    this.setupEventListeners();
    await this.renderTasks();
  }

  setupEventListeners = () => {
    this.taskForm?.addEventListener("submit", this.handleAddTask);
    this.taskList?.addEventListener("click", this.handleTaskActions);
  };

  createFilterAndSearchUI = () => {
    const filterContainer = document.createElement("div");
    filterContainer.innerHTML = `
      <select id="taskFilter">
        <option value="">All Tasks</option>
        <option value="completed">Completed</option>
        <option value="incomplete">Incomplete</option>
        <option value="high-priority">High Priority</option>
        <option value="medium-priority">Medium Priority</option>
        <option value="low-priority">Low Priority</option>
      </select>
      <input type="text" id="taskSearch" placeholder="Search tasks...">
    `;
    this.taskList?.parentNode.insertBefore(filterContainer, this.taskList);

    document
      .getElementById("taskFilter")
      ?.addEventListener("change", this.handleFilter);
    document
      .getElementById("taskSearch")
      ?.addEventListener("input", this.handleSearch);
  };

  handleFilter = async (event) => {
    const filterType = event.target.value;
    const filteredTasks = this.taskManager.filterTasks(filterType);
    await this.renderTasks(filteredTasks);
  };

  handleSearch = async (event) => {
    const searchTerm = event.target.value;
    const searchResults = this.taskManager.searchTasks(searchTerm);
    await this.renderTasks(searchResults);
  };

  renderTasks = async (tasksToRender = null) => {
    if (!this.taskList) return;

    this.taskList.innerHTML = "";
    const tasks = tasksToRender ?? this.taskManager.tasks;

    const taskElements = tasks.map(this.createTaskElement);
    this.taskList.append(...taskElements);
  };

  createTaskElement = (task) => {
    const taskDiv = document.createElement("div");
    taskDiv.classList.add("task-item");
    task.completed && taskDiv.classList.add("task-completed");

    taskDiv.innerHTML = `
      <div class="task-card">
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <small>Priority: ${task.priority}</small>
      </div>
      <div class="task-actions">
        <button class="complete-btn" data-id="${task.id}">
          ${task.completed ? "Undo" : "Complete"}
        </button>
        <button class="edit-btn" data-id="${task.id}">Edit</button>
        <button class="delete-btn" data-id="${task.id}">Delete</button>
      </div>
    `;

    return taskDiv;
  };

  handleAddTask = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const taskData = Object.fromEntries(formData.entries());

    try {
      await this.taskManager.addTask(
        taskData.title,
        taskData.description,
        taskData.priority
      );

      event.target.reset();
      await this.renderTasks();
    } catch (error) {
      alert(error.message);
    }
  };

  handleTaskActions = async (event) => {
    const target = event.target;
    const taskId = target.dataset.id;
    if (!taskId) return;

    try {
      if (target.classList.contains("complete-btn")) {
        await this.taskManager.toggleTaskCompletion(taskId);
      } else if (target.classList.contains("delete-btn")) {
        await this.taskManager.deleteTask(taskId);
      } else if (target.classList.contains("edit-btn")) {
        await this.showEditModal(taskId);
      }
      await this.renderTasks();
    } catch (error) {
      alert(error.message);
    }
  };

  showEditModal = async (taskId) => {
    const task = this.taskManager.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const modal = document.createElement("div");
    modal.innerHTML = `
      <div class="modal">
        <h2>Edit Task</h2>
        <form id="editTaskForm">
          <input type="text" id="editTaskTitle" value="${task.title}" required>
          <textarea id="editTaskDescription">${task.description}</textarea>
          <select id="editTaskPriority">
            ${["low", "medium", "high"]
              .map(
                (priority) => `
              <option value="${priority}" ${
                  task.priority === priority ? "selected" : ""
                }>
                ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
              </option>
            `
              )
              .join("")}
          </select>
          <button type="submit">Save Changes</button>
          <button type="button" id="cancelEdit">Cancel</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const editForm = document.getElementById("editTaskForm");
    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        await this.taskManager.updateTask(taskId, {
          title: document.getElementById("editTaskTitle").value,
          description: document.getElementById("editTaskDescription").value,
          priority: document.getElementById("editTaskPriority").value,
        });

        document.body.removeChild(modal);
        await this.renderTasks();
      } catch (error) {
        alert(error.message);
      }
    };

    editForm?.addEventListener("submit", handleSubmit);
    document.getElementById("cancelEdit")?.addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  };
}

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  const taskManager = new TaskManager();
  await taskManager.init();
  new TaskManagerUI(taskManager);
});
