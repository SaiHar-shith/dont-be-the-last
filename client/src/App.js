// ... imports and setup ...

export default function App() {
  // ... existing state ... 
  
  // NEW: Add a submitting state to prevent double clicks
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... useEffects ...

  // Update handleSubmitAnswer to prevent page reload and double submission
  const handleSubmitAnswer = (e) => {
    // 1. Prevent Browser Refresh
    if (e) e.preventDefault(); 
    
    if (!room || !answerInput || isSubmitting) return;
    
    setIsSubmitting(true); // Lock the button
    socket.emit("submit-answer", { room, player: name, answer: answerInput });
    setAnswerInput("");
    
    // Unlock after a short delay (or when new question arrives)
    setTimeout(() => setIsSubmitting(false), 500);
  };

  // ... other handlers ...

  // --- UI RENDER ---
  // ... Lobby code remains the same ...

  // 2. Game Screen
  return (
    <div className="game-container">
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
            {/* WRAP INPUT AND BUTTON IN A FORM TO HANDLE ENTER KEY PROPERLY */}
            <form onSubmit={handleSubmitAnswer}>
                <input 
                    className="input-3d"
                    value={answerInput} 
                    onChange={(e) => setAnswerInput(e.target.value)} 
                    placeholder="Type your answer..." 
                    autoFocus
                    disabled={isSubmitting} // Disable while submitting
                />
                <button 
                    type="submit" 
                    className="btn-3d btn-green" 
                    disabled={isSubmitting}
                    style={{ opacity: isSubmitting ? 0.7 : 1 }}
                >
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
    </div>
  );
}