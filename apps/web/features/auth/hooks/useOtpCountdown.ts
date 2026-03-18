import { useEffect, useState } from "react";

export function useOtpCountdown(initialSeconds = 30) {
  const [countdown, setCountdown] = useState(initialSeconds);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const resetCountdown = () => setCountdown(initialSeconds);

  return { countdown, resetCountdown };
}
