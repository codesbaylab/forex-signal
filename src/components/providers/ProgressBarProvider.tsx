'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.08 })

export default function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  // Stop bar when navigation completes (pathname changed)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      NProgress.done()
      prevPathname.current = pathname
    }
  }, [pathname])

  // Start bar on any internal link click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return
      // Skip external links, anchors, mailto, tel
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto') ||
        href.startsWith('tel') ||
        anchor.target === '_blank'
      ) return
      NProgress.start()
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <>
      <style>{`
        #nprogress .bar {
          background: #1a6b3c !important;
          height: 3px !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 9999 !important;
        }
        #nprogress .peg {
          box-shadow: 0 0 10px #1a6b3c, 0 0 5px #1a6b3c !important;
        }
        #nprogress .spinner { display: none !important; }
      `}</style>
      {children}
    </>
  )
}
