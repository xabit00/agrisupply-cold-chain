import { UserRole } from "@/lib/types";

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
