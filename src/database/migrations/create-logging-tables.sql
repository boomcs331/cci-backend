-- Create API Logs Table
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(50) NOT NULL,
    method VARCHAR(10) NOT NULL,
    url VARCHAR(500) NOT NULL,
    status_code INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    client_ip VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    request_size INTEGER DEFAULT 0,
    response_size INTEGER DEFAULT 0,
    query JSONB,
    params JSONB,
    body JSONB,
    headers JSONB,
    response JSONB,
    error TEXT,
    is_error BOOLEAN DEFAULT FALSE,
    is_slow BOOLEAN DEFAULT FALSE
);

-- Create indexes for api_logs
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_logs_client_ip ON api_logs(client_ip);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_method_url ON api_logs(method, url);
CREATE INDEX IF NOT EXISTS idx_api_logs_request_id ON api_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_is_error ON api_logs(is_error);
CREATE INDEX IF NOT EXISTS idx_api_logs_is_slow ON api_logs(is_slow);

-- Create Auth Logs Table
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'LOGIN_ATTEMPT',
        'LOGIN_SUCCESS', 
        'LOGIN_FAILED',
        'REGISTRATION_ATTEMPT',
        'REGISTRATION_SUCCESS',
        'REGISTRATION_FAILED',
        'LOGOUT',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET'
    )),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    user_id VARCHAR(50),
    client_ip VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    duration INTEGER DEFAULT 0,
    error_message TEXT,
    roles JSONB,
    permission_count INTEGER,
    is_success BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

-- Create indexes for auth_logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON auth_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_username ON auth_logs(username);
CREATE INDEX IF NOT EXISTS idx_auth_logs_client_ip ON auth_logs(client_ip);
CREATE INDEX IF NOT EXISTS idx_auth_logs_is_success ON auth_logs(is_success);

-- Create partitions for better performance (optional, for high-volume systems)
-- Partition api_logs by month
-- CREATE TABLE api_logs_y2024m12 PARTITION OF api_logs
-- FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Create views for common queries
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
    timestamp,
    method,
    url,
    status_code,
    duration,
    client_ip,
    error
FROM api_logs 
WHERE is_error = true 
ORDER BY timestamp DESC 
LIMIT 100;

CREATE OR REPLACE VIEW slow_requests AS
SELECT 
    timestamp,
    method,
    url,
    duration,
    client_ip,
    request_id
FROM api_logs 
WHERE is_slow = true 
ORDER BY duration DESC 
LIMIT 100;

CREATE OR REPLACE VIEW failed_logins AS
SELECT 
    timestamp,
    username,
    client_ip,
    user_agent,
    error_message,
    duration
FROM auth_logs 
WHERE action = 'LOGIN_FAILED' 
ORDER BY timestamp DESC 
LIMIT 100;

-- Create function for automatic cleanup
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    cutoff_date TIMESTAMP;
    api_deleted_count INTEGER;
    auth_deleted_count INTEGER;
    total_deleted_count INTEGER;
BEGIN
    cutoff_date := CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    -- Delete old API logs
    DELETE FROM api_logs WHERE timestamp < cutoff_date;
    GET DIAGNOSTICS api_deleted_count = ROW_COUNT;
    
    -- Delete old auth logs
    DELETE FROM auth_logs WHERE timestamp < cutoff_date;
    GET DIAGNOSTICS auth_deleted_count = ROW_COUNT;
    
    total_deleted_count := api_deleted_count + auth_deleted_count;
    
    RETURN total_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for log statistics
CREATE OR REPLACE FUNCTION get_log_statistics(time_window_minutes INTEGER DEFAULT 60)
RETURNS TABLE(
    total_requests BIGINT,
    successful_requests BIGINT,
    client_errors BIGINT,
    server_errors BIGINT,
    avg_response_time NUMERIC,
    total_login_attempts BIGINT,
    successful_logins BIGINT,
    failed_logins BIGINT
) AS $$
DECLARE
    cutoff_time TIMESTAMP;
BEGIN
    cutoff_time := CURRENT_TIMESTAMP - INTERVAL '1 minute' * time_window_minutes;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM api_logs WHERE timestamp > cutoff_time),
        (SELECT COUNT(*) FROM api_logs WHERE timestamp > cutoff_time AND status_code BETWEEN 200 AND 399),
        (SELECT COUNT(*) FROM api_logs WHERE timestamp > cutoff_time AND status_code BETWEEN 400 AND 499),
        (SELECT COUNT(*) FROM api_logs WHERE timestamp > cutoff_time AND status_code BETWEEN 500 AND 599),
        (SELECT AVG(duration) FROM api_logs WHERE timestamp > cutoff_time),
        (SELECT COUNT(*) FROM auth_logs WHERE timestamp > cutoff_time AND action = 'LOGIN_ATTEMPT'),
        (SELECT COUNT(*) FROM auth_logs WHERE timestamp > cutoff_time AND action = 'LOGIN_SUCCESS'),
        (SELECT COUNT(*) FROM auth_logs WHERE timestamp > cutoff_time AND action = 'LOGIN_FAILED');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT ON api_logs TO app_user;
-- GRANT SELECT, INSERT ON auth_logs TO app_user;
-- GRANT SELECT ON recent_errors TO app_user;
-- GRANT SELECT ON slow_requests TO app_user;
-- GRANT SELECT ON failed_logins TO app_user;