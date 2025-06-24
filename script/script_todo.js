// —————————— DOM 요소 가져오기 ——————————
const todoInput     = document.querySelector('#todoText');
const todoBtn       = document.querySelector('#todoBtn');
const todoContainer = document.querySelector('.todo');
const TEMPLATE_ITEM = document.querySelector('.todo-item');

// 로컬스토리지 키
const TODOS_KEY = 'todos';

// 드래그 중인 아이템 참조
let draggedItem = null;

// —————————— 로컬스토리지 저장/불러오기 ——————————
function saveTodos() {
    const todos = Array.from(todoContainer.children).map(item => ({
        text:     item.querySelector('.todo-text').textContent,
        checked:  item.querySelector('.todo-checkbox').checked
    }));
    
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

function loadTodos() {
    const raw = localStorage.getItem(TODOS_KEY);

    if (!raw) {
        // 로컬에 아무것도 없으면, HTML에 이미 있는 초기 .todo-item 에 이벤트 붙이기
        todoContainer.querySelectorAll('.todo-item')
        .forEach(item => attachTodoEvents(item));
        return;
    }

    const todos = JSON.parse(raw);
    todoContainer.innerHTML = '';
    todos.forEach(data => createTodoItem(data.text, data.checked));
}

loadTodos();

// —————————— 아이템 생성 & 이벤트 바인딩 ——————————
function attachTodoEvents(item) {
    // 드래그 가능
    item.setAttribute('draggable', true);

    item.addEventListener('dragstart', e => {
        draggedItem = item;
        item.classList.add('dragging');
    });
        item.addEventListener('dragend', e => {
        item.classList.remove('dragging');
        saveTodos();
    });

    item.addEventListener('dragover', e => e.preventDefault());

    item.addEventListener('drop', e => {
    e.preventDefault();

    if (draggedItem && draggedItem !== item) {
        const rect   = item.getBoundingClientRect();
        const offset = e.clientY - rect.top;

        // 커서가 위쪽 절반이면 target 앞에, 아니면 뒤에 삽입
        if (offset < rect.height / 2) {
            todoContainer.insertBefore(draggedItem, item);
        } else {
            todoContainer.insertBefore(draggedItem, item.nextSibling);
        }

        saveTodos();
        }
    });

    const checkbox = item.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            todoContainer.appendChild(item);
        } else {
            todoContainer.insertBefore(item, todoContainer.firstChild);
        }

        saveTodos();
    });

    const removeBtn = item.querySelector('#todoRemove');
    removeBtn.addEventListener('click', () => {
        item.remove();
        saveTodos();
    });

    const moveBtn = item.querySelector('#todoMove');
    moveBtn.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault(); 
    });
}

function createTodoItem(text, checked = false) {
    // 템플릿 복제
    const newItem = TEMPLATE_ITEM.cloneNode(true);
    newItem.querySelector('.todo-text').textContent = text;
    const cb = newItem.querySelector('.todo-checkbox');
    cb.checked = checked;

    // 체크된 상태면 맨 아래, 아니면 맨 위
    if (checked) {
        todoContainer.appendChild(newItem);
    } else {
        todoContainer.insertBefore(newItem, todoContainer.firstChild);
    }

    attachTodoEvents(newItem);
}

// —————————— 새 항목 추가 ——————————
todoBtn.addEventListener('click', () => {
    const text = todoInput.value.trim();

    if (!text) return;

    createTodoItem(text, false);
    todoInput.value = '';
    saveTodos();
});

todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    todoBtn.click();
  }
}); 