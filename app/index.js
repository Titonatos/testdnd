import { Field } from "../entities/field/model.js";
import { renderField } from "../entities/field/ui.js";
import { initDnd } from "../features/dnd/dnd.js";

// Моковые данные: 3 строки, по 2 поля
let rows = [
  [new Field("Имя", "Иван"), new Field("Фамилия", "Иванов")],
  [new Field("Имя", "Мария"), new Field("Фамилия", "Петрова")],
  [new Field("Имя", "Джон"), new Field("Фамилия", "Смит")],
];

const grid = document.getElementById("grid");
let dndInstance = null;

function onDndStateChange(newRows) {
  rows = newRows;
  renderGrid();
}

function renderGrid() {
  grid.innerHTML = "";
  rows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "grid-row";
    row.forEach((field) => {
      rowElement.appendChild(renderField(field));
    });
    grid.appendChild(rowElement);
  });
  if (dndInstance && dndInstance.updateRows) dndInstance.updateRows();
  if (dndInstance && dndInstance.addDragStartListeners)
    dndInstance.addDragStartListeners();
}

document.addEventListener("DOMContentLoaded", () => {
  renderGrid();
  dndInstance = initDnd(grid, rows, onDndStateChange);
});
