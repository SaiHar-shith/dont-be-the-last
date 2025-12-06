import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Connect to backend
const SOCKET_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnectionAttempts: 5,
});

export default function App() {
  // --- STATE DEFINITIONS ---
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [alivePlayers, setAlivePlayers] = useState([]);
  const [inLobby, setInLobby] = useState(true);

  const [currentPlayer, setCurrentPlayer] = useState("");
  const [timer, setTimer] = useState(0);
  const [question, setQuestion] = useState(null);
  const [answerInput, setAnswerInput] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const timedRef = useRef(null);

  // --- HELPER: Notifications ---
  const showToast = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("room-players", (list) => {
      setPlayers(Array.isArray(list) ? list : []);
    });

    socket.on("alive-players", (names) => {
      setAlivePlayers(Array.isArray(names) ? names : []);
    });

    socket.on("game-started", ({ starter, alivePlayers }) => {
      setInLobby(false);
      setCurrentPlayer(starter || "");
      setAlivePlayers(alivePlayers || []);
      setQuestion(null);
      setTimer(0);
      setIsSubmitting(false); 
      showToast("Game Started! Good luck!", "info");
    });

    socket.on("new-question", ({ question }) => {
      setQuestion({ question });
      setAnswerInput("");
      setIsSubmitting(false); 
    });

    socket.on("bomb-updated", ({ currentPlayer }) => {
      setCurrentPlayer(currentPlayer);
      setIsSubmitting(false); 
    });

    socket.on("bomb-timer", ({ currentPlayer, time }) => {
      setCurrentPlayer(currentPlayer);
      setTimer(time);
    });

    socket.on("player-eliminated", ({ player, alivePlayers, correctAnswer }) => {
      setIsSubmitting(false); 
      if (player) {
        if (player === name) {
          const ansText = correctAnswer ? ` Answer: "${correctAnswer}"` : "";
          showToast(`💥 You were eliminated!${ansText}`, "danger");
        } else {
          const ansText = correctAnswer ? ` (Ans: ${correctAnswer})` : "";
          showToast(`${player} eliminated!${ansText}`, "info");
        }
      }
      setAlivePlayers(Array.isArray(alivePlayers) ? alivePlayers : []);
    });

    socket.on("game-over", ({ winner }) => {
      setIsSubmitting(false);
      showToast(`🎉 Game over! Winner: ${winner}`, "success");
      setTimeout(() => {
        setInLobby(true);
        setPlayers([]);
        setAlivePlayers([]);
        setCurrentPlayer("");
        setTimer(0);
        setQuestion(null);
        setAnswerInput("");
      }, 4000);
    });

    return () => {
      socket.off("connect");
      socket.off("room-players");
      socket.off("alive-players");
      socket.off("game-started");
      socket.off("new-question");
      socket.off("bomb-updated");
      socket.off("bomb-timer");
      socket.off("player-eliminated");
      socket.off("game-over");
    };
  }, [name]); 

  // --- HANDLERS ---
  const handleCreate = () => {
    if (!room || !name) return showToast("Enter room and nickname", "info");
    socket.emit("create-room", { room, name });
  };
  
  const handleJoin = () => {
    if (!room || !name) return showToast("Enter room and nickname", "info");
    socket.emit("join-room", { room, name });
  };

  const handleStart = () => {
    if (!room) return;
    socket.emit("start-game", room);
  };

  const handleSubmitAnswer = (e) => {
    e.preventDefault(); 
    if (!room || !answerInput || isSubmitting) return;

    setIsSubmitting(true);
    socket.emit("submit-answer", { room, player: name, answer: answerInput });
    setAnswerInput("");

    setTimeout(() => setIsSubmitting(false), 1000);
  };

  // --- UI RENDER ---
  return (
    <div className="game-container">
      {notification && (
        <div className={`notification-pop notify-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {inLobby ? (
        <div className="game-card">
          <h2>Don’t Be The Last 💣</h2>
          <input className="input-3d" placeholder="Nickname" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input-3d" placeholder="Room Code" value={room} onChange={(e) => setRoom(e.target.value)} />
          <button className="btn-3d btn-green" onClick={handleCreate}>Create Game</button>
          <button className="btn-3d btn-blue" onClick={handleJoin}>Join Game</button>
          <div style={{ marginTop: 24 }}>
            <h4>Players in lobby ({players.length})</h4>
            <ul className="player-list">
                {players.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
          {players.length > 1 && players[0] === name && (
            <button className="btn-3d btn-red" onClick={handleStart}>Start Game</button>
          )}
        </div>
      ) : (
        <div className="game-card wide">
          <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap'}}>
              <span className="status-badge">💣 Bomb: {currentPlayer || "-"}</span>
              <span className="status-badge">⏳ Time: {timer}s</span>
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>Alive players</h4>
            <ul className="player-list">
              {(alivePlayers || []).map((p) => (
                  <li key={p} style={{ background: p === currentPlayer ? '#fee2e2' : 'white' }}>
                      {p} {p === currentPlayer ? '💣' : ''}
                  </li>
              ))}
            </ul>
          </div>

          {question && currentPlayer === name && (
            <div style={{ marginTop: 24, borderTop:'3px solid #000', paddingTop: 20 }}>
              <div style={{ fontWeight: 800, marginBottom: 12, fontSize: '1.2rem' }}>
                  {question.question}
              </div>
              
              <form onSubmit={handleSubmitAnswer}>
                <input 
                    className="input-3d"
                    value={answerInput} 
                    onChange={(e) => setAnswerInput(e.target.value)} 
                    placeholder="Type answer..." 
                    autoFocus
                    disabled={isSubmitting}
                />
                <button type="submit" className="btn-3d btn-green" disabled={isSubmitting}>
                    {isSubmitting ? "Checking..." : "Submit Answer"}
                </button>
              </form>
            </div>
          )}

          {question && currentPlayer !== name && (
            <div style={{ marginTop: 24, padding: 20, background: '#f3f4f6', borderRadius: 8, border:'3px solid #000', textAlign:'center', fontStyle: "italic" }}>
              Waiting for <strong>{currentPlayer}</strong> to answer...
            </div>
          )}
        </div>
      )}
    </div>
  );
}