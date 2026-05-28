package com.ie303.notificationservice.messaging;

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
    public static final String VERIFICATION_EMAIL_QUEUE = "uifive.notifications.verification-email";
    public static final String SHOP_ITEM_CREATED_QUEUE = "uifive.notifications.shop-item-created";
    public static final String PAYMENT_COMPLETED_QUEUE = "uifive.notifications.payment-completed";

    public static final String VERIFICATION_EMAIL_ROUTING_KEY = "notification.verification-email";
    public static final String SHOP_ITEM_CREATED_ROUTING_KEY = "notification.shop-item-created";
    public static final String PAYMENT_COMPLETED_ROUTING_KEY = "notification.payment-completed";

    @Bean
    public TopicExchange notificationsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue verificationEmailQueue() {
        return new Queue(VERIFICATION_EMAIL_QUEUE, true);
    }

    @Bean
    public Queue shopItemCreatedQueue() {
        return new Queue(SHOP_ITEM_CREATED_QUEUE, true);
    }

    @Bean
    public Queue paymentCompletedQueue() {
        return new Queue(PAYMENT_COMPLETED_QUEUE, true);
    }

    @Bean
    public Binding verificationEmailBinding(Queue verificationEmailQueue, TopicExchange notificationsExchange) {
        return BindingBuilder.bind(verificationEmailQueue)
                .to(notificationsExchange)
                .with(VERIFICATION_EMAIL_ROUTING_KEY);
    }

    @Bean
    public Binding shopItemCreatedBinding(Queue shopItemCreatedQueue, TopicExchange notificationsExchange) {
        return BindingBuilder.bind(shopItemCreatedQueue)
                .to(notificationsExchange)
                .with(SHOP_ITEM_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding paymentCompletedBinding(Queue paymentCompletedQueue, TopicExchange notificationsExchange) {
        return BindingBuilder.bind(paymentCompletedQueue)
                .to(notificationsExchange)
                .with(PAYMENT_COMPLETED_ROUTING_KEY);
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
