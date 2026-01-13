# Test Messages API Script
# Run this from PowerShell to test the messaging functionality

$baseUrl = "http://localhost:3002/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MESSAGES API TEST SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create User 1 (or login if exists)
Write-Host "Step 1: Creating/Logging in User 1..." -ForegroundColor Yellow
$user1Email = "testuser1@example.com"
$user1Password = "Test123456!"

try {
    $signupBody1 = @{
        email = $user1Email
        password = $user1Password
        firstName = "John"
        lastName = "Sender"
    } | ConvertTo-Json

    $user1Response = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody1 -ContentType "application/json" -ErrorAction Stop
    Write-Host "  User 1 created successfully!" -ForegroundColor Green
    $token1 = $user1Response.access_token
} catch {
    # User might already exist, try login
    Write-Host "  User 1 exists, logging in..." -ForegroundColor Gray
    $loginBody1 = @{
        email = $user1Email
        password = $user1Password
    } | ConvertTo-Json
    
    try {
        $user1Response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody1 -ContentType "application/json" -ErrorAction Stop
        Write-Host "  User 1 logged in successfully!" -ForegroundColor Green
        $token1 = $user1Response.access_token
    } catch {
        Write-Host "  Failed to login User 1: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  Token 1: $($token1.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# Step 2: Create User 2 (or login if exists)
Write-Host "Step 2: Creating/Logging in User 2..." -ForegroundColor Yellow
$user2Email = "testuser2@example.com"
$user2Password = "Test123456!"

try {
    $signupBody2 = @{
        email = $user2Email
        password = $user2Password
        firstName = "Jane"
        lastName = "Receiver"
    } | ConvertTo-Json

    $user2Response = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody2 -ContentType "application/json" -ErrorAction Stop
    Write-Host "  User 2 created successfully!" -ForegroundColor Green
    $token2 = $user2Response.access_token
    $user2Id = $user2Response.user.id
} catch {
    # User might already exist, try login
    Write-Host "  User 2 exists, logging in..." -ForegroundColor Gray
    $loginBody2 = @{
        email = $user2Email
        password = $user2Password
    } | ConvertTo-Json
    
    try {
        $user2Response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody2 -ContentType "application/json" -ErrorAction Stop
        Write-Host "  User 2 logged in successfully!" -ForegroundColor Green
        $token2 = $user2Response.access_token
        $user2Id = $user2Response.user.id
    } catch {
        Write-Host "  Failed to login User 2: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  Token 2: $($token2.Substring(0, 20))..." -ForegroundColor Gray
Write-Host "  User 2 ID: $user2Id" -ForegroundColor Gray
Write-Host ""

# Step 3: Create a conversation from User 1 to User 2
Write-Host "Step 3: Creating conversation from User 1 to User 2..." -ForegroundColor Yellow
$headers1 = @{
    "Authorization" = "Bearer $token1"
    "Content-Type" = "application/json"
}

$conversationBody = @{
    recipientId = $user2Id
    initialMessage = "Hello! This is a test message from John."
} | ConvertTo-Json

try {
    $conversationResponse = Invoke-RestMethod -Uri "$baseUrl/messages/conversations" -Method POST -Body $conversationBody -Headers $headers1 -ErrorAction Stop
    Write-Host "  Conversation created successfully!" -ForegroundColor Green
    $conversationId = $conversationResponse.id
    Write-Host "  Conversation ID: $conversationId" -ForegroundColor Gray
} catch {
    Write-Host "  Error creating conversation: $($_.Exception.Message)" -ForegroundColor Red
    # Try to get existing conversations
    Write-Host "  Checking existing conversations..." -ForegroundColor Gray
    try {
        $existingConvs = Invoke-RestMethod -Uri "$baseUrl/messages/conversations" -Method GET -Headers $headers1 -ErrorAction Stop
        if ($existingConvs.data -and $existingConvs.data.Count -gt 0) {
            $conversationId = $existingConvs.data[0].id
            Write-Host "  Using existing conversation: $conversationId" -ForegroundColor Green
        }
    } catch {
        Write-Host "  No existing conversations found" -ForegroundColor Red
    }
}

Write-Host ""

# Step 4: Send more messages
if ($conversationId) {
    Write-Host "Step 4: Sending more messages..." -ForegroundColor Yellow
    
    # Message from User 1
    $messageBody1 = @{
        conversationId = $conversationId
        recipientId = $user2Id
        content = "Is this property still available?"
    } | ConvertTo-Json
    
    try {
        $msg1 = Invoke-RestMethod -Uri "$baseUrl/messages" -Method POST -Body $messageBody1 -Headers $headers1 -ErrorAction Stop
        Write-Host "  Message 1 sent: 'Is this property still available?'" -ForegroundColor Green
    } catch {
        Write-Host "  Error sending message 1: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Get User 1 ID for User 2 to reply
    $user1Profile = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers1 -ErrorAction SilentlyContinue
    $user1Id = $user1Profile.id
    
    # Message from User 2 (reply)
    $headers2 = @{
        "Authorization" = "Bearer $token2"
        "Content-Type" = "application/json"
    }
    
    $messageBody2 = @{
        conversationId = $conversationId
        recipientId = $user1Id
        content = "Yes, the property is available! Would you like to schedule a viewing?"
    } | ConvertTo-Json
    
    try {
        $msg2 = Invoke-RestMethod -Uri "$baseUrl/messages" -Method POST -Body $messageBody2 -Headers $headers2 -ErrorAction Stop
        Write-Host "  Message 2 sent: 'Yes, the property is available!...'" -ForegroundColor Green
    } catch {
        Write-Host "  Error sending message 2: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Another message from User 1
    $messageBody3 = @{
        conversationId = $conversationId
        recipientId = $user2Id
        content = "That would be great! How about this Saturday at 2pm?"
    } | ConvertTo-Json
    
    try {
        $msg3 = Invoke-RestMethod -Uri "$baseUrl/messages" -Method POST -Body $messageBody3 -Headers $headers1 -ErrorAction Stop
        Write-Host "  Message 3 sent: 'That would be great!...'" -ForegroundColor Green
    } catch {
        Write-Host "  Error sending message 3: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Step 5: Fetch conversation with messages
    Write-Host "Step 5: Fetching conversation with messages..." -ForegroundColor Yellow
    try {
        $convWithMessages = Invoke-RestMethod -Uri "$baseUrl/messages/conversations/$conversationId" -Method GET -Headers $headers1 -ErrorAction Stop
        Write-Host "  Conversation fetched successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Messages:" -ForegroundColor Cyan
        foreach ($msg in $convWithMessages.messages) {
            $sender = if ($msg.senderId -eq $user1Id) { "John" } else { "Jane" }
            Write-Host "    [$sender]: $($msg.content)" -ForegroundColor White
        }
    } catch {
        Write-Host "  Error fetching conversation: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test in the browser:" -ForegroundColor Yellow
Write-Host "1. Go to http://localhost:3000/auth/login" -ForegroundColor White
Write-Host "2. Login with: $user1Email / $user1Password" -ForegroundColor White
Write-Host "3. Go to http://localhost:3000/dashboard/messages" -ForegroundColor White
Write-Host "4. You should see the conversation with Jane!" -ForegroundColor White
Write-Host ""
Write-Host "Or login as User 2:" -ForegroundColor Yellow
Write-Host "   Email: $user2Email" -ForegroundColor White
Write-Host "   Password: $user2Password" -ForegroundColor White
