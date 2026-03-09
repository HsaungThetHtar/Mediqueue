import { api } from "./client";
import { AuthUser } from "./auth";

export interface UserProfile extends AuthUser {
    phone?: string;
    dateOfBirth?: string;
    identificationNumber?: string;
    notifyNewBooking?: boolean;
    notifyUrgentCall?: boolean;
    notifySms?: boolean;
}

export interface UpdateProfileData {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    identificationNumber?: string;
    notifyNewBooking?: boolean;
    notifyUrgentCall?: boolean;
    notifySms?: boolean;
}

export async function getProfile(): Promise<UserProfile> {
    return api.get<UserProfile>("/users/profile");
}

export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    return api.patch<UserProfile>("/users/profile", data);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return api.post<{ message: string }>("/users/change-password", { currentPassword, newPassword });
}
