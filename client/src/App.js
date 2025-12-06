import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ['websocket']
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

  // --- NEW: Notification State ---
  const [notification, setNotification] = useState(null); // { message: "", type: "danger" | "success" | "info" }

  const timedRef = useRef(null);

  // --- NEW: Helper to show notification and hide it after 3 seconds ---
  const showToast = (message, type = "info") => {
    setNotification({ message, type });
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  useEffect(() => {
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
      showToast("Game Started! Good luck!", "info");
    });

    socket.on("new-question", ({ question }) => {
      setQuestion({ question });
      setAnswerInput("");
    });

    socket.on("bomb-updated", ({ currentPlayer }) => {
      setCurrentPlayer(currentPlayer);
    });

    socket.on("bomb-timer", ({ currentPlayer, time }) => {
      setCurrentPlayer(currentPlayer);
      setTimer(time);
    });

    // --- UPDATED: Replaced Alert with Custom Toast ---
    socket.on("player-eliminated", ({ player, alivePlayers }) => {
      if (player) {
        if (player === name) {
          showToast("💥 You were eliminated!", "danger");
        } else {
          // Optional: Notify when others die, or keep it quiet
          showToast(`${player} was eliminated!`, "info");
        }
      }
      setAlivePlayers(Array.isArray(alivePlayers) ? alivePlayers : []);
    });

    // --- UPDATED: Replaced Alert with Custom Toast ---
    socket.on("game-over", ({ winner }) => {
      showToast(`🎉 Game over! Winner: ${winner}`, "success");
      
      // Small delay before resetting so they can see the message
      setTimeout(() => {
        setInLobby(true);
        setPlayers([]);
        setAlivePlayers([]);
        setCurrentPlayer("");
        setTimer(0);
        setQuestion(null);
        setAnswerInput("");
      }, 3500);
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
  }, [name]); // Dependency on 'name' to check if 'I' was eliminated

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

  const handleSubmitAnswer = () => {
    if (!room || !answerInput) return;
    socket.emit("submit-answer", { room, player: name, answer: answerInput });
    setAnswerInput("");
  };

  return (
    <div className="game-container">
      
      {/* --- NEW: Notification Component --- */}
      {notification && (
        <div className={`notification-pop notify-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {inLobby ? (
        // 1. Lobby Screen
        <div className="game-card">
          <h2>Don’t Be The Last 💣</h2>

          <input 
            className="input-3d"
            placeholder="Nickname" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <input 
            className="input-3d"
            placeholder="Room Code" 
            value={room} 
            onChange={(e) => setRoom(e.target.value)} 
          />

          <button className="btn-3d btn-green" onClick={handleCreate}>
            Create Game
          </button>
          
          <button className="btn-3d btn-blue" onClick={handleJoin}>
            Join Game
          </button>

          <div style={{ marginTop: 24 }}>
            <h4>Players in lobby ({players.length})</h4>
            {players.length > 0 ? (
                <ul className="player-list">
                    {players.map((p) => <li key={p}>{p}</li>)}
                </ul>
            ) : (
                <p style={{fontStyle:'italic', color:'#666', textAlign:'center'}}>Waiting for players...</p>
            )}
          </div>

          {players.length > 1 && players[0] === name && (
            <button className="btn-3d btn-red" onClick={handleStart}>
              Start Game
            </button>
          )}
        </div>
      ) : (
        // 2. Game Screen
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

          {/* Question Section */}
          {question && currentPlayer === name && (
            <div style={{ marginTop: 24, borderTop:'3px solid #000', paddingTop: 20 }}>
              <div style={{ fontWeight: 800, marginBottom: 12, fontSize: '1.2rem' }}>
                  {question.question}
              </div>
              <input 
                  className="input-3d"
                  value={answerInput} 
                  onChange={(e) => setAnswerInput(e.target.value)} 
                  placeholder="Type your answer..." 
                  autoFocus
              />
              <button className="btn-3d btn-green" onClick={handleSubmitAnswer}>
                  Submit Answer
              </button>
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