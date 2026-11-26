package com.beetector.api.controllers;

import com.beetector.api.config.ApiController;
import com.beetector.api.dtos.request.SignInRequest;
import com.beetector.api.dtos.request.SignUpRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController implements ApiController {

    private final AuthenticationManager authenticationManager;

    public AuthController(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/sign-up")
    public ResponseEntity<String> signUn(@RequestBody @Valid SignUpRequest request){
        return ResponseEntity.ok("User signed-up sucessfuly.");
    }

    @PostMapping("/sign-in")
    public ResponseEntity signIn(@RequestBody @Valid SignInRequest request){
        var useremailPassword = new UsernamePasswordAuthenticationToken(request.userEmail(), request.userPassword());
        var auth = this.authenticationManager.authenticate(useremailPassword);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/sign-out")
    public ResponseEntity<String> signOut(){
        // TODO User log-out (must destroy token)
        return ResponseEntity.ok("User signed-out sucessfuly.");
    }
}
