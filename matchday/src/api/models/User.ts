export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGEMENT = 'MANAGEMENT',
    CAPTAIN = 'CAPTAIN',
    USER = 'USER'
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserCreate {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
} 