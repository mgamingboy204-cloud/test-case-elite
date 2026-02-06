"use client";

import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import ThemeToggle from "../components/ThemeToggle";

export default function SettingsPage() {
  return (
    <RouteGuard requireActive>
      <AppShellLayout>
        <div className="settings-grid">
          <PageHeader title="Settings" subtitle="Manage your account preferences." />
          <Card>
            <h3>Appearance</h3>
            <p className="text-muted">Toggle between dark and light mode.</p>
            <ThemeToggle variant="switch" label="Toggle appearance" />
          </Card>
          <Card>
            <h3>Notifications</h3>
            <p className="text-muted">Stay in sync with matches and verification updates.</p>
            <div className="page-header__actions">
              <Button variant="secondary" type="button">
                Email updates
              </Button>
              <Button type="button">SMS updates</Button>
            </div>
          </Card>
          <Card>
            <h3>Account</h3>
            <p className="text-muted">Review your verification and billing status.</p>
            <div className="page-header__actions">
              <a className="text-button" href="/verification">
                Video verification
              </a>
              <a className="text-button" href="/payment">
                Payment status
              </a>
            </div>
          </Card>
        </div>
      </AppShellLayout>
    </RouteGuard>
  );
}
