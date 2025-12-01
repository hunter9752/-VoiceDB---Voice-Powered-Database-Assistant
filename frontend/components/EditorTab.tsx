import React, { useState } from 'react'


interface EditorTabProps {
    onQuerySubmit?: (query: string) => void
}

export default function EditorTab({ onQuerySubmit }: EditorTabProps) {
    const [sql, setSql] = useState('')
    const [results, setResults] = useState<any[] | null>(null)
    const [error, setError] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [executionTime, setExecutionTime] = useState<number>(0)

    const handleExecute = async () => {
        if (!sql.trim()) return

        setIsLoading(true)
        setError('')
        setResults(null)
        const startTime = Date.now()

        try {
            const response = await fetch('http://localhost:8000/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: sql,
                    confirm_destructive: sql.toLowerCase().includes('delete') ||
                        sql.toLowerCase().includes('drop') ||
                        sql.toLowerCase().includes('truncate')
                })
            })

            const data = await response.json()
            const endTime = Date.now()
            setExecutionTime(endTime - startTime)

            if (data.error) {
                setError(data.error)
            } else {
                setResults(data.results || [])
            }
        } catch (err) {
            setError('Failed to execute query: ' + (err as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    const exampleQueries = [
        'SELECT * FROM users LIMIT 10',
        'SELECT COUNT(*) as total FROM products',
        'SELECT * FROM orders WHERE created_at > NOW() - INTERVAL \'7 days\'',
    ]

    return (
        <div className="editorTab">
            <div className="editorContainer">
                <div className="editorHeader">
                    <h3>SQL Editor</h3>
                    <div className="editorActions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setSql('')}
                            disabled={!sql || isLoading}
                        >
                            Clear
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleExecute}
                            disabled={!sql.trim() || isLoading}
                        >
                            {isLoading ? 'Executing...' : '▶ Execute'}
                        </button>
                    </div>
                </div>

                <textarea
                    className="sqlEditor"
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    placeholder="Enter your SQL query here...&#10;&#10;Example:&#10;SELECT * FROM users WHERE role = 'admin'"
                    spellCheck={false}
                />

                <div className="exampleQueries">
                    <p className="exampleLabel">Quick examples:</p>
                    {exampleQueries.map((query, idx) => (
                        <button
                            key={idx}
                            className="exampleQueryBtn"
                            onClick={() => setSql(query)}
                        >
                            {query}
                        </button>
                    ))}
                </div>
            </div>

            <div className="resultsContainer">
                {error && (
                    <div className="errorMessage">
                        <strong>⚠️ Error:</strong> {error}
                    </div>
                )}

                {results && (
                    <div className="resultsPanel">
                        <div className="resultsHeader">
                            <span className="resultCount">
                                {results.length} row{results.length !== 1 ? 's' : ''} returned
                            </span>
                            <span className="executionTime">
                                ⏱️ {executionTime}ms
                            </span>
                        </div>

                        {results.length === 0 ? (
                            <div className="emptyResults">
                                Query executed successfully, but returned no rows.
                            </div>
                        ) : (
                            <div className="resultsTable">
                                <table className="dataTable">
                                    <thead>
                                        <tr>
                                            {Object.keys(results[0]).map(col => (
                                                <th key={col}>{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.slice(0, 100).map((row, idx) => (
                                            <tr key={idx}>
                                                {Object.keys(results[0]).map(col => (
                                                    <td key={col}>
                                                        {row[col] === null ? (
                                                            <span className="nullValue">NULL</span>
                                                        ) : typeof row[col] === 'object' ? (
                                                            JSON.stringify(row[col])
                                                        ) : (
                                                            String(row[col])
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {results.length > 100 && (
                                    <div className="moreResults">
                                        ... and {results.length - 100} more rows
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {isLoading && (
                    <div className="loadingResults">
                        <div className="spinner"></div>
                        <p>Executing query...</p>
                    </div>
                )}
            </div>
        </div>
    )
}
