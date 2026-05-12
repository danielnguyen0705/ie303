package com.ie303.uifive.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurerSupport;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class RedisCacheConfig extends CachingConfigurerSupport {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        ObjectMapper cacheObjectMapper = objectMapper.copy();
        cacheObjectMapper.findAndRegisterModules();
        cacheObjectMapper.activateDefaultTypingAsProperty(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfSubType("com.ie303.uifive")
                        .allowIfSubType("java.util")
                        .allowIfSubType("java.lang")
                        .allowIfSubType("java.time")
                        .build(),
                ObjectMapper.DefaultTyping.EVERYTHING,
                "@class"
        );

        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(cacheObjectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer)
                )
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigs = new LinkedHashMap<>();
        cacheConfigs.put("questions-by-id", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigs.put("question-groups-by-id", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigs.put("questions-by-lesson", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("lessons", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("units", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("sections", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("unit-reviews", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("group-reviews", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("semester-tests", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("progress-grades-units", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigs.put("progress-units-sections", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigs.put("progress-sections-lessons", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigs.put("leaderboard-coins", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigs.put("leaderboard-collectors", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigs.put("leaderboard-exp", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        cacheConfigs.put("shop-items-by-id", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("shop-items-all", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("shop-items-active", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("shop-items-my-items", defaultConfig.entryTtl(Duration.ofMinutes(2)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .transactionAware()
                .build();
    }
}
