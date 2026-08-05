package com.digitalarchive;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DigitalArchiveApplication {

    public static void main(String[] args) {
        SpringApplication.run(DigitalArchiveApplication.class, args);
    }

}
