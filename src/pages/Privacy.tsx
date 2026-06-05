import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import skaapIcon from "@/assets/skaap-icon.png";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
    <div className="mt-2 text-sm leading-relaxed text-muted-foreground space-y-2">{children}</div>
  </section>
);

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
);

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft size={14} /> Home
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <img src={skaapIcon} alt="SKAAP" className="h-6 w-6 rounded-md" />
            <span className="text-sm font-bold tracking-tight">SKAAP</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-20 pt-8">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-xs text-muted-foreground">Last updated: June 5, 2026</p>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          SKAAP ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, and share information about you when you use our mobile
          application and website (collectively, the "Service").
        </p>

        <Section title="Information We Collect">
          <Bullets
            items={[
              "Account information: name, email address, and password when you create an account",
              "Profile information: dietary preferences, health goals, and food scanning history",
              "Usage data: how you interact with the app, features you use, and content you view",
              "Device information: device type, operating system, and unique device identifiers",
              "Location data: approximate location to find nearby stores (only when permitted)",
              "Payment information: subscription billing details processed securely through our payment provider",
            ]}
          />
        </Section>

        <Section title="How We Use Your Information">
          <Bullets
            items={[
              "To provide and improve our food intelligence and scan-and-go services",
              "To personalize your experience and recommendations",
              "To process payments and manage your subscription",
              "To send you updates, alerts, and promotional communications (you may opt out)",
              "To comply with legal obligations",
            ]}
          />
        </Section>

        <Section title="How We Share Your Information">
          <p>We do not sell your personal information. We may share information with:</p>
          <Bullets
            items={[
              "Service providers who help us operate the platform (payment processors, cloud hosting)",
              "Analytics partners to help us understand app usage",
              "Law enforcement when required by law",
            ]}
          />
        </Section>

        <Section title="Data Retention">
          <p>
            We retain your data for as long as your account is active or as needed to provide
            services. You may request deletion of your account and data at any time by contacting us.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>
            You have the right to access, correct, or delete your personal information. To exercise
            these rights, contact us at{" "}
            <a className="text-primary underline" href="mailto:privacy@useskaap.com">
              privacy@useskaap.com
            </a>
            .
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            SKAAP is not directed at children under 13. We do not knowingly collect personal
            information from children under 13.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes via email or in-app notification.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>If you have questions about this Privacy Policy, contact us at:</p>
          <ul className="space-y-1">
            <li>
              Email:{" "}
              <a className="text-primary underline" href="mailto:privacy@useskaap.com">
                privacy@useskaap.com
              </a>
            </li>
            <li>
              Website:{" "}
              <a className="text-primary underline" href="https://useskaap.com">
                https://useskaap.com
              </a>
            </li>
            <li>Address: Boston, Massachusetts, United States</li>
          </ul>
        </Section>

        <div className="mt-12 border-t border-border pt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={14} /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
