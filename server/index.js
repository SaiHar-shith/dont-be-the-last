// server/index.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
// Allow connections from anywhere (Vercel/Render support)
app.use(cors({ origin: "*" }));

const server = http.createServer(app);

// Update Socket.io CORS to allow external connections
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  },
});

// --- General Knowledge question bank ---
const questions = [
  { type: "open", question: "What is the capital city of France?", answer: "paris" },
  { type: "open", question: "Which element has the chemical symbol 'O'?", answer: "oxygen" },
  { type: "open", question: "What is 7 multiplied by 8?", answer: "56" },
  { type: "open", question: "Who wrote the play 'Romeo and Juliet'?", answer: "william shakespeare" },
  { type: "open", question: "What planet is known as the Red Planet?", answer: "mars" },
  { type: "open", question: "What is the largest mammal on Earth?", answer: "blue whale" },
  { type: "open", question: "How many continents are there on Earth?", answer: "7" },
  { type: "open", question: "Which ocean is the largest by area?", answer: "pacific ocean" },
  { type: "open", question: "What gas do plants absorb from the atmosphere?", answer: "carbon dioxide" },
  { type: "open", question: "Who painted the Mona Lisa?", answer: "leonardo da vinci" },
  { type: "open", question: "What is the freezing point of water in degrees Celsius?", answer: "0" },
  { type: "open", question: "Which country is home to the kangaroo?", answer: "australia" },
  { type: "open", question: "What currency is used in Japan?", answer: "yen" },
  { type: "open", question: "What is the largest organ in the human body?", answer: "skin" },
  { type: "open", question: "What is the chemical formula for water?", answer: "h2o" },
  { type: "open", question: "Who discovered penicillin?", answer: "alexander fleming" },
  { type: "open", question: "What is the main language spoken in Brazil?", answer: "portuguese" },
  { type: "open", question: "Which country has the Great Pyramid of Giza?", answer: "egypt" },
  { type: "open", question: "What is the capital of India?", answer: "new delhi" },
  { type: "open", question: "Which instrument has 88 keys?", answer: "piano" },
  { type: "tf", question: "The Great Wall of China is visible from space with the naked eye.", answer: "false" },
  { type: "tf", question: "The human adult skeleton has 206 bones.", answer: "true" },
  { type: "tf", question: "Sound travels faster in air than in water.", answer: "false" },
  { type: "tf", question: "Lightning never strikes the same place twice.", answer: "false" },
  { type: "tf", question: "The chemical symbol for sodium is 'Na'.", answer: "true" },
  { type: "tf", question: "Bats are blind.", answer: "false" },
  { type: "tf", question: "Venus is the hottest planet in our solar system.", answer: "true" },
  { type: "tf", question: "An octagon has six sides.", answer: "false" },
  { type: "tf", question: "Shakespeare wrote 'Hamlet'.", answer: "true" },
  { type: "tf", question: "The capital of Japan is Kyoto.", answer: "false" }
];

// --- Helper Utilities ---
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const normalize = (s) => String(s || "").trim().toLowerCase();

const rooms = Object.create(null);

// --- Broadcast Helpers ---
function emitRoomPlayers(room) {
  if (!rooms[room]) return;
  const names = rooms[room].players.map((p) => p.name);
  io.to(room).emit("room-players", names);
}

function emitTimer(room) {
  if (!rooms[room]) return;
  const holderName = rooms[room].holderId ? rooms[room].nameById[rooms[room].holderId] : "";
  const time = rooms[room].remaining ?? 0;
  io.to(room).emit("bomb-timer", { currentPlayer: holderName, time });
}

// --- CORE GAME LOGIC ---

// 1. Ask question to a specific holder
function askQuestion(room, holderId) {
  if (!rooms[room]) return;

  // IMPORTANT: Clear any existing interval to prevent "double timers"
  if (rooms[room].intervalId) {
    clearInterval(rooms[room].intervalId);
    rooms[room].intervalId = null;
  }

  const q = pickRandom(questions);
  rooms[room].currentQuestion = q;
  rooms[room].holderId = holderId;
  // Set timer to 15 seconds (giving players a bit more time)
  rooms[room].remaining = 15; 

  const holderName = rooms[room].nameById[holderId] || "Unknown";

  // Notify frontend
  io.to(room).emit("bomb-updated", { currentPlayer: holderName });
  io.to(room).emit("new-question", { question: q.question });

  // Start new countdown interval
  rooms[room].intervalId = setInterval(() => {
    const R = rooms[room];
    // Safety check if room was deleted mid-game
    if (!R) return;

    R.remaining -= 1;
    emitTimer(room);

    // If time runs out
    if (R.remaining <= 0) {
      clearInterval(R.intervalId);
      R.intervalId = null;
      eliminateHolder(room);
    }
  }, 1000);

  // Emit initial timer state immediately
  emitTimer(room);
}

