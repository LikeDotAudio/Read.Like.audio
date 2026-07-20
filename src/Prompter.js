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
        // Split on punctuation only if followed by a space or end of string 
        // (prevents breaking on filenames like NAME.DN)
        let rawChunks = textToProcess.split(/([.!?]+(?=\s|$))/);
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

    let currentChapterCount = 0;
    let lineInChapter = 0;

    allChunks.forEach((chunk, index) => {
        if (chunk.isHeading) {
            if (chunk.level === 1) {
                currentChapterCount = 0;
                lineInChapter = 1;
            } else if (chunk.level === 2) {
                currentChapterCount++;
                lineInChapter = 1;
            } else {
                lineInChapter++;
            }
        } else {
            lineInChapter++;
        }

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
        numDiv.textContent = `${currentChapterCount}.${lineInChapter}`;
        
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
    
    if (alternateVoiceCheckbox.checked) {
        // Calculate chapter count up to this chunk
        let chapterCount = 0;
        for (let i = 0; i <= index; i++) {
            if (allChunks[i].isHeading && (allChunks[i].level === 1 || allChunks[i].level === 2)) chapterCount++;
        }
        
        // Best-effort selection of male and female English voices
        let maleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Guy') || v.name.includes('David') || v.name.includes('Alex')));
        let femaleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Aria') || v.name.includes('Zira') || v.name.includes('Jenny') || v.name.includes('Samantha')));
        
        // Fallbacks if named voices aren't found
        if (!maleVoice) maleVoice = voices.find(v => v.lang.startsWith('en'));
        if (!femaleVoice) femaleVoice = voices.find(v => v.lang.startsWith('en') && v !== maleVoice);
        
        // Alternate voice based on chapter count
        if (maleVoice && femaleVoice) {
            utterThis.voice = (chapterCount % 2 === 0) ? femaleVoice : maleVoice;
        }
    } else if (voiceSelect.selectedOptions.length > 0) {
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
