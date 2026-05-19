import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export default function EbayLogo({ className = '', asLink = true, onClick }) {
  const content = (
    <span className={`inline-flex items-center select-none tracking-tight font-extrabold italic ${className}`}>
      <span className="text-ebay-red leading-none">e</span>
      <span className="text-ebay-blue leading-none">b</span>
      <span className="text-ebay-yellow leading-none">a</span>
      <span className="text-ebay-green leading-none">y</span>
    </span>
  )

  if (asLink) {
    return (
      <Link to={ROUTES.HOME} aria-label="Go to home page" onClick={onClick}>
        {content}
      </Link>
    )
  }

  return content
}
