const storageKey = "copy-paste-stored-key";
let copiedText = "";

//#region get the text
const getSelectedText = () => {
    const selection = document.getSelection();
    let found = false;
    let value = "";
    if (selection 
            && selection.rangeCount > 0
            && selection.anchorNode
            && selection.anchorNode.nodeType === Node.TEXT_NODE) {
        found = true;
        value = selection.toString();
    }
    else {
        const activeElement = document.activeElement;
        if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            found = true;
            value = activeElement.value.substring(
                activeElement.selectionStart,
                activeElement.selectionEnd);
        }
    }
    return {found: found, selectedText: value};
};

const handleSelectionChange = (event) => {
    let result = getSelectedText();

    if (result.found && result.selectedText !== "") {
        event.preventDefault();
        chrome.storage.local.set({ [storageKey]: result.selectedText });
    }
};
//#endregion

//#region set the text
const handleMiddleClick = (event) => {
    if (event.button === 1 && copiedText !== "") {
        const target = event.target;
        if ((target.tagName === "INPUT" && target.type === "text") 
            || target.tagName === "TEXTAREA"
            || target.isContentEditable) {
            event.preventDefault();
            let caretPosition = 0;

            // Handle text inputs
            if (target.tagName === "INPUT" && target.type === "text") {
                caretPosition = getTextInputCaretPosition(event.clientX, target);
            }

            // Handle textareas
            else if (target.tagName === "TEXTAREA") {
                /* 
                    I'm not sure how to get the caret position in a textarea,
                    and I tried a lot of different ways.
                    The most promising one was creating a div of the size of the textarea,
                    then insert words one at a time,
                    increment the line found each time the div grows vertically.
                    Once the correct line is found (comparing to cursor's Y position),
                    find the correct word, then backtrack to find the correct character.
                    this worked great until the scrollbar appeared and screwed the whole calculation.
                    For now, just use the selection - i.e. where the cursor is.
                    If there's no selection, it'll insert at the end.
                    
                    However, if there was a selection, the caret will be somewhere. To handle that,
                    we set the caret position to the cursor if the target has focus, otherwise to the
                    end of the value
                */
                caretPosition = target.matches(':focus') ? target.selectionStart : target.value.length;
            }

            // Handle contentEditable
            else {
                caretPosition = getContentEditableCaretPosition();
            }
            insertTextAtCaret(target, caretPosition, copiedText);
        }
    }
};

const insertTextAtCaret = (target, caretPosition, text) => {
    if (target.setSelectionRange) {
        target.setSelectionRange(caretPosition, caretPosition);
        const textBefore = target.value.slice(0, caretPosition);
        const textAfter = target.value.slice(caretPosition);
        target.value = `${textBefore}${text}${textAfter}`;
        target.setSelectionRange(caretPosition, caretPosition);
    }
    else {
        // target should be contenteditable
        const selection = document.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;

        // Check if the common ancestor is within the contentEditable element
        if (!target.contains(commonAncestor)) return;

        // Create a text node with the desired text
        const textNode = document.createTextNode(text);

        // Insert the text node at the current cursor position
        range.deleteContents(); // Remove any selected text
        range.insertNode(textNode);
    }
}

const getTextInputCaretPosition = (xCursor, target) => {
    const rect = target.getBoundingClientRect();
    const x = xCursor - rect.left;
    const text = target.value;
    const style = getComputedStyle(target);
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = fontSize + " " + fontFamily;
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

const getContentEditableCaretPosition = () => {
    const selection = document.getSelection();
    if (selection.rangeCount === 0) return 0; // No selection

    return selection.focusOffset;
}
//#endregion

//#region set event listeners
document.addEventListener("selectionchange", event => {
    handleSelectionChange(event);
});

document.addEventListener("mousedown", event => {
    handleMiddleClick(event);
});

// Listen for changes in Chrome storage
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[storageKey]) {
        copiedText = changes[storageKey].newValue || "";
    }
});
//#endregion
