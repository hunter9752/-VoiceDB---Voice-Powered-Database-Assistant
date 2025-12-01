import React, { useState, useEffect, useRef } from 'react'


interface Message {
    id: string
    type: 'user' | 'assistant'
    text: string
    sql?: string
    results?: any[]
    timestamp: Date
}

interface ChatTabProps {
    onQuerySubmit: (query: string) => void
    messages: Message[]
    isLoading: boolean
}

export default function ChatTab({ onQuerySubmit, messages, isLoading }: ChatTabProps) {
    const [input, setInput] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const recognitionRef = useRef<any>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = false
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = 'en-US'

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('')
                setTranscript(transcript)
                setInput(transcript)
            }

            recognitionRef.current.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error)
                setIsListening(false)
            }
        }
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
        } else {
            setTranscript('')
            setIsListening(true)
            recognitionRef.current?.start()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (input.trim() && !isLoading) {
            onQuerySubmit(input.trim())
            setInput('')
            setTranscript('')
        }
    }

    const exampleQueries = [
        'Show all users',
        'How many products are there?',
        'List orders from today',
        'Show customers by country'
    ]

    return (
        <div className="chatTab">
            <div className="chatMessages">
                {messages.length === 0 ? (
                    <div className="welcomeScreen">
                        <div className="welcomeIcon">🎤</div>
                        <h2 className="gradient-text">Welcome to VoiceDB</h2>
                        <p className="welcomeText">
                            Ask questions about your database using voice or text
                        </p>
                        <div className="exampleQueries">
                            <p className="exampleLabel">Try asking:</p>
                            <div className="exampleGrid">
                                {exampleQueries.map((query, idx) => (
                                    <button
                                        key={idx}
                                        className="exampleQuery"
                                        onClick={() => setInput(query)}
                                    >
                                        {query}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${message.type === 'user' ? 'user-message' : 'assistant-message'}`}
                        >
                            <div className="messageContent">
                                <p className="messageText">{message.text}</p>
                                {message.sql && (
                                    <div className="sqlCode">
                                        <code>{message.sql}</code>
                                    </div>
                                )}
                                {message.results && message.results.length > 0 && (
                                    <div className="results">
                                        <div className="resultsHeader">
                                            {message.results.length} row{message.results.length !== 1 ? 's' : ''} returned
                                        </div>
                                        <div className="resultsTable">
                                            {message.results.slice(0, 5).map((row, idx) => (
                                                <div key={idx} className="resultRow">
                                                    {JSON.stringify(row, null, 2)}
                                                </div>
                                            ))}
                                            {message.results.length > 5 && (
                                                <div className="moreResults">
                                                    ... and {message.results.length - 5} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="messageTime">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="loadingMessage">
                        <div className="spinner"></div>
                        <p>Processing your query...</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="inputForm">
                <div className="inputContainer">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about your database..."
                        className="input"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`btn-voice ${isListening ? 'active' : ''}`}
                        title={isListening ? 'Stop listening' : 'Start voice input'}
                        disabled={isLoading}
                    >
                        {isListening ? '🔴' : '🎤'}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!input.trim() || isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Ask'}
                    </button>
                </div>
                {isListening && (
                    <div className="listeningIndicator">
                        <span className="pulse"></span>
                        Listening... {transcript && <span>"{transcript}"</span>}
                    </div>
                )}
            </form>
        </div>
    )
}
