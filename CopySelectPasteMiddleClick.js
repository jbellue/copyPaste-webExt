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
            const rect = target.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const text = target.value;
            const fontSize = getComputedStyle(target).fontSize;
            const fontFamily = getComputedStyle(target).fontFamily;
      
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            ctx.font = fontSize + " " + fontFamily;
      
            let totalWidth = 0;
            let caretPosition = 0;
            for (let i = 0; i < text.length; i++) {
              const charWidth = ctx.measureText(text[i]).width;
              if (totalWidth <= x && totalWidth + charWidth >= x) {
                caretPosition = i;
                break;
              }
              totalWidth += charWidth;
            }
    
            target.setSelectionRange(caretPosition, caretPosition);
            const textBefore = target.value.slice(0, caretPosition);
            const textAfter = target.value.slice(caretPosition);
            target.value = `${textBefore}${copiedText}${textAfter}`;

            // Place the cursor after the inserted text
            target.selectionStart = target.selectionEnd = cursorPos + copiedText.length;
        }
    }
});
