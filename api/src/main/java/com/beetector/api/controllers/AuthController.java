package com.beetector.api.controllers;

import com.beetector.api.config.ApiController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController implements ApiController {

    @PostMapping("/sign-up")
    public ResponseEntity<String> signUn(){
        // TODO User register
        return ResponseEntity.ok("User signed-un sucessfuly.");
    }

    @PostMapping("/sign-in")
    public ResponseEntity<String> signIn(){
        // TODO User log-in
        return ResponseEntity.ok("User signed-in sucessfuly.");
    }

    @PostMapping("/sign-out")
    public ResponseEntity<String> signOut(){
        // TODO User log-out (must destroy token)
        return ResponseEntity.ok("User signed-out sucessfuly.");
    }
}
