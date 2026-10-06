$questions = @(
    "How does line balancing work in this system?",
    "Show me the production orders",
    "List all lines",
    "Which operators are available today?",
    "What is the bottleneck operation?",
    "How can I improve line efficiency?",
    "Tell me about the styles in production",
    "How to allocate operators?",
    "What are the machines available?",
    "Who is the best operator for collar stitching?"
)

foreach ($q in $questions) {
    $body = @{ message = $q } | ConvertTo-Json
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:8085/api/chatbot/chat" -Method Post -ContentType "application/json" -Body $body
        Write-Output "=================================================="
        Write-Output "Q: $q"
        Write-Output "Intent: $($resp.data.intent)"
        Write-Output "Data Available: $($resp.data.dataAvailable)"
        Write-Output "Response Preview: $($resp.data.messageText.Substring(0, [Math]::Min(120, $resp.data.messageText.Length)))"
    } catch {
        Write-Output "ERROR for Q: $q - $_"
    }
}
