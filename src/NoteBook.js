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
