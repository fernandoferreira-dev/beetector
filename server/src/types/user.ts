export interface UserEntity {
    id: number;
    email: string;
    passwordHash: string;
}

export interface UserRow {
    id: number;
    user_email: string;
    user_password_hash: string;
}
