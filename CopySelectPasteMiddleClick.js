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
    if (selectedText !== "") {
        copiedText = selectedText;
        console.log("selection is " + copiedText)
    }
});

const textAreaFullWidth = (style, offsetWidth) => {
    let rawWidth = offsetWidth;
    rawWidth -= parseInt(style.getPropertyValue("border-left-width"));
    rawWidth -= parseInt(style.getPropertyValue("border-right-width"));
    rawWidth -= parseInt(style.getPropertyValue("padding-left"));
    rawWidth -= parseInt(style.getPropertyValue("padding-right"));
    return rawWidth;
};

document.addEventListener("mousedown", (event) => {
    if (event.button === 1 && copiedText !== "") {
        const target = event.target;
        if ((target.tagName === "INPUT" && target.type === "text") 
            || target.tagName === "TEXTAREA"
            || target.contentEditable === "true") {
            event.preventDefault();
            const rect = target.getBoundingClientRect();
            const xCursor = event.clientX - rect.left;
            const yCursor = event.clientY - rect.top;
            const text = target.value;
            const style = getComputedStyle(target);
            const fontSize = style.fontSize;
            const fontFamily = style.fontFamily;
            const lineHeightStyle = style.lineHeight;
            let lineHeight;
            if (lineHeightStyle === "normal") {
                lineHeight = parseFloat(fontSize) * 1.2;
            } else {
                // Convert line-height to a number if it's in pixels
                lineHeight = parseFloat(lineHeightStyle);
            }
      
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            ctx.font = fontSize + " " + fontFamily;
            let caretPosition = 0;
            let index = 0;
            let foundIndex = false;
            let totalWidth = 0;
            for (; index < text.length; index++) {
                // measure the width of each character before the cursor
                const charWidth = ctx.measureText(text[index]).width;
                if (totalWidth <= xCursor && totalWidth + charWidth >= xCursor) {
                    // if it goes over, we've found our index
                    caretPosition = index;
                    foundIndex = true;
                    break;
                }
                totalWidth += charWidth;
            }
            if (!foundIndex) {
                caretPosition = text.length;
            }

            if (target.tagName === "TEXTAREA") {
            const textAreaWidth = textAreaFullWidth(style, target.offsetWidth);
                const row = Math.floor(yCursor / lineHeight);
                let targetCols = 0;
                // keep measuring until we go over the full width
                for (; index < text.length; index++) {
                    const charWidth = ctx.measureText(text[index]).width;
                    totalWidth += charWidth;
                    if (totalWidth > textAreaWidth) {
                        targetCols = index;
                        break;
                    }
                }
                // there's a bug here, because of the wrapping:
                // 123456789112
                //┌────────────┐
                //│some text   │
                //│wrapping    │
                //└────────────┘
                // the text "wrapping" is sent to the next row, but the width calculation
                // doesn't handle that - so the rows are calculated as 12 characters, when
                // there are only 9 in the first one.

                caretPosition += targetCols * row;
            }
    
            target.setSelectionRange(caretPosition, caretPosition);
            const textBefore = target.value.slice(0, caretPosition);
            const textAfter = target.value.slice(caretPosition);
            target.value = `${textBefore}${copiedText}${textAfter}`;
        }
    }
});