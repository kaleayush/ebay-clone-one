import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

const footerLinks = [
  {
    title: 'Buy',
    links: [
      { label: 'Browse Categories', to: '/listings' },
      { label: 'Daily Deals', to: '/listings?sort=deals' },
      { label: 'Track My Orders', to: '/orders' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Start Selling', to: '/listings/new' },
      { label: 'My Listings', to: '/profile/listings' },
      { label: 'Business Profile', to: '/profile/business' },
    ],
  },
  {
    title: 'Help & Contact',
    links: [
      { label: 'Help Centre', to: '/help' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Resolution Centre', to: '/resolution' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Use', to: '/terms' },
    ],
  },
]

const socials = [
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
]

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-0.5 select-none">
            <span className="text-ebay-blue  font-extrabold text-xl">e</span>
            <span className="text-ebay-red   font-extrabold text-xl">B</span>
            <span className="text-ebay-yellow font-extrabold text-xl">a</span>
            <span className="text-ebay-green  font-extrabold text-xl">y</span>
            <span className="text-gray-600 font-semibold ml-1">Clone</span>
          </Link>

          <p className="text-xs text-gray-400 order-last md:order-none">
            © {new Date().getFullYear()} eBay Clone. All rights reserved.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full transition-colors"
              >
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
