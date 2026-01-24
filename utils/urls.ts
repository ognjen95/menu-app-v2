import { Website } from "@/lib/types"

export const getWebsiteUrl = (website?: any) => {
  const isLocalDev = process.env.NODE_ENV === 'development'
  const isStaging = process.env.NODE_ENV === 'test'

  return website?.custom_domain
    ? `https://${website.custom_domain}`
    : website?.subdomain
      ? isLocalDev
        ? `http://localhost:3000/site/${website.subdomain}`
        : isStaging
          ? `${window.location.origin}/site/${website.subdomain}`
          : `https://${website.subdomain}.qrmenu.app`
      : null
}