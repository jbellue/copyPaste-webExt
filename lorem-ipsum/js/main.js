let mouseX = 0;
let mouseY = 0;

const link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = browser.runtime.getURL("styles/styles.css");
document.head.appendChild(link);

const settings = {
    count: 10,
    type: 'lorem_ipsum',
    unit: 'paragraphs'
};

const storeSettings = () => {
    browser.storage.local.set({ userSettings: settings })
    .catch((error) => {
        console.error('Error updating lorem ipsum settings:', error);
    });
}

// Capture mouse coordinates on right-click
document.addEventListener("contextmenu", (event) => {
    mouseX = event.pageX;
    mouseY = event.pageY;
});

browser.runtime.onMessage.addListener((message) => {
    if (message.action === "showPopup") {
        const inputElement = document.elementFromPoint(mouseX, mouseY);

        // Check if the inputElement is valid
        if (inputElement) {
            const rect = inputElement.getBoundingClientRect();

            // Create the overlay
            const overlay = document.createElement("div");
            overlay.id = "loremIpsumOverlay";

            // Create the popup
            const popup = document.createElement("div");
            popup.id = "loremIpsumPopup";

            // Position the popup roughly over the input element
            popup.style.left = `${rect.left + window.scrollX}px`; // Adjust for scrolling
            popup.style.top = `${rect.bottom + window.scrollY}px`; // Position below the input

            // Add content to the popup
            popup.innerHTML = `
<div class="loremIpsumContainer">
    <div class="loremIpsumColumn">
        <div class="loremIpsumSliderContainer">
            <input type="range" id="numberSlider" min="1" max="20" class="loremIpsumSlider" aria-label="Number of items to generate">
            <span id="sliderValue" class="loremIpsumSliderValue"></span>
        </div>
        <select id="lorem_type" class="loremIpsumSelect" aria-label="Select type of text to generate"></select>
    </div>
    <div class="loremIpsumColumnFlex">
        <select id="lorem_units" class="loremIpsumSelect" aria-label="Select unit of measurement">
            <option value="paragraphs">Paragraphs</option>
            <option value="words">Words</option>
            <option value="letters">Letters</option>
        </select>
        <button id="lorem_generate" class="loremIpsumButton" aria-label="Generate Lorem Ipsum text">Generate ✏️</button>
    </div>
</div>`;
            // Append overlay and popup to the body
            document.body.appendChild(overlay);
            document.body.appendChild(popup);

            // Update the displayed value of the slider
            const slider = document.getElementById("numberSlider");
            const sliderValue = document.getElementById("sliderValue");
            const units = document.getElementById("lorem_units");
            const type = document.getElementById("lorem_type");
            
            browser.storage.local.get('texts').then((data) => {
                for (const key in data.texts) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = data.texts[key].title;
                    type.appendChild(option);
                }
            });

            // Function to update the slider value position
            const updateSliderValuePosition = () => {
                sliderValue.textContent = settings.count;
                const thumbWidth = 20; // Approximate width of the slider thumb
                const valueWidth = sliderValue.offsetWidth; // Get the width of the slider value text
                const valuePercentage = (settings.count - slider.min) / (slider.max - slider.min); // Calculate the percentage of the current value
                sliderValue.style.left = `${valuePercentage * (slider.offsetWidth - thumbWidth) + (thumbWidth / 2) - (valueWidth / 2)}px`; // Adjust position
            };

            // Initial position calculation
            updateSliderValuePosition();

            slider.addEventListener("input", () => {
                settings.count = slider.value;
                updateSliderValuePosition();
                storeSettings();
            });
            
            units.addEventListener('change', () => {
                settings.unit = units.value;
                storeSettings();
            })
            
            type.addEventListener('change', () => {
                settings.type = type.value;
                storeSettings();
            })

            // Add event listeners for the button
            document.getElementById("lorem_generate").addEventListener("click", () => {
                generateLoremIpsum().then(loremText => {
                    inputElement.value = loremText;
                })
                cleanup();
            });

            // Function to remove the overlay and popup
            function cleanup() {
                document.body.removeChild(overlay);
                document.body.removeChild(popup);
            }

            // Remove the popup and overlay when clicking outside of the popup
            overlay.addEventListener("click", cleanup);

            browser.storage.local.get('userSettings')
                .then((result) => {
                    // Access individual properties
                    if (result.userSettings) {
                        settings.count = result.userSettings.count
                        settings.unit = result.userSettings.unit
                        settings.type = result.userSettings.type
                        slider.value = settings.count;
                        updateSliderValuePosition();
                        units.value = settings.unit;
                        type.value = settings.type;
                    }
                });
        } else {
            console.error("No valid input element found at the clicked position.");
        }
    }
});

function generateLoremIpsum() {
    return browser.storage.local.get('texts').then((data) => {
        // Access individual properties
        if (data.texts) {
            const sourceText = data.texts[settings.type].data;
            const words = sourceText.split(" ");
            const totalWords = words.length;
            let result = "";
        
            if (settings.unit === "words") {
                for (let i = 0; i < settings.count; i++) {
                    result += words[i % totalWords] + " "; // Use modulo to wrap around
                }
            } else if (settings.unit === "letters") {
                const totalChars  = sourceText.length;
                for (let i = 0; i < settings.count; i++) {
                    result += sourceText[i % totalChars]; // Use modulo to wrap around
                }
            } else if (settings.unit === "paragraphs") {
                const paragraphs = sourceText.split("\n"); // Assuming paragraphs are separated by double newlines
                for (let i = 0; i < settings.count; i++) {
                    result += paragraphs[i % paragraphs.length] + "\n\n"; // Use modulo to wrap around
                }
            }
        
            return result.trim(); // Trim any trailing spaces
        }
        return "";
    });
}
