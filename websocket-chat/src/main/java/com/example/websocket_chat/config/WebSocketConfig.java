package com.example.websocket_chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registers the "/ws" endpoint, enabling SockJS fallback options.
        // This is the URL the client will connect to.
        registry.addEndpoint("/ws").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Defines that messages whose destination starts with "/app" should be routed to
        // message-handling methods in @Controller classes.
        registry.setApplicationDestinationPrefixes("/app");

        // Defines that messages whose destination starts with "/topic" should be routed to the
        // message broker, which broadcasts them to all subscribed clients.
        registry.enableSimpleBroker("/topic");
    }
}
