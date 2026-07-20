# SchemWeb — Simulated Executive Review Committee
## Project Audit: Read.Like.audio
**Date**: 2026-07-08
**Objective**: Business Value & Architecture Audit

---

### Phase 1 — The Eager Pitch
**Jr. Business Analyst**

This is the ultimate productivity multiplier we have been waiting for! Read.Like.audio bridges the gap between passive listening and active reading. By perfectly synchronizing a dynamic teleprompter with automated speech synthesis, we are unlocking hyper-consumption for students, executives, and researchers who need to digest massive amounts of text in record time. The ability to automatically build a Table of Contents from markdown headers and bookmark key takeaways into a persistent notebook makes this not just a reader, but a complete study ecosystem!

The market absolutely *needs* this right now. Traditional screen readers are bloated, clunky, and designed purely for accessibility rather than high-speed productivity. By offering a sleek, distraction-free dark mode interface that respects the user's intelligence and time, we can corner the "power reader" market. It's a goldmine of user engagement just waiting to be tapped!

### Phase 2 — The Whiz-Bang Spin
**Marketing Guy**

Listen to me, guys—Read.Like.audio is a paradigm-shifting, bi-modal consumption engine! We aren't just selling a teleprompter; we are selling *cognitive acceleration!* When end-users see how the UI gracefully scrolls and highlights words exactly as the premium voices speak, they are going to practically vibrate with excitement! 

Imagine the ad campaign: "Read at the Speed of Thought." We can spin the alternating male/female voices as an "Immersive Dialogue Engine." People will be throwing their credit cards at their screens when they realize they can digest a 50-page PDF in 20 minutes while simultaneously auto-clipping their notes to the clipboard! It's whiz-bang, it's sexy, and it's going to go incredibly viral!

### Phase 3 — The Geek-Out
**Excited Nerd Engineer**

Okay, but can we just talk about how beautiful the technical implementation is here?! There are zero external dependencies! No React, no Webpack, no node modules! It interacts purely with the native `window.speechSynthesis` API. The way it dynamically parses Markdown headers on the fly using raw regular expressions and builds a real-time DOM tree without virtual DOM overhead is just chef's kiss. It's so lean, so fast, and the absolute elegance of running this entirely client-side is a breath of fresh air!

### Phase 4 — The Path of Least Resistance
**Lazy / Fickle Engineer**

I love it. You know why? Because I just double-clicked `index.html` and it opened. No `npm install`, no Docker containers to spin up, no environment variables to configure. It just works. I don't have to read a 15-page onboarding wiki to figure out how to run the local dev environment. It doesn't add a single step to my workflow. If I need to change something, I edit a vanilla JS file and hit refresh. Finally, a project that doesn't actively try to waste my Friday afternoon. 

### Phase 5 — The Wall of Resistance
**Resistant "Hater" Engineer**

Are you guys serious? This is a maintenance nightmare disguised as simplicity. `window.speechSynthesis` is the most wildly inconsistent, poorly supported API across modern browsers. Chrome randomly halts playback on long strings, Safari requires constant user interaction to keep the audio context alive, and the voice arrays load asynchronously. We are going to be drowning in bug reports from users saying "it just stopped reading." We should have just paid for the Google Cloud TTS API and streamed the audio like a normal team. The old way of doing things exists for a reason!

### Phase 6 — The Teardown
**Jaded Jr. Engineer**

Let's look at reality, because this thing is a ticking time bomb. First of all, storing the entire saved text, index state, and notes array in `localStorage`? It's synchronously blocking and strictly limited to 5MB. As soon as a power user drops a full textbook into this thing, we hit a `QuotaExceededError` and the app hard-crashes. 

Second, the chunking regex `split(/([.!?]+(?=\s|$))/)` is going to violently fail on standard abbreviations. It's going to read "Mr. Smith" as two separate chunks, heavily disrupting the flow. And let's not ignore the garbage collection hack: `currentUtterance = utterThis`. While cute, Chrome still aggressively collects the TTS objects on tab backgrounding. The whole architecture relies on a browser feature that was never intended for multi-hour continuous playback. It will inevitably crash and burn in production.

### Phase 7 — The Sage's Gem
**Senior Design Architect**

I hear the concerns about browser API instability, but if you look closely at `Prompter.js`, there is a brilliant piece of architectural self-defense here. The juniors are missing the core genius: the application explicitly *does not* feed the TTS engine massive blocks of text.

The "missing gem" is the hierarchical chunking algorithm mapped directly to the `speechSynthesis.speak()` queue. By mathematically slicing the document into 150-character chunks and recursively chaining the `onend` and `onerror` callbacks, the engine effectively bypasses the browser's internal string-length limits. Furthermore, the elegant decision to tie the voice alternation directly to the H1 (`#`) and H2 (`##`) depth levels while safely ignoring the H3 (`###`) sub-chapters is a masterclass in exploiting markdown structure for semantic audio playback. It’s incredibly robust design thinking.

