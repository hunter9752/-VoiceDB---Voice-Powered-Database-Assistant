import sqlparse
from sqlparse.sql import IdentifierList, Identifier, Where
from sqlparse.tokens import Keyword, DML
import re
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class SQLSafetyValidator:
    """Validates SQL queries for safety"""
    
    # Destructive keywords that should be blocked
    DESTRUCTIVE_KEYWORDS = {
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 
        'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE', 'EXECUTE'
    }
    
    # Dangerous patterns
    DANGEROUS_PATTERNS = [
        r';\s*\w+',  # Multiple statements
        r'--',  # SQL comments
        r'/\*',  # Multi-line comments
        r'xp_',  # SQL Server extended procedures
        r'exec\s*\(',  # Execute statements
        r'sp_',  # Stored procedures
    ]
    
    def __init__(self, allowed_tables: List[str] = None):
        self.allowed_tables = set(allowed_tables) if allowed_tables else None
    
    def validate(self, sql: str, allow_destructive: bool = False) -> Dict:
        """
        Validate SQL query for safety
        
        Args:
            sql: SQL query to validate
            allow_destructive: Whether destructive operations are allowed
            
        Returns:
            dict with validation results
        """
        errors = []
        warnings = []
        
        # Parse SQL
        try:
            parsed = sqlparse.parse(sql)
            if not parsed:
                errors.append("Unable to parse SQL query")
                return self._result(False, errors, warnings)
        except Exception as e:
            errors.append(f"SQL parse error: {str(e)}")
            return self._result(False, errors, warnings)
        
        statement = parsed[0]
        
        # Detect operation type
        operation_type = self._detect_operation_type(statement)
        
        # Check for multiple statements
        if len(parsed) > 1:
            errors.append("Multiple SQL statements not allowed")
            return self._result(False, errors, warnings, operation_type)
        
        # Check for destructive keywords
        is_destructive = operation_type in ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE']
        
        if is_destructive and not allow_destructive:
            return self._result(
                False, 
                [f"{operation_type} operation not allowed. Enable destructive queries in settings."],
                warnings,
                operation_type,
                is_destructive=True,
                requires_confirmation=True
            )
        
        # Check for dangerous patterns
        for pattern in self.DANGEROUS_PATTERNS:
            if re.search(pattern, sql, re.IGNORECASE):
                errors.append(f"Dangerous pattern detected: {pattern}")
        
        # For UPDATE/DELETE without WHERE clause
        if operation_type in ['UPDATE', 'DELETE']:
            if not self._has_where_clause(statement):
                warnings.append(f"{operation_type} without WHERE clause will affect ALL rows!")
        
        # Calculate complexity
        complexity = self._calculate_complexity(statement)
        
        # Check allowed tables if specified
        if self.allowed_tables:
            table_names = self._extract_table_names(statement)
            unauthorized_tables = [t for t in table_names if t not in self.allowed_tables]
            if unauthorized_tables:
                errors.append(f"Unauthorized tables: {', '.join(unauthorized_tables)}")
        
        # Determine if query is safe
        is_safe = len(errors) == 0
        
        return self._result(
            is_safe, 
            errors, 
            warnings, 
            operation_type=operation_type,
            complexity=complexity,
            is_destructive=is_destructive,
            requires_confirmation=is_destructive
        )
    
    def _detect_operation_type(self, statement) -> str:
        """Detect the type of SQL operation"""
        first_token = str(statement.token_first(skip_ws=True, skip_cm=True)).upper()
        
        if first_token == 'SELECT':
            return 'SELECT'
        elif first_token == 'INSERT':
            return 'INSERT'
        elif first_token == 'UPDATE':
            return 'UPDATE'
        elif first_token == 'DELETE':
            return 'DELETE'
        elif first_token == 'CREATE':
            return 'CREATE'
        elif first_token == 'DROP':
            return 'DROP'
        elif first_token == 'ALTER':
            return 'ALTER'
        elif first_token == 'TRUNCATE':
            return 'TRUNCATE'
        else:
            return 'UNKNOWN'
    
    def _has_where_clause(self, statement) -> bool:
        """Check if statement has a WHERE clause"""
        for token in statement.tokens:
            if isinstance(token, Where):
                return True
        return False
    
    def _extract_table_names(self, statement) -> List[str]:
        """Extract table names from SQL statement"""
        tables = []
        
        def extract_from_token(token):
            if isinstance(token, IdentifierList):
                for identifier in token.get_identifiers():
                    tables.append(str(identifier).split()[0])
            elif isinstance(token, Identifier):
                tables.append(str(token).split()[0])
        
        from_seen = False
        for token in statement.tokens:
            if from_seen:
                extract_from_token(token)
                from_seen = False
            
            if token.ttype is Keyword and token.value.upper() == 'FROM':
                from_seen = True
        
        return tables
    
    def _calculate_complexity(self, statement) -> int:
        """Calculate query complexity score"""
        sql = str(statement).upper()
        score = 10  # Base score
        
        # Count JOINs
        score += sql.count('JOIN') * 10
        
        # Count subqueries
        score += sql.count('SELECT') * 15
        
        # Count aggregations
        agg_functions = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'GROUP BY']
        for func in agg_functions:
            score += sql.count(func) * 5
        
        # Count UNION
        score += sql.count('UNION') * 10
        
        # Count wildcards in LIKE
        score += sql.count("LIKE '%") * 5
        
        return score
    
    def _result(self, is_valid: bool, errors: List, warnings: List, 
                operation_type: str = 'UNKNOWN', complexity: int = 0,
                is_destructive: bool = False, requires_confirmation: bool = False) -> Dict:
        """Format validation result"""
        return {
            'is_valid': is_valid,
            'is_safe': is_valid and not is_destructive,
            'operation_type': operation_type,
            'is_destructive': is_destructive,
            'requires_confirmation': requires_confirmation,
            'errors': errors,
            'warnings': warnings,
            'complexity': complexity
        }
