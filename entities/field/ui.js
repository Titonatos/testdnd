export function renderField(field) {
    const fieldElement = document.createElement('div');
    fieldElement.className = 'grid-item';
    fieldElement.setAttribute('data-id', field.id);
    
    const burgerIcon = document.createElement('img');
    burgerIcon.src = '/shared/icons/burgerMenu.svg';
    burgerIcon.alt = 'burgerIcon';
    burgerIcon.style.marginRight = '8px';
    burgerIcon.style.width = '20px';
    burgerIcon.style.height = '20px';

    fieldElement.appendChild(burgerIcon);
    fieldElement.appendChild(document.createTextNode(field.name + ' - ' + field.text));
    fieldElement.draggable = true;
    return fieldElement;
} 