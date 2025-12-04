// server/index.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// --- General Knowledge question bank (open-ended + true/false) ---
const questions = [
  // Open-ended questions (type: "open")
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
  { type: "open", question: "What is the smallest prime number?", answer: "2" },
  { type: "open", question: "What is the hardest natural material on Earth?", answer: "diamond" },
  { type: "open", question: "Which metal is liquid at room temperature?", answer: "mercury" },
  { type: "open", question: "What is the tallest mountain in the world (above sea level)?", answer: "mount everest" },
  { type: "open", question: "Which organ pumps blood around the body?", answer: "heart" },
  { type: "open", question: "Which planet has rings around it?", answer: "saturn" },
  { type: "open", question: "Who developed the theory of relativity?", answer: "albert einstein" },
  { type: "open", question: "What is the capital of the United Kingdom?", answer: "london" },
  { type: "open", question: "In computing, what does 'CPU' stand for?", answer: "central processing unit" },
  { type: "open", question: "What is the largest desert in the world (non-polar)?", answer: "sahara" },
  { type: "open", question: "Which animal is known as the 'king of the jungle'?", answer: "lion" },
  { type: "open", question: "How many degrees are in a right angle?", answer: "90" },
  { type: "open", question: "What is the capital city of Germany?", answer: "berlin" },
  { type: "open", question: "What is the chemical symbol for gold?", answer: "au" },
  { type: "open", question: "Which continent is India part of?", answer: "asia" },
  { type: "open", question: "Which bird is often associated with delivering babies in folklore?", answer: "stork" },
  { type: "open", question: "What is the capital of Canada?", answer: "ottawa" },
  { type: "open", question: "Which famous scientist is known for gravity and the laws of motion?", answer: "isaac newton" },
  { type: "open", question: "What is 100 divided by 4?", answer: "25" },
  { type: "open", question: "Which city is famous for the Eiffel Tower?", answer: "paris" },
  { type: "open", question: "What substance do bees produce?", answer: "honey" },
  { type: "open", question: "What is the largest planet in our solar system?", answer: "jupiter" },
  { type: "open", question: "Which country is known for pizza and pasta?", answer: "italy" },
  { type: "open", question: "What is the currency of the United States?", answer: "us dollar" },
  { type: "open", question: "Which sea creature has eight arms?", answer: "octopus" },
  { type: "open", question: "Who is the author of 'Harry Potter' series?", answer: "j.k. rowling" },
  { type: "open", question: "Which device do we use to look at stars?", answer: "telescope" },
  { type: "open", question: "What does DNA stand for?", answer: "deoxyribonucleic acid" },
  { type: "open", question: "Which country is famous for the pyramids and the Nile?", answer: "egypt" },
  { type: "open", question: "What is the fastest land animal?", answer: "cheetah" },
  { type: "open", question: "What is the capital of Australia?", answer: "canberra" },
  { type: "open", question: "What liquid do plants take up through their roots?", answer: "water" },

  // True/False questions (type: "tf")
  { type: "tf", question: "The Great Wall of China is visible from space with the naked eye.", answer: "false" },
  { type: "tf", question: "The human adult skeleton has 206 bones.", answer: "true" },
  { type: "tf", question: "Sound travels faster in air than in water.", answer: "false" },
  { type: "tf", question: "Lightning never strikes the same place twice.", answer: "false" },
  { type: "tf", question: "The chemical symbol for sodium is 'Na'.", answer: "true" },
  { type: "tf", question: "Bats are blind.", answer: "false" },
  { type: "tf", question: "Venus is the hottest planet in our solar system.", answer: "true" },
  { type: "tf", question: "An octagon has six sides.", answer: "false" },
  { type: "tf", question: "Shakespeare wrote 'Hamlet'.", answer: "true" },
  { type: "tf", question: "The capital of Japan is Kyoto.", answer: "false" },
  { type: "tf", question: "Water boils at 100 degrees Celsius at sea level.", answer: "true" },
  { type: "tf", question: "Gold is heavier than silver for the same volume.", answer: "true" },
  { type: "tf", question: "The Amazon is the longest river in the world.", answer: "false" },
  { type: "tf", question: "Pluto is still classified as a planet.", answer: "false" },
  { type: "tf", question: "The human heart has four chambers.", answer: "true" },
  { type: "tf", question: "Mount Kilimanjaro is in South America.", answer: "false" },
  { type: "tf", question: "A light year measures time.", answer: "false" },
  { type: "tf", question: "The Taj Mahal is in India.", answer: "true" },
  { type: "tf", question: "Penguins can fly.", answer: "false" },
  { type: "tf", question: "The Sahara is a desert.", answer: "true" },
  { type: "tf", question: "Sound can travel through a vacuum.", answer: "false" },
  { type: "tf", question: "Tomatoes are classified as a fruit.", answer: "true" },
  { type: "tf", question: "Albert Einstein won the Nobel Prize for relativity.", answer: "false" },
  { type: "tf", question: "Humans share about 50% of their DNA with bananas.", answer: "true" },
  { type: "tf", question: "There are 24 hours in a day.", answer: "true" },

  // A few more open-ended to round out the set
  { type: "open", question: "Which gas makes up most of the Earth's atmosphere?", answer: "nitrogen" },
  { type: "open", question: "Which country gifted the Statue of Liberty to the USA?", answer: "france" },
  { type: "open", question: "Who was the first person to walk on the moon?", answer: "neil armstrong" },
  { type: "open", question: "Which chemical element has the symbol 'Fe'?", answer: "iron" },
  { type: "open", question: "What is the primary language spoken in Argentina?", answer: "spanish" },
  { type: "open", question: "Which city hosted the 2016 Summer Olympics?", answer: "rio de janeiro" },
  { type: "open", question: "What is the main ingredient in guacamole?", answer: "avocado" },
  { type: "open", question: "How many players are there in a soccer team on the field (per side)?", answer: "11" },
  { type: "open", question: "What is the shape of Earth?", answer: "oblate spheroid" },
  { type: "open", question: "Which element is essential for breathing and making up about 21% of Earth's atmosphere?", answer: "oxygen" }
];


