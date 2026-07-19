// Header and Controls Logic

const voiceSelect = document.getElementById('voice-select');
const rateSlider = document.getElementById('rate-slider');
const rateValue = document.getElementById('rate-value');
const btnFormat = document.getElementById('btn-format');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');
const sizeSelect = document.getElementById('size-select');
const alternateVoiceCheckbox = document.getElementById('alternate-voice-checkbox');

// Text Size logic
const SAVED_SIZE_KEY = 'synthesize_textSize';
if (localStorage.getItem(SAVED_SIZE_KEY)) {
    const savedSize = localStorage.getItem(SAVED_SIZE_KEY);
    sizeSelect.value = savedSize;
    document.documentElement.style.setProperty('--prompter-font-size', savedSize);
}

sizeSelect.addEventListener('change', () => {
    const newSize = sizeSelect.value;
    document.documentElement.style.setProperty('--prompter-font-size', newSize);
    localStorage.setItem(SAVED_SIZE_KEY, newSize);
});

function populateVoiceList() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = '';
    
    // Sort voices: Google/Premium English first, then English, then Google/Premium other, then other
    voices.sort((a, b) => {
        const aIsEnglish = a.lang.toLowerCase().startsWith('en');
        const bIsEnglish = b.lang.toLowerCase().startsWith('en');
        
        const aIsPremium = a.name.includes('Google') || a.name.includes('Premium') || a.name.includes('Enhanced');
        const bIsPremium = b.name.includes('Google') || b.name.includes('Premium') || b.name.includes('Enhanced');
        
        if (aIsEnglish && !bIsEnglish) return -1;
        if (!aIsEnglish && bIsEnglish) return 1;
        
        if (aIsPremium && !bIsPremium) return -1;
        if (!aIsPremium && bIsPremium) return 1;
        
        return a.name.localeCompare(b.name);
    });
    
    voices.forEach((voice, i) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        
        if (voice.name.includes('Google') || voice.name.includes('Premium') || voice.name.includes('Enhanced')) {
            option.textContent += ' ⭐ (Best for High Speed)';
        } else if (voice.default) {
            option.textContent += ' -- DEFAULT';
        }

        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

// Ensure voices are loaded
populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

// Update speed label
rateSlider.addEventListener('input', () => {
    rateValue.textContent = Number(rateSlider.value).toFixed(1);
});

btnFormat.addEventListener('click', () => {
    if (btnFormat.textContent === 'Clear Text') {
        textInput.value = '';
        localStorage.setItem(SAVED_TEXT_KEY, '');
        localStorage.setItem(SAVED_INDEX_KEY, '0');
        btnFormat.textContent = 'Format Text';
        return;
    }

    formatText();
    
    // Visual feedback
    btnFormat.textContent = 'Formatted!';
    setTimeout(() => {
        btnFormat.textContent = 'Clear Text';
    }, 1500);
});

btnPlay.addEventListener('click', () => {
    speak();
});

btnPause.addEventListener('click', () => {
    if (synth.speaking && !synth.paused) {
        synth.pause();
    }
});

btnStop.addEventListener('click', () => {
    isManuallyStopped = true;
    synth.cancel();
    
    // Return to Edit Mode
    textInput.style.display = 'block';
    prompterView.style.display = 'none';
    document.getElementById('toc-sidebar').style.display = 'none';
    currentChunkIndex = 0;
    allChunks = [];
});

// Notes UI
const btnNotes = document.getElementById('btn-notes');
const notesModal = document.getElementById('notes-modal');
const btnCloseNotes = document.getElementById('btn-close-notes');
const notesOutput = document.getElementById('notes-output');
const btnCopyNotes = document.getElementById('btn-copy-notes');
const btnClearNotes = document.getElementById('btn-clear-notes');

btnNotes.addEventListener('click', () => {
    notesOutput.value = [...savedNotes].join('\n\n');
    notesModal.style.display = 'flex';
});

btnCloseNotes.addEventListener('click', () => {
    notesModal.style.display = 'none';
});

btnCopyNotes.addEventListener('click', () => {
    notesOutput.select();
    document.execCommand('copy');
    const originalText = btnCopyNotes.textContent;
    btnCopyNotes.textContent = 'Copied!';
    setTimeout(() => btnCopyNotes.textContent = originalText, 1500);
});

btnClearNotes.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all notes?')) {
        savedNotes.clear();
        localStorage.setItem('synthesize_notes', '[]');
        notesOutput.value = '';
        
        document.querySelectorAll('.line-action input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }
});
