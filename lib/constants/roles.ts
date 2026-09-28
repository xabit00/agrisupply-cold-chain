import { User, UserRole } from "@/lib/types";

export const USER_ROLES: Record<UserRole, UserRole> = {
  Farmer: "Farmer",
  Transporter: "Transporter",
  WarehouseAdmin: "WarehouseAdmin",
  Retailer: "Retailer",
};

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  Farmer: "/farmer",
  Transporter: "/transporter",
  WarehouseAdmin: "/warehouse",
  Retailer: "/retailer",
};

export const AUTH_STORAGE_KEY = "agri_supply_auth_session";
export const AUTH_COOKIE_NAME = "agri_auth_token";

export interface MockUserAccount {
  user: User;
  passwordPlain: string;
  // bcrypt hash for "Pass123!" with 10 salt rounds
  passwordHash: string;
}

export const MOCK_USERS: Record<string, MockUserAccount> = {
  "farmer@agrisupply.com": {
    user: {
      id: "usr_farm_elena",
      name: "Elena Rostova",
      email: "farmer@agrisupply.com",
      role: "Farmer",
      organizationId: "org_salinas_coop",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      createdAt: "2026-01-15T08:00:00Z",
    },
    passwordPlain: "Pass123!",
    passwordHash: "$2b$10$oY7NqB.s3H.Z0W01O7Y17eb3f3c/1G9uYjA2hHqW4oV8jZzU7zW1u",
  },
  "transporter@agrisupply.com": {
    user: {
      id: "usr_trans_marcus",
      name: "Marcus Vance",
      email: "transporter@agrisupply.com",
      role: "Transporter",
      organizationId: "org_arctichaul_fleet",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      createdAt: "2026-01-20T08:00:00Z",
    },
    passwordPlain: "Pass123!",
    passwordHash: "$2b$10$oY7NqB.s3H.Z0W01O7Y17eb3f3c/1G9uYjA2hHqW4oV8jZzU7zW1u",
  },
  "warehouse@agrisupply.com": {
    user: {
      id: "usr_wh_sarah",
      name: "Sarah Chen",
      email: "warehouse@agrisupply.com",
      role: "WarehouseAdmin",
      organizationId: "org_metro_cold_depot",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
      createdAt: "2026-02-01T08:00:00Z",
    },
    passwordPlain: "Pass123!",
    passwordHash: "$2b$10$oY7NqB.s3H.Z0W01O7Y17eb3f3c/1G9uYjA2hHqW4oV8jZzU7zW1u",
  },
  "retailer@agrisupply.com": {
    user: {
      id: "usr_ret_david",
      name: "David Kim",
      email: "retailer@agrisupply.com",
      role: "Retailer",
      organizationId: "org_pacific_organic",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      createdAt: "2026-02-10T08:00:00Z",
    },
    passwordPlain: "Pass123!",
    passwordHash: "$2b$10$oY7NqB.s3H.Z0W01O7Y17eb3f3c/1G9uYjA2hHqW4oV8jZzU7zW1u",
  },
};

