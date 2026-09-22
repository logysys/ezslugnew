import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface PrivacyPolicyContentProps {
  onClose?: () => void;
}

export default function PrivacyPolicyContent({ onClose }: PrivacyPolicyContentProps) {
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
          <h1 className="text-3xl font-bold text-yellow-400">EZ Wiki Privacy Policy</h1>
        </div>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">1. Introduction</h2>
            <p className="mb-4 text-gray-200">
              Welcome to EZ Wiki ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience while using our services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our wiki and knowledge management platform.
            </p>
            <p className="text-gray-200">
              By using EZ Wiki, you consent to the data practices described in this Privacy Policy. If you do not agree with the data practices described, you should not use our services.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-purple-300 mb-2">Personal Information</h3>
            <p className="mb-4 text-gray-200">
              When you register for an account or use our services, we may collect personal information that can identify you, such as:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-200">
              <li>Name and contact information (email address)</li>
              <li>Account credentials</li>
              <li>Payment information (processed by secure third-party processors)</li>
              <li>Profile information you choose to provide</li>
            </ul>
            
            <h3 className="text-xl font-medium text-purple-300 mb-2">Wiki and Content Data</h3>
            <p className="mb-4 text-gray-200">
              As part of our service, we collect and store information related to your wikis and content, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-200">
              <li>Wiki pages and their content</li>
              <li>Collaboration data and edit history</li>
              <li>User permissions and access controls</li>
              <li>Custom domains and settings</li>
              <li>Media files and attachments</li>
            </ul>
            
            <h3 className="text-xl font-medium text-purple-300 mb-2">Technical and Usage Data</h3>
            <p className="mb-4 text-gray-200">
              We automatically collect certain information when you visit our platform:
            </p>
            <ul className="list-disc pl-6 text-gray-200">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Usage patterns and interaction with our services</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">3. How We Use Your Information</h2>
            <p className="mb-4 text-gray-200">We use the information we collect for various purposes, including to:</p>
            <ul className="list-disc pl-6 text-gray-200">
              <li>Provide, maintain, and improve our wiki services</li>
              <li>Process transactions and send related information</li>
              <li>Enable collaboration and content sharing</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Send technical notices, updates, and security alerts</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Personalize and improve your experience</li>
              <li>Detect, investigate, and prevent fraudulent transactions</li>
              <li>Comply with legal obligations and protect our rights</li>
            </ul>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">4. Data Storage and Security</h2>
            <p className="mb-4 text-gray-200">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.
            </p>
            <p className="mb-4 text-gray-200">
              Your data is stored on secure servers, and we use encryption for sensitive information. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
            </p>
            <p className="text-gray-200">
              We retain your personal information only for as long as necessary to fulfill the purposes for which we collected it, including to satisfy any legal, accounting, or reporting requirements.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">5. Cookies and Tracking Technologies</h2>
            <p className="mb-4 text-gray-200">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
            </p>
            <p className="text-gray-200">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">6. Third-Party Services</h2>
            <p className="mb-4 text-gray-200">
              Our service may contain links to third-party websites and services that are not owned or controlled by EZ Wiki. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party services.
            </p>
            <p className="text-gray-200">
              We use third-party services for authentication, analytics, and payment processing. These third parties have access to your information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">7. Your Data Rights</h2>
            <p className="mb-4 text-gray-200">Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 text-gray-200">
              <li>The right to access and receive a copy of your personal information</li>
              <li>The right to rectify inaccurate or incomplete personal information</li>
              <li>The right to request erasure of your personal information</li>
              <li>The right to restrict or object to processing of your personal information</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent where we rely on consent to process your information</li>
            </ul>
            <p className="mt-4 text-gray-200">
              To exercise any of these rights, please contact us using the information provided in the "Contact Us" section.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">8. Children's Privacy</h2>
            <p className="text-gray-200">
              Our service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you become aware that a child has provided us with personal information, please contact us. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information from our servers.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">9. Changes to This Privacy Policy</h2>
            <p className="mb-4 text-gray-200">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            <p className="text-gray-200">
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">10. Contact Us</h2>
            <p className="mb-2 text-gray-200">If you have any questions about this Privacy Policy, please contact us:</p>
            <ul className="list-none pl-0 text-gray-200">
              <li className="mb-1">By email: support@ez.wiki</li>
              <li className="mb-1">Through our website: https://ez.wiki/contact</li>
              <li>By mail: EZ Wiki Privacy Office, 123 Tech Lane, San Francisco, CA 94103</li>
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