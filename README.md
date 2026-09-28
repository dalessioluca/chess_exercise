# Chess Visualization Trainer

A browser-based exercise for practicing chess board visualization, with
five exercise types: locating a given square on the board, naming which
piece starts on a given square, naming a given square's color, typing a
square a given piece attacks, and typing a legal path for a piece from
one square to another. Each round can be timed (30 seconds or 2 minutes)
or endless.

## Running the app

This is a static site (plain HTML/CSS/JS) with no build step or
dependencies. Any local web server will work — you can't just double-click
`index.html`, because the browser's security rules block `script.js` from
loading correctly over the `file://` protocol.

### Quick start

```bash
./launch.sh
```

This starts a local server on port 8934 and opens
**http://localhost:8934** in your default browser automatically. Press
`Ctrl+C` to stop the server. To use a different port: `./launch.sh 9000`.

### Manual start

From the project directory:

```bash
python3 -m http.server 8934
```

Then open **http://localhost:8934** in your browser.

Alternative if you have Node.js installed instead:

```bash
npx serve .
```

(follow the URL it prints, usually http://localhost:3000)

To stop the server, press `Ctrl+C` in the terminal where it's running.

## How to play

Menu selection is two steps:

1. **Pick a game mode:**
   - **Locate the Square** — you're given a square; click where it is on
     the board.
   - **Name the Piece** — you're given a square on rank 1 or 8 (the back
     ranks); click which piece starts there — King, Queen, Rook, Bishop,
     or Knight (e.g. g1 → Knight). The piece buttons sit in a panel to
     the right of the board, which is shown for reference only (not
     clickable).
   - **Name the Color** — you're given a square; click **White** or
     **Black** for its color. The board is shown for reference only (not
     clickable).
   - **Does It Attack?** — you're given a Bishop, Knight, or Pawn of a
     given color on a square (e.g. "White Knight on F3"). Type at least
     one square it genuinely attacks, then press **Enter** or **Submit**
     — any correct square counts, you don't need to list them all. Wrong
     answers show the full list of squares it does attack. Attacks are
     calculated on an otherwise empty board (no blockers, no other
     pieces) — pure piece-movement pattern recognition.
   - **Move the Piece** — you're given a Bishop or Knight of a given
     color, a start square, and an end square (e.g. "White Knight,
     B1 → F6"). Type the sequence of squares it passes through to get
     there — e.g. `d2, e4, f6` — separated by commas or spaces, then
     press **Enter** or **Submit**. Any legal path counts, not just the
     shortest one; wrong answers show one valid example. Bishop puzzles
     always keep the start and end square the same color, since a bishop
     can never leave its color. The board is shown for reference only
     (not clickable).
   Use **← Back** to pick a different mode.
2. **Pick a difficulty:**
   - **Beginner** — squares colored, coordinates shown.
   - **Intermediate** — squares colored, no coordinates.
   - **Advanced** — full 8×8 grid lines shown (every square's boundary
     is visible), but no checkerboard coloring.
   - **Expert** — completely empty grid (one line each way, splitting
     the board into 4 quadrants, as a loose visual aid).
   - **Master** — blindfolded (see below). Only offered for **Name the
     Piece** and **Name the Color**, since both have a clean button
     answer; it isn't offered for **Locate the Square** (no board to
     click on blindfolded) or **Does It Attack?** / **Move the Piece**
     (typing an answer by voice isn't practical).
3. **Pick a round length**, shown alongside the difficulty options:
   - **30 Seconds** — the classic quick round.
   - **2 Minutes** — a longer timed round.
   - **Endless** — no timer (a stopwatch counts up instead); keep going
     until you quit (✕ button or **Esc**), at which point your results
     are shown just like a timed round ends.
4. **Pick a board orientation**, also shown on the difficulty screen:
   - **White POV** (default) — the classic view, a1 at the bottom-left,
     h8 at the top-right.
   - **Black POV** — the board flipped 180°, a1 at the top-right, h8 at
     the bottom-left, matching what Black sees across the board. This
     only changes how the board is *drawn*; it has no effect on Master
     mode (no board shown) or on which squares/pieces are used.

Each round starts with a 3-2-1 countdown centered on the board. Every new
target square first flashes large in the center of the board for one
second, then settles into the label at the top, before you answer.

### Scoring (Beginner / Intermediate / Advanced / Expert)

- Correct answer → pleasant chime, new target appears.
- Incorrect answer → low buzz, new target appears. In **Does It Attack?**
  and **Move the Piece**, there's a brief pause after each submission so
  you can read the feedback (and the example answer, if you got it
  wrong) before the next puzzle loads.
- **30 Seconds / 2 Minutes**: when time runs out, your correct/incorrect
  counts (plus accuracy %) are shown. **Endless**: quitting mid-round
  shows the same results screen instead of just discarding your progress.
- Click **Play Again** to retry the same mode, difficulty, and round
  length, or **Change Mode** to go back to the mode-selection menu.

## Master mode (blindfolded)

Built for training away from the screen: the board is hidden entirely,
the app **speaks** each prompt out loud, and you answer by tapping a
large button rather than looking for a specific square.

- The app **speaks** each prompt (e.g. "What's on B 6?" or "Color of
  B 6?") using the browser's built-in text-to-speech — no microphone or
  internet connection involved, and nothing to install.
- You answer by **tapping a button** — the same King/Queen/Rook/Bishop/
  Knight buttons as Name the Piece, or the same White/Black buttons as
  Name the Color, just bigger and with no board next to them. (Speech
  *recognition* was tried first, but real-time transcription turned out
  too slow/unreliable for a fast quiz — tapping is instant and 100%
  reliable, which matters more here.)
- The app plays the correct/incorrect chime and **speaks** "Correct." or
  "Incorrect, it's Knight." before speaking the next prompt.
- Press **Esc** any time to quit back to the menu, findable by touch.
- At the end of the round, the app **speaks** your final score as well as
  showing it on screen.

## Files

- `index.html` — page structure / screens (menu, game, results)
- `style.css` — styling, board layout, full-screen board sizing
- `script.js` — game logic: square/claim generation, timer, scoring,
  sounds, and the Master-mode speech prompts
- `launch.sh` — starts the local server and opens the app