// helper utilities
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const normalize = (s) => String(s || "").trim().toLowerCase();

// rooms store
// rooms[roomCode] = {
//   players: [{ id, name }],
//   alive: [socketId, ...],
//   nameById: { socketId: name, ... },
//   hostId: socketId,
//   holderId: socketId || null,
//   intervalId: NodeJS.Timer | null,
//   remaining: number,
//   currentQuestion: { question, answer } | null
// }
const rooms = Object.create(null);

// Broadcast helper
function emitRoomPlayers(room) {
  if (!rooms[room]) return;
  const names = rooms[room].players.map((p) => p.name);
  io.to(room).emit("room-players", names);
}
function emitAlivePlayers(room) {
  if (!rooms[room]) return;
  const aliveNames = rooms[room].alive.map((id) => rooms[room].nameById[id]).filter(Boolean);
  io.to(room).emit("player-eliminated", { player: null, alivePlayers: aliveNames }); // maintain compatibility
  // also emit a dedicated alive list event
  io.to(room).emit("alive-players", aliveNames);
}

function emitTimer(room) {
  if (!rooms[room]) return;
  const holderName = rooms[room].holderId ? rooms[room].nameById[rooms[room].holderId] : "";
  const time = rooms[room].remaining ?? 0;
  io.to(room).emit("bomb-timer", { currentPlayer: holderName, time });
}

// Ask question to a specific holder (socket id)
function askQuestion(room, holderId) {
  if (!rooms[room]) return;
  const q = pickRandom(questions);
  rooms[room].currentQuestion = q;
  rooms[room].holderId = holderId;
  rooms[room].remaining = 8;

  const holderName = rooms[room].nameById[holderId] || "";

  // notify
  io.to(room).emit("bomb-updated", { currentPlayer: holderName });
  io.to(room).emit("new-question", { question: q.question });

  // clear previous interval if any
  if (rooms[room].intervalId) {
    clearInterval(rooms[room].intervalId);
    rooms[room].intervalId = null;
  }

  // start countdown: tick each second and broadcast
  rooms[room].intervalId = setInterval(() => {
    const R = rooms[room];
    if (!R) return;
    R.remaining -= 1;
    emitTimer(room);

    if (R.remaining <= 0) {
      clearInterval(R.intervalId);
      R.intervalId = null;
      // timeout => eliminate current holder
      eliminateHolder(room);
    }
  }, 1000);

  // Immediately emit initial timer state
  emitTimer(room);
}