// 2. Pass bomb to random other alive player (Success case)
function passBomb(room, currentHolderId) {
  if (!rooms[room]) return;
  const R = rooms[room];

  // Stop current timer immediately
  if (R.intervalId) {
    clearInterval(R.intervalId);
    R.intervalId = null;
  }

  // Find others who are alive
  const others = R.alive.filter((id) => id !== currentHolderId);

  // Edge case: If current player is the only one left alive, they win
  if (others.length === 0) {
     const winnerName = R.nameById[currentHolderId];
     io.to(room).emit("game-over", { winner: winnerName });
     return;
  }

  // Pick random next player
  const nextId = pickRandom(others);
  askQuestion(room, nextId);
}

// 3. Eliminate current holder (Timeout or Wrong Answer)
function eliminateHolder(room) {
  if (!rooms[room]) return;
  const R = rooms[room];

  // Stop current timer
  if (R.intervalId) {
    clearInterval(R.intervalId);
    R.intervalId = null;
  }

  const eliminatedId = R.holderId;
  if (!eliminatedId) return;

  const eliminatedName = R.nameById[eliminatedId];
  // Capture answer before resetting state so we can show it to the user
  const rightAnswer = R.currentQuestion ? R.currentQuestion.answer : "Unknown";

  R.holderId = null;
  R.currentQuestion = null;
  R.remaining = 0;

  // Remove player from alive list
  R.alive = R.alive.filter((id) => id !== eliminatedId);
  const aliveNames = R.alive.map((id) => R.nameById[id]);

  // Send elimination event WITH the correct answer
  io.to(room).emit("player-eliminated", { 
    player: eliminatedName, 
    alivePlayers: aliveNames,
    correctAnswer: rightAnswer 
  });
  
  io.to(room).emit("alive-players", aliveNames);

  // CHECK WIN CONDITION: Only 1 player left
  if (R.alive.length === 1) {
    const winnerName = R.nameById[R.alive[0]];
    io.to(room).emit("game-over", { winner: winnerName });
    return;
  } 
  // CHECK DRAW/EMPTY CONDITION
  else if (R.alive.length === 0) {
    io.to(room).emit("game-over", { winner: "Nobody" });
    return;
  }

  // Game continues: Pick new holder from survivors
  const nextHolder = pickRandom(R.alive);
  askQuestion(room, nextHolder);
}

// --- SOCKET HANDLERS ---
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("create-room", ({ room, name }) => {
    if (!room || !name) return;
    socket.join(room);
    rooms[room] = {
      players: [{ id: socket.id, name }],
      alive: [socket.id],
      nameById: { [socket.id]: name },
      hostId: socket.id,
      holderId: null,
      intervalId: null,
      remaining: 0,
      currentQuestion: null,
    };
    emitRoomPlayers(room);
  });

  socket.on("join-room", ({ room, name }) => {
    if (!room || !name) return;
    socket.join(room);
    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        alive: [],
        nameById: {},
        hostId: socket.id,
        holderId: null,
        intervalId: null,
        remaining: 0,
        currentQuestion: null,
      };
    }
    const R = rooms[room];
    R.players.push({ id: socket.id, name });
    R.alive.push(socket.id);
    R.nameById[socket.id] = name;
    emitRoomPlayers(room);
    io.to(room).emit("alive-players", R.alive.map((id) => R.nameById[id]));
  });

  socket.on("start-game", (room) => {
    const R = rooms[room];
    if (!R) return;
    // Need at least 2 players to start
    if (R.players.length < 2) return;
    // Only host can start
    if (socket.id !== R.hostId) return;

    io.to(room).emit("game-started", {
      starter: R.nameById[R.alive[0]],
      alivePlayers: R.alive.map((id) => R.nameById[id]),
    });

    const starterId = pickRandom(R.alive);
    askQuestion(room, starterId);
  });

  socket.on("submit-answer", ({ room, player, answer }) => {
    const R = rooms[room];
    if (!R) return;
    if (!R.currentQuestion) return;

    const holderName = R.holderId ? R.nameById[R.holderId] : null;
    
    // Security check: ensure only the bomb holder can answer
    if (holderName !== player) return;

    // Normalize answer to check correctness
    const correct = normalize(answer) === normalize(R.currentQuestion.answer);

    if (correct) {
      passBomb(room, R.holderId);
    } else {
      eliminateHolder(room);
    }
  });

  socket.on("disconnect", () => {
    for (const room of Object.keys(rooms)) {
      const R = rooms[room];
      if (!R.nameById[socket.id]) continue;

      // Remove player data
      R.players = R.players.filter((p) => p.id !== socket.id);
      R.alive = R.alive.filter((id) => id !== socket.id);
      delete R.nameById[socket.id];

      // If the disconnecting player was holding the bomb
      if (R.holderId === socket.id) {
        if (R.intervalId) { 
            clearInterval(R.intervalId); 
            R.intervalId = null; 
        }
        
        // Decide what to do next
        if (R.alive.length === 1) {
          const winner = R.nameById[R.alive[0]];
          io.to(room).emit("game-over", { winner });
        } else if (R.alive.length > 0) {
          const next = pickRandom(R.alive);
          askQuestion(room, next);
        } else {
            // Room empty
            delete rooms[room];
            return; 
        }
      }

      emitRoomPlayers(room);
      // Only emit alive-players if the room still exists
      if(rooms[room]) {
          io.to(room).emit("alive-players", R.alive.map((id) => R.nameById[id]));
      }
    }
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));