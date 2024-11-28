let copiedText = ""

const getSelectedText = () => {
    const selection = window.getSelection();
    if (selection.anchorNode && selection.anchorNode.nodeType === 3) {
        if (selection.toString() !== "") {
            return selection.toString();
        }
    } else {
        const activeElement = document.activeElement;
        if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            return activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd);
        }
    }
    return "";
};

document.addEventListener("selectionchange", function() {
    const selectedText = getSelectedText();
    if (selectedText != "") {
        copiedText = selectedText;
        console.log("selection is " + copiedText)
    }
});

document.addEventListener("mousedown", (event) => {
    if (event.button === 1 && copiedText !== "") {
        const target = event.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            event.preventDefault();
            const cursorPos = target.selectionStart;
            const textBefore = target.value.slice(0, cursorPos);
            const textAfter = target.value.slice(cursorPos);
            target.value = `${textBefore}${copiedText}${textAfter}`;

            // Place the cursor after the inserted text
            target.selectionStart = target.selectionEnd = cursorPos + copiedText.length;
        }
    }
});
