import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

// --- URL DE LA API (Dinámica para Deploy) ---
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- ICONOS SVG ---
const ChevronLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
const ChevronRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
const CardIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
const PlayIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
const MinusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
const PlusIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>

function MatchView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [currentHole, setCurrentHole] = useState(1)
  const [holeScores, setHoleScores] = useState({})
  
  const [viewMode, setViewMode] = useState('hole')
  const [cardSection, setCardSection] = useState('front') 

  useEffect(() => { loadMatchData() }, [id])

  const loadMatchData = () => {
    // CAMBIO 1: Usar API_URL
    axios.get(`${API_URL}/matches/${id}`)
      .then(res => {
        setMatch(res.data)
        setLoading(false)
        prepareHoleScores(res.data, currentHole)
      })
      .catch(err => { console.error(err); setLoading(false) })
  }

  useEffect(() => { if (match) prepareHoleScores(match, currentHole) }, [currentHole])

  const prepareHoleScores = (matchData, holeNum) => {
    const currentScores = {}
    const players = matchData.players || []
    const holes = matchData.course?.holes || []
    const holeInfo = holes.find(h => h.number === holeNum)
    const defaultPar = holeInfo ? holeInfo.par : 4

    players.forEach(p => {
      const pScores = p.scores || []
      const savedScore = pScores.find(s => s.hole_number === holeNum)
      currentScores[p.player_name] = {
        strokes: savedScore ? savedScore.strokes : defaultPar,
        putts: savedScore ? savedScore.putts : 0,
        fairway: savedScore ? savedScore.fairway_hit : null
      }
    })
    setHoleScores(currentScores)
  }

  const saveToBackend = (playerName, holeNum, scoresObj) => {
    const payload = {
      match_id: parseInt(id),
      player_name: playerName,
      hole_number: holeNum,
      strokes: scoresObj.strokes,
      putts: scoresObj.putts,
      fairway_hit: scoresObj.fairway
    }
    // CAMBIO 2: Usar API_URL
    axios.post(`${API_URL}/matches/score`, payload).catch(console.error)
  }

  const updateScore = (playerName, field, value) => {
    const newScores = { ...holeScores }
    if (!newScores[playerName]) return
    newScores[playerName] = { ...newScores[playerName], [field]: value }
    setHoleScores(newScores)

    const updatedMatch = { ...match }
    const player = updatedMatch.players.find(p => p.player_name === playerName)
    if (player) {
        let scoreEntry = player.scores.find(s => s.hole_number === currentHole)
        if (!scoreEntry) {
            scoreEntry = { hole_number: currentHole, strokes: 0, putts: 0, fairway_hit: null }
            player.scores.push(scoreEntry)
        }
        scoreEntry[field] = value
    }
    setMatch(updatedMatch)
    saveToBackend(playerName, currentHole, newScores[playerName])
  }

  const handleChangeHole = (direction) => {
    const newHole = currentHole + direction;
    if (newHole < 1 || newHole > 18) return;

    const players = match.players || []
    players.forEach(p => {
        const scores = holeScores[p.player_name]
        const updatedMatch = { ...match }
        const playerInMemory = updatedMatch.players.find(pl => pl.player_name === p.player_name)
        
        let scoreEntry = playerInMemory.scores.find(s => s.hole_number === currentHole)
        if (!scoreEntry) {
             scoreEntry = { hole_number: currentHole, strokes: scores.strokes, putts: scores.putts, fairway_hit: scores.fairway }
             playerInMemory.scores.push(scoreEntry)
             saveToBackend(p.player_name, currentHole, scores)
        }
    })
    setCurrentHole(newHole)
  }

  // --- LÓGICA TO PAR ---
  const getPlayerToPar = (player) => {
      if (!player.scores || player.scores.length === 0) return 'E';
      const holes = match.course?.holes || []
      let totalStrokes = 0;
      let totalPar = 0;
      player.scores.forEach(s => {
          const h = holes.find(hole => hole.number === s.hole_number)
          if (h && s.strokes > 0) {
              totalStrokes += s.strokes;
              totalPar += h.par;
          }
      });
      const diff = totalStrokes - totalPar;
      if (diff === 0) return 'E';
      if (diff > 0) return `+${diff}`;
      return `${diff}`;
  }

  const calculateAccumulatedTotal = (player) => {
    if (!player.scores) return 0
    return player.scores.reduce((sum, s) => sum + s.strokes, 0)
  }
  
  const calculateAccumulatedNet = (player) => {
    if (!player.scores) return 0
    const holes = match.course?.holes || []
    return player.scores.reduce((sum, s) => {
        const h = holes.find(hole => hole.number === s.hole_number)
        if (!h) return sum + s.strokes
        const hcpHole = h.handicap_index
        const strokesReceived = player.playing_handicap >= hcpHole ? 1 : 0
        return sum + (s.strokes - strokesReceived)
    }, 0)
  }

  const finishMatch = () => {
      if (window.confirm("¿Finalizar partida y salir?")) navigate('/')
  }

  // --- ESTILOS ---
  const colors = {
    bg: '#f8fafc', primary: '#2563eb', primaryDark: '#1e3a8a',
    textMain: '#1e293b', textSub: '#64748b', border: '#e2e8f0',
    birdie: '#dc2626', bogey: '#1d4ed8', success: '#16a34a'
  }

  const styles = {
    // CORRECCIÓN: Usamos minHeight para permitir scroll natural
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: colors.bg, fontFamily: '-apple-system, sans-serif' },
    
    // Header Sticky
    headerContainer: { position: 'sticky', top: 0, zIndex: 50, width: '100%' },
    
    heroSection: {
        backgroundColor: colors.primaryDark,
        color: 'white',
        padding: '20px 20px 30px 20px',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
        boxShadow: '0 10px 30px -10px rgba(30, 58, 138, 0.5)',
    },
    topNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    courseName: { fontSize: '14px', opacity: 0.9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' },
    toggleBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', padding: '6px 12px', borderRadius: '20px', color: 'white', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backdropFilter: 'blur(5px)' },
    
    holeInfoRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
    holeBigNumber: { fontSize: '56px', fontWeight: '900', lineHeight: 0.8, letterSpacing: '-2px' },
    holeLabel: { fontSize: '12px', fontWeight: '700', opacity: 0.6, textTransform: 'uppercase', marginBottom: '5px' },
    metaBox: { display: 'flex', gap: '20px' },
    metaItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    metaLabel: { fontSize: '10px', fontWeight: '700', opacity: 0.6, textTransform: 'uppercase' },
    metaValue: { fontSize: '20px', fontWeight: '700' },

    // ZONA DE JUEGO
    playArea: { flex: 1, padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' },
    
    playerCard: {
        backgroundColor: 'white', borderRadius: '24px', padding: '20px',
        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', border: `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column', gap: '15px'
    },
    playerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    playerName: { fontSize: '18px', fontWeight: '800', color: colors.textMain },
    
    toParBadge: { padding: '6px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' },

    scoreRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    controlBtn: { width: '56px', height: '56px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    minusBtn: { backgroundColor: '#f1f5f9', color: colors.textMain },
    plusBtn: { backgroundColor: colors.primary, color: 'white', boxShadow: '0 8px 20px -5px rgba(37, 99, 235, 0.4)' },
    scoreDisplay: { textAlign: 'center', width: '60px' },
    scoreNumber: { fontSize: '42px', fontWeight: '900', lineHeight: 1 },
    scoreLabel: { fontSize: '10px', fontWeight: '700', color: colors.textSub, letterSpacing: '1px', marginTop: '5px' },

    // FOOTER
    footerNav: {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white', padding: '15px 25px 30px 25px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `1px solid ${colors.border}`, boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.05)', zIndex: 100
    },
    navBtn: { background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: colors.textSub, cursor: 'pointer', padding: '10px' },
    nextBtn: { background: colors.primary, color: 'white', padding: '14px 28px', borderRadius: '40px', fontSize: '16px', fontWeight: '700', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', cursor: 'pointer' },

    // === ESTILOS TARJETA ===
    // CORRECCIÓN: Eliminamos flex: 1 y overflow: hidden para evitar colapso
    dashboardContainer: { display: 'flex', flexDirection: 'column', backgroundColor: 'white', minHeight: '100%' },
    
    dashboardHeader: { backgroundColor: 'white', padding: '15px', borderBottom: `1px solid ${colors.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', position: 'sticky', top: 0, zIndex: 40 },
    
    tabRow: { flexShrink: 0, display: 'flex', padding: '10px 15px', gap: '10px', backgroundColor: '#f8fafc' },
    tabBtn: { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },

    statsRow: { display: 'flex', padding: '15px', backgroundColor: colors.primaryDark, color: 'white', alignItems:'center', position: 'sticky', top: '60px', zIndex: 30 },
    
    gridHeader: { display: 'flex', padding: '12px 10px', borderBottom: `1px solid ${colors.border}`, backgroundColor: '#f8fafc', position: 'sticky', top: '110px', zIndex: 20 },
    
    gridBody: { paddingBottom: '40px' },
    gridRow: { display: 'flex', height: '55px', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, padding: '0 10px' },
    
    // Celdas
    colHoleHeader: { width: '50px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: colors.textSub },
    colPlayerHeader: { flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: '800', color: colors.primaryDark, whiteSpace: 'nowrap', overflow: 'hidden' },
    cellHole: { width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    cellPlayer: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700' },

    finishBtn: { width: '100%', padding: '15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', marginTop: '20px' }
  }

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'sans-serif', color: colors.textSub}}>Cargando...</div>
  if (!match) return <div>Error</div>

  const holes = match.course?.holes || []
  const sortedHoles = [...holes].sort((a, b) => a.number - b.number)
  const holeInfo = sortedHoles.find(h => h.number === currentHole) || { par: '-', handicap_index: '-' }
  const players = match.players || []
  const startHole = cardSection === 'front' ? 1 : 10
  const endHole = cardSection === 'front' ? 9 : 18
  const currentHoles = sortedHoles.filter(h => h.number >= startHole && h.number <= endHole)

  return (
    <div style={styles.container}>
      
      {/* === MODO JUEGO === */}
      {viewMode === 'hole' && (
        <>
            <div style={styles.headerContainer}>
                <div style={styles.heroSection}>
                    <div style={styles.topNav}>
                        <span style={styles.courseName}>{match.course?.name}</span>
                        <button style={styles.toggleBtn} onClick={() => setViewMode('card')}>
                            <CardIcon /> TARJETA
                        </button>
                    </div>
                    <div style={styles.holeInfoRow}>
                        <div>
                            <div style={{...styles.holeLabel, color:'rgba(255,255,255,0.6)'}}>HOYO ACTUAL</div>
                            <div style={styles.holeBigNumber}>{currentHole}</div>
                        </div>
                        <div style={styles.metaBox}>
                            <div style={styles.metaItem}>
                                <span style={{...styles.metaLabel, color:'rgba(255,255,255,0.6)'}}>PAR</span>
                                <span style={styles.metaValue}>{holeInfo.par}</span>
                            </div>
                            <div style={styles.metaItem}>
                                <span style={{...styles.metaLabel, color:'rgba(255,255,255,0.6)'}}>HCP</span>
                                <span style={styles.metaValue}>{holeInfo.handicap_index}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.playArea}>
                {players.map(player => {
                    const scores = holeScores[player.player_name] || { strokes: holeInfo.par || 4, putts: 0 }
                    
                    let scoreColor = colors.textMain
                    if (scores.strokes < holeInfo.par) scoreColor = colors.birdie
                    else if (scores.strokes > holeInfo.par) scoreColor = colors.bogey
                    else scoreColor = colors.par

                    const toPar = getPlayerToPar(player)
                    let badgeBg = '#f1f5f9'; let badgeColor = colors.textMain
                    if (toPar.startsWith('+')) { badgeBg = '#eff6ff'; badgeColor = colors.primary } 
                    else if (toPar.startsWith('-')) { badgeBg = '#fef2f2'; badgeColor = colors.birdie } 
                    else if (toPar === 'E') { badgeBg = '#f0fdf4'; badgeColor = colors.success }

                    return (
                        <div key={player.id} style={styles.playerCard}>
                            <div style={styles.playerHeader}>
                                <span style={styles.playerName}>{player.player_name}</span>
                                <div style={{...styles.toParBadge, backgroundColor: badgeBg, color: badgeColor}}>
                                    {toPar}
                                </div>
                            </div>

                            <div style={styles.scoreRow}>
                                <button style={{...styles.controlBtn, ...styles.minusBtn}} 
                                    onClick={() => updateScore(player.player_name, 'strokes', Math.max(1, scores.strokes - 1))}>
                                    <MinusIcon />
                                </button>
                                
                                <div style={styles.scoreDisplay}>
                                    <div style={{...styles.scoreNumber, color: scoreColor}}>
                                        {scores.strokes}
                                    </div>
                                    <div style={styles.scoreLabel}>GOLPES</div>
                                </div>

                                <button style={{...styles.controlBtn, ...styles.plusBtn}} 
                                    onClick={() => updateScore(player.player_name, 'strokes', scores.strokes + 1)}>
                                    <PlusIcon />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div style={styles.footerNav}>
                <button onClick={() => handleChangeHole(-1)} disabled={currentHole === 1} style={{...styles.navBtn, opacity: currentHole === 1 ? 0.3 : 1}}>
                    <ChevronLeft /> ANTERIOR
                </button>
                <button onClick={() => handleChangeHole(1)} disabled={currentHole === 18} style={{...styles.nextBtn, opacity: currentHole === 18 ? 0.5 : 1}}>
                    SIGUIENTE <ChevronRight />
                </button>
            </div>
        </>
      )}

      {/* === MODO TARJETA === */}
      {viewMode === 'card' && (
        <div style={styles.dashboardContainer}>
            <div style={styles.dashboardHeader}>
                 <div style={{...styles.headerTitle, color: colors.primaryDark}}>{match.course?.name}</div>
                 <button style={{...styles.toggleBtn, background: colors.primary, color: 'white'}} onClick={() => setViewMode('hole')}>
                    <PlayIcon /> Volver a Jugar
                </button>
            </div>

            <div style={styles.tabRow}>
                <button onClick={() => setCardSection('front')} style={{...styles.tabBtn, backgroundColor: cardSection === 'front' ? colors.primary : 'white', color: cardSection === 'front' ? 'white' : colors.textSub}}>IDA</button>
                <button onClick={() => setCardSection('back')} style={{...styles.tabBtn, backgroundColor: cardSection === 'back' ? colors.primary : 'white', color: cardSection === 'back' ? 'white' : colors.textSub}}>VUELTA </button>
            </div>

            {/* Sticky Headers para la Tabla */}
            <div style={styles.statsRow}>
                <div style={{width:'50px', textAlign:'center', fontSize:'10px', fontWeight:'700', lineHeight:1.2}}>TOTAL<br/></div>
                {players.map(p => (
                    <div key={p.id} style={{flex:1, textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.1)'}}>
                        <div style={{fontSize:'20px', fontWeight:'800'}}>{calculateAccumulatedTotal(p)}</div>
                        <div style={{fontSize:'10px', opacity:0.8}}>Neto: {calculateAccumulatedNet(p)}</div>
                    </div>
                ))}
            </div>

            <div style={styles.gridHeader}>
                <div style={styles.colHoleHeader}>HOYO</div>
                {players.map(p => <div key={p.id} style={styles.colPlayerHeader}>{p.player_name.substring(0,6)}</div>)}
            </div>

            {/* Cuerpo de la Tabla (Scroll Natural) */}
            <div style={styles.gridBody}>
                {currentHoles.map((hole, idx) => (
                    <div key={hole.number} style={{...styles.gridRow, backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc'}} onClick={() => { setViewMode('hole'); setCurrentHole(hole.number); }}>
                        <div style={styles.cellHole}>
                            <span style={{fontSize:'16px', fontWeight:'800', color: colors.textMain}}>{hole.number}</span>
                            <span style={{fontSize:'10px', color: colors.textSub, fontWeight:'600'}}>P{hole.par}</span>
                        </div>
                        {players.map(p => {
                            const s = p.scores?.find(sc => sc.hole_number === hole.number)
                            const val = s ? s.strokes : '-'
                            let color = colors.textMain
                            let weight = '500'
                            if (val !== '-') {
                                if (val < hole.par) { color = colors.birdie; weight = '800' }
                                else if (val > hole.par) { color = colors.bogey }
                            }
                            return <div key={p.id} style={{...styles.cellPlayer, color: color, fontWeight: weight}}>{val}</div>
                        })}
                    </div>
                ))}
                <div style={{padding:'20px'}}>
                    <button onClick={finishMatch} style={styles.finishBtn}>
                        <CheckIcon /> FINALIZAR Y SALIR
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

export default MatchView