# Read.Like.audio

## What it is
Read.Like.audio is a minimalist, intelligent teleprompter and screen reader built purely with vanilla web technologies (HTML, CSS, and JS). It takes plain text or Markdown, intelligently formats it, and chunks it into perfectly timed, readable sentences using the browser's native Speech Synthesis API.

## Features
- **Teleprompter View**: As the voice reads, the active sentence is highlighted and automatically scrolled into view, allowing you to follow along visually.
- **Dynamic Table of Contents**: Automatically parses Markdown headings (e.g., `# Chapter 1`) and builds an interactive sidebar tree. As the prompter reads, the current chapter glows to show your position. You can also click any chapter to instantly jump the audio to that section.
- **Bookmark Notes**: Every line in the prompter features a checkbox. Checking the box saves that sentence to a persistent "Notes" modal, where you can easily review and copy all of your highlighted takeaways to your clipboard.
- **Robust Persistence**: Your text, current reading position, custom text size, playback speed, and bookmarked notes are all continuously saved to your browser's LocalStorage so you never lose your place across sessions.
- **Intelligent Voice Routing**: Prioritizes premium, high-quality voices (like Google UK English) for superior clarity, especially at high playback speeds.
- **Auto-Formatting**: Instantly strips out messy HTML/Markdown tags and fixes spacing issues the moment you paste text into the app.

## Why it is needed
Traditional screen readers and text-to-speech apps are often visually overwhelming, full of unnecessary GUI clutter, or technically unstable. Browsers commonly crash or cut out when their speech synthesis engines are fed massive blocks of text, especially at high playback speeds (e.g. 1.3x and beyond).

**Read.Like.audio** solves these problems by:
1. Implementing a rigorous sentence-level chunking algorithm that bypasses Chrome/browser speech engine limits, preventing crashes on long documents.
2. Providing a clean, ultra-minimalist dark mode interface that maximizes screen real estate and minimizes distractions.
3. Bridging the gap between a reading tool and an active study tool by allowing users to effortlessly bookmark important lines and navigate huge documents via an auto-generated Table of Contents.

It is built specifically for users who need to consume, synthesize, and review large quantities of text quickly and efficiently.

## Running Locally
Because it has zero external dependencies, you can run this app simply by opening `index.html` in any modern web browser. No build steps, frameworks, or web servers required.
