package com.ie303.uifive;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@EnableFeignClients
@EnableAsync
@Slf4j
public class IdentityServiceApplication {

    public static void main(String[] args) {
        loadDotenvIfPresent("");
        if (isBlank(System.getProperty("CLOUDAMQP_URL"))) {
            loadDotenvIfPresent("IdentityService");
        }
        SpringApplication.run(IdentityServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner logRabbitMqConfig(
            @Value("${spring.rabbitmq.addresses:amqp://guest:guest@rabbitmq:5672/%2F}") String addresses
    ) {
        return args -> log.info(
                "RabbitMQ config loaded for IdentityService -> addresses={}",
                addresses
        );
    }

    private static void loadDotenvIfPresent(String directory) {
        Dotenv dotenv = directory == null || directory.isBlank()
                ? Dotenv.configure().ignoreIfMissing().load()
                : Dotenv.configure().directory(directory).ignoreIfMissing().load();
        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
