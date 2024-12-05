const storageKey = "copy-paste-stored-key";
let copiedText = "";

//#region get the text
const getSelectedText = doc => {
    const selection = doc.getSelection();
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

const getIframeSelectionRecursively = (iframe) => {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        // Check for selection in this iframe
        const selection = iframeDoc.getSelection();
        if (selection && selection.toString()) {
            return { found: true, selectedText: selection.toString() };
        }

        // Recursively check nested iframes
        const nestedIframes = iframeDoc.querySelectorAll("iframe");
        for (const nestedIframe of nestedIframes) {
            const result = getIframeSelectionRecursively(nestedIframe);
            if (result.found) {
                return result;
            }
        }
    } catch (err) {
        // ignore
        // console.warn("Unable to access iframe or nested iframe:", err);
    }
    return { found: false, selectedText: "" };
};

const handleSelectionChange = (event, doc) => {
    let result = getSelectedText(doc);

    if (result.found && result.selectedText !== "") {
        event.preventDefault()
        chrome.storage.local.set({ [storageKey]: result.selectedText });
    }
};

const attachSelectionChangeListener = doc => {
    doc.addEventListener("selectionchange", event => {
        handleSelectionChange(event, doc);
    });
};
const attachMouseDownListener = doc => {
    doc.addEventListener("mousedown", event => {
        handleMiddleClick(event)
    });
}

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
            if (target.tagName === "INPUT" && target.type === "text") {
                caretPosition = getTextInputCaretPosition(event.clientX, target);
            }
            else {
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
                    */
                caretPosition = target.selectionStart;
            }
            insertTextAtCaret(target, caretPosition, copiedText)
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
        const selection = window.getSelection();
        if (!selection.rangeCount) return; // Exit if there's no selection
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
//#endregion

//#region set event handlers
const attachListenersToIframes = (rootDoc, iframePath = []) => {
    // Attach listeners to the root document
    attachSelectionChangeListener(rootDoc);
    attachMouseDownListener(rootDoc);

    // Find all iFrames in the current document
    const iframes = rootDoc.querySelectorAll("iframe");
    for (const [index, iframe] of iframes.entries()) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const newPath = [...iframePath, `iframe[${index}]`];

            // Attach listener to the iframe document
            attachListenersToIframes(iframeDoc, newPath);

            // Also observe future nested iframes within this iframe
            const observer = new MutationObserver(() => {
                attachListenersToIframes(iframeDoc, newPath);
            });
            observer.observe(iframeDoc.body, { childList: true, subtree: true });
        } catch (err) {
            // ignore that error, it all works anyway
            // console.warn("Unable to access iframe content:", err);
        }
    }
};

attachListenersToIframes(document);

// Listen for changes in Chrome storage
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[storageKey]) {
        copiedText = changes[storageKey].newValue || "";
    }
});
//#endregion