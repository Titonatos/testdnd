export function renderField(field) {
    const fieldElement = document.createElement('div');
    fieldElement.className = 'grid-item';
    fieldElement.setAttribute('data-id', field.id);
    const burgerIcon = document.createElement('span');
    burgerIcon.textContent = '≡';
    burgerIcon.style.marginRight = '8px';
    fieldElement.appendChild(burgerIcon);
    fieldElement.appendChild(document.createTextNode(field.name + ' - ' + field.text));
    fieldElement.draggable = true;
    return fieldElement;
} 