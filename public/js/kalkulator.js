function appendToDisplay(value) {
    const display = document.getElementById("display");
    display.value += value;
}

function operate(operation) {
    const display = document.getElementById("display");
    display.value += operation;
}

function calculate() {
    const display = document.getElementById("display");
    try {
        display.value = eval(display.value);
    } catch {
        display.value = "Error";
    }
}

function clearDisplay() {
    const display = document.getElementById("display");
    display.value = "";
}
