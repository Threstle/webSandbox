export function setLabelColor(id: string, color: string) {
    document.getElementById(id).style.backgroundColor = color;
}

export function setLabelText(id: string, text: string) {
    document.getElementById(id).innerHTML = text;
}