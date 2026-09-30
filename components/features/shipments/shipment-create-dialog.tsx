"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { MultiStepShipmentForm } from "@/components/features/forms/multi-step-shipment-form";

/**
 * Modal host for the M4 multi-step registration wizard. Mounted from the farmer
 * dashboard header; closing is blocked while the mutation is in flight so a
 * half-typed batch is never lost to a stray backdrop click.
 */
export function ShipmentCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [pending, setPending] = React.useState(false);

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Register Produce Batch"
      description="Capture the cold-chain envelope, routing and evidence photos for a new lot."
      className="max-w-2xl"
      disableDismiss={pending}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <MultiStepShipmentForm
        onPendingChange={setPending}
        onSuccess={() => onOpenChange(false)}
      />
    </Dialog>
  );
}
