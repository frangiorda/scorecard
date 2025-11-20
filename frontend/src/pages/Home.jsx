import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

// --- URL DE LA API (Dinámica para Deploy) ---
// Si existe la variable de Vercel la usa, si no, usa localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- ICONOS SVG ---
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
const GolfIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1e40af' }}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
const HistoryIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
const ArrowRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
const FolderIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>

function Home() {
  const navigate = useNavigate() 
  const [courses, setCourses] = useState([])
  const [matches, setMatches] = useState([]) 
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [players, setPlayers] = useState([{ name: '', handicap: 0 }])
  const [loading, setLoading] = useState(true)
  
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    // Cargar Canchas usando la URL dinámica
    axios.get(`${API_URL}/courses/`)
      .then(res => { setCourses(res.data); setLoading(false) })
      .catch(err => console.error("Error cargando canchas:", err))
    
    loadHistory()
  }, [])

  const loadHistory = () => {
    // Cargar Historial usando la URL dinámica
    axios.get(`${API_URL}/matches/`)
      .then(res => setMatches(res.data))
      .catch(err => console.error("Error cargando historial:", err))
  }

  const addPlayerRow = () => { if (players.length < 4) setPlayers([...players, { name: '', handicap: 0 }]) }
  const removePlayer = (index) => { if (players.length > 1) setPlayers(players.filter((_, i) => i !== index)) }
  
  const updatePlayer = (index, field, value) => {
    const newPlayers = [...players]
    if (field === 'handicap') {
        newPlayers[index][field] = value === '' ? '' : parseInt(value)
    } else {
        newPlayers[index][field] = value
    }
    setPlayers(newPlayers)
  }

  const handleStartMatch = () => {
    if (!selectedCourseId) return alert("Por favor selecciona una cancha.")
    const validPlayers = players.filter(p => p.name.trim() !== "")
    if (validPlayers.length === 0) return alert("Debes agregar al menos un jugador.")
    const sanitizedPlayers = validPlayers.map(p => ({ name: p.name, handicap: p.handicap === '' ? 0 : p.handicap }))
    const payload = { course_id: parseInt(selectedCourseId), players: sanitizedPlayers }

    // Crear partido usando la URL dinámica
    axios.post(`${API_URL}/matches/`, payload)
      .then(response => navigate(`/match/${response.data.id}`))
      .catch(error => alert("Hubo un problema al crear el partido."))
  }

  const handleDeleteMatch = (e, matchId) => {
      e.stopPropagation()
      if (window.confirm("¿Eliminar este partido?")) {
          // Borrar partido usando la URL dinámica
          axios.delete(`${API_URL}/matches/${matchId}`)
            .then(() => setMatches(matches.filter(m => m.id !== matchId)))
            .catch(() => alert("Error al eliminar"))
      }
  }

  const styles = {
    container: { 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc', 
        fontFamily: '-apple-system, sans-serif', 
        padding: '40px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center'
    },
    card: { 
        width: '100%', 
        maxWidth: '480px', 
        backgroundColor: '#ffffff', 
        borderRadius: '24px', 
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.08)', 
        padding: '30px', 
        border: '1px solid #e2e8f0', 
        marginBottom: '20px' 
    },
    header: { textAlign: 'center', marginBottom: '30px' },
    title: { fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '10px', letterSpacing: '-0.5px' },
    subtitle: { color: '#64748b', fontSize: '14px', marginTop: '5px' },
    
    // ETIQUETAS DE CABECERA ALINEADAS
    labelsContainer: {
        display: 'flex', 
        gap: '12px', 
        marginBottom: '8px',
        paddingRight: players.length > 1 ? '56px' : '0', 
        transition: 'padding-right 0.2s ease'
    },
    labelName: { flex: 1, fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
    labelHcp: { width: '70px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
    labelGeneral: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' },

    select: { width: '100%', padding: '14px 16px', fontSize: '16px', borderRadius: '14px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', marginBottom: '25px', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' },
    
    playerRow: { display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' },
    inputWrapper: { position: 'relative', flex: 1 }, 
    inputIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
    input: { width: '100%', padding: '14px 14px 14px 42px', fontSize: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff' },
    hcpInput: { width: '70px', padding: '14px', fontSize: '16px', textAlign: 'center', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff' },
    
    deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '12px', width: '44px', height: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    addBtn: { width: '100%', padding: '14px', background: '#f1f5f9', color: '#475569', border: '2px dashed #cbd5e1', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' },
    startBtn: { width: '100%', padding: '18px', background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', marginTop: '30px', boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)' },
    
    historyToggleBtn: { width: '100%', background: 'transparent', border: 'none', color: '#64748b', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '15px', marginTop: '10px', borderRadius: '14px', transition: 'background 0.2s' },
    
    historyContainer: { width: '100%', maxWidth: '480px', animation: 'slideDown 0.3s ease' },
    historyHeader: { fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '15px', paddingLeft: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    matchItem: { backgroundColor: 'white', padding: '16px 20px', borderRadius: '16px', marginBottom: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    matchInfo: { display: 'flex', flexDirection: 'column' },
    matchCourse: { fontWeight: '700', color: '#0f172a', fontSize: '15px', marginBottom: '4px' },
    matchDate: { fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' },
    resumeBtn: { background: '#eff6ff', color: '#2563eb', padding: '8px 14px', borderRadius: '20px', border: 'none', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
    deleteMatchBtn: { marginLeft: '10px', background: 'transparent', color: '#cbd5e1', border: 'none', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
  }

  return (
    <div style={styles.container}>
      <style>{`
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } 
        input[type=number] { -moz-appearance: textfield; } 
        select:focus, input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          <GolfIcon />
          <h1 style={styles.title}>Golf Tracker</h1>
          <p style={styles.subtitle}>Configura tu ronda y comienza</p>
        </div>
        
        <label style={styles.labelGeneral}>Seleccionar Club</label>
        <select style={styles.select} value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} disabled={loading}>
          <option value="">{loading ? "Cargando..." : "Elige una cancha..."}</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* CABECERAS ALINEADAS */}
        <div style={styles.labelsContainer}>
            <div style={styles.labelName}>Jugadores</div>
            <div style={styles.labelHcp}>HCP</div>
        </div>

        {players.map((player, index) => (
          <div key={index} style={styles.playerRow}>
            <div style={styles.inputWrapper}>
              <div style={styles.inputIcon}><UserIcon /></div>
              <input type="text" placeholder={`Jugador ${index + 1}`} value={player.name} onChange={(e) => updatePlayer(index, 'name', e.target.value)} style={styles.input} />
            </div>
            <input type="number" placeholder="0" value={player.handicap} onChange={(e) => updatePlayer(index, 'handicap', e.target.value)} style={styles.hcpInput} />
            
            {players.length > 1 && (
                <button onClick={() => removePlayer(index)} style={styles.deleteBtn}><TrashIcon /></button>
            )}
          </div>
        ))}

        {players.length < 4 && <button onClick={addPlayerRow} style={styles.addBtn}><PlusIcon /> Agregar otro jugador</button>}
        
        <button onClick={handleStartMatch} style={styles.startBtn}>Comenzar Ronda</button>

        {matches.length > 0 && (
            <>
                <div style={{ width: '100%', height: '1px', background: '#f1f5f9', margin: '20px 0' }}></div>
                <button style={styles.historyToggleBtn} onClick={() => setShowHistory(!showHistory)}>
                    <FolderIcon /> {showHistory ? "Ocultar Historial" : "Ver Partidos Anteriores"} <ChevronDown />
                </button>
            </>
        )}
      </div>

      {showHistory && matches.length > 0 && (
        <div style={styles.historyContainer}>
            <div style={styles.historyHeader}>Partidos Recientes</div>
            {matches.map(match => (
                <div key={match.id} style={styles.matchItem} onClick={() => navigate(`/match/${match.id}`)}>
                    <div style={styles.matchInfo}>
                        <span style={styles.matchCourse}>{match.course?.name}</span>
                        <span style={styles.matchDate}>
                            <HistoryIcon /> {match.date.split(' ')[0]} • {match.players.length} Jugadores
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button style={styles.resumeBtn}>
                            Abrir
                        </button>
                        <button 
                            style={styles.deleteMatchBtn} 
                            onClick={(e) => handleDeleteMatch(e, match.id)}
                            title="Borrar partido"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default Home