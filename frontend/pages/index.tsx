import React, { useState } from 'react'
import Head from 'next/head'
import ChatTab from '../components/ChatTab'
import DatabaseTab from '../components/DatabaseTab'
import EditorTab from '../components/EditorTab'
import HistoryTab from '../components/HistoryTab'
import SettingsTab from '../components/SettingsTab'

type Tab = 'chat' | 'database' | 'editor' | 'history' | 'settings'

interface Message {
  id: string
  type: 'user' | 'assistant'
  text: string
  sql?: string
  results?: any[]
  timestamp: Date
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleQuerySubmit = async (query: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, confirm_destructive: false })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: data.explanation || 'Query executed successfully',
        sql: data.sql,
        results: data.results,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Query error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: 'Sorry, there was an error processing your query.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'database', label: 'Database', icon: '📊' },
    { id: 'editor', label: 'Editor', icon: '✏️' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <>
      <Head>
        <title>VoiceDB - Voice-Powered Database Assistant</title>
      </Head>

      <div className="voicedb-container">
        <header className="voicedb-header">
          <div className="container">
            <div className="header-content">
              <div className="logo-section">
                <div className="logo-icon">🎤</div>
                <div>
                  <h1 className="gradient-text">VoiceDB</h1>
                  <p className="tagline">Voice-Powered Database Assistant</p>
                </div>
              </div>
              <div className="status-badge">
                <span className="status-dot"></span>
                Connected
              </div>
            </div>
          </div>
        </header>

        <nav className="tab-nav">
          <div className="container">
            <div className="tab-list">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as Tab)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="main-content">
          <div className="container">
            {activeTab === 'chat' && (
              <ChatTab
                onQuerySubmit={handleQuerySubmit}
                messages={messages}
                isLoading={isLoading}
              />
            )}
            {activeTab === 'database' && <DatabaseTab />}
            {activeTab === 'editor' && <EditorTab />}
            {activeTab === 'history' && <HistoryTab messages={messages} />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </main>

        <style jsx>{`
          .voicedb-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .voicedb-header {
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1.5rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
          }

          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .logo-section {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .logo-icon {
            font-size: 2.5rem;
            animation: pulse 2s ease-in-out infinite;
          }

          .voicedb-header h1 {
            font-size: 2rem;
            font-weight: 800;
            margin: 0;
          }

          .tagline {
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin: 0;
          }

          .status-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: var(--radius-full);
            color: var(--success);
            font-size: 0.875rem;
            font-weight: 600;
          }

          .status-dot {
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }

          .tab-nav {
            background: var(--bg-secondary);
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            position: sticky;
            top: 88px;
            z-index: 99;
          }

          .tab-list {
            display: flex;
            gap: 0.5rem;
            overflow-x: auto;
            padding: 0.25rem 0;
          }

          .tab-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: transparent;
            border: 1px solid transparent;
            border-radius: var(--radius-lg);
            color: var(--text-secondary);
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-base);
            white-space: nowrap;
          }

          .tab-button:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
          }

          .tab-button.active {
            background: var(--accent-gradient);
            color: white;
            border-color: transparent;
            box-shadow: var(--shadow-glow);
          }

          .tab-icon {
            font-size: 1.25rem;
          }

          .main-content {
            flex: 1;
            padding: 2rem 0;
          }

          @media (max-width: 768px) {
            .tab-nav {
              top: 80px;
            }

            .tab-label {
              display: none;
            }

            .tab-button {
              padding: 0.75rem 1rem;
            }

            .logo-section {
              gap: 0.75rem;
            }

            .voicedb-header h1 {
              font-size: 1.5rem;
            }

            .tagline {
              font-size: 0.75rem;
            }

            .status-badge {
              font-size: 0.75rem;
              padding: 0.4rem 0.8rem;
            }
          }
        `}</style>
      </div>
    </>
  )
}
