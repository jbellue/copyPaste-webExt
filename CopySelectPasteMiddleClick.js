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
    }
});

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
      
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            ctx.font = fontSize + " " + fontFamily;
            let caretPosition = 0;
            if (target.tagName === "INPUT" && target.type === "text") {
                caretPosition = getTextInputCaretPosition(text, ctx, xCursor);
            }
            else if (target.tagName === "TEXTAREA") {
                // Call this function before using the hidden div
                const hiddenDiv = document.getElementById(hiddenDivId) || addHiddenDivToDocument();
                syncHiddenDivStyle(hiddenDiv, style);
                caretPosition = getTextAreaCaretPosition(text, ctx, xCursor, yCursor, hiddenDiv);
            }

            target.setSelectionRange(caretPosition, caretPosition);
            const textBefore = target.value.slice(0, caretPosition);
            const textAfter = target.value.slice(caretPosition);
            target.value = `${textBefore}${copiedText}${textAfter}`;
        }
    }
});

const getTextAreaCaretPosition = (text, ctx, x, y, hiddenDiv) => {
    const tokens = tokenize(text);
    const lines = [];
    let currentLineTokens = [];
    let totalCharacters = 0;
    let currentLineHeight = 0;

    hiddenDiv.textContent = ''; // Reset hidden div
    // calculate the default margins
    const hiddenDivBaseHeight = hiddenDiv.offsetHeight;
    
    let totalHeight = hiddenDivBaseHeight / 2;
    
    for (const token of tokens) {
        currentLineTokens.push(token);
        // Update hidden div with current line content
        hiddenDiv.textContent = currentLineTokens.join('');
        totalCharacters += token.length;
    
        const newLineHeight = hiddenDiv.offsetHeight - hiddenDivBaseHeight;
    
        if (currentLineHeight > 0 && newLineHeight > currentLineHeight) {
            // Line break detected
            // Push the current line (excluding the last token)
            lines.push(currentLineTokens.slice(0, -1).join(''));
            // start a new line only containing the token
            currentLineTokens = [token];
            totalHeight += currentLineHeight;
        }
    
        currentLineHeight = newLineHeight;
    
        // Check if we have the correct line
        if (totalHeight <= y && totalHeight + currentLineHeight > y) {
            let cursorLineTokens = currentLineTokens.join('');
            let lineWidth = ctx.measureText(cursorLineTokens).width;

            // if the line is wider than x, we have the correct token
            if (lineWidth > x) {
                // remove characters one by one until we get before x
                let charIndex = 0;
                while (lineWidth > x && charIndex < cursorLineTokens.length) {
                    charIndex++;
                    lineWidth = ctx.measureText(cursorLineTokens.slice(0, -charIndex)).width;
                }
                return totalCharacters - charIndex;
            }
        }
    }
    // token wasn't found, add at the end
    return text.length;
}

const getTextInputCaretPosition = (text, ctx, x) => {
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
        // measure the width of each character before the cursor
        const charWidth = ctx.measureText(text[i]).width;
        if (totalWidth <= x && totalWidth + charWidth >= x) {
            // if it goes over, we've found our index
            return i;
        }
        totalWidth += charWidth;
    }
    return text.length;
}

const hiddenDivId = `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const addHiddenDivToDocument = () => {
    const hiddenDiv = document.createElement('div');
    hiddenDiv.id = hiddenDivId;
    hiddenDiv.style.visibility = 'hidden';
    hiddenDiv.style.whiteSpace = 'pre-wrap';
    hiddenDiv.style.wordWrap = 'break-word';
    hiddenDiv.style.position = 'absolute';
    hiddenDiv.style.top = '0';
    hiddenDiv.style.left = '0';
    document.body.appendChild(hiddenDiv);
    return hiddenDiv;
};

const syncHiddenDivStyle = (hiddenDiv, sourceStyle) => {
    hiddenDiv.style.width = sourceStyle.width;
    hiddenDiv.style.fontFamily = sourceStyle.fontFamily;
    hiddenDiv.style.fontSize = sourceStyle.fontSize;
    hiddenDiv.style.fontWeight = sourceStyle.fontWeight;
    hiddenDiv.style.lineHeight = sourceStyle.lineHeight;
    hiddenDiv.style.padding = sourceStyle.padding;
    hiddenDiv.style.border = sourceStyle.border;
    hiddenDiv.style.boxSizing = sourceStyle.boxSizing;
    hiddenDiv.style.letterSpacing = sourceStyle.letterSpacing;
    hiddenDiv.style.whiteSpace = sourceStyle.whiteSpace;
    hiddenDiv.style.textAlign = sourceStyle.textAlign;
    hiddenDiv.style.overflow = sourceStyle.overflow;
};
const tokenize = text => {
    // Split text into words and whitespace, preserving tabs and spaces
    const regex = /[^\s\u00A0]+|\s+|\u00A0|\n/g; // Match words, whitespace, non-breaking spaces or new lines
    return text.match(regex) || [];
}
