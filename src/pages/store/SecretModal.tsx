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
      <h2 className="text-lg font-semibold text-slate-900">
        Number Purchased
      </h2>
      <p className="mt-1 text-sm text-slate-500 leading-relaxed">
        Your purchase is complete. Scan the QR code below with the{" "}
        <strong className="text-slate-700">Arnacon</strong> app to activate your
        number on your device.
      </p>

      <div className="mt-6 flex justify-center">
        <img
          src={qrUrl}
          alt="Scan to activate your number"
          className="rounded-xl border border-slate-100 bg-white p-3"
          width={220}
          height={220}
        />
      </div>

      <p className="mt-4 text-center text-xs text-slate-400 leading-relaxed">
        Open the Arnacon app and scan this code to complete activation.
      </p>
    </Modal>
  );
}
