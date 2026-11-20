export interface UserEntity {
    id: number;
    email: string;
    passwordHash: string;
}

export interface UserRow {
    user_id: number;
    user_email: string;
    user_password: string;
}
