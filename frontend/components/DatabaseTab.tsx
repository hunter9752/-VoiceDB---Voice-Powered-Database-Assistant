import React, { useState, useEffect } from 'react'


interface DatabaseTabProps {
    onQuerySubmit?: (query: string) => void
}

export default function DatabaseTab({ onQuerySubmit }: DatabaseTabProps) {
    const [tables, setTables] = useState<string[]>([])
    const [selectedTable, setSelectedTable] = useState<string>('')
    const [tableData, setTableData] = useState<any[]>([])
    const [columns, setColumns] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const rowsPerPage = 10

    // Fetch available tables on mount
    useEffect(() => {
        fetchTables()
    }, [])

    const fetchTables = async () => {
        try {
            const response = await fetch('http://localhost:8000/schema')
            const data = await response.json()
            const tableNames = Object.keys(data.schema || {})
            setTables(tableNames)
            if (tableNames.length > 0 && !selectedTable) {
                setSelectedTable(tableNames[0])
            }
        } catch (error) {
            console.error('Error fetching tables:', error)
        }
    }

    // Fetch table data when table is selected
    useEffect(() => {
        if (selectedTable) {
            fetchTableData(selectedTable)
        }
    }, [selectedTable])

    const fetchTableData = async (tableName: string) => {
        setIsLoading(true)
        try {
            const response = await fetch('http://localhost:8000/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `Show all data from ${tableName}`,
                    confirm_destructive: false
                })
            })
            const data = await response.json()

            if (data.results && data.results.length > 0) {
                setTableData(data.results)
                setColumns(Object.keys(data.results[0]))
            } else {
                setTableData([])
                setColumns([])
            }
        } catch (error) {
            console.error('Error fetching table data:', error)
            setTableData([])
        } finally {
            setIsLoading(false)
        }
    }

    const totalPages = Math.ceil(tableData.length / rowsPerPage)
    const startIdx = (currentPage - 1) * rowsPerPage
    const endIdx = startIdx + rowsPerPage
    const currentData = tableData.slice(startIdx, endIdx)

    return (
        <div className="databaseTab">
            <div className="databaseHeader">
                <div className="tableSelector">
                    <label>Select Table:</label>
                    <select
                        value={selectedTable}
                        onChange={(e) => {
                            setSelectedTable(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="tableSelect"
                    >
                        {tables.map(table => (
                            <option key={table} value={table}>{table}</option>
                        ))}
                    </select>
                </div>
                <div className="tableInfo">
                    <span className="rowCount">
                        {tableData.length} row{tableData.length !== 1 ? 's' : ''}
                    </span>
                    {totalPages > 1 && (
                        <span className="pageInfo">
                            Page {currentPage} of {totalPages}
                        </span>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="loadingContainer">
                    <div className="spinner"></div>
                    <p>Loading table data...</p>
                </div>
            ) : tableData.length === 0 ? (
                <div className="emptyState">
                    <div className="emptyIcon">📭</div>
                    <h3>No Data</h3>
                    <p>This table is empty or doesn't exist.</p>
                </div>
            ) : (
                <>
                    <div className="tableContainer">
                        <table className="dataTable">
                            <thead>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map((row, idx) => (
                                    <tr key={idx}>
                                        {columns.map(col => (
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
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                ← Previous
                            </button>
                            <span className="pageNumbers">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = i + 1
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`pageButton ${currentPage === pageNum ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </span>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
