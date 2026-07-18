const textInput = document.getElementById('text-input');
const prompterView = document.getElementById('prompter-view');
const voiceSelect = document.getElementById('voice-select');
const rateSlider = document.getElementById('rate-slider');
const rateValue = document.getElementById('rate-value');
const btnFormat = document.getElementById('btn-format');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');
const sizeSelect = document.getElementById('size-select');

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

// Basic text formatter
function formatText() {
    let text = textInput.value;
    
    if (!text.trim()) return;

    // Remove HTML/Markdown tags (preserve # for headings)
    text = text.replace(/<[^>]*>?/gm, '');
    text = text.replace(/[*_`~>]/g, '');
    
    // Fix extra spaces and newlines
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.replace(/ +/g, ' ');
    text = text.replace(/^ +/gm, ''); // Remove leading spaces from all lines
    
    // Ensure space after punctuation
    text = text.replace(/([.?!,;:])([a-zA-Z])/g, '$1 $2');
    
    textInput.value = text.trim();
    
    localStorage.setItem(SAVED_TEXT_KEY, textInput.value);
    localStorage.setItem(SAVED_INDEX_KEY, '0');
}

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

// Synthesis & Prompter functions
let currentUtterance = null; // Prevent garbage collection
let allChunks = [];
let currentTOC = [];
let currentChunkIndex = 0;
let isManuallyStopped = false;

function parseTextToChunks(rawText) {
    let chunks = [];
    let tocItems = [];
    
    // Split text by lines to preserve headings
    const lines = rawText.split(/\r?\n/);
    let currentParagraph = "";
    
    function flushParagraph() {
        if (currentParagraph.trim() === '') return;
        
        let textToProcess = currentParagraph.replace(/\s+/g, ' ').trim();
        let rawChunks = textToProcess.split(/([.!?]+)/);
        let sentences = [];
        for (let j = 0; j < rawChunks.length; j += 2) {
            let sentence = rawChunks[j];
            let punct = rawChunks[j+1] || "";
            if ((sentence + punct).trim().length > 0) {
                sentences.push((sentence + punct).trim());
            }
        }
        
        sentences.forEach(s => {
            while (s.length > 0) {
                if (s.length <= 150) {
                    chunks.push({ text: s, isHeading: false });
                    break;
                }
                
                let maxEnd = 150;
                let breakIndex = Math.max(
                    s.lastIndexOf(',', maxEnd),
                    s.lastIndexOf(';', maxEnd),
                    s.lastIndexOf(':', maxEnd)
                );
                
                if (breakIndex === -1) breakIndex = s.lastIndexOf(' ', maxEnd);
                if (breakIndex === -1) breakIndex = maxEnd - 1;
                
                chunks.push({ text: s.substring(0, breakIndex + 1).trim(), isHeading: false });
                s = s.substring(breakIndex + 1).trim();
            }
        });
        
        currentParagraph = "";
    }

    lines.forEach(line => {
        let match = line.match(/^\s*(#{1,6})\s+(.*)$/);
        if (match) {
            flushParagraph();
            let headingText = match[2].trim();
            let level = match[1].length;
            
            // Add heading as its own chunk
            let chunkIndex = chunks.length;
            chunks.push({ text: headingText, isHeading: true, level: level });
            
            // Add to TOC
            tocItems.push({ title: headingText, level: level, chunkIndex: chunkIndex });
        } else {
            currentParagraph += " " + line;
        }
    });
    
    flushParagraph();
    return { chunks: chunks, toc: tocItems };
}

function speak() {
    if (synth.speaking && !synth.paused) {
        return;
    }
    
    if (synth.paused) {
        synth.resume();
        return;
    }

    if (textInput.value.trim() === '') return;

    isManuallyStopped = false;

    // Reset synthesis to avoid hanging states
    synth.cancel();
    
    // If we are starting fresh from the text box
    if (textInput.style.display !== 'none') {
        const result = parseTextToChunks(textInput.value);
        allChunks = result.chunks;
        currentTOC = result.toc;
        
        let savedIndex = parseInt(localStorage.getItem(SAVED_INDEX_KEY) || '0', 10);
        currentChunkIndex = (savedIndex >= 0 && savedIndex < allChunks.length) ? savedIndex : 0;
        
        buildPrompterUI(result.toc);
        
        textInput.style.display = 'none';
        prompterView.style.display = 'block';
    }

    if (allChunks.length > 0 && currentChunkIndex < allChunks.length) {
        playChunk(currentChunkIndex);
    }
}

function buildPrompterUI(toc) {
    prompterView.innerHTML = '';
    
    // Build TOC
    const tocSidebar = document.getElementById('toc-sidebar');
    const tocList = document.getElementById('toc-list');
    
    if (toc && toc.length > 0) {
        tocSidebar.style.display = 'block';
        tocList.innerHTML = '';
        toc.forEach((item, i) => {
            const li = document.createElement('li');
            li.id = `toc-item-${i}`;
            li.textContent = item.title;
            li.style.marginLeft = `${(item.level - 1) * 15}px`; // indent based on ## level
            
            li.addEventListener('click', () => {
                isManuallyStopped = true;
                synth.cancel();
                
                document.querySelectorAll('.prompter-line').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.line-text').forEach((el, i) => {
                    el.textContent = allChunks[i].text;
                });
                
                currentChunkIndex = item.chunkIndex;
                localStorage.setItem(SAVED_INDEX_KEY, currentChunkIndex.toString());
                
                setTimeout(() => {
                    isManuallyStopped = false;
                    playChunk(currentChunkIndex);
                }, 50);
            });
            tocList.appendChild(li);
        });
    } else {
        tocSidebar.style.display = 'none';
    }

    allChunks.forEach((chunk, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'prompter-line';
        lineDiv.id = `prompter-line-${index}`;
        
        if (chunk.isHeading) {
            lineDiv.classList.add('heading-line');
            lineDiv.style.fontWeight = 'bold';
            lineDiv.style.fontSize = `${maxLevelSize(chunk.level)}em`; 
        }
        
        const numDiv = document.createElement('div');
        numDiv.className = 'line-number';
        numDiv.textContent = index + 1;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'line-text';
        textDiv.id = `prompter-text-${index}`;
        textDiv.textContent = chunk.text;
        
        const actionDiv = document.createElement('div');
        actionDiv.className = 'line-action';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        
        const textToSave = chunk.text.trim();
        if (savedNotes.has(textToSave)) {
            checkbox.checked = true;
        }
        
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                savedNotes.add(textToSave);
            } else {
                savedNotes.delete(textToSave);
            }
            localStorage.setItem('synthesize_notes', JSON.stringify([...savedNotes]));
        });
        
        actionDiv.appendChild(checkbox);
        
        lineDiv.appendChild(numDiv);
        lineDiv.appendChild(textDiv);
        lineDiv.appendChild(actionDiv);
        
        // Click to skip functionality
        lineDiv.addEventListener('click', () => {
            isManuallyStopped = true;
            synth.cancel();
            
            document.querySelectorAll('.prompter-line').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.line-text').forEach((el, i) => {
                el.textContent = allChunks[i].text;
            });
            
            currentChunkIndex = index;
            localStorage.setItem(SAVED_INDEX_KEY, index.toString());
            
            setTimeout(() => {
                isManuallyStopped = false;
                playChunk(currentChunkIndex);
            }, 50);
        });
        
        prompterView.appendChild(lineDiv);
    });
}

function maxLevelSize(level) {
    const size = 1.5 - (level * 0.1);
    return size < 1.1 ? 1.1 : size;
}

function playChunk(index) {
    if (index >= allChunks.length) {
        // Finished reading everything
        localStorage.setItem(SAVED_INDEX_KEY, '0');
        return;
    }
    
    localStorage.setItem(SAVED_INDEX_KEY, index.toString());
    
    // Update TOC glow
    let activeTocIndex = -1;
    for (let i = 0; i < currentTOC.length; i++) {
        if (index >= currentTOC[i].chunkIndex) {
            activeTocIndex = i;
        } else {
            break;
        }
    }
    
    document.querySelectorAll('#toc-list li').forEach((el, i) => {
        if (i === activeTocIndex) {
            el.classList.add('toc-active');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            el.classList.remove('toc-active');
        }
    });
    
    // Clear old active lines
    document.querySelectorAll('.prompter-line').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.line-text').forEach((el, i) => {
        el.textContent = allChunks[i].text;
    });

    const activeLine = document.getElementById(`prompter-line-${index}`);
    const activeText = document.getElementById(`prompter-text-${index}`);
    
    if (activeLine) {
        activeLine.classList.add('active');
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const chunk = allChunks[index];
    const utterThis = new SpeechSynthesisUtterance(chunk.text);
    currentUtterance = utterThis; // Keep reference to prevent GC bug in some browsers
    
    if (voiceSelect.selectedOptions.length > 0) {
        const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
        for (let i = 0; i < voices.length; i++) {
            if (voices[i].name === selectedOption) {
                utterThis.voice = voices[i];
                break;
            }
        }
    }
    
    utterThis.rate = parseFloat(rateSlider.value);
    
    utterThis.onend = function () {
        currentChunkIndex++;
        playChunk(currentChunkIndex);
    };
    
    utterThis.onerror = function (event) {
        if (isManuallyStopped) return; // Ignore expected stop
        
        console.error('SpeechSynthesisUtterance.onerror on chunk:', event.error || event);
        
        if (event.error === 'interrupted') {
            // Chrome still randomly interrupted the synthesis. Let's auto-continue to the next chunk seamlessly!
            currentChunkIndex++;
            playChunk(currentChunkIndex);
        }
    };

    // Highlight words as it reads
    utterThis.onboundary = function(event) {
        if (event.name === 'word' && activeText) {
            const text = chunk.text;
            const startIndex = event.charIndex;
            let endIndex = startIndex;
            
            // Find the end of the current word
            while (endIndex < text.length && !/\s/.test(text[endIndex])) {
                endIndex++;
            }
            
            const before = text.substring(0, startIndex);
            const word = text.substring(startIndex, endIndex);
            const after = text.substring(endIndex);
            
            activeText.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;
        }
    };
    
    synth.speak(utterThis);
}

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
