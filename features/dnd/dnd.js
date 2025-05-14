export class DragDropGrid {
  constructor(gridElement, rows, onStateChange) {
    // Основной контейнер для grid
    this.grid = gridElement;
    // Состояние grid'а (массив строк с полями)
    this.state = rows;
    // Callback для обновления состояния
    this.onStateChange = onStateChange;
    // Массив DOM-элементов строк
    this.rows = Array.from(
      this.grid.querySelectorAll(".grid-row:not(.row-placeholder)")
    );
    // Текущий перетаскиваемый элемент
    this.draggedItem = null;
    // Placeholder для визуальной индикации места вставки
    this.placeholder = null;
    // Целевая строка для вставки
    this.targetRow = null;
    // Placeholder для создания новой строки
    this.rowPlaceholder = null;
    
    this.init();
  }

  init() {
    this.addEventListeners();
    this.createRowPlaceholder();
  }

  addDragStartListeners() {
    this.grid.querySelectorAll(".grid-item").forEach((item) => {
      if (!item._dragStartListenerAdded) {
        item.addEventListener("dragstart", this.handleDragStart.bind(this));
        item._dragStartListenerAdded = true;
      }
    });
  }

  addEventListeners() {
    this.addDragStartListeners();
    this.grid.addEventListener("dragover", this.handleDragOver.bind(this));
    this.grid.addEventListener("dragleave", this.handleDragLeave.bind(this));
    this.grid.addEventListener("drop", this.handleDrop.bind(this));
    this.grid.addEventListener("dragend", this.handleDragEnd.bind(this));
  }

  createRowPlaceholder() {
    this.rowPlaceholder = document.createElement("div");
    this.rowPlaceholder.className = "row-placeholder";
    this.rowPlaceholder.style.display = "none";
    this.grid.appendChild(this.rowPlaceholder);
  }

  handleDragStart(e) {
    this.draggedItem = e.target;
    e.dataTransfer.setData("text/plain", e.target.textContent);
    e.target.classList.add("dragging");
    this.placeholder = document.createElement("div");
    this.placeholder.className = "grid-placeholder";
    this.placeholder.style.flexBasis = `${e.target.offsetWidth}px`;
    setTimeout(() => {
      e.target.style.display = "none";
    }, 0);
  }

  handleDragOver(e) {
    e.preventDefault();
    const { row, position } = this.findDropPosition(e.clientY);
    //Если курсор находится до/после строки, то показываем placeholder и убираем targetRow
    if (position === "before" || position === "after") {
      this.showRowPlaceholder(row, position);
      this.targetRow = null;
      return;
    }
    //Если курсор находится внутри строки, то убираем placeholder и показываем targetRow
    if (row) {
      this.hideRowPlaceholder();
      this.targetRow = row;
      this.rows.forEach((r) => r.classList.remove("drop-zone"));
      row.classList.add("drop-zone");
      //Если строка не пустая, то убираем placeholder и находим ближайший элемент внутри строки для вставки placeholder
      if (!row.classList.contains("empty-row")) {
        const existingPlaceholder = row.querySelector(".grid-placeholder");
        //Если placeholder существует, то убираем его
        if (existingPlaceholder) {
          row.removeChild(existingPlaceholder);
        }
        //Находим ближайший элемент внутри строки для вставки placeholder
        const closestItem = this.findClosestItem(row, e.clientX);
        //Если ближайший элемент существует, то вставляем placeholder до/после него
        if (closestItem) {
          const rect = closestItem.getBoundingClientRect();
          const midpoint = rect.left + rect.width / 2;
          if (e.clientX < midpoint) {
            row.insertBefore(this.placeholder, closestItem);
          } else {
            row.insertBefore(this.placeholder, closestItem.nextSibling);
          }
        } else {
          //Если ближайший элемент не существует, то вставляем placeholder в конец строки
          row.appendChild(this.placeholder);
        }
      }
    }
  }

  //Определяет, куда вставлять placeholder: до/после строки или внутрь.
  findDropPosition(yPos) {
    // Логика определения позиции для дропа:
    // 1. Проверка позиции относительно первой строки (верхняя граница)
    // 2. Проверка позиции между строками
    // 3. Проверка позиции относительно последней строки (нижняя граница)
    // 4. Если ни одно условие не сработало, находим ближайшую строку
    
    const firstRow = this.rows[0];
    // Проверка верхней границы (25% от высоты первой строки)
    if (firstRow) {
      const firstRowRect = firstRow.getBoundingClientRect();
      if (yPos < firstRowRect.top + firstRowRect.height * 0.25) {
        return { row: firstRow, position: "before" };
      }
    }

    // Проверка промежутков между строками
    // Используем 25% от высоты текущей и следующей строки для определения зоны между строками
    for (let i = 0; i < this.rows.length - 1; i++) {
      const currentRow = this.rows[i];
      const nextRow = this.rows[i + 1];
      const currentRowRect = currentRow.getBoundingClientRect();
      const nextRowRect = nextRow.getBoundingClientRect();
      if (
        yPos >= currentRowRect.bottom + currentRowRect.height * 0.25 &&
        yPos <= nextRowRect.top + nextRowRect.height * 0.25
      ) {
        return { row: nextRow, position: "before" };
      }
    }

    // Проверка нижней границы (25% от высоты последней строки)
    const lastRow = this.rows[this.rows.length - 1];
    if (lastRow) {
      const lastRowRect = lastRow.getBoundingClientRect();
      if (yPos > lastRowRect.bottom - lastRowRect.height * 0.25) {
        return { row: lastRow, position: "after" };
      }
    }

    // Если курсор не попал ни в одну из зон между строками,
    // находим ближайшую строку по вертикали
    let closestRow = null;
    let closestDistance = Infinity;
    this.rows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      const distance = Math.abs(yPos - (rect.top + rect.height / 2));
      if (distance < closestDistance) {
        closestDistance = distance;
        closestRow = row;
      }
    });
    return { row: closestRow, position: "inside" };
  }

  showRowPlaceholder(referenceRow, position) {
    this.rowPlaceholder.style.display = "block";

    if (position === "before") {
      this.grid.insertBefore(this.rowPlaceholder, referenceRow);
    } else if (position === "after") {
      if (referenceRow.nextSibling) {
        this.grid.insertBefore(this.rowPlaceholder, referenceRow.nextSibling);
      } else {
        this.grid.appendChild(this.rowPlaceholder);
      }
    }
    this.rows.forEach((r) => r.classList.remove("drop-zone"));
  }

  hideRowPlaceholder() {
    if (this.rowPlaceholder.style.display !== "none") {
      this.rowPlaceholder.style.display = "none";
    }
  }

  handleDragLeave(e) {
    if (!e.relatedTarget || !this.grid.contains(e.relatedTarget)) {
      this.hideRowPlaceholder();
    }
  }

  handleDrop(e) {
    e.preventDefault();
    if (!this.draggedItem) return;
    
    // Получаем ID и данные перетаскиваемого поля
    const draggedId = this.draggedItem.getAttribute("data-id");
    const draggedField = this.findFieldById(draggedId);
    if (!draggedField) return;

    // Шаг 1: Удаление поля из старой позиции
    const oldRowIndex = this.findRowIndexByFieldId(draggedId);
    if (oldRowIndex !== -1) {
      const oldRow = this.state[oldRowIndex];
      const fieldIndex = oldRow.findIndex((f) => f.id === draggedId);
      if (fieldIndex !== -1) {
        oldRow.splice(fieldIndex, 1);

        // Удаление пустой строки, если она осталась без полей
        if (oldRow.length === 0) {
          this.state.splice(oldRowIndex, 1);
          const oldRowElement = this.rows[oldRowIndex];
          if (oldRowElement) {
            oldRowElement.remove();
          }
        }
      }
    }

    // Шаг 2: Добавление поля в новую позицию
    if (this.rowPlaceholder.style.display !== "none") {
      // Создание новой строки
      const newRowIndex = this.getRowPlaceholderIndex();
      this.state.splice(newRowIndex, 0, [draggedField]);
    } else if (this.targetRow) {
      // Вставка в существующую строку
      const targetRowIndex = this.getRowIndex(this.targetRow);
      if (targetRowIndex !== -1) {
        const placeholder = this.targetRow.querySelector(".grid-placeholder");
        if (placeholder) {
          // Определение позиции вставки относительно соседних элементов
          const nextItem = placeholder.nextSibling;
          const nextId = nextItem ? nextItem.getAttribute("data-id") : null;
          const fieldIndex = nextId
            ? this.state[targetRowIndex].findIndex((f) => f.id === nextId)
            : this.state[targetRowIndex].length;
          this.state[targetRowIndex].splice(fieldIndex, 0, draggedField);
        } else {
          this.state[targetRowIndex].push(draggedField);
        }
      }
    }

    // Шаг 3: Обновление состояния и DOM
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
    
    // Обновление DOM-структуры
    this.draggedItem.parentElement.removeChild(this.draggedItem);
    if (this.rowPlaceholder.style.display !== "none") {
      // Создание новой строки в DOM
      const newRow = document.createElement("div");
      newRow.className = "grid-row";
      newRow.appendChild(this.draggedItem);
      this.grid.replaceChild(newRow, this.rowPlaceholder);
      this.hideRowPlaceholder();
      this.draggedItem.addEventListener(
        "dragstart",
        this.handleDragStart.bind(this)
      );
    } else if (this.targetRow) {
      // Вставка в существующую строку в DOM
      const placeholder = this.targetRow.querySelector(".grid-placeholder");
      if (placeholder) {
        this.targetRow.replaceChild(this.draggedItem, placeholder);
      } else {
        this.targetRow.appendChild(this.draggedItem);
      }
    }
    
    // Очистка
    this.targetRow?.classList.remove("drop-zone");
    this.rows = Array.from(
      this.grid.querySelectorAll(".grid-row:not(.row-placeholder)")
    );
  }

  handleDragEnd(e) {
    e.target.classList.remove("dragging");
    e.target.style.display = "";
    document.querySelectorAll(".grid-placeholder").forEach((el) => el.remove());
    this.hideRowPlaceholder();
    this.rows.forEach((r) => r.classList.remove("drop-zone"));
    this.draggedItem = null;
    this.placeholder = null;
    this.targetRow = null;
  }

  //Находит ближайший элемент внутри строки для вставки placeholder
  findClosestItem(row, xPos) {
    // Находим все элементы в строке, кроме перетаскиваемого
    const items = Array.from(row.querySelectorAll(".grid-item:not(.dragging)"));
    let closestItem = null;
    let closestDistance = Infinity;
    
    // Вычисляем расстояние от курсора до центра каждого элемента
    // и находим ближайший
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const distance = Math.abs(xPos - (rect.left + rect.width / 2));
      if (distance < closestDistance) {
        closestDistance = distance;
        closestItem = item;
      }
    });
    return closestItem;
  }

  updateRows() {
    this.rows = Array.from(
      this.grid.querySelectorAll(".grid-row:not(.row-placeholder)")
    );
  }

  findFieldById(id) {
    for (const row of this.state) {
      const field = row.find((f) => f.id === id);
      if (field) return field;
    }
    return null;
  }

  findRowIndexByFieldId(id) {
    return this.state.findIndex((row) => row.some((field) => field.id === id));
  }

  getRowPlaceholderIndex() {
    const rows = Array.from(this.grid.children);
    const placeholderIndex = rows.findIndex(
      (row) => row === this.rowPlaceholder
    );
    return placeholderIndex === -1 ? rows.length : placeholderIndex;
  }

  getRowIndex(rowElement) {
    const rows = Array.from(
      this.grid.querySelectorAll(".grid-row:not(.row-placeholder)")
    );
    return rows.indexOf(rowElement);
  }
}

export function initDnd(gridElement, rows, onStateChange) {
  return new DragDropGrid(gridElement, rows, onStateChange);
}
