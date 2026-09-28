import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shipment } from "@/lib/types";
import { formatTemperature, formatHumidity } from "@/lib/utils/formatters";

interface ShipmentDetailsCardProps {
  shipment: Shipment;
}

export function ShipmentDetailsCard({ shipment }: ShipmentDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{shipment.trackingNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <span className="font-semibold">Produce:</span> {shipment.produce.name} (
          {shipment.produce.category})
        </div>
        <div>
          <span className="font-semibold">Optimal Range:</span>{" "}
          {formatTemperature(shipment.produce.optimalTempMin)} -{" "}
          {formatTemperature(shipment.produce.optimalTempMax)} |{" "}
          {formatHumidity(shipment.produce.optimalHumidityMin)} -{" "}
          {formatHumidity(shipment.produce.optimalHumidityMax)}
        </div>
        <div>
          <span className="font-semibold">Origin:</span> {shipment.origin.name}
        </div>
        <div>
          <span className="font-semibold">Destination:</span> {shipment.destination.name}
        </div>
      </CardContent>
    </Card>
  );
}