// Pass bomb to random other alive player
function passBomb(room, currentHolderId) {
  if (!rooms[room]) return;
  const R = rooms[room];
  const others = R.alive.filter((id) => id !== currentHolderId);
  if (others.length === 0) {
    // no other to pass to
    return;
  }
  const nextId = pickRandom(others);

  // clear any existing interval
  if (R.intervalId) {
    clearInterval(R.intervalId);
    R.intervalId = null;
  }

  askQuestion(room, nextId);
}

// Eliminate current holder
function eliminateHolder(room) {
  if (!rooms[room]) return;
  const R = rooms[room];
  const eliminatedId = R.holderId;
  if (!eliminatedId) return;

  const eliminatedName = R.nameById[eliminatedId];

  // clear any running timer for this room
  if (R.intervalId) {
    clearInterval(R.intervalId);
    R.intervalId = null;
  }
  R.holderId = null;
  R.currentQuestion = null;
  R.remaining = 0;

  // remove from alive
  R.alive = R.alive.filter((id) => id !== eliminatedId);

  // emit elimination event with alive names
  const aliveNames = R.alive.map((id) => R.nameById[id]);
  io.to(room).emit("player-eliminated", { player: eliminatedName, alivePlayers: aliveNames });
  io.to(room).emit("alive-players", aliveNames);

  // if only one remains -> game over
  if (R.alive.length === 1) {
    const winnerName = R.nameById[R.alive[0]];
    io.to(room).emit("game-over", { winner: winnerName });
    // clear interval cleanup if exists
    if (R.intervalId) {
      clearInterval(R.intervalId);
      R.intervalId = null;
    }
    return;
  }

  // else pick a new holder and ask question
  const nextHolder = pickRandom(R.alive);
  askQuestion(room, nextHolder);
}

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
    if (R.players.length < 2) return; // need at least 2
    // only host can start (optional)
    if (socket.id !== R.hostId) return;

    // announce game-started
    io.to(room).emit("game-started", {
      starter: R.nameById[R.alive[0]],
      alivePlayers: R.alive.map((id) => R.nameById[id]),
    });

    // pick starter randomly and start asking
    const starterId = pickRandom(R.alive);
    askQuestion(room, starterId);
  });

  socket.on("submit-answer", ({ room, player, answer }) => {
    const R = rooms[room];
    if (!R) return;
    if (!R.currentQuestion) return;

    // ensure the player sending is the holder
    const holderName = R.holderId ? R.nameById[R.holderId] : null;
    if (holderName !== player) return;

    // stop timer
    if (R.intervalId) {
      clearInterval(R.intervalId);
      R.intervalId = null;
    }

    const correct = normalize(answer) === normalize(R.currentQuestion.answer);

    if (correct) {
      // pass bomb to another alive player
      passBomb(room, R.holderId);
    } else {
      // wrong => eliminate holder
      eliminateHolder(room);
    }
  });

  socket.on("disconnect", () => {
    // Remove user from any rooms they were in
    for (const room of Object.keys(rooms)) {
      const R = rooms[room];
      if (!R.nameById[socket.id]) continue;

      // remove from players & alive & nameById
      R.players = R.players.filter((p) => p.id !== socket.id);
      R.alive = R.alive.filter((id) => id !== socket.id);
      delete R.nameById[socket.id];

      // if holder left, handle it
      if (R.holderId === socket.id) {
        if (R.intervalId) { clearInterval(R.intervalId); R.intervalId = null; }
        if (R.alive.length === 1) {
          const winner = R.nameById[R.alive[0]];
          io.to(room).emit("game-over", { winner });
        } else if (R.alive.length > 0) {
          const next = pickRandom(R.alive);
          askQuestion(room, next);
        }
      }

      emitRoomPlayers(room);
      io.to(room).emit("alive-players", R.alive.map((id) => R.nameById[id]));
    }
    console.log("Disconnected:", socket.id);
  });
});

// In your server.js or index.js
const PORT = process.env.PORT || 5000; // Render will provide the PORT automatically
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
