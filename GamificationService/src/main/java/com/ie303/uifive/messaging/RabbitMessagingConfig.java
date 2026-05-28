package com.ie303.uifive.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMessagingConfig {

    public static final String EXCHANGE = "uifive.notifications.exchange";
    public static final String SHOP_ITEM_CREATED_QUEUE = "uifive.notifications.shop-item-created";
    public static final String SHOP_ITEM_CREATED_ROUTING_KEY = "notification.shop-item-created";

    @Bean
    public TopicExchange notificationsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue shopItemCreatedQueue() {
        return new Queue(SHOP_ITEM_CREATED_QUEUE, true);
    }

    @Bean
    public Binding shopItemCreatedBinding(Queue shopItemCreatedQueue, TopicExchange notificationsExchange) {
        return BindingBuilder.bind(shopItemCreatedQueue)
                .to(notificationsExchange)
                .with(SHOP_ITEM_CREATED_ROUTING_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter rabbitMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         Jackson2JsonMessageConverter rabbitMessageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(rabbitMessageConverter);
        return rabbitTemplate;
    }
}
