// deno-lint-ignore-file no-explicit-any
import {
    createClient,
    SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPT_URL = "https://exp.host/--/api/v2/push/getReceipts";

Deno.serve(async (req: Request) => {
  try {
    const { groupId, title, body, data } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all tokens for all members of the group
    const { data: members, error } = await supabase
      .from("group_members")
      .select("push_tokens(token)")
      .eq("groupId", groupId);

    if (error) throw error;

    const tokens: string[] = (members ?? [])
      .flatMap((m: any) => m.push_tokens ?? [])
      .map((t: any) => t.token)
      .filter(Boolean);

    if (!tokens.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    // Expo accepts max 100 messages per request
    const chunks = chunkArray(tokens, 100);
    const receiptIds: string[] = [];

    for (const chunk of chunks) {
      const messages = chunk.map((token) => ({ to: token, title, body, data }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });

      const result = await res.json();
      result.data?.forEach((r: any) => {
        if (r.id) receiptIds.push(r.id);
      });
    }

    // Check receipts and clean up dead tokens
    if (receiptIds.length) {
      await cleanupDeadTokens(receiptIds, supabase);
    }

    return new Response(JSON.stringify({ sent: tokens.length }), {
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});

async function cleanupDeadTokens(
  receiptIds: string[],
  supabase: SupabaseClient,
) {
  const res = await fetch(EXPO_RECEIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: receiptIds }),
  });

  const { data: receipts } = await res.json();
  if (!receipts) return;

  const deadTokens = Object.values(receipts)
    .filter((r: any) => r.details?.error === "DeviceNotRegistered")
    .map((r: any) => r.details?.expoPushToken as string)
    .filter(Boolean);

  if (deadTokens.length) {
    await supabase.from("push_tokens").delete().in("token", deadTokens);
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}
