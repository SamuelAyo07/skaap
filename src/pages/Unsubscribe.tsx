import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json();
        if (data?.valid) setStatus("valid");
        else if (data?.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setStatus("done");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-border p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground mb-2">Unsubscribe</h1>
        {status === "loading" && <p className="text-muted-foreground text-sm">Checking your link…</p>}
        {status === "valid" && (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Stop receiving emails from Skaap?
            </p>
            <button
              onClick={confirm}
              className="w-full bg-[#C41E3A] text-white rounded-full py-3 text-sm font-medium"
            >
              Confirm unsubscribe
            </button>
          </>
        )}
        {status === "submitting" && <p className="text-muted-foreground text-sm">Unsubscribing…</p>}
        {status === "done" && <p className="text-sm">You've been unsubscribed. Sorry to see you go.</p>}
        {status === "already" && <p className="text-sm">You're already unsubscribed.</p>}
        {status === "invalid" && <p className="text-sm text-muted-foreground">This link is invalid or expired.</p>}
        {status === "error" && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
      </div>
    </div>
  );
}
