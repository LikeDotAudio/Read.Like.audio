const textInput = document.getElementById('text-input');
const prompterView = document.getElementById('prompter-view');


let synth = window.speechSynthesis;
let voices = [];
let savedNotes = new Set(JSON.parse(localStorage.getItem('synthesize_notes') || '[]'));

const SAVED_TEXT_KEY = 'synthesize_savedText';
const SAVED_INDEX_KEY = 'synthesize_savedIndex';

// Restore from local storage on load
if (localStorage.getItem(SAVED_TEXT_KEY)) {
    textInput.value = localStorage.getItem(SAVED_TEXT_KEY);
}

textInput.addEventListener('input', () => {
    localStorage.setItem(SAVED_TEXT_KEY, textInput.value);
    localStorage.setItem(SAVED_INDEX_KEY, '0');
    
    if (textInput.value.trim() === '') {
        btnFormat.textContent = 'Format Text';
    }
});



// Basic text formatter
function formatText() {
    let text = textInput.value;
    
    if (!text.trim()) return;

    // Remove HTML/Markdown tags (preserve # for headings)
    text = text.replace(/<[^>]*>?/gm, '');
    text = text.replace(/[*_`~>]/g, '');
    
    // Special character behaviours
    text = text.replace(/-{2,}/g, ' '); // --- is not read as dash dash dash
    text = text.replace(/\|/g, '');     // | PIPE is not said out loud
    
    // Units formatting
    text = text.replace(/(\d)\s*ms\b/gi, '$1 milliseconds'); // 6.7ms -> 6.7 milliseconds
    
    // Skip large numbers (over a million)
    text = text.replace(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g, (match) => {
        const num = parseFloat(match.replace(/,/g, ''));
        if (num >= 1000000) {
            return '';
        }
        return match;
    });

    // Fix extra spaces and newlines
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.replace(/ +/g, ' ');
    text = text.replace(/^ +/gm, ''); // Remove leading spaces from all lines
    
    // Ensure space after punctuation (excluding period to preserve filenames like NAME.DN)
    text = text.replace(/([?!,;:])([a-zA-Z])/g, '$1 $2');
    
    textInput.value = text.trim();
    
    localStorage.setItem(SAVED_TEXT_KEY, textInput.value);
    localStorage.setItem(SAVED_INDEX_KEY, '0');
}



// Auto-format on paste
textInput.addEventListener('paste', () => {
    setTimeout(() => {
        formatText();
        
        // Brief visual feedback on the button to show it happened automatically
        btnFormat.textContent = 'Auto-Formatted!';
        setTimeout(() => {
            btnFormat.textContent = 'Clear Text';
        }, 1500);
    }, 10);
});






