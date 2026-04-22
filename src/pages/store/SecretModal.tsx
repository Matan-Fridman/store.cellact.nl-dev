import { Modal } from "../../components/Modal";
import type { PurchaseResponse } from "../../types";
import { buildQrUrl } from "../../utils/format";

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  data: PurchaseResponse;
}

export function PurchaseModal({ open, onClose, data }: PurchaseModalProps) {
  const qrUrl = buildQrUrl(data.claimUrl);

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
        Number Purchased
      </h2>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        Your purchase is complete. Scan the QR code below with the{" "}
        <strong style={{ color: "var(--color-text)" }}>Arnacon</strong> app to
        activate your number on your device.
      </p>

      <div className="mt-6 flex justify-center">
        <div
          className="rounded-xl p-3"
          style={{ background: "#fff", border: "1px solid var(--color-border)" }}
        >
          <img
            src={qrUrl}
            alt="Scan to activate your number"
            width={220}
            height={220}
          />
        </div>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        Open the Arnacon app and scan this code to complete activation.
      </p>
    </Modal>
  );
}
