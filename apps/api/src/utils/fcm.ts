type FcmPushResult = {
  ok: boolean;
  status?: number;
  error?: unknown;
};

export async function sendFcmLegacyPush(options: {
  tokens: string[];
  title: string;
  body: string;
  deepLinkUrl?: string | null;
}): Promise<FcmPushResult> {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) {
    // Best-effort: production deployments should set FCM_SERVER_KEY.
    return { ok: false, error: "FCM_SERVER_KEY not set" };
  }
  if (!options.tokens.length) return { ok: false, error: "No FCM tokens" };

  // Legacy FCM HTTP API (server key).
  const endpoint = process.env.FCM_ENDPOINT ?? "https://fcm.googleapis.com/fcm/send";
  const payload = {
    registration_ids: options.tokens,
    notification: {
      title: options.title,
      body: options.body
    },
    data: {
      deepLinkUrl: options.deepLinkUrl ?? "/alerts",
      vaelType: "ALERT"
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${serverKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { ok: false, status: response.status, error: text };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return { ok: false, error };
  }
}

