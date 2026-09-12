$endpoints = @(
    'http://localhost:8085/actuator/health',
    'http://localhost:8085/api/orders',
    'http://localhost:8085/api/styles',
    'http://localhost:8085/api/sizes',
    'http://localhost:8085/api/operations',
    'http://localhost:8085/api/operations/affinities/all',
    'http://localhost:8085/api/operation-bulletins',
    'http://localhost:8085/api/shifts',
    'http://localhost:8085/api/shift-assignments',
    'http://localhost:8085/api/lines',
    'http://localhost:8085/api/machines',
    'http://localhost:8085/api/operators',
    'http://localhost:8085/api/attendance?date=2026-09-12',
    'http://localhost:8085/api/attendance/history',
    'http://localhost:8085/api/skill-matrix',
    'http://localhost:8085/api/skill-matrix/history/logs',
    'http://localhost:8085/api/capacity-plans',
    'http://localhost:8085/api/line-designs',
    'http://localhost:8085/api/line-plans',
    'http://localhost:8085/api/piece-production/logs',
    'http://localhost:8085/api/piece-production/timesheet-24h',
    'http://localhost:8085/api/hourly-production/board',
    'http://localhost:8085/api/notifications',
    'http://localhost:8085/api/audit-logs',
    'http://localhost:8085/api/chatbot/conversations'
)

$passed = 0
$failed = 0

foreach ($url in $endpoints) {
    try {
        $res = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 5
        Write-Host "[PASS] 200 OK - $url" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "[FAIL] $($_.Exception.Message) - $url" -ForegroundColor Red
        $failed++
    }
}

# Test Chatbot API with POST /api/chatbot/chat
try {
    $body = @{
        message = "What is the takt time for order 1?"
        userIdentifier = "test_user"
    } | ConvertTo-Json

    $chatRes = Invoke-RestMethod -Uri 'http://localhost:8085/api/chatbot/chat' -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 10
    Write-Host "[PASS] 200 OK - POST http://localhost:8085/api/chatbot/chat (Chatbot response: $($chatRes.data.messageText.Substring(0, [Math]::Min(40, $chatRes.data.messageText.Length)))...)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "[FAIL] $($_.Exception.Message) - POST http://localhost:8085/api/chatbot/chat" -ForegroundColor Red
    $failed++
}

Write-Host "========================================="
Write-Host "Total Passed: $passed, Total Failed: $failed"
