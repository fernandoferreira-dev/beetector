# API

## Stack
- Java + Spring Boot
- Spring Data JPA
- MariaDB
- Maven

## Requirements
- JDK 25+
- MariaDB 11.8.6+

## Execution
```./mvnw spring-boot:run```

## Files
```
├── HELP.md
├── mvnw
├── mvnw.cmd
├── pom.xml
├── README.md
└── src
    ├── main
    │   ├── java/com/beetector/api
    │   │   ├── ApiApplication.java
    │   │   ├── config
    │   │   │   ├── ApiController.java
    │   │   │   └── WebConfig.java
    │   │   ├── controllers
    │   │   │   ├── AuthController.java
    │   │   │   ├── HiveController.java
    │   │   │   ├── PageController.java
    │   │   │   ├── UserController.java
    │   │   │   └── WebhookController.java
    │   │   ├── dtos
    │   │   │   ├── request
    │   │   │   │   └── CreateUserRequest.java
    │   │   │   └── response
    │   │   │       └── UserResponse.java
    │   │   ├── exceptions
    │   │   │   ├── RestExceptionHandler.java
    │   │   │   └── UserNotFoundException.java
    │   │   ├── models
    │   │   │   ├── Hives.java
    │   │   │   └── Users.java
    │   │   ├── repositories
    │   │   │   ├── HiveRepository.java
    │   │   │   └── UserRepository.java
    │   │   └── services
    │   │       ├── HiveService.java
    │   │       └── UserService.java
    │   └── resources
    │       ├── application.yaml
    │       ├── static
    │       └── templates
    └── test
```