package com.beetector.api.dtos.response;

import com.beetector.api.models.Users;

// resposta do login para o cliente mobile
public record SignInResponse(User user) {

    // cria uma resposta com valores da conta, tirando credenciais
    public static SignInResponse fromEntity(Users user) {
        return new SignInResponse(new User(user.getUserId(), user.getUserEmail()));
    }

    // classe interna para representar o usuário sem expor credenciais
    public record User(int id, String email) {}
}
