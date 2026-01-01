import api from "./api";

class UserService {
  async getAdminStats() {
    const response = await api.get("/users/admin/stats");
    return response.data;
  }

  async getAllUsers() {
    const response = await api.get("/users/admin/users");
    return response.data;
  }

  async promoteToAdmin(email: string) {
    const response = await api.post("/users/admin/seed", { email }, {
      headers: {
        'x-seed-token': process.env.NEXT_PUBLIC_ADMIN_SEED_TOKEN || 'dev-token'
      }
    });
    return response.data;
  }

  async getProfile() {
    const response = await api.get("/users/profile");
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await api.patch("/users/profile", data);
    return response.data;
  }
}

export const userService = new UserService();