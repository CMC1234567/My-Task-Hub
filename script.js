
const taskList = document.getElementById('task-list');
const completedList = document.getElementById('completed-list');
const newTaskInput = document.getElementById('new-task');
const addTaskButton = document.getElementById('add-task');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progress-fill');

const ACTIVE_KEY = 'myTasks';
const COMPLETED_KEY = 'completedTasks';

function loadTasks(key) {
  try {
    const saved = localStorage.getItem(key);
    const tasks = saved ? JSON.parse(saved) : [];

    return Array.isArray(tasks)
      ? tasks.filter(task =>
          task &&
          typeof task.text === 'string' &&
          task.text.trim() !== ''
        )
      : [];
  } catch (error) {
    console.error('Could not load tasks:', error);
    return [];
  }
}

let tasks = loadTasks(ACTIVE_KEY);
let completedTasks = loadTasks(COMPLETED_KEY);

function saveTasks() {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(tasks));
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedTasks));
}

function updateProgress() {
  const total = tasks.length + completedTasks.length;
  const completed = completedTasks.length;

  progress.textContent = `Completed: ${completed} of ${total} tasks`;

  const percentage = total === 0 ? 0 : (completed / total) * 100;
  progressFill.style.width = percentage + '%';
}

function createTaskElement(task, isCompleted) {
  const card = document.createElement('div');
  card.className = 'task-item';

  if (isCompleted) {
    card.classList.add('completed-item');
  }

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = isCompleted;
  checkbox.setAttribute(
    'aria-label',
    isCompleted ? 'Mark task as active' : 'Complete task'
  );

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = task.text;

  checkbox.addEventListener('change', function() {
    if (checkbox.checked) {
      tasks = tasks.filter(item => item.id !== task.id);
      completedTasks.push(task);
    } else {
      completedTasks = completedTasks.filter(
        item => item.id !== task.id
      );
      tasks.push(task);
    }

    saveTasks();
    renderTasks();
  });

  card.appendChild(checkbox);
  card.appendChild(span);

  if (!isCompleted) {
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit';
    editButton.className = 'edit-button';

    editButton.addEventListener('click', function() {
      const updatedText = prompt('Edit your task:', task.text);

      if (updatedText === null) return;

      if (updatedText.trim() === '') {
        alert('Task cannot be empty.');
        return;
      }

      task.text = updatedText.trim();
      saveTasks();
      renderTasks();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-button';

    deleteButton.addEventListener('click', function() {
      if (!confirm(`Delete "${task.text}"?`)) return;

      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    card.appendChild(actions);
  }

  return card;
}

function renderTasks() {
  taskList.replaceChildren();
  completedList.replaceChildren();

  if (tasks.length === 0) {
    const message = document.createElement('p');
    message.className = 'empty-message';
    message.textContent = 'No active tasks. Add one above!';
    taskList.appendChild(message);
  } else {
    tasks.forEach(task => {
      taskList.appendChild(createTaskElement(task, false));
    });
  }

  if (completedTasks.length === 0) {
    const message = document.createElement('p');
    message.className = 'empty-message';
    message.textContent = 'Completed tasks will appear here.';
    completedList.appendChild(message);
  } else {
    completedTasks.forEach(task => {
      completedList.appendChild(createTaskElement(task, true));
    });
  }

  updateProgress();
}

function addTask() {
  const text = newTaskInput.value.trim();

  if (text === '') {
    alert('Please enter a task first!');
    return;
  }

  tasks.push({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    text: text
  });

  newTaskInput.value = '';
  saveTasks();
  renderTasks();
  newTaskInput.focus();
}

addTaskButton.addEventListener('click', addTask);

newTaskInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    addTask();
  }
});

saveTasks();
renderTasks();
