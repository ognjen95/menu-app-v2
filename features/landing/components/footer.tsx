'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Footer() {
  const t = useTranslations('landing.footer')

  const links = {
    product: [
      { label: t('features'), href: '#features' },
      { label: t('pricing'), href: '#pricing' },
      { label: t('demo'), href: '#' },
    ],
    company: [
      { label: t('about'), href: '#' },
      { label: t('contact'), href: '#footer' },
      { label: t('blog'), href: '#' },
    ],
    legal: [
      { label: t('privacy'), href: '#' },
      { label: t('terms'), href: '#' },
    ],
  }

  return (
    <footer id="footer" className="bg-card border-t border-border px-5">
      <div className="w-full max-w-7xl mx-auto py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12"
        >
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">K</span>
              </div>
              <span className="font-bold text-xl text-foreground">
                Klopay<span className="text-primary">.app</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('tagline')}
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('product')}</h4>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('company')}</h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('legal')}</h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t('copyright')}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
