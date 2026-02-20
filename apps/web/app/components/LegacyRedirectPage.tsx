"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";

interface LegacyRedirectPageProps {
  to: string;
  title: string;
  description: string;
}

export function LegacyRedirectPage({ to, title, description }: LegacyRedirectPageProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="max-w-xl p-8 text-center md:p-10">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <p className="mt-6 text-xs text-muted-foreground">
          If you are not redirected automatically, continue to{" "}
          <Link href={to} className="font-semibold text-primary underline underline-offset-2">
            {to}
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
