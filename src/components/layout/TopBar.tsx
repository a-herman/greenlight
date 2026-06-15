'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Dashboard', href: '/' },
  { label: 'Policies',  href: '/admin/policies' },
  { label: 'Features',  href: '/admin/features' },
  { label: 'Sources',   href: '/admin/sources' },
  { label: 'Audit log', href: null },
  { label: 'Settings',  href: null },
]

function GeometricMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect width="22" height="22" rx="5" fill="#F5EDFF" />
      <path d="M8 7.5L13 11L8 14.5" stroke="#A100FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function TopBar() {
  const pathname = usePathname()
  const isActive = (href: string | null) =>
    href !== null && (href === '/' ? pathname === '/' || pathname.startsWith('/features/') : pathname.startsWith(href))

  return (
    <header className="bg-white border-b border-[#EEEEEE] h-14 flex items-center px-10 flex-shrink-0 gap-8">
      {/* Wordmark */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <GeometricMark />
        <span className="text-[16px] font-semibold text-ink tracking-[-0.02em]">Greenlight</span>
      </Link>

      {/* Nav */}
      <nav className="flex gap-7">
        {NAV.map(item => {
          const active = isActive(item.href)
          return (
            <div key={item.label} className="relative h-14 flex items-center">
              {item.href ? (
                <Link
                  href={item.href}
                  className={`text-[14px] font-medium transition-colors ${
                    active ? 'text-accent' : 'text-secondary hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[14px] font-medium text-tertiary cursor-default">{item.label}</span>
              )}
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-accent" />
              )}
            </div>
          )
        })}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent-soft text-accent-dark">
          AccentureTEST
        </span>
        <span className="w-8 h-8 rounded-full bg-white border-2 border-accent text-accent flex items-center justify-center text-[11px] font-semibold">
          AH
        </span>
      </div>
    </header>
  )
}
