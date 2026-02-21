"use client";

import { useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select } from "@/app/components/ui/Select";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { MarketingContentPage } from "@/app/components/MarketingContentPage";

export default function ContactPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    addToast("Message sent! We'll get back to you soon.", "success");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <MarketingContentPage title="Contact Us" subtitle="Have a question or concern? We're here to help.">
      <Card className="marketing-panel" style={{ padding: 30 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Name" placeholder="Your name" required />
          <Input label="Email" type="email" placeholder="you@example.com" required />
          <Select
            label="Topic"
            placeholder="Select a topic"
            options={[
              { value: "account", label: "Account Issue" },
              { value: "billing", label: "Billing" },
              { value: "safety", label: "Safety Concern" },
              { value: "bug", label: "Bug Report" },
              { value: "other", label: "Other" }
            ]}
            required
          />
          <Textarea label="Message" placeholder="Tell us how we can help..." rows={5} required />
          <Button fullWidth loading={loading} type="submit" style={{ marginTop: 8, minHeight: 44 }}>
            Send Message
          </Button>
        </form>
      </Card>
    </MarketingContentPage>
  );
}
