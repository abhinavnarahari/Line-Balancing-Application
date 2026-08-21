package com.qtech.linebalancing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class LineBalancingApplication {

    public static void main(String[] args) {
        SpringApplication.run(LineBalancingApplication.class, args);
    }
}
