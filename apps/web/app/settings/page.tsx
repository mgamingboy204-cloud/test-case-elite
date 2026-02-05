"use client";

import RouteGuard from "../components/RouteGuard";
import AppShell from "../components/AppShell";

export default function SettingsPage() {
  return (
    <RouteGuard requireActive>
      <AppShell>
        <div className="stack-page">
          <div className="page-header">
            <div>
              <h2>Settings</h2>
              <p className="card-subtitle">Manage your account preferences.</p>
            </div>
          </div>
          <div className="simple-grid">
            <div className="simple-card">
              <h3>Notifications</h3>
              <p className="card-subtitle">Stay in sync with matches and verification updates.</p>
              <div className="inline-actions">
                <button className="secondary" type="button">
                  Email updates
                </button>
                <button type="button">SMS updates</button>
              </div>
            </div>
            <div className="simple-card">
              <h3>Account</h3>
              <p className="card-subtitle">Review your verification and billing status.</p>
              <div className="inline-actions">
                <a className="text-link" href="/verification">
                  Video verification
                </a>
                <a className="text-link" href="/payment">
                  Payment status
                </a>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </RouteGuard>
  );
}