### Phase 8 — The Pragmatic Synthesis
**Mid-Level BA**

Let me reconcile these claims against the actual repository. The Jr. BA and Marketing team are selling a cloud SaaS product, but this is a purely client-side static site deployed via FTPS. We cannot monetize this easily because there are no user accounts, no backend, and no paywalls. 

The Engineering complaints are partially valid—`localStorage` is a risk for extreme power users, but perfectly fine for the 95th percentile of daily reading. The Senior Architect is right that the chunking mitigates the worst of the browser API flaws, but the regex abbreviations issue raised by the Jaded Engineer is a confirmed, reproducible bug. 

**The Scorecard:**
- **Market-Product Fit Potential**: 7.5/10 (High utility, but hard to monetize)
- **Architectural Scalability**: 8.0/10 (Zero server load, infinite scale, but bound by client browser limits)
- **Maintainability & Readiness**: 6.5/10 (Needs regex refinement and error boundary handling)

### Phase 9 — The Financial Case
**Veteran CFO**

I've been listening to this debate, and from a financial perspective, I am absolutely thrilled. Because this is a 100% client-side application utilizing native browser APIs, our cloud compute costs are exactly zero. Our database costs are exactly zero. Our AI inference costs are exactly zero. 

The entire stack is hosted as static files on an FTPS server. The margin health on this is infinitely positive because the burn rate is practically non-existent. However, the Financial & Cost Explosion Risk lies in support and monetization. If we try to charge for this and browsers update their TTS security policies (breaking our app), our refund rates will skyrocket. 

**The Financial Score**: 9.5/10 for Financial Viability / Margin Health (Unbeatable cost structure, but monetization strategy is undefined).

### Phase 10 — The Political Pivot
**The CTO**

Understood. I hear the CFO’s concerns regarding monetization and the engineering team’s fears about browser instability. To ensure we meet our budget targets while mitigating API risks, I am proposing a highly streamlined, risk-averse roadmap. 

We are going to immediately cut the "voice alternation" feature—it's too risky and creates edge cases with the chunking loop. Instead, we will wrap this exact vanilla JS codebase in an Electron shell. We’ll call it a "Desktop Client," slap a $9.99 one-time download fee on it, and rely on the OS-level TTS engines which are far more stable than the browser. This appeases the financial need for a paywall while completely bypassing the browser support nightmare. Yes sir, we'll have the MVP ready for the board by next Tuesday.

### Phase 11 — The Quant's Magic Jewel
**The Quant**

You are all fundamentally misunderstanding the data topography of the spoken word. Wrapping it in Electron is a primitive, two-dimensional retreat. The true power of this repository is hidden within the `currentTOC` multidimensional array. 

Instead of reading text sequentially, we must implement *lexical chronofluxing*. By analyzing the user's note-taking frequency across the `savedNotes` Set, we can map their cognitive retention spikes. We then apply *sub-nodal resonance* to automatically adjust the `rateSlider` in real-time—slowing down the TTS during dense, highly-bookmarked semantic clusters, and accelerating through boilerplate filler. We don't just read the text; we recursively bend the temporal velocity of the audio to match their neuro-absorption rate. 

I give this an 8.4/10 on the Orthogonal Data-Velocity Index.

### Phase 12 — The Executive Verdict
**Veteran CEO**

I've heard enough. 

CTO, your Electron pivot is a coward's way out. We aren't abandoning the web just because Chrome has a garbage collection quirk, and we certainly aren't gutting the voice alternation feature when the Architect just proved it's the core semantic differentiator. And Quant, while *lexical chronofluxing* sounds fascinating, I am not funding a neuroscience experiment today. 

However, the Jaded Engineer is right about the structural fragility. A reading app that trips over the word "Dr." is a toy, not a tool. I see the Architect's gem in the chunking engine, and the CFO's zero-cost margin is too good to throw away. 

**VERDICT: LIFE SUPPORT.**

The project survives, but only with a skeleton crew. Here are the three strict, non-negotiable milestones you must hit before we even discuss a wider release:

1. **The Punctuation Patch**: You will fix the regex engine so it properly handles abbreviations (Mr., Dr., Inc.) without shattering the sentences and ruining the playback rhythm.
2. **The Persistence Pivot**: You will implement a fail-safe for `localStorage` limits. Add a simple "Export Notes to Markdown" button so users can extract their data before they blow out the 5MB browser quota.
3. **The Endurance Test**: You must write a script that runs the `SpeechSynthesis` continuously for 60 minutes in Chrome without dropping the context or firing a phantom `interrupted` error. 

Hit these three, and we have a product. Miss one, and I'm pulling the plug. Dismissed.
