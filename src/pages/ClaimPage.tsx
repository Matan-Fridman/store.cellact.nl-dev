import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { ClaimCard } from "./claim/ClaimCard";
import { setUseProductionUrls } from "../config/constants";

export function ClaimPage() {
  const [searchParams] = useSearchParams();

  const secret = searchParams.get("secret");
  const label = searchParams.get("label");
  const walletAddress = searchParams.get("walletAddress");
  const dev = searchParams.get("dev");

  useEffect(() => {
    if (dev === "false") setUseProductionUrls(true);
    else if (dev === "true") setUseProductionUrls(false);
  }, [dev]);

  if (!secret || !label || !walletAddress) {
    return (
      <Layout>
        <div className="mx-auto max-w-md text-center py-16">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-xl bg-blue-50 text-3xl mb-5">
            🔗
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            Invalid Link
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            This activation link is incomplete. Please use the link provided
            after your purchase or scan the QR code from the Arnacon app.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md">
        <ClaimCard params={{ secret, label, walletAddress }} />
      </div>
    </Layout>
  );
}
