'use strict';

// DOM Elements
const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');
const onlineCountElement = document.querySelector('#onlineCount');
const typingIndicator = document.querySelector('#typingIndicator');

let stompClient = null;
let username = null;
let onlineUsers = new Set();
let typingTimer;

const avatarColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

// Connect to WebSocket
function connect(event) {
    event.preventDefault();
    username = document.querySelector('#name').value.trim();

    if (username && username.length >= 2) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        // Add connecting message
        addSystemMessage('Connecting to chat...', 'connecting');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Disable debug logging

        stompClient.connect({}, onConnected, onError);
    } else {
        showNotification('Please enter a username with at least 2 characters', 'error');
    }
}

function onConnected() {
    // Subscribe to public topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Send join message
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({
        sender: username,
        type: 'JOIN'
    }));

    // Remove connecting message
    const connectingMsg = document.querySelector('.connecting-message');
    if (connectingMsg) {
        connectingMsg.remove();
    }

    addSystemMessage('Connected successfully! Welcome to the chat.', 'success');
}

function onError(error) {
    console.error('WebSocket connection error:', error);
    addSystemMessage('Could not connect to chat. Please refresh to try again.', 'error');
}

// Send message
function sendMessage(event) {
    event.preventDefault();
    const messageContent = messageInput.value.trim();

    if (messageContent && stompClient && messageContent.length > 0) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };

        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';

        // Auto resize textarea
        messageInput.style.height = 'auto';
    }
}

// Handle received messages
function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);

    if (message.type === 'JOIN') {
        onlineUsers.add(message.sender);
        updateOnlineCount();
        addSystemMessage(`${message.sender} joined the chat`, 'join');
    } else if (message.type === 'LEAVE') {
        onlineUsers.delete(message.sender);
        updateOnlineCount();
        addSystemMessage(`${message.sender} left the chat`, 'leave');
    } else if (message.type === 'CHAT') {
        addChatMessage(message);
    }
}

// Add chat message to UI
function addChatMessage(message) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('chat-message');

    const timestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageElement.innerHTML = `
        <div class="avatar" style="background: ${getAvatarColor(message.sender)}">
            ${message.sender.charAt(0).toUpperCase()}
        </div>
        <div class="message-content">
            <div class="sender">${escapeHtml(message.sender)}</div>
            <p class="message-text">${escapeHtml(message.content)}</p>
            <div class="timestamp">${timestamp}</div>
        </div>
    `;

    messageArea.appendChild(messageElement);
    scrollToBottom();
}

// Add system message
function addSystemMessage(text, type) {
    const messageElement = document.createElement('li');
    messageElement.classList.add('event-message');

    if (type) {
        messageElement.classList.add(`${type}-message`);
    }

    const icon = type === 'join' ? '👋' : type === 'leave' ? '👋' :
                type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    messageElement.innerHTML = `${icon} ${escapeHtml(text)}`;
    messageArea.appendChild(messageElement);
    scrollToBottom();
}

// Utility functions
function getAvatarColor(sender) {
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
        hash = 31 * hash + sender.charCodeAt(i);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
}

function updateOnlineCount() {
    onlineCountElement.textContent = Math.max(1, onlineUsers.size);
}

function showNotification(message, type) {
    // Simple notification - you could enhance this with a proper notification system
    alert(message);
}

// Auto-resize message input
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

// Emoji button functionality
document.querySelector('.emoji-btn').addEventListener('click', function() {
    const emojis = ['😊', '😂', '❤️', '👍', '🎉', '😮', '😢', '😠'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    messageInput.value += randomEmoji;
    messageInput.focus();
});

// Enter key handling
messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage(event);
    }
});

// Event listeners
usernameForm.addEventListener('submit', connect);
messageForm.addEventListener('submit', sendMessage);

// Focus username input on page load
document.querySelector('#name').focus();