import { z } from "zod";

export const shipmentSchema = z.object({
  produceName: z.string().min(2, "Produce name must be at least 2 characters"),
  category: z.enum(["Dairy", "Fruits", "Vegetables", "Meat", "Seafood", "Flowers"]),
  quantityKg: z.number().positive("Quantity must be greater than 0"),
  optimalTempMin: z.number().min(-30).max(50),
  optimalTempMax: z.number().min(-30).max(50),
  optimalHumidityMin: z.number().min(0).max(100),
  optimalHumidityMax: z.number().min(0).max(100),
  originAddress: z.string().min(5, "Origin address is required"),
  destinationAddress: z.string().min(5, "Destination address is required"),
  notes: z.string().optional(),
});

export type ShipmentFormData = z.infer<typeof shipmentSchema>;
