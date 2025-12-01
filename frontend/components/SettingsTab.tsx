import React, { useState, useEffect } from 'react'


export default function SettingsTab() {
    const [schema, setSchema] = useState<any>({})
    const [isLoading, setIsLoading] = useState(true)
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchSchema()
    }, [])

    const fetchSchema = async () => {
        try {
            const response = await fetch('http://localhost:8000/schema')
            const data = await response.json()
            setSchema(data.schema || {})
        } catch (error) {
            console.error('Error fetching schema:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleTable = (tableName: string) => {
        const newExpanded = new Set(expandedTables)
        if (newExpanded.has(tableName)) {
            newExpanded.delete(tableName)
        } else {
            newExpanded.add(tableName)
        }
        setExpandedTables(newExpanded)
    }

    const tableNames = Object.keys(schema)

    return (
        <div className="settingsTab">
            <div className="settingsHeader">
                <h2>Database Schema</h2>
                <button className="btn btn-secondary" onClick={fetchSchema}>
                    ↻ Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="loadingContainer">
                    <div className="spinner"></div>
                    <p>Loading schema...</p>
                </div>
            ) : (
                <div className="schemaTree">
                    <div className="schemaInfo">
                        <p>{tableNames.length} table{tableNames.length !== 1 ? 's' : ''} found</p>
                    </div>

                    {tableNames.map(tableName => {
                        const columns = schema[tableName] || []
                        const isExpanded = expandedTables.has(tableName)

                        return (
                            <div key={tableName} className="schemaTable">
                                <div
                                    className="tableHeader"
                                    onClick={() => toggleTable(tableName)}
                                >
                                    <span className="expandIcon">
                                        {isExpanded ? '▼' : '▶'}
                                    </span>
                                    <span className="tableName">📊 {tableName}</span>
                                    <span className="columnCount">
                                        {columns.length} column{columns.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div className="columnslist">
                                        {columns.map((col: any, idx: number) => (
                                            <div key={idx} className="columnItem">
                                                <span className="columnName">{col.column_name}</span>
                                                <span className="columnType">{col.data_type}</span>
                                                <div className="columnFlags">
                                                    {col.is_nullable === 'NO' && (
                                                        <span className="notNull">NOT NULL</span>
                                                    )}
                                                    {col.primary_key && (
                                                        <span className="primaryKey">PRIMARY KEY</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
