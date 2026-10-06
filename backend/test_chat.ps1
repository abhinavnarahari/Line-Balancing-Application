$body = '{"message": "What is line balancing?"}'
$resp = Invoke-RestMethod -Uri "http://localhost:8085/api/chatbot/chat" -Method Post -ContentType "application/json" -Body $body
Write-Output "SUCCESS:"
$resp.data.messageText.Substring(0, 150)
