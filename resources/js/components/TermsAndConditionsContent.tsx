import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface TermsAndConditionsContentProps {
  onClose?: () => void;
}

export default function TermsAndConditionsContent({ onClose }: TermsAndConditionsContentProps) {
  return (
    <>
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center z-50 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close panel"
        >
          <FontAwesomeIcon 
            icon={faTimes} 
            className="text-white text-lg" 
            style={{ textShadow: '0.7px 0.7px 0 rgb(255,0,0), -0.7px -0.7px 0 rgb(0,255,255)' }}
          />
        </button>
      )}
      
      <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-4 text-white">
        <div className="flex items-center justify-center mb-6">
          <AppLogoIcon className="h-12 w-12 mr-3" />
          <h1 className="text-3xl font-bold text-yellow-400">EZ Wiki Terms and Conditions</h1>
        </div>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">1. Acceptance of Terms</h2>
            <p className="mb-4 text-gray-200">
              By accessing or using the EZ Wiki platform ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>
            <p className="text-gray-200">
              Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">2. Accounts</h2>
            <p className="mb-4 text-gray-200">
              When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p className="mb-4 text-gray-200">
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
            </p>
            <p className="text-gray-200">
              You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">3. Service Description</h2>
            <p className="mb-4 text-gray-200">
              EZ Wiki provides a platform for creating and managing collaborative wikis and knowledge bases, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-200">
              <li>Creating and editing wiki pages with rich content</li>
              <li>Organizing content with categories and tags</li>
              <li>Collaborating with team members in real-time</li>
              <li>Managing user permissions and access controls</li>
              <li>Customizing the appearance and structure of your wiki</li>
              <li>Integrating with third-party services and applications</li>
            </ul>
            <p className="text-gray-200">
              We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">4. Intellectual Property Rights</h2>
            <p className="mb-4 text-gray-200">
              The Service and its original content, features, and functionality are and will remain the exclusive property of EZ Wiki and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
            </p>
            <p className="text-gray-200">
              Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of EZ Wiki.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">5. User Content</h2>
            <p className="mb-4 text-gray-200">
              Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
            </p>
            <p className="mb-4 text-gray-200">
              By posting Content on or through the Service, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-200">
              <li>The Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms</li>
              <li>The posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person</li>
            </ul>
            <p className="text-gray-200">
              We reserve the right to terminate the account of anyone found to be infringing on a copyright or other intellectual property rights.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">6. Prohibited Uses</h2>
            <p className="mb-4 text-gray-200">You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-200">
              <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
              <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm the Company or users of the Service</li>
            </ul>
            <p className="text-gray-200">
              Additionally, you agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-200">
              <li>Use the Service in any manner that could disable, overburden, damage, or impair the site</li>
              <li>Use any robot, spider, or other automatic device, process, or means to access the Service for any purpose</li>
              <li>Introduce any viruses, Trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful</li>
              <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">7. Termination</h2>
            <p className="mb-4 text-gray-200">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="mb-4 text-gray-200">
              Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or delete your account through the account settings.
            </p>
            <p className="text-gray-200">
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">8. Limitation of Liability</h2>
            <p className="mb-4 text-gray-200">
              In no event shall EZ Wiki, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-200">
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
            <p className="text-gray-200">
              The limitations of liability set forth in this section shall apply whether the alleged liability is based on contract, tort, negligence, strict liability, or any other basis, even if we have been advised of the possibility of such damage.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">9. Disclaimer</h2>
            <p className="mb-4 text-gray-200">
              Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
            </p>
            <p className="text-gray-200">
              EZ Wiki, its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure, or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">10. Governing Law</h2>
            <p className="mb-4 text-gray-200">
              These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-200">
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">11. Changes to Terms</h2>
            <p className="mb-4 text-gray-200">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="text-gray-200">
              By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">12. Contact Us</h2>
            <p className="mb-2 text-gray-200">If you have any questions about these Terms, please contact us:</p>
            <ul className="list-none pl-0 text-gray-200">
              <li className="mb-1">By email: support@ez.wiki</li>
              <li className="mb-1">Through our website: https://ez.wiki/contact</li>
              <li>By mail: EZ Wiki Legal Department, 123 Tech Lane, San Francisco, CA 94103</li>
            </ul>
          </section>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-600 text-center">
          <Link 
            href="/"
            className="inline-flex items-center text-yellow-400 hover:text-yellow-300 font-medium"
          >
            ← Return to Home
          </Link>
        </div>
      </div>
    </>
  );
}