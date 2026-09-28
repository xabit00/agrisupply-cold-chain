export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  FARMER: "/farmer",
  TRANSPORTER: "/transporter",
  WAREHOUSE: "/warehouse",
  RETAILER: "/retailer",
  API: {
    AUTH_LOGIN: "/api/auth/login",
    AUTH_ME: "/api/auth/me",
    SHIPMENTS: "/api/shipments",
    IOT: "/api/iot",
    TRACKING: "/api/tracking",
  },
} as const;
