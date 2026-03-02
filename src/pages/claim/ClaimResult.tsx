import type { ActivateResponse } from "../../types";
import { formatPhone } from "../../utils/format";

interface ClaimResultProps {
  data: ActivateResponse;
}

export function ClaimResult({ data }: ClaimResultProps) {
  return (
    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <h3 className="text-sm font-semibold text-emerald-700 mb-3">
        Number Activated Successfully
      </h3>
      <dl className="space-y-2.5">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
            Your Number
          </dt>
          <dd className="text-sm font-semibold text-slate-700">
            {formatPhone(data.label)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
            Registered As
          </dt>
          <dd className="text-xs text-slate-700">
            {data.label}.{data.name}
          </dd>
        </div>
      </dl>
    </div>
  );
}
