import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Messages.css'

const initials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

function Messages() {
  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [socket, setSocket] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [availableDoctors, setAvailableDoctors] = useState([])
  const [attachment, setAttachment] = useState(null)
  const [showChat, setShowChat] = useState(false)

  // ── WebRTC Telemedicine States ──
  const [stream, setStream] = useState(null)
  const [receivingCall, setReceivingCall] = useState(false)
  const [callerData, setCallerData] = useState(null)
  const [callAccepted, setCallAccepted] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callEnded, setCallEnded] = useState(true) // Default true means no active UI

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const connectionRef = useRef(null)
  const messagesEndRef = useRef(null)

  const token = localStorage.getItem('medilink_token') || localStorage.getItem('medilink_doctor_token')
  const userStr = localStorage.getItem('medilink_user') || localStorage.getItem('medilink_doctor')
  const currentUser = userStr ? JSON.parse(userStr) : null
  const isDoctor = currentUser?.role === 'doctor'
  const role = isDoctor ? 'doctor' : 'patient'

  useEffect(() => {
    fetchConversations()
    const socketUrl = API_BASE_URL.replace('/api', '')
    const sock = io(socketUrl, { auth: { token } }) // ← secure: JWT in handshake
    setSocket(sock)

    if (currentUser?.id) {
      sock.emit('join_chat', currentUser.id)
    }

    sock.on('receive_message', (msg) => setMessages(prev => [...prev, msg]))

    // ── WebRTC Listeners ──
    sock.on('call_user', (data) => {
      setReceivingCall(true)
      setCallerData(data)
      setCallEnded(false)
    })

    sock.on('call_accepted', async (signal) => {
      setCallAccepted(true)
      if (connectionRef.current) {
        await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal))
      }
    })

    sock.on('ice_candidate', async (candidate) => {
      if (connectionRef.current) {
        try {
          await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
          console.error("Error adding received ice candidate", e)
        }
      }
    })

    return () => sock.disconnect()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Media streams must be linked to video elements
  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream
    }
  }, [stream, isCalling, receivingCall])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {}
  }

  const openConversation = async (convo) => {
    setActiveConvo(convo)
    setShowCompose(false)
    setShowChat(true)
    try {
      const res = await fetch(`${API_BASE_URL}/messages/${convo.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {}
  }

  const fetchAvailableDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`)
      const data = await res.json()
      setAvailableDoctors(data.doctors || [])
      setShowCompose(true)
      setActiveConvo(null)
      setShowChat(true)
    } catch {}
  }

  const startNewConversation = (doctor) => {
    const existing = conversations.find(c => c.otherUser?.id === doctor.id)
    if (existing) { openConversation(existing); return }
    setActiveConvo({ id: 'new', otherUser: { id: doctor.id, fullName: doctor.fullName, role: 'doctor' } })
    setMessages([])
    setShowCompose(false)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if ((!text.trim() && !attachment) || !activeConvo) return
    const receiverId = activeConvo.otherUser.id
    try {
      const formData = new FormData()
      formData.append('receiverId', receiverId)
      if (text.trim()) formData.append('content', text)
      if (attachment) formData.append('attachment', attachment)
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const saved = await res.json()
      if (!res.ok) throw new Error('Failed to send')
      setMessages(prev => [...prev, saved.message])
      if (activeConvo.id === 'new') {
        fetchConversations()
        setActiveConvo(prev => ({ ...prev, id: saved.conversationId }))
      }
      socket?.emit('send_message', { receiverId, messageData: saved.message })
      setText('')
      setAttachment(null)
    } catch (err) { console.error(err) }
  }

  /* ================================================================
     WebRTC Telemedicine Logic
     ================================================================ */

  const setupPeerConnection = () => {
    const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
    const peerConnection = new RTCPeerConnection(configuration)
    
    // Send ICE candidates to remote naturally
    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate && socket && activeConvo) {
         // If dialing, receiver is activeConvo. If receiving, caller is callerData.from
         const toId = isCalling ? activeConvo.otherUser.id : callerData.from
         socket.emit('ice_candidate', { to: toId, candidate: event.candidate })
      }
    })

    // Listen for remote track
    peerConnection.addEventListener('track', event => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    })

    return peerConnection
  }

  const startCall = async () => {
    if (!activeConvo) return
    setIsCalling(true)
    setCallEnded(false)
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(currentStream)

      const peerConnection = setupPeerConnection()
      connectionRef.current = peerConnection

      currentStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, currentStream)
      })

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      socket.emit('call_user', {
        userToCall: activeConvo.otherUser.id,
        signalData: offer,
        from: currentUser.id,
        name: currentUser.fullName
      })
    } catch (err) {
      console.error("Failed to start call", err)
      leaveCall()
    }
  }

  const answerCall = async () => {
    setCallAccepted(true)
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(currentStream)

      const peerConnection = setupPeerConnection()
      connectionRef.current = peerConnection

      currentStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, currentStream)
      })

      await peerConnection.setRemoteDescription(new RTCSessionDescription(callerData.signal))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      socket.emit('answer_call', { signal: answer, to: callerData.from })
    } catch (err) {
      console.error("Failed to answer call", err)
      leaveCall()
    }
  }

  const leaveCall = () => {
    setCallEnded(true)
    setIsCalling(false)
    setReceivingCall(false)
    setCallAccepted(false)
    setCallerData(null)
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (connectionRef.current) {
      connectionRef.current.close()
      connectionRef.current = null
    }
  }

  const VideoModal = () => {
    if (callEnded) return null

    // Call Ringing
    if (receivingCall && !callAccepted) {
      return (
        <div className="video-call-overlay">
          <div className="video-call-body">
            <div className="incoming-call-box">
              <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>Video Call</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{callerData?.name} is calling you...</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="video-btn video-btn-end" onClick={leaveCall}>✖</button>
                <button className="video-btn video-btn-accept" onClick={answerCall}>📞</button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Call Active / Dialing
    return (
      <div className="video-call-overlay">
        <div className="video-call-header">
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>MediLink Telemedicine</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Secure WebRTC Connection</p>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            {callAccepted ? 'LIVE' : 'DIALING...'}
          </span>
        </div>
        
        <div className="video-call-body">
          {callAccepted ? (
            <video playsInline ref={remoteVideoRef} autoPlay className="video-remote" />
          ) : (
            <div style={{ fontSize: '1.2rem', opacity: 0.5, fontWeight: 'bold' }}>Waiting for {activeConvo?.otherUser?.fullName} to answer...</div>
          )}
          {stream && (
            <video playsInline muted ref={localVideoRef} autoPlay className="video-local" />
          )}
        </div>

        <div className="video-call-controls">
          <button className="video-btn video-btn-end" onClick={leaveCall}>☎</button>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-page">
      <Navbar role={role} />
      <VideoModal />

      <div className="messages-container">
        {/* ── Sidebar ── */}
        <div className={`messages-sidebar ${showChat ? 'hidden' : ''}`}>
          <div className="messages-sidebar-header">
            <h2>Inbox</h2>
            {!isDoctor && (
              <button className="messages-new-btn" onClick={fetchAvailableDoctors}>+ New Chat</button>
            )}
          </div>

          <div className="messages-convo-list">
            {conversations.length === 0 && (
              <div className="messages-empty" style={{ marginTop: '2rem' }}>
                <span className="messages-empty-icon">💬</span>
                <span className="messages-empty-text">No conversations yet</span>
              </div>
            )}
            {conversations.map(convo => (
              <div
                key={convo.id}
                className={`messages-convo-item ${activeConvo?.otherUser?.id === convo.otherUser?.id && !showCompose ? 'active' : ''}`}
                onClick={() => openConversation(convo)}
              >
                <div className="messages-convo-avatar">
                  {initials(convo.otherUser?.fullName || '?')}
                </div>
                <div className="messages-convo-info">
                  <p className="messages-convo-name">{convo.otherUser?.fullName || 'Unknown'}</p>
                  <p className="messages-convo-role">{convo.otherUser?.role === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={`messages-chat-area ${showChat ? 'visible' : ''}`}>
          {showCompose ? (
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <button
                onClick={() => { setShowCompose(false); setShowChat(false) }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginBottom: '1rem' }}
              >
                ← Back
              </button>
              <h2 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Select a Doctor</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {availableDoctors.map(doc => (
                  <div
                    key={doc.id}
                    className="ml-card"
                    style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.85rem' }}
                    onClick={() => startNewConversation(doc)}
                  >
                    <div className="messages-convo-avatar">{initials(doc.fullName)}</div>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0 }}>{doc.fullName}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{doc.specialty || 'General Practitioner'}</p>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>Message →</span>
                  </div>
                ))}
              </div>
            </div>
          ) : activeConvo ? (
            <>
              {/* Header */}
              <div className="messages-chat-header">
                {/* Mobile Back Button */}
                <button
                  className="messages-mobile-back"
                  onClick={() => setShowChat(false)}
                  style={{ display: window.innerWidth <= 768 ? 'block' : 'none', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', marginRight: '0.5rem' }}
                >
                  ←
                </button>
                <div className="messages-chat-header-avatar">
                  {initials(activeConvo.otherUser.fullName)}
                </div>
                <div className="messages-chat-header-info" style={{ flex: 1 }}>
                  <h3>{activeConvo.otherUser.fullName}</h3>
                  <p>{activeConvo.otherUser.role === 'doctor' ? 'Clinical Staff' : 'Patient'}</p>
                </div>
                
                {/* 📹 Start Video Call Hook */}
                {activeConvo.id !== 'new' && (
                  <button 
                    onClick={startCall}
                    style={{ 
                      background: 'linear-gradient(135deg, #059669, #10B981)', color: 'white', 
                      border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', 
                      fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.2s'
                    }}
                  >
                    📹 Video Call
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="messages-area">
                {messages.length === 0 && (
                  <div className="messages-empty">
                    <span className="messages-empty-icon">👋</span>
                    <span className="messages-empty-text">Say hello!</span>
                  </div>
                )}
                {messages.map((m, i) => {
                  const isMine = m.senderId === currentUser.id
                  return (
                    <div key={i} className={isMine ? 'message-my' : 'message-other'}>
                      <div>{m.content}</div>
                      {m.attachmentUrl && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <a href={m.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: isMine ? '#fff' : 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', textDecoration: 'underline' }}>
                            📎 View Attachment
                          </a>
                        </div>
                      )}
                      <div className="message-time">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input box */}
              <form className="messages-input-area" onSubmit={sendMessage}>
                <button type="button" className="messages-attach-btn" onClick={() => document.getElementById('chat-upload').click()}>
                  +
                </button>
                <input
                  id="chat-upload"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => setAttachment(e.target.files[0])}
                />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attachment && (
                    <div className="messages-attachment-preview">
                      📎 {attachment.name}
                      <button type="button" className="messages-attachment-remove" onClick={() => setAttachment(null)}>✖</button>
                    </div>
                  )}
                  <input
                    className="messages-input-field"
                    type="text"
                    placeholder="Type a message..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                  />
                </div>
                
                <button type="submit" className="messages-send-btn" disabled={(!text.trim() && !attachment)}>
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="messages-empty">
              <span className="messages-empty-icon">⚡</span>
              <span className="messages-empty-text">Select a conversation to start</span>
            </div>
          )}
        </div>
      </div>
      <BottomNav role={role} />
    </div>
  )
}

export default Messages
