/**
 * behaviours.js
 * 
 * This file documents the little things that happen in the main script,
 * including special cases, formatting rules, and things to ignore.
 * 
 * ==========================================
 * 1. FORMATTING & TEXT CLEANUP BEHAVIOURS
 * ==========================================
 * - HTML/Markdown Removal: All HTML tags and Markdown symbols (*, _, `, ~, >) are removed.
 * - THING TO IGNORE (Exception): The '#' symbol is explicitly ignored during cleanup to preserve headings for the Table of Contents.
 * - Whitespace Correction: Multiple spaces are reduced to a single space. Leading spaces on lines are removed.
 * - Special Characters (Dashes & Pipes): Multiple dashes (---) are converted to spaces to prevent reading as "dash dash dash". The pipe symbol (|) is stripped out entirely so it's not spoken.
 * - Unit Expansion: Expands unit abbreviations attached to numbers for accurate speech synthesis. For example, "6.7ms" is expanded to "6.7 milliseconds" to prevent it from being misread or unexpectedly split.
 * - Skip Large Numbers: Numbers with a value of 1,000,000 or greater (e.g., long serial numbers, IDs) are entirely stripped from the text and skipped.
 * - Newline Correction: Multiple blank lines (\n\s*\n) are reduced to exactly two newlines (\n\n).
 * - Punctuation Formatting: Automatically adds a missing space after most punctuation (?!,;:) if immediately followed by a letter. NOTE: Periods (.) are intentionally excluded to preserve filenames like NAME.DN.
 * - Auto-Format on Paste: Triggers formatting automatically 10ms after a paste event.
 * 
 * ==========================================
 * 2. TEXT PARSING & CHUNKING (SPECIAL CASES)
 * ==========================================
 * - Smart Splitting (Filenames): Sentences are split by punctuation ONLY if followed by a space or end-of-string. This prevents breaking mid-filename (e.g., NAME.DN).
 * - Max Length: Sentences are split into chunks of maximum 150 characters to prevent speech synthesis from choking.
 * - Graceful Breaking: If a sentence exceeds 150 characters, the script looks backwards to break at the nearest comma (,), semicolon (;), or colon (:).
 * - Fallback Breaking: If no punctuation is found, it breaks at the nearest space.
 * - Hard Cut: If there are no spaces (e.g., a long URL), it cuts strictly at 149 characters.
 * - Headings: Lines starting with '#' are treated as their own chunks and added to the Table of Contents. Their font size is dynamically calculated based on the heading level: size = 1.5 - (level * 0.1).
 * 
 * ==========================================
 * 3. SPEECH SYNTHESIS & BUGS TO IGNORE
 * ==========================================
 * - Voice Sorting: 
 *    1. Google/Premium/Enhanced English voices.
 *    2. Regular English voices.
 *    3. Google/Premium/Enhanced non-English voices.
 *    4. Other voices.
 * - BUGS TO IGNORE (Chrome 'interrupted' Bug): 
 *    - Chrome randomly throws an 'interrupted' error during speech synthesis. 
 *    - The script explicitly catches this error, ignores it, and auto-continues to the next chunk seamlessly.
 * - Manual Stop vs. Error: The `isManuallyStopped` flag is used to differentiate between a user stopping the playback and an unexpected synthesis error.
 * 
 * ==========================================
 * 4. UI & VISUAL FEEDBACK
 * ==========================================
 * - Temporary Button States: Buttons give visual feedback ("Formatted!", "Auto-Formatted!", "Copied!") and automatically revert to their original text after 1500ms.
 * - Reading Highlight: As the voice reads, the current word is wrapped in a `<span class="highlight">` tag. The script locates the word boundaries based on character indexes provided by the `onboundary` event.
 */

// Example: Extracted Regex Patterns for Formatting Rules
export const FORMATTING_RULES = {
    stripHtmlAndMarkdown: (text) => {
        let stripped = text.replace(/<[^>]*>?/gm, '');
        return stripped.replace(/[*_`~>]/g, ''); // Note: # is excluded
    },
    fixSpacing: (text) => {
        let spaced = text.replace(/\n\s*\n/g, '\n\n'); // Fix newlines
        spaced = spaced.replace(/ +/g, ' ');          // Single spaces
        return spaced.replace(/^ +/gm, '');           // Trim leading spaces
    },
    fixPunctuation: (text) => {
        // Ensure space after punctuation (excluding period to preserve filenames like NAME.DN)
        return text.replace(/([?!,;:])([a-zA-Z])/g, '$1 $2');
    },
    removeSpecialSpeechCharacters: (text) => {
        text = text.replace(/-{2,}/g, ' '); // prevent "dash dash dash"
        text = text.replace(/\|/g, '');     // prevent saying pipe out loud
        return text;
    },
    expandUnits: (text) => {
        // Expand ms so TTS reads "6.7 milliseconds" instead of breaking or mispronouncing
        return text.replace(/(\d)\s*ms\b/gi, '$1 milliseconds');
    },
    skipLargeNumbers: (text) => {
        // Strip numbers >= 1,000,000
        return text.replace(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g, (match) => {
            const num = parseFloat(match.replace(/,/g, ''));
            if (num >= 1000000) return '';
            return match;
        });
    }
};
