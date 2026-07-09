export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-bento-text">
      <h1 className="text-4xl font-bold mb-8">
        Privacy Policy
      </h1>

      <div className="space-y-6 text-bento-muted leading-8">
        <p>
          Stryde respects your privacy. We only collect the information
          necessary to create your account and provide habit tracking,
          goal management, analytics, and streak features.
        </p>

        <p>
          When you sign in using Google, we receive basic profile
          information such as your name, email address, and profile
          picture through Google&apos;s OAuth service.
        </p>

        <p>
          Your data is securely stored using Supabase and is never sold
          to third parties.
        </p>

        <p>
          We use your information solely to personalize your experience
          and improve the Stryde platform.
        </p>

        <p>
          If you have any questions regarding this Privacy Policy,
          contact us at:
        </p>

        <p className="font-semibold text-stryde-primary">
          peterfamuyiwa70@gmail.com
        </p>

        <p className="text-sm">
          Last updated: July 2026
        </p>
      </div>
    </main>
  );
}