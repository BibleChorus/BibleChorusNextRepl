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

export function TermsDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BibleChorus, you agree to be bound by these Terms of Service. BibleChorus is operated as a not-for-profit service dedicated to sharing scripture through music. If you do not agree to these terms, please do not use our services.
            </p>

            <h2 className="text-lg font-semibold">2. User-Generated Content</h2>
            <p>
              2.1. <strong>Content Ownership and Rights</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain ownership of any content you upload to BibleChorus.</li>
              <li>By uploading content, you grant BibleChorus a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your content across our platforms and promotional materials.</li>
              <li>You are solely responsible for ensuring you have all necessary rights, licenses, and permissions for any content you upload, including but not limited to songs, artwork, lyrics, and musical compositions.</li>
              <li>For AI-generated content, you must comply with the terms of service and usage rights of the AI platforms (such as Suno, Udio, or others) used to create the content.</li>
              <li>You must clearly indicate when content is AI-generated and specify which AI tools were used in its creation.</li>
            </ul>

            <p>
              2.2. <strong>AI-Generated Content Guidelines</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>When uploading AI-generated music, you must have the appropriate rights and licenses from the AI platform used to create the content.</li>
              <li>You must verify that your use of AI-generated content complies with the AI platform's terms of service and commercial use policies.</li>
              <li>BibleChorus reserves the right to remove any AI-generated content that violates the terms of service of the AI platforms used to create it.</li>
              <li>Users must maintain transparency about AI involvement in content creation, including which elements were AI-generated (music, lyrics, artwork, etc.).</li>
            </ul>

            <p>
              2.3. <strong>Prohibited Content</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Infringes on any copyright, trademark, or intellectual property rights</li>
              <li>Contains explicit, violent, discriminatory, or offensive material</li>
              <li>Promotes hate speech or harassment</li>
              <li>Violates any applicable laws or regulations</li>
              <li>Contains malware, viruses, or harmful code</li>
              <li>Impersonates others or provides false information</li>
              <li>Misrepresents the source or creation method of the content</li>
            </ul>

            <h2 className="text-lg font-semibold">3. Community Guidelines</h2>
            <p>When participating in our community forums and discussions, users must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Treat others with respect and courtesy</li>
              <li>Keep discussions relevant to biblical and musical topics</li>
              <li>Avoid spam, excessive self-promotion, or commercial solicitation</li>
              <li>Report inappropriate content or behavior</li>
              <li>Be transparent about AI usage in content creation</li>
            </ul>

            <h2 className="text-lg font-semibold">4. Content Moderation</h2>
            <p>
              BibleChorus reserves the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Review, edit, or remove any content that violates these terms</li>
              <li>Suspend or terminate accounts for violations</li>
              <li>Cooperate with law enforcement when required</li>
              <li>Verify AI-generated content compliance</li>
            </ul>

            <h2 className="text-lg font-semibold">5. Non-Profit Status and Usage</h2>
            <p>
              BibleChorus operates as a not-for-profit service with the intention of becoming a registered non-profit organization. Users acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The service is provided free of charge for the purpose of sharing scripture through music</li>
              <li>Any donations or contributions are used to maintain and improve the platform</li>
              <li>The platform may not be used for commercial purposes without explicit permission</li>
              <li>Content shared on the platform should align with our mission of sharing scripture through music</li>
            </ul>

            <h2 className="text-lg font-semibold">6. Copyright Claims</h2>
            <p>
              If you believe your copyright has been violated, please contact us with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A description of the copyrighted work</li>
              <li>The location of the infringing content on our site</li>
              <li>Your contact information</li>
              <li>A statement of good faith belief in the infringement</li>
              <li>A statement of accuracy under penalty of perjury</li>
            </ul>

            <h2 className="text-lg font-semibold">7. Limitation of Liability</h2>
            <p>
              BibleChorus is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of our services or user-generated content, including AI-generated content.
            </p>

            <h2 className="text-lg font-semibold">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of BibleChorus after changes constitutes acceptance of the modified terms.
            </p>

            <h2 className="text-lg font-semibold">9. Contact Information</h2>
            <p>
              For questions about these terms, please contact us at{" "}
              <Link href={"mailto:admin@biblechorus.com"} className="text-primary hover:underline">
                admin@biblechorus.com
              </Link>
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 