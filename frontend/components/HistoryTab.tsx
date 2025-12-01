import React, { useState, useEffect } from 'react'


interface HistoryItem {
    id: string
    query: string
    sql?: string
    success: boolean
    timestamp: Date
    rowCount?: number
}

interface HistoryTabProps {
    messages?: any[]
}

export default function HistoryTab({ messages = [] }: HistoryTabProps) {
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')

    useEffect(() => {
        // Convert messages to history items
        const historyItems: HistoryItem[] = messages
            .filter(m => m.type === 'user')
            .map(m => {
                const assistantResponse = messages.find(
                    am => am.type === 'assistant' && new Date(am.timestamp) > new Date(m.timestamp)
                )
                return {
                    id: m.id,
                    query: m.text,
                    sql: assistantResponse?.sql,
                    success: assistantResponse && !assistantResponse.text.toLowerCase().includes('error'),
                    timestamp: new Date(m.timestamp),
                    rowCount: assistantResponse?.results?.length || 0
                }
            })
        setHistory(historyItems)
    }, [messages])

    const filteredHistory = history.filter(item => {
        if (filter === 'success') return item.success
        if (filter === 'failed') return !item.success
        return true
    })

    const handleRerun = async (query: string) => {
        // Trigger query in parent component if callback provided
        console.log('Rerunning query:', query)
    }

    return (
        <div className="historyTab">
            <div className="historyHeader">
                <h2>Query History</h2>
                <div className="historyFilters">
                    <button
                        className={`filterBtn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({history.length})
                    </button>
                    <button
                        className={`filterBtn ${filter === 'success' ? 'active' : ''}`}
                        onClick={() => setFilter('success')}
                    >
                        ✅ Success ({history.filter(h => h.success).length})
                    </button>
                    <button
                        className={`filterBtn ${filter === 'failed' ? 'active' : ''}`}
                        onClick={() => setFilter('failed')}
                    >
                        ❌ Failed ({history.filter(h => !h.success).length})
                    </button>
                </div>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="emptyHistory">
                    <div className="emptyIcon">📜</div>
                    <h3>No Query History</h3>
                    <p>Your executed queries will appear here</p>
                </div>
            ) : (
                <div className="historyList">
                    {filteredHistory.map(item => (
                        <div key={item.id} className={`historyItem ${item.success ? 'success' : 'failed'}`}>
                            <div className="historyItemHeader">
                                <span className="historyStatus">
                                    {item.success ? '✅' : '❌'}
                                </span>
                                <span className="historyTime">
                                    {item.timestamp.toLocaleString()}
                                </span>
                            </div>
                            <div className="historyQuery">
                                <strong>Query:</strong> {item.query}
                            </div>
                            {item.sql && (
                                <div className="historySql">
                                    <strong>SQL:</strong> <code>{item.sql}</code>
                                </div>
                            )}
                            <div className="historyFooter">
                                <span className="historyRows">
                                    {item.rowCount} row{item.rowCount !== 1 ? 's' : ''}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleRerun(item.query)}
                                >
                                    ↻ Rerun
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
