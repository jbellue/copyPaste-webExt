# CopyPaste: A Firefox Extension to Mimic X Primary Selection Clipboard

![Logo](icons/icon.svg)

## Overview

This web extension mimics the Linux behavior of copying selected text to a specific clipboard and allows users to paste it using the middle mouse click. If no text is selected, the middle click will function as usual. This extension enhances the user experience by providing a familiar clipboard functionality for users transitioning from Linux environments.

## Features

- **Copy Selected Text**: Automatically copies any selected text to a specific clipboard.
- **Middle Click Paste**: 
  - If text is selected, it pastes the copied text at the mouse cursor position.
  - If no text is selected, it performs the default middle-click action.
- **Input Handling**:
  - For input fields, the text is inserted at the mouse cursor position.
  - For textareas:
    - If the textarea is focused, the text is inserted at the caret position.
    - If not focused, the text is appended at the end.
  - For contentEditable elements:
    - Text is inserted only if the element is focused and the caret is present.

## Usage

1. Select any text on a webpage.
2. Use the middle mouse button to paste the copied text:
   - In input fields, it will paste at the cursor position.
   - In textareas, it will paste at the caret position if focused, or at the end if not.
   - In contentEditable elements, it will paste only if focused and the caret is present.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## License

This project is licensed under the MPL v2 License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the clipboard functionality in the X Window System used in many Linux desktop environments.
- Thanks to the open-source community for their contributions and support.
