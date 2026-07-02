import { env } from "@/config/env";
import { signToken } from "@/utils/jwt";
import { userRepository } from "@/repositories/user.repository";
import { db } from "@/config/db";

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const authService = {
  async getGoogleAuthUrl(returnTo?: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    if (returnTo) {
      params.set("state", returnTo);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async handleGoogleCallback(code: string, state?: string) {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json() as GoogleTokenResponse;
    if (!tokenData.access_token) {
      throw new Error("Failed to get Google access token");
    }

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email) {
      throw new Error("No email from Google");
    }

    // Find or create user
    let user = await userRepository.findByEmail(googleUser.email);

    if (!user) {
      user = await userRepository.createOrUpdateFromGoogle({
        id: googleUser.id,
        email: googleUser.email,
        fullName: googleUser.name,
        avatarUrl: googleUser.picture || null,
      });
    }

    if (!user) {
      throw new Error("Failed to create or find user");
    }

    const token = signToken({ userId: user.id, email: user.email || "" });

    return {
      token,
      user,
      returnTo: state,
    };
  },
};
