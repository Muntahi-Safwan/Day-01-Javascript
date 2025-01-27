class TaskManager {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  }

  // Task Add Function
  addTask = async (title, description, priority) => {
    if (!title || title.trim() === "") {
      throw new Error("Task title cannot be empty");
    }

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  };

  // Task Delete Function
  deleteTask = async (taskId) => {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex !== -1) {
      this.tasks.splice(taskIndex, 1);
      this.saveTasks();
      return true;
    }
    return false;
  };

  // Task Update Function
  updateTask = async (taskId, updates) => {
    const taskToUpdate = this.tasks.find((task) => task.id === taskId);
    if (!taskToUpdate) {
      throw new Error("Task not found");
    }
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        taskToUpdate[key] = updates[key];
      }
    });
    this.saveTasks();
    return taskToUpdate;
  };

  // Task Completion Toggle Function
  toggleTaskCompletion(taskId) {
    const task = this.tasks.find((task) => task.id === taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    task.completed = !task.completed;
    this.saveTasks();

    return task;
  }
  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  // Task Filter Function based on the filter type
  filterTasks = (filterType) => {
    switch (filterType) {
      case "completed":
        return this.tasks.filter((task) => task.completed);
      case "incomplete":
        return this.tasks.filter((task) => !task.completed);
      case "high-priority":
        return this.tasks.filter((task) => task.priority === "high");
      case "medium-priority":
        return this.tasks.filter((task) => task.priority === "medium");
      case "low-priority":
        return this.tasks.filter((task) => task.priority === "low");
      default:
        return this.tasks;
    }
  };

  // Task Search Function
  searchTasks(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term)
    );
  }
}

class TaskManagerUI {
  constructor(taskManager) {
    this.taskManager = taskManager;
    this.taskForm = document.getElementById("taskForm");
    this.taskList = document.getElementById("taskList");
    this.createFilterAndSearchUI();
    this.taskForm.addEventListener("submit", this.handleAddTask.bind(this));
    this.taskList.addEventListener("click", this.handleTaskActions.bind(this));
    this.renderTasks();
  }

  // Task Filter and Search UI Creation Function
  createFilterAndSearchUI() {
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
    this.taskList.parentNode.insertBefore(filterContainer, this.taskList);

    const filterSelect = document.getElementById("taskFilter");
    const searchInput = document.getElementById("taskSearch");

    filterSelect.addEventListener("change", this.handleFilter.bind(this));
    searchInput.addEventListener("input", this.handleSearch.bind(this));
  }

  handleFilter(event) {
    const filterType = event.target.value;
    const filteredTasks = this.taskManager.filterTasks(filterType);
    this.renderTasks(filteredTasks);
  }

  handleSearch(event) {
    const searchTerm = event.target.value;
    const searchResults = this.taskManager.searchTasks(searchTerm);
    this.renderTasks(searchResults);
  }

  renderTasks(tasksToRender = null) {
    this.taskList.innerHTML = "";
    const tasks = tasksToRender || this.taskManager.tasks;
    tasks.forEach((task) => {
      const taskElement = this.createTaskElement(task);
      this.taskList.appendChild(taskElement);
    });
  }

  createTaskElement(task) {
    const taskDiv = document.createElement("div");
    taskDiv.classList.add("task-item");
    if (task.completed) {
      taskDiv.classList.add("task-completed");
    }

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
  }

  handleAddTask(event) {
    event.preventDefault();

    const titleInput = document.getElementById("taskTitle");
    const descriptionInput = document.getElementById("taskDescription");
    const priorityInput = document.getElementById("taskPriority");

    try {
      this.taskManager.addTask(
        titleInput.value,
        descriptionInput.value,
        priorityInput.value
      );

      this.taskForm.reset();
      this.renderTasks();
    } catch (error) {
      alert(error.message);
    }
  }

  handleTaskActions(event) {
    const target = event.target;
    const taskId = target.getAttribute("data-id");

    if (target.classList.contains("complete-btn")) {
      this.taskManager.toggleTaskCompletion(taskId);
      this.renderTasks();
    }

    if (target.classList.contains("delete-btn")) {
      this.taskManager.deleteTask(taskId);
      this.renderTasks();
    }

    if (target.classList.contains("edit-btn")) {
      this.showEditModal(taskId);
    }
  }

  showEditModal(taskId) {
    const task = this.taskManager.tasks.find((t) => t.id === taskId);

    const modal = document.createElement("div");
    modal.innerHTML = `
            <div class="modal">
                <h2>Edit Task</h2>
                <form id="editTaskForm">
                    <input type="text" id="editTaskTitle" value="${
                      task.title
                    }" required>
                    <textarea id="editTaskDescription">${
                      task.description
                    }</textarea>
                    <select id="editTaskPriority">
                        <option value="low" ${
                          task.priority === "low" ? "selected" : ""
                        }>Low Priority</option>
                        <option value="medium" ${
                          task.priority === "medium" ? "selected" : ""
                        }>Medium Priority</option>
                        <option value="high" ${
                          task.priority === "high" ? "selected" : ""
                        }>High Priority</option>
                    </select>
                    <button type="submit">Save Changes</button>
                    <button type="button" id="cancelEdit">Cancel</button>
                </form>
            </div>
        `;

    document.body.appendChild(modal);

    const editForm = document.getElementById("editTaskForm");
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const updatedTitle = document.getElementById("editTaskTitle").value;
      const updatedDescription = document.getElementById(
        "editTaskDescription"
      ).value;
      const updatedPriority = document.getElementById("editTaskPriority").value;

      this.taskManager.updateTask(taskId, {
        title: updatedTitle,
        description: updatedDescription,
        priority: updatedPriority,
      });

      document.body.removeChild(modal);
      this.renderTasks();
    });

    document.getElementById("cancelEdit").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const taskManager = new TaskManager();
  new TaskManagerUI(taskManager);
});

const modalStyle = document.createElement("style");
modalStyle.textContent = `
    .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 500px;
    }
    .modal h2 {
        margin: 0;
        padding: 0;
        font-size: 1.2em;
        width: 100%;
        text-align: center;
    }
    .modal form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 500px;
        padding: 10px;
    }
    .modal form input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
    }
    .modal form textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
    }
    .modal select {
        width: 100%;
        height: 40px;
        padding: 10px;
        border: 1px solid #ccc;
    }
    .modal button {
        padding: 10px;

    }
`;
document.head.appendChild(modalStyle);
