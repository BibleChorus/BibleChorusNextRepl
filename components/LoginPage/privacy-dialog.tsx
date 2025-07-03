import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

export function PrivacyDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated: <span suppressHydrationWarning>{new Date().toLocaleDateString()}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">1. Introduction</h2>
            <p>
              BibleChorus (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a not-for-profit service dedicated to sharing scripture through music. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>

            <h2 className="text-lg font-semibold">2. Information We Collect</h2>
            <p>
              2.1. <strong>Information You Provide</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (username, email, password)</li>
              <li>Profile information (name, profile picture, bio, website)</li>
              <li>User-generated content (songs, artwork, comments, forum posts)</li>
              <li>AI generation metadata (prompts, AI platform used, generation settings)</li>
              <li>Communications with us</li>
            </ul>

            <p>
              2.2. <strong>Automatically Collected Information</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device information (IP address, browser type, device type)</li>
              <li>Usage data (interactions, preferences, listening history)</li>
              <li>AI-related analytics (generation success rates, usage patterns)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Log data (access times, pages viewed, error logs)</li>
            </ul>

            <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your uploads and enable community features</li>
              <li>Track and analyze AI-generated content usage</li>
              <li>Ensure compliance with AI platform terms of service</li>
              <li>Personalize your experience and recommendations</li>
              <li>Communicate with you about updates and announcements</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
              <li>Research and analyze platform usage to improve our mission effectiveness</li>
            </ul>

            <h2 className="text-lg font-semibold">4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers (hosting, analytics, payment processing)</li>
              <li>AI platform providers (for content generation and verification)</li>
              <li>Other users (based on your privacy settings)</li>
              <li>Legal authorities when required by law</li>
              <li>Research partners (in anonymized form) for improving scripture-based music creation</li>
            </ul>

            <h2 className="text-lg font-semibold">5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of sensitive information</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Secure data storage and transmission</li>
              <li>AI platform integration security measures</li>
            </ul>

            <h2 className="text-lg font-semibold">6. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Export your data</li>
              <li>Control AI-generated content attribution</li>
              <li>Manage your content visibility settings</li>
              <li>Opt-out of analytics and tracking</li>
            </ul>

            <h2 className="text-lg font-semibold">7. Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>

            <h2 className="text-lg font-semibold">8. Non-Profit Data Usage</h2>
            <p>
              As a not-for-profit service, we commit to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using data solely for mission-aligned purposes</li>
              <li>Never selling personal information for commercial gain</li>
              <li>Maintaining transparency about data usage</li>
              <li>Protecting user privacy while furthering our mission</li>
              <li>Using data analytics to improve scripture-based music creation</li>
            </ul>

            <h2 className="text-lg font-semibold">9. AI Platform Integration</h2>
            <p>
              Regarding AI-generated content:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We collect metadata about AI generation processes</li>
              <li>We share necessary data with AI platforms (e.g., Suno, Udio) for content generation</li>
              <li>We track AI usage patterns to improve service quality</li>
              <li>We maintain records of AI platform compliance</li>
              <li>We protect AI-related intellectual property information</li>
            </ul>

            <h2 className="text-lg font-semibold">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h2 className="text-lg font-semibold">11. Cookies Policy</h2>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remember your preferences</li>
              <li>Understand how you use our service</li>
              <li>Track AI generation patterns</li>
              <li>Provide personalized content</li>
              <li>Improve our service</li>
            </ul>

            <h2 className="text-lg font-semibold">12. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of any material changes through our service or via email.
            </p>

            <h2 className="text-lg font-semibold">13. Contact Us</h2>
            <p>
              For privacy-related questions or concerns, contact us at{" "}
              <Link href={"mailto:privacy@biblechorus.com"} className="text-primary hover:underline">
                privacy@biblechorus.com
              </Link>
            </p>

            <h2 className="text-lg font-semibold">14. Data Protection Rights (GDPR)</h2>
            <p>
              For EU residents, you have additional rights under GDPR, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to be informed about AI data processing</li>
              <li>Right to data portability including AI metadata</li>
              <li>Right to restrict processing of AI-related data</li>
              <li>Right to object to automated decision-making</li>
              <li>Right to erasure of AI generation history</li>
            </ul>

            <h2 className="text-lg font-semibold">15. California Privacy Rights (CCPA)</h2>
            <p>
              California residents have additional rights under CCPA, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to know what AI-related personal information is collected</li>
              <li>Right to know whether personal information is shared with AI platforms</li>
              <li>Right to access AI generation history</li>
              <li>Right to delete AI-related personal information</li>
              <li>Right to equal service regardless of privacy choices</li>
            </ul>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 