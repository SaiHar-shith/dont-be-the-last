import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// --- FIX 1: Point to the backend environment variable ---
// If we are on Vercel, use the environment variable. 
// If we are local, use localhost:5000.
const SOCKET_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
    transports: ['websocket'] // Forces modern connection, helps with Render
});

export default function App() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [alivePlayers, setAlivePlayers] = useState([]);
  const [inLobby, setInLobby] = useState(true);

  const [currentPlayer, setCurrentPlayer] = useState("");
  const [timer, setTimer] = useState(0);
  const [question, setQuestion] = useState(null);
  const [answerInput, setAnswerInput] = useState("");

  const timedRef = useRef(null);

  useEffect(() => {
    // room players list
    socket.on("room-players", (list) => {
      setPlayers(Array.isArray(list) ? list : []);
    });

    // alive players list
    socket.on("alive-players", (names) => {
      setAlivePlayers(Array.isArray(names) ? names : []);
    });

    socket.on("game-started", ({ starter, alivePlayers }) => {
      setInLobby(false);
      setCurrentPlayer(starter || "");
      setAlivePlayers(alivePlayers || []);
      setQuestion(null);
      setTimer(0);
    });

    // new question
    socket.on("new-question", ({ question }) => {
      setQuestion({ question });
      setAnswerInput("");
    });

    // bomb-updated
    socket.on("bomb-updated", ({ currentPlayer }) => {
      setCurrentPlayer(currentPlayer);
    });

    // bomb-timer
    socket.on("bomb-timer", ({ currentPlayer, time }) => {
      setCurrentPlayer(currentPlayer);
      setTimer(time);
    });

    // player eliminated
    socket.on("player-eliminated", ({ player, alivePlayers }) => {
      if (player) {
        if (player === name) {
          alert("You were eliminated!");
        } else {
          console.log(`${player} eliminated`);
        }
      }
      setAlivePlayers(Array.isArray(alivePlayers) ? alivePlayers : []);
    });

    // game-over
    socket.on("game-over", ({ winner }) => {
      alert(`🎉 Game over! Winner: ${winner}`);
      setInLobby(true);
      setPlayers([]);
      setAlivePlayers([]);
      setCurrentPlayer("");
      setTimer(0);
      setQuestion(null);
      setAnswerInput("");
    });

    return () => {
      socket.off("room-players");
      socket.off("alive-players");
      socket.off("game-started");
      socket.off("new-question");
      socket.off("bomb-updated");
      socket.off("bomb-timer");
      socket.off("player-eliminated");
      socket.off("game-over");
      if (timedRef.current) clearInterval(timedRef.current);
    };
  }, [name]);

  const handleCreate = () => {
    if (!room || !name) return alert("Enter room and nickname");
    socket.emit("create-room", { room, name });
  };
  const handleJoin = () => {
    if (!room || !name) return alert("Enter room and nickname");
    socket.emit("join-room", { room, name });
  };

  const handleStart = () => {
    if (!room) return;
    socket.emit("start-game", room);
  };

  const handleSubmitAnswer = () => {
    if (!room || !answerInput) return;
    socket.emit("submit-answer", { room, player: name, answer: answerInput });
    setAnswerInput("");
  };

  // UI
  if (inLobby) {
    const isHost = players.length > 0 && players[0] === name;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff7cc" }}>
        <div style={{ width: 360, padding: 20, background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}>
          <h2 style={{ textAlign: "center" }}>Don’t Be The Last 💣</h2>

          <input placeholder="Nickname" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 12 }} />
          <input placeholder="Room Code" value={room} onChange={(e) => setRoom(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 8 }} />

          <button onClick={handleCreate} style={{ width: "100%", marginTop: 10, padding: 10, background: "#16a34a", color: "#fff" }}>Create Game</button>
          <button onClick={handleJoin} style={{ width: "100%", marginTop: 8, padding: 10, background: "#2563eb", color: "#fff" }}>Join Game</button>

          <div style={{ marginTop: 16 }}>
            <h4>Players in lobby</h4>
            <ul>
              {players.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>

          {players.length > 1 && isHost && (
            <button onClick={handleStart} style={{ width: "100%", marginTop: 12, padding: 10, background: "#ef4444", color: "#fff" }}>Start Game</button>
          )}
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fee2e2" }}>
      <div style={{ width: 560, padding: 20, background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}>
        <h3>💣 Bomb is with: <strong>{currentPlayer || "-"}</strong></h3>
        <h4>⏳ Time left: {timer}s</h4>

        <div style={{ marginTop: 12 }}>
          <h4>Alive players</h4>
          <ul>
            {(alivePlayers || []).map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>

        {question && currentPlayer === name && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{question.question}</div>
            <input value={answerInput} onChange={(e) => setAnswerInput(e.target.value)} placeholder="Your answer" style={{ width: "100%", padding: 8 }} />
            <button onClick={handleSubmitAnswer} style={{ width: "100%", padding: 10, marginTop: 8, background: "#16a34a", color: "#fff" }}>Submit Answer</button>
          </div>
        )}

        {question && currentPlayer !== name && (
          <div style={{ marginTop: 16, fontStyle: "italic" }}>
            Waiting for <strong>{currentPlayer}</strong> to answer...
          </div>
        )}
      </div>
    </div>
  );
}