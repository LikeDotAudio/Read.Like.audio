# Read.Like.audio

## What it is
Read.Like.audio is a minimalist, intelligent teleprompter and screen reader built purely with vanilla web technologies (HTML, CSS, and JS). It takes plain text or Markdown, intelligently formats it, and chunks it into perfectly timed, readable sentences using the browser's native Speech Synthesis API.

## Features
- **Teleprompter View**: As the voice reads, the active sentence is highlighted and automatically scrolled into view, allowing you to follow along visually.
- **Dynamic Table of Contents**: Automatically parses Markdown headings and builds an interactive sidebar tree. As the prompter reads, the current chapter glows to show your position. You can also click any chapter to instantly jump the audio to that section.
- **Hierarchical Line Numbering**: Prompter lines are intelligently numbered based on the chapter depth (e.g., `8.1`, `8.2`).
- **Automated Voice Toggling**: Automatically switches between a male and female voice whenever it hits a new Chapter or Phase, creating a dynamic reading experience.
- **Bookmark Notes**: Every line in the prompter features a checkbox. Checking the box saves that sentence to a persistent "Notes" modal, where you can easily review and copy all of your highlighted takeaways to your clipboard.
- **Robust Persistence**: Your text, current reading position, custom text size, playback speed, and bookmarked notes are all continuously saved to your browser's LocalStorage so you never lose your place across sessions.
- **Intelligent Voice Routing**: Prioritizes premium, high-quality voices (like Google UK English) for superior clarity, especially at high playback speeds.
- **Auto-Formatting**: Instantly strips out messy HTML/Markdown tags, filters out distracting punctuation like arrows (`->`), and fixes spacing issues the moment you paste text into the app.

## Markdown Header Hierarchy & Depth
The prompter uses specific Markdown headers to control the visual Table of Contents, line numbering, and voice-alternating engine:
- **`#` (H1) File Level**: Represents the overall document or meeting. Resets the Chapter count to 0 and toggles the speaker voice.
- **`##` (H2) Chapter Level**: Represents Phases or Chapters. Increments the Chapter count (e.g., Chapter 8) and toggles the speaker voice.
- **`###` (H3) Sub-chapter Level**: Represents Characters or sub-sections. Provides visual depth in the TOC without interrupting the voice or resetting the line numbers.

## Why it is needed
Traditional screen readers and text-to-speech apps are often visually overwhelming, full of unnecessary GUI clutter, or technically unstable. Browsers commonly crash or cut out when their speech synthesis engines are fed massive blocks of text, especially at high playback speeds (e.g. 1.3x and beyond).

**Read.Like.audio** solves these problems by:
1. Implementing a rigorous sentence-level chunking algorithm that bypasses Chrome/browser speech engine limits, preventing crashes on long documents.
2. Providing a clean, ultra-minimalist dark mode interface that maximizes screen real estate and minimizes distractions.
3. Bridging the gap between a reading tool and an active study tool by allowing users to effortlessly bookmark important lines and navigate huge documents via an auto-generated Table of Contents.

## Architecture
The application logic is modularized inside the `src/` directory for maintainability:
- **`Header.js`**: Manages the top-level UI controls, sliders, and format buttons.
- **`Prompter.js`**: The core engine that parses text, calculates depth-based line numbers, tracks the Table of Contents, and runs the SpeechSynthesis logic (including Voice Alternation).
- **`NoteBook.js`**: Manages the interactive notes modal, handling clipping sentences, clearing, and copying to the clipboard.
- **`script.js`**: Handles basic initialization, local storage binding, and the initial formatting/filtering logic.

## Running Locally & Deployment
Because it has zero external dependencies, you can run this app simply by opening `src/index.html` in any modern web browser. No build steps, frameworks, or web servers required.

For deployment, the repository contains a continuous delivery pipeline (`.github/workflows/ftp-deploy.yml`) that automatically uploads the site to an FTPS server whenever a push to the `master` branch occurs.
