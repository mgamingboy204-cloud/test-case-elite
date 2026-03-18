import { useEffect, useState } from "react";
import { fetchOfflineMeetCase } from "@/lib/offlineMeet";
import { fetchOnlineMeetCase, type MeetPlatform } from "@/lib/onlineMeet";

export function useOfflineMeetOptions(matchId: string) {
  const [options, setOptions] = useState<{ cafes: Array<{ id: string; name: string; address: string }>; timeSlots: Array<{ id: string; label: string }> }>({
    cafes: [],
    timeSlots: []
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchOfflineMeetCase(matchId)
      .then((value) => {
        if (!active) return;
        setOptions({
          cafes: value.options.cafes,
          timeSlots: value.options.timeSlots.map((entry) => ({ id: entry.id, label: entry.label }))
        });
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load concierge options right now.");
      });

    return () => {
      active = false;
    };
  }, [matchId]);

  return { options, error };
}

export function useOnlineMeetOptions(matchId: string) {
  const [options, setOptions] = useState<{ platforms: MeetPlatform[]; timeSlots: Array<{ id: string; label: string }> }>({ platforms: [], timeSlots: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchOnlineMeetCase(matchId)
      .then((value) => {
        if (!active) return;
        setOptions({
          platforms: value.options.platforms,
          timeSlots: value.options.timeSlots.map((entry) => ({ id: entry.id, label: entry.label }))
        });
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load online meet options right now.");
      });

    return () => {
      active = false;
    };
  }, [matchId]);

  return { options, error };
}
