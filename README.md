# 🎨 Skribbl.io Multiplayer Drawing & Guessing Game

Welcome to the **Skribbl.io Multiplayer Game** repository! This project is a full-stack, real-time multiplayer drawing and guessing game inspired by the popular web game *skribbl.io*. 

It is built from the ground up using **pure JavaScript** (no TypeScript), featuring a high-performance **Node.js, Express, and Socket.IO** backend coupled with a modern **React and Tailwind CSS** frontend. The entire application runs conveniently on a single unified port and includes optional cloud persistence with **MongoDB Atlas**.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Complete Folder & File Structure](#-complete-folder--file-structure)
- [Technology Stack & Design Choices](#-technology-stack--design-choices)
- [Real-Time WebSocket Protocol](#-real-time-websocket-protocol)
- [REST API Endpoints](#-rest-api-endpoints)
- [Database Models & Persistence](#-database-models--persistence)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Deployment Guide (Render, Netlify, Railway, Vercel & Docker)](#-deployment-guide-render-netlify-railway-vercel--docker)
- [Environment Configuration](#-environment-configuration)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Game Rules & Scoring Formula](#-game-rules--scoring-formula)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Project Overview

In this game, players gather inside a virtual room. Each round, one designated player is chosen as the **Drawer**, while everyone else becomes a **Guesser**:
1. The **Drawer** secretly selects a word from candidate choices and sketches it on an interactive canvas in real time.
2. The **Guessers** watch the drawing appear stroke-by-stroke on their screens and race to type the correct word into the chat.
3. Guessing earlier awards more points! The drawer also earns bonus points when other players guess their artwork correctly.
4. When all rounds conclude, players celebrate on a victory podium with confetti, fanfare sound effects, and an interactive stroke replay viewer.

---

## ✨ Key Features

### 1. Multiplayer Rooms & Custom Game Settings
- **Room Creation**: Create private or public rooms with custom rules.
- **Customizable Host Rules**:
  - Player limit: 2 to 20 players.
  - Round count: 2 to 10 rounds per match.
  - Drawing time limit: 15 to 240 seconds per turn.
  - Word candidate options: 1 to 5 choices for the drawer.
  - Letter hints: 0 to 5 progressive hints revealed automatically.
  - Dictionary categories: Animals, Food, Everyday Objects, Actions, Places, Fantasy, or All.
  - Custom Words: Enter comma-separated custom words with the option to play custom words exclusively.
  - Word Modes: **Normal** (progressive hints), **Hidden** (`? ? ?`), and **Combination** (adjective + noun pairs like "flying pizza").
  - Multilingual Dictionaries: English 🇬🇧, Spanish 🇪🇸, French 🇫🇷, German 🇩🇪, and Hindi 🇮🇳.
- **Easy Room Joining**: Join using a 6-character room code, direct URL parameter (`?room=CODE`), or through the public room lobby browser.
- **Spectator Mode**: Players can join or switch into spectator mode at any time to watch games without participating in turns or score tallying.

### 2. High-Performance Drawing Canvas
- **Normalized Coordinates (`0.0` to `1.0`)**: Drawing coordinates are calculated as percentages of canvas dimensions. This ensures that a drawing made on a wide desktop screen renders identically on a mobile phone or tablet.
- **Creative Tools**:
  - Smooth Pen / Brush with round line caps and line joints.
  - Eraser tool.
  - Flood Fill (Paint Bucket) using a 4-way stack-based scanline flood fill algorithm.
  - 22 curated color swatches + native hex color picker.
  - 4 quick-select brush sizes (3px, 6px, 12px, 24px).
  - Undo stroke action.
  - Clear canvas with confirmation.
- **Instant Catch-up for Late Joiners**: When a player connects or reconnects mid-round, the server transmits the entire drawing history so their canvas matches the room immediately.

### 3. Smart Guessing & Chat Feed
- **Exact Match Engine**: Case-insensitive matching with diacritic stripping and punctuation normalization.
- **"You are close!" Typo Detection**: Uses a dynamic Levenshtein distance algorithm. If a guesser misses by 1 or 2 letters, they receive a private alert that they are close, without leaking the answer to others.
- **Spoiler Shielding**: Once a player guesses the word correctly, their chat messages are hidden from players who are still guessing and highlighted in green for other players who have also guessed.
- **Anti-Cheat Protection**: The drawer is blocked from typing the secret word into the chat to prevent spoiling the round.

### 4. Interactive Stroke-by-Stroke Replay Viewer
- After each round and at the end of the game, players can open the **Replay Viewer** modal.
- Re-watch the entire drawing unfold stroke-by-stroke.
- Control playback with Play, Pause, Restart, scrubber slider, and speed multipliers (1x, 2x, 4x).

### 5. Room Moderation & Fair Play
- **Host Direct Kick**: Room creators can immediately remove disruptive players.
- **Host Permanent Ban**: Room creators can ban an IP / player ID from rejoining the room.
- **Democratic Vote-Kick**: Non-host players can initiate a vote-kick. If more than 50% of the active room votes yes, the target is removed.
- **Player Reporting**: Categorized reports (Spam, Inappropriate Drawing, Harassment) with in-game confirmations.

### 6. Procedural Web Audio Sound Engine
- High quality sound effects generated directly in the browser via the native **Web Audio API**:
  - Ticking countdown timer when time runs low.
  - Cheerful chime when a player guesses correctly.
  - Subtle buzzer on invalid actions.
  - Victorious brass fanfare upon match completion.
  - Pop sounds when joining or clicking buttons.
  - Zero external MP3 downloads required!

### 7. Cloud Persistence with MongoDB Atlas
- Automatically records match outcomes, winner details, player rosters, and final scores.
- Maintains global player records (Games Played, Games Won, Total Score, and Highest Score).
- In-game "Hall of Fame" leaderboard modal fetching all-time top players.

---

## 📁 Complete Folder & File Structure

```
├── backend/
│   ├── server.js               # Main full-stack server (Express, Socket.IO & Vite dev middleware)
│   ├── socketHandler.js        # Real-time WebSocket event routing and game room orchestration
│   ├── Game.js                 # OOP Game state machine (turns, timers, hints, scoring, rounds)
│   ├── Room.js                 # OOP Room manager (player rosters, permissions, vote-kick, ban lists)
│   ├── Player.js               # OOP Player model (avatars, scores, roles, statuses)
│   ├── words.js                # Multilingual dictionary, 7 categories, and custom word parsers
│   ├── db.js                   # MongoDB connection and Mongoose schemas (MatchHistory & PlayerStats)
│   └── game_logic.test.js      # Automated unit tests using Node.js built-in test runner
│
├── frontend/
│   ├── main.jsx                # React root entry point
│   ├── App.jsx                 # Main game controller managing game phases and socket subscriptions
│   ├── index.css               # Global styling with Tailwind CSS and custom fonts
│   │
│   ├── components/
│   │   ├── Canvas.jsx          # HTML5 Canvas with tools, stroke listeners, and flood fill
│   │   ├── ChatAndGuess.jsx    # Real-time chat feed, spoiler shielding, and guess submissions
│   │   ├── GameHeader.jsx      # Round indicator, countdown timer bar, and letter hint display
│   │   ├── Scoreboard.jsx      # Live leaderboard, rank badges, drawer indicator, and kick actions
│   │   ├── Lobby.jsx           # Room creation, match settings form, player list, and public room browser
│   │   ├── WordPickerModal.jsx # 15-second modal for drawers to choose their secret word
│   │   ├── RoundEndModal.jsx   # Round reveal screen, score bonuses, and replay launcher
│   │   ├── GameOverModal.jsx   # Match conclusion podium, confetti fireworks, and final scores
│   │   ├── AvatarCustomizer.jsx# Interactive SVG avatar builder (face color, eyes, expressions)
│   │   └── ReplayViewer.jsx    # Stroke-by-stroke animation replay player with speed controls
│   │
│   └── services/
│       ├── socket.js           # Client-side Socket.IO singleton instance
│       └── sounds.js           # Web Audio API procedural sound synthesizer
│
├── public/                     # Static public assets
├── .env.example                # Template for environment configuration
├── .gitignore                  # Git ignore rules for node_modules, build, logs, and secrets
├── index.html                  # HTML5 document shell with custom fonts and metadata
├── metadata.json               # Applet identity and permission descriptors
├── package.json                # Project dependencies and npm automation scripts
├── vite.config.js              # Vite bundler configuration in pure JavaScript
└── README.md                   # Complete documentation
```

---

## 🛠️ Technology Stack & Design Choices

| Area | Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React (v19)** | Declarative, component-based UI for managing interactive modals, reactive chat feeds, and live scoreboard updates. |
| **Language** | **Pure JavaScript (ES Modules)** | Clean, modern JavaScript (`.jsx` and `.js`) without compilation overhead or TypeScript complexity. |
| **Styling** | **Tailwind CSS (v4)** | Rapid utility-first styling with playful fonts (`Fredoka` & `Nunito`) replicating the vibrant comic aesthetic of skribbl.io. |
| **Real-Time Engine** | **Socket.IO (v4)** | Low-latency, bidirectional WebSocket communication between players with automatic reconnection and fallback. |
| **Backend Framework** | **Express.js (v4)** | Minimalist HTTP server hosting REST APIs, health checks, and integrating Vite middleware. |
| **Canvas Graphics** | **HTML5 Canvas 2D API** | High-performance 2D raster rendering with customizable line widths, round caps, undo stack, and flood fill. |
| **Database** | **MongoDB Atlas + Mongoose** | Flexible document database for storing finished match summaries and accumulating global player leaderboards. |
| **Audio** | **Native Web Audio API** | Procedurally synthesized oscillators and gain envelopes for snappy SFX with zero external audio assets. |
| **Visual Effects** | **canvas-confetti** | Lightweight particle physics confetti for podium celebrations. |
| **Icons** | **lucide-react** | Clean, responsive vector icons for drawing tools, lobby settings, and player roles. |
| **Testing** | **Node.js Test Runner (`node:test`)** | Native test runner for fast, zero-dependency unit testing of game rules and string matching algorithms. |

---

## 🔄 Real-Time WebSocket Protocol

All gameplay communication takes place over WebSockets using Socket.IO.

### Client-to-Server Events
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `get_public_rooms` | `callback(rooms)` | Requests the list of available public rooms. |
| `create_room` | `{ hostName, settings, isPrivate, avatar }` | Initializes a new game room and sets the creator as host. |
| `join_room` | `{ roomId, playerName, avatar, asSpectator }` | Connects a player or spectator to an existing room. |
| `toggle_ready` | None | Toggles the player's ready state in the lobby. |
| `update_settings` | `newSettings` | Updates match rules (Host only). |
| `start_game` | None | Begins the match when conditions are met (Host only). |
| `word_chosen` | `{ word }` | Drawer submits their chosen word from candidate choices. |
| `draw_start` | `{ x, y, color, size, tool }` | Emitted when the drawer begins a stroke (normalized coordinates). |
| `draw_move` | `{ x, y }` | Continuous coordinate updates during drawing. |
| `draw_end` | None | Emitted when the drawer lifts the pointer. |
| `fill_bucket` | `{ x, y, color }` | Triggers a flood-fill fill action at normalized coordinates. |
| `draw_undo` | None | Removes the most recent drawing stroke. |
| `canvas_clear` | None | Clears all artwork from the canvas. |
| `guess` | `{ text }` | Submits a chat message or word guess. |
| `vote_kick` | `{ targetPlayerId }` | Casts a vote to kick a player. |
| `ban_player` | `{ targetPlayerId }` | Host permanently bans a player from the room. |
| `report_player`| `{ targetPlayerId, reason }` | Files a moderation report against a player. |
| `toggle_spectator` | None | Switches between playing and spectating. |
| `return_to_lobby` | None | Resets game back to lobby after game over (Host only). |

### Server-to-Client Events
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `room_created` | `{ roomId, player, roomData }` | Acknowledges successful room creation. |
| `joined_room_success` | `{ roomId, player, roomData }` | Confirms room entry and passes initial state. |
| `game_state` | Complete Game State object | Synchronizes current game phase, round, drawer, and masked word. |
| `time_update` | `{ timeLeft, phase }` | 1-second interval broadcast for countdown timers. |
| `word_choices` | `{ words, timeout }` | Sent privately to the current drawer to pick a word. |
| `hint_update` | `{ maskedWord, revealedCount }`| Broadcasts newly revealed letter hints. |
| `draw_start` | `{ x, y, color, size, tool }` | Replicates drawing stroke start on guesser screens. |
| `draw_move` | `{ x, y }` | Replicates continuous stroke path on guesser screens. |
| `draw_end` | None | Replicates pointer release. |
| `fill_bucket` | `{ x, y, color }` | Replicates flood fill bucket on guesser screens. |
| `canvas_sync_history` | `{ drawingHistory }` | Sends complete drawing history for synchronization. |
| `chat_message` | Chat message object | Delivers chat messages, guesses, and system notifications. |
| `scores_update` | `{ players }` | Broadcasts refreshed player scores and ranks. |
| `round_end` | Round summary payload | Reveals word, score awards, and drawings at round end. |
| `game_over` | Final podium summary payload | Displays 1st, 2nd, and 3rd place winners with confetti. |
| `public_rooms_list` | Array of public room objects | Broadcasts active public room updates. |

---

## 🌐 REST API Endpoints

In addition to WebSockets, the server exposes lightweight REST endpoints:

- **`GET /api/health`**
  - Returns `{ status: "ok", time: 1700000000000 }` to check server availability.
- **`GET /api/db/status`**
  - Returns `{ connected: true, readyState: 1, database: "activityservice_db" }` showing MongoDB status.
- **`GET /api/categories`**
  - Returns dictionary word categories and their display labels.
- **`GET /api/leaderboard`**
  - Returns the top 20 all-time players sorted by total score and victories.
- **`GET /api/matches`**
  - Returns the 10 most recent finished matches with winner details and room IDs.

---

## 🗃️ Database Models & Persistence

The application utilizes **MongoDB Atlas** with **Mongoose**. If a MongoDB connection string is not provided or if the database is unreachable, the server gracefully falls back to purely in-memory gameplay with zero interruption.

### 1. `MatchHistory` Schema
Records complete records of finished matches:
- `roomId` (*String*): Unique 6-letter room identifier.
- `winner` (*Object*): Name, score, and customized avatar of the champion.
- `players` (*Array*): Roster of all participants with their final scores.
- `rounds` (*Number*): Total rounds played.
- `category` (*String*): Word category selected for the match.
- `createdAt` (*Date*): Timestamp of match completion.

### 2. `PlayerStats` Schema
Maintains all-time records across matches:
- `playerName` (*String, unique index*): Player's registered nickname.
- `gamesPlayed` (*Number*): Total matches participated in.
- `gamesWon` (*Number*): Total 1st-place victories.
- `totalScore` (*Number*): Cumulative points earned across all games.
- `highestScore` (*Number*): Highest score achieved in a single match.
- `lastAvatar` (*Object*): Latest avatar customization settings.
- `lastPlayed` (*Date*): Timestamp of most recent game.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: Version 18.0.0 or higher recommended.
- **npm**: Version 8.0.0 or higher.

### Step 1: Clone or Open the Repository
```bash
git clone <repository-url>
cd skribbl-clone
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables (Optional)
Copy the example environment file:
```bash
cp .env.example .env
```
*(You can leave the default values or enter your own MongoDB Atlas URI).*

### Step 4: Run the Development Server
```bash
npm run dev
```
The server will start on **`http://localhost:3000`**. Both the Express backend and the Vite React frontend run together on this single port.

### Step 5: Open Multiple Windows to Play!
Open `http://localhost:3000` in two or more browser tabs to simulate multiple players drawing, guessing, and scoring together!

---

## 🚢 Deployment Guide (Render, Netlify, Railway, Vercel & Docker)

This application is engineered to be **100% production ready** across **Render**, **Netlify**, **Railway**, and **Vercel** with zero code changes needed.

### 🌐 Quick Comparison

| Platform | Best For | Architecture | Pre-Configured Files | Free Tier? |
| :--- | :--- | :--- | :--- | :--- |
| **Render** | Full-Stack All-in-One (Easiest & Free) | Node.js Web Service + Persistent WebSockets | `render.yaml`, `Procfile` | ✅ 100% Free |
| **Netlify** | Free Global CDN Frontend | Static React SPA connecting to Render backend | `netlify.toml` | ✅ 100% Free |
| **Railway** | Full-Stack All-in-One | Nixpacks / Node.js + Persistent WebSockets | `railway.json`, `nixpacks.toml` | ✅ Free Trial |
| **Vercel** | Edge CDN Frontend | Static React SPA connecting to Render backend | `vercel.json` | ✅ 100% Free |
| **Docker** | Any Cloud Host (Fly.io, AWS, GCP, DO) | Alpine Node 20 Multi-Stage Container | `Dockerfile`, `.dockerignore` | ✅ Self-Host |

---

### 1. 🟣 Deploying on Render (Recommended for Full-Stack)

Render natively supports long-running Node.js processes with persistent WebSockets.

#### Method A: One-Click Blueprint (Easiest)
1. Fork or push this repository to your GitHub account.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** and select **Blueprint**.
3. Connect your repository. Render will automatically read `render.yaml` and configure the Web Service with health checks and build commands.
4. (Optional) Add your `MONGODB_URI` under Environment Variables.
5. Click **Apply**! Your app will be live with full real-time canvas support.

#### Method B: Manual Web Service Setup
1. In Render, click **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `skribbl-multiplayer`
   - **Runtime**: `Node`
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter
4. Under **Advanced**:
   - **Health Check Path**: `/api/health`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *(Optional: your MongoDB Atlas connection string)*
6. Click **Create Web Service**. Render assigns a free HTTPS domain (e.g., `https://skribbl-multiplayer.onrender.com`).

---

### 2. 🚂 Deploying on Railway (Recommended for Full-Stack)

Railway automatically detects the repository configuration via `railway.json`, `nixpacks.toml`, and `Procfile`.

1. Go to [Railway.app](https://railway.app) and sign in.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select this repository.
4. Railway will automatically:
   - Detect Node.js
   - Run the build: `npm run build`
   - Start the service: `npm start`
   - Dynamically bind the assigned `PORT` on `0.0.0.0`
5. Click on the deployed service, go to **Variables**, and optionally add:
   - `MONGODB_URI`: *(Optional MongoDB connection string)*
6. In **Settings** > **Networking**, click **Generate Domain** to get a public HTTPS URL (e.g., `https://skribbl-production.up.railway.app`).
7. Enjoy smooth multiplayer drawing!

---

### 3. ▲ Deploying on Vercel

> **Note on Architecture**: Vercel is a serverless platform designed for stateless HTTP APIs and static frontends. Because Skribbl requires persistent bidirectional WebSockets for real-time multiplayer drawing, the recommended approach is:
> - **Frontend on Vercel** (Global edge CDN)
> - **Backend on Render or Railway** (Stateful WebSocket server)

#### Step 1: Deploy Backend to Railway or Render
First deploy your backend on Railway or Render using the steps above to get your backend URL (e.g. `https://skribbl-backend.up.railway.app`).

#### Step 2: Deploy Frontend to Vercel
1. Go to [Vercel](https://vercel.com) and click **Add New...** > **Project**.
2. Import this repository.
3. Vercel automatically detects Vite via `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - **`VITE_BACKEND_URL`**: `https://your-backend.up.railway.app` (or your Render URL)
5. Click **Deploy**.
6. The `vercel.json` file ensures that all Single Page Application (SPA) routes and URL queries (like `?room=ABCDEF`) redirect cleanly to `/index.html` without 404 errors.

---

### 4. 🌐 Deploying on Netlify (100% Free Frontend)

Netlify is globally distributed, blazingly fast, and 100% free for static frontend hosting.

#### Step 1: Deploy Backend to Render First
Deploy the backend on Render for free (using Section 1 above) to obtain your backend server URL (e.g., `https://skribbl-multiplayer.onrender.com`).

#### Step 2: Deploy Frontend on Netlify
1. Log in to your [Netlify Dashboard](https://app.netlify.com).
2. Click **Add new site** > **Import an existing project** (or select GitHub).
3. Select your repository.
4. Netlify will auto-detect settings from `netlify.toml`:
   - **Base directory**: (Leave blank / root)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Add environment variables**:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: `https://skribbl-multiplayer.onrender.com` *(Replace with your Render backend URL)*
6. Click **Deploy skribbl-multiplayer**.
7. Netlify gives you a custom free subdomain like `https://funny-drawing.netlify.app`. All SPA routes and query strings (like `?room=XYZ123`) work automatically thanks to `netlify.toml`!

---

### 5. 🐳 Deploying via Docker (Universal)

A high-efficiency multi-stage `Dockerfile` is included in the project root.

#### Build the image:
```bash
docker build -t skribbl-game .
```

#### Run the container:
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e MONGODB_URI="your_mongodb_uri_here" \
  skribbl-game
```
Access the game at `http://localhost:3000`.

---

## ⚙️ Environment Configuration

Configuration is managed via environment variables. See `.env.example`:

```env
# Server Port (Defaults to 3000 if omitted)
PORT=3000

# Node Environment ('development' or 'production')
NODE_ENV=development

# MongoDB Atlas URI (Optional - enables match history and global leaderboards)
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/activityservice_db?retryWrites=true&w=majority"
```

---

## 🧪 Testing & Quality Assurance

The project includes automated unit tests covering game logic, string sanitization, hint masks, custom word parsing, and moderation rules.

Run the test suite using Node.js's built-in test runner:
```bash
npm test
```

### What is tested:
1. **Word Normalization**: Accents, casing, and punctuation stripping.
2. **Levenshtein Typo Distance**: Accuracy of "You are close!" detection.
3. **Word Masking**: Blank formatting (`_ _ _ _`) and progressive letter reveals.
4. **Game Modes**: Normal, Hidden, and Combination generation.
5. **Custom Words**: Splitting, trimming, and duplicate removal.
6. **Room Moderation**: Player roster handling, host kicks, vote kicks, and ban lists.
7. **Report Filing**: Storage of moderation reports.

To verify code syntax without running:
```bash
npm run lint
```

---

## 🎯 Game Rules & Scoring Formula

### Guessing Points Formula
Points for correct guesses scale dynamically based on how quickly the player responds:
$$\text{Guesser Points} = 100 + \left\lfloor \frac{\text{Time Left}}{\text{Total Round Time}} \times 400 \right\rfloor$$
- **Fastest Guess (at full time)**: Up to **500 points**.
- **Last Second Guess**: Minimum **100 points**.

### Drawer Points Formula
The drawer is rewarded for creating clear, recognizable drawings:
$$\text{Drawer Bonus} = \left\lfloor \frac{\text{Correct Guessers}}{\text{Total Eligible Guessers}} \times 350 \right\rfloor$$
- If every guesser figures out the drawing, the drawer receives a maximum bonus of **350 points**.

---

## ❓ Troubleshooting & FAQ

**Q: Can I run the project without a MongoDB database?**  
A: Yes! If MongoDB is not connected, the server automatically operates in in-memory mode. All rooms, turns, drawing, and scoring work seamlessly. Database connection is only needed for persistent all-time leaderboards.

**Q: How do drawing strokes scale across different screen resolutions?**  
A: Every stroke coordinate is normalized into a `0.0` to `1.0` percentage relative to canvas width and height before transmission. When a client receives stroke points, it multiplies them by its own canvas dimensions, ensuring crisp, accurate rendering on any screen.

**Q: Why is there only one port (3000)?**  
A: In development, Express runs on port 3000 and mounts the Vite development server as an internal middleware (`vite.middlewares`). In production, Express serves the optimized pre-built static bundle from `/dist`. This eliminates CORS issues and simplifies deployment.

**Q: How do I invite friends to my room?**  
A: Inside the room lobby, click the **Copy Link** button. Send the URL to your friends. When they open it, their browser will automatically fill in the room code!

---

Enjoy playing and building with the **Skribbl.io Multiplayer Game**! If you have any suggestions or questions, feel free to contribute or open an issue. Have fun drawing! 🎨✨
