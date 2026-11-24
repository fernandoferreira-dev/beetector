package com.beetector.api.controllers;

import com.beetector.api.config.ApiController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/webhook")
public class WebhookController implements ApiController {

    @PostMapping("/uplink")
    public ResponseEntity<String> uplink() {
        // TODO POST REQ from TTN
        return ResponseEntity.ok("Data received sucessfuly.");
    }
}
