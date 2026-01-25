'use client'

import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DialogFooter } from '@/components/ui/dialog'
import { Loader2, Plus, X, Upload, UtensilsCrossed } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaXTwitter, FaTiktok, FaYoutube, FaLinkedinIn, FaYelp } from 'react-icons/fa6'
import { SiTripadvisor } from 'react-icons/si'

// Social media platforms config
const SOCIAL_PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: FaFacebookF, placeholder: 'https://facebook.com/yourpage' },
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, placeholder: 'https://instagram.com/yourhandle' },
  { id: 'twitter', label: 'X (Twitter)', icon: FaXTwitter, placeholder: 'https://x.com/yourhandle' },
  { id: 'tiktok', label: 'TikTok', icon: FaTiktok, placeholder: 'https://tiktok.com/@yourhandle' },
  { id: 'youtube', label: 'YouTube', icon: FaYoutube, placeholder: 'https://youtube.com/@yourchannel' },
  { id: 'linkedin', label: 'LinkedIn', icon: FaLinkedinIn, placeholder: 'https://linkedin.com/company/yourcompany' },
  { id: 'yelp', label: 'Yelp', icon: FaYelp, placeholder: 'https://yelp.com/biz/yourbusiness' },
  { id: 'tripadvisor', label: 'TripAdvisor', icon: SiTripadvisor, placeholder: 'https://tripadvisor.com/...' },
]
import { cn } from '@/lib/utils'

type MenuItem = {
  id: string
  name: string
  description: string | null
  base_price: number
  image_urls: string[] | null
  is_active: boolean
  is_featured: boolean
  category: { id: string; name: string } | null
}

type WebsiteBlock = {
  id: string
  page_id: string
  type: string
  content: Record<string, unknown>
  settings: { padding: string; background: string; alignment: string }
  is_visible: boolean
  sort_order: number
}

// Image Upload Component
export function ImageUpload({ 
  value, 
  onChange, 
  label = 'Image' 
}: { 
  value: string
  onChange: (url: string) => void
  label?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/website/upload', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Upload failed')
      const { url } = await response.json()
      onChange(url)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-zinc-300">{label}</Label>
      <div className="flex gap-2">
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="URL or upload" className="flex-1 bg-zinc-800 border-zinc-700 text-white" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-zinc-700 text-zinc-300">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>
      {value && (
        <div className="relative w-full h-32 mt-2 rounded-lg overflow-hidden bg-zinc-800">
          { /* eslint-disable-next-line @next/next/no-img-element */ }
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onChange('')}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Multi Image Upload
export function MultiImageUpload({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/website/upload', { method: 'POST', body: formData })
        if (!response.ok) throw new Error('Upload failed')
        return (await response.json()).url
      }))
      onChange([...images, ...urls])
    } catch { alert('Failed to upload') } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  return (
    <div className="space-y-2">
      <Label className="text-zinc-300">Gallery Images</Label>
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
            { /* eslint-disable-next-line @next/next/no-img-element */ }
            <img src={url} alt={`${idx + 1}`} className="w-full h-full object-cover" />
            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => onChange(images.filter((_, i) => i !== idx))}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-blue-500/50 flex flex-col items-center justify-center text-zinc-500 hover:text-blue-400">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Plus className="h-6 w-6" /><span className="text-xs">Add</span></>}
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
    </div>
  )
}

// Menu Items Selector
export function MenuItemsSelector({ selectedItems, onChange }: { selectedItems: string[]; onChange: (items: string[]) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['menu-items'], queryFn: () => apiGet<{ data: { items: MenuItem[] } }>('/menu/items') })
  const items = data?.data?.items || []

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
  if (!items.length) return <div className="text-center py-8 text-zinc-500"><UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No menu items</p></div>

  const grouped = items.reduce((acc, item) => { const cat = item.category?.name || 'Other'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc }, {} as Record<string, MenuItem[]>)
  const allIds = items.map(i => i.id)
  const allSelected = allIds.every(id => selectedItems.includes(id))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-zinc-300">Menu Items</Label>
        <Button variant="ghost" size="sm" onClick={() => onChange(allSelected ? [] : allIds)} className="text-zinc-400 hover:text-white">{allSelected ? 'Deselect All' : 'Select All'}</Button>
      </div>
      <ScrollArea className="h-[250px] rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="mb-4">
            <h4 className="text-xs text-zinc-500 mb-2">{cat}</h4>
            {catItems.map((item) => (
              <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/50 cursor-pointer">
                <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={() => onChange(selectedItems.includes(item.id) ? selectedItems.filter(id => id !== item.id) : [...selectedItems, item.id])} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.image_urls?.[0] && <img src={item.image_urls[0]} alt="" className="w-8 h-8 rounded object-cover" />}
                <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{item.name}</p><p className="text-xs text-zinc-500">${item.base_price.toFixed(2)}</p></div>
              </label>
            ))}
          </div>
        ))}
      </ScrollArea>
      <p className="text-xs text-zinc-500">{selectedItems.length} selected</p>
    </div>
  )
}

// Block Editor
export function BlockEditor({ block, onSave, isPending }: { block: WebsiteBlock; onSave: (content: Record<string, unknown>) => void; isPending: boolean }) {
  const [content, setContent] = useState(block.content)
  const inputClass = "bg-zinc-800 border-zinc-700 text-white"

  const renderFields = () => {
    switch (block.type) {
      case 'hero':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Headline</Label><Input value={(content.headline as string) || ''} onChange={(e) => setContent({ ...content, headline: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Subheadline</Label><Input value={(content.subheadline as string) || ''} onChange={(e) => setContent({ ...content, subheadline: e.target.value })} className={inputClass} /></div>
          <ImageUpload label="Background Image" value={(content.image_url as string) || ''} onChange={(url) => setContent({ ...content, image_url: url })} />
          <div className="space-y-2"><Label className="text-zinc-300">Button Text</Label><Input value={(content.button_text as string) || ''} onChange={(e) => setContent({ ...content, button_text: e.target.value })} className={inputClass} /></div>
        </div>)
      case 'about':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Content</Label><Textarea value={(content.text as string) || ''} onChange={(e) => setContent({ ...content, text: e.target.value })} rows={4} className={inputClass} /></div>
          <ImageUpload label="Image" value={(content.image_url as string) || ''} onChange={(url) => setContent({ ...content, image_url: url })} />
        </div>)
      case 'gallery':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <MultiImageUpload images={(content.images as string[]) || []} onChange={(images) => setContent({ ...content, images })} />
        </div>)
      case 'menu_preview':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <MenuItemsSelector selectedItems={(content.item_ids as string[]) || []} onChange={(ids) => setContent({ ...content, item_ids: ids })} />
        </div>)
      case 'contact':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Address</Label><Input value={(content.address as string) || ''} onChange={(e) => setContent({ ...content, address: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Phone</Label><Input value={(content.phone as string) || ''} onChange={(e) => setContent({ ...content, phone: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Email</Label><Input value={(content.email as string) || ''} onChange={(e) => setContent({ ...content, email: e.target.value })} className={inputClass} /></div>
        </div>)
      case 'hours':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Hours</Label><Textarea value={(content.hours_text as string) || ''} onChange={(e) => setContent({ ...content, hours_text: e.target.value })} rows={5} className={inputClass} /></div>
        </div>)
      case 'testimonials':
        const testimonials = (content.testimonials as { image?: string; name: string; text: string }[]) || []
        const updateTestimonial = (idx: number, field: string, value: string) => {
          const updated = [...testimonials]
          updated[idx] = { ...updated[idx], [field]: value }
          setContent({ ...content, testimonials: updated })
        }
        const addTestimonial = () => setContent({ ...content, testimonials: [...testimonials, { image: '', name: '', text: '' }] })
        const removeTestimonial = (idx: number) => setContent({ ...content, testimonials: testimonials.filter((_, i) => i !== idx) })
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="text-zinc-300">Testimonials</Label><Button type="button" variant="ghost" size="sm" onClick={addTestimonial} className="text-blue-400 hover:text-blue-300"><Plus className="h-4 w-4 mr-1" />Add</Button></div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3 pr-4">
                {testimonials.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {t.image ? (
                          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={t.image} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => updateTestimonial(idx, 'image', '')} className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center"><X className="h-4 w-4 text-white" /></button>
                          </div>
                        ) : (
                          <label className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center cursor-pointer hover:border-blue-500 bg-zinc-800">
                            <Plus className="h-4 w-4 text-zinc-500" />
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0]; if (!file) return
                              const formData = new FormData(); formData.append('file', file)
                              try { const res = await fetch('/api/website/upload', { method: 'POST', body: formData }); if (res.ok) { const { url } = await res.json(); updateTestimonial(idx, 'image', url) } } catch {}
                            }} />
                          </label>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input value={t.name || ''} onChange={(e) => updateTestimonial(idx, 'name', e.target.value)} placeholder="Name" className={cn(inputClass, "h-8 text-sm")} />
                        <Textarea value={t.text || ''} onChange={(e) => updateTestimonial(idx, 'text', e.target.value)} placeholder="Testimonial text..." rows={2} className={cn(inputClass, "text-sm resize-none")} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeTestimonial(idx)} className="h-8 w-8 text-zinc-500 hover:text-red-400"><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                {testimonials.length === 0 && <p className="text-center text-zinc-500 text-sm py-4">No testimonials yet. Click Add to create one.</p>}
              </div>
            </ScrollArea>
          </div>
        </div>)
      case 'social':
        const socialLinks = (content.links as Record<string, string>) || {}
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="Follow Us" /></div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Social Media Links</Label>
            <p className="text-xs text-zinc-500">Enter the full URL for each platform you want to display</p>
            <div className="space-y-2 mt-3">
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon
                return (
                  <div key={platform.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-zinc-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-zinc-400 mb-1">{platform.label}</p>
                      <Input 
                        value={socialLinks[platform.id] || ''} 
                        onChange={(e) => setContent({ ...content, links: { ...socialLinks, [platform.id]: e.target.value } })} 
                        placeholder={platform.placeholder}
                        className={cn(inputClass, "h-8 text-sm")} 
                      />
                    </div>
                    {socialLinks[platform.id] && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => { const updated = { ...socialLinks }; delete updated[platform.id]; setContent({ ...content, links: updated }) }} className="h-8 w-8 text-zinc-500 hover:text-red-400 flex-shrink-0"><X className="h-4 w-4" /></Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>)

      case 'specials':
        const specials = (content.items as { name: string; description?: string; price?: string; day?: string; image_url?: string }[]) || []
        const addSpecial = () => setContent({ ...content, items: [...specials, { name: '', description: '', price: '', day: '', image_url: '' }] })
        const updateSpecial = (idx: number, field: string, value: string) => { const updated = [...specials]; updated[idx] = { ...updated[idx], [field]: value }; setContent({ ...content, items: updated }) }
        const removeSpecial = (idx: number) => setContent({ ...content, items: specials.filter((_, i) => i !== idx) })
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="Today's Specials" /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Subtitle</Label><Input value={(content.subtitle as string) || ''} onChange={(e) => setContent({ ...content, subtitle: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="text-zinc-300">Specials</Label><Button type="button" variant="ghost" size="sm" onClick={addSpecial} className="text-blue-400"><Plus className="h-4 w-4 mr-1" />Add</Button></div>
            <ScrollArea className="h-[320px]"><div className="space-y-3 pr-4">
              {specials.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 space-y-2">
                  <div className="flex gap-2"><Input value={item.day || ''} onChange={(e) => updateSpecial(idx, 'day', e.target.value)} placeholder="Day (e.g., Monday)" className={cn(inputClass, "h-8 text-sm flex-1")} /><Button type="button" variant="ghost" size="icon" onClick={() => removeSpecial(idx)} className="h-8 w-8 text-zinc-500 hover:text-red-400"><X className="h-4 w-4" /></Button></div>
                  <Input value={item.name || ''} onChange={(e) => updateSpecial(idx, 'name', e.target.value)} placeholder="Dish name" className={cn(inputClass, "h-8 text-sm")} />
                  <div className="flex gap-2"><Input value={item.description || ''} onChange={(e) => updateSpecial(idx, 'description', e.target.value)} placeholder="Description" className={cn(inputClass, "h-8 text-sm flex-1")} /><Input value={item.price || ''} onChange={(e) => updateSpecial(idx, 'price', e.target.value)} placeholder="Price" className={cn(inputClass, "h-8 text-sm w-24")} /></div>
                  <ImageUpload label="Image" value={item.image_url || ''} onChange={(url) => updateSpecial(idx, 'image_url', url)} />
                </div>
              ))}
              {specials.length === 0 && <p className="text-center text-zinc-500 text-sm py-4">No specials. Click Add to create one.</p>}
            </div></ScrollArea>
          </div>
        </div>)

      case 'events':
        const events = (content.events as { title: string; date: string; time?: string; description?: string; image_url?: string }[]) || []
        const addEvent = () => setContent({ ...content, events: [...events, { title: '', date: '', time: '', description: '', image_url: '' }] })
        const updateEvent = (idx: number, field: string, value: string) => { const updated = [...events]; updated[idx] = { ...updated[idx], [field]: value }; setContent({ ...content, events: updated }) }
        const removeEvent = (idx: number) => setContent({ ...content, events: events.filter((_, i) => i !== idx) })
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="Upcoming Events" /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="text-zinc-300">Events</Label><Button type="button" variant="ghost" size="sm" onClick={addEvent} className="text-blue-400"><Plus className="h-4 w-4 mr-1" />Add</Button></div>
            <ScrollArea className="h-[320px]"><div className="space-y-3 pr-4">
              {events.map((event, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 space-y-2">
                  <div className="flex gap-2"><Input value={event.title || ''} onChange={(e) => updateEvent(idx, 'title', e.target.value)} placeholder="Event title" className={cn(inputClass, "h-8 text-sm flex-1")} /><Button type="button" variant="ghost" size="icon" onClick={() => removeEvent(idx)} className="h-8 w-8 text-zinc-500 hover:text-red-400"><X className="h-4 w-4" /></Button></div>
                  <div className="flex gap-2"><Input value={event.date || ''} onChange={(e) => updateEvent(idx, 'date', e.target.value)} placeholder="Date (e.g., Sat, Jan 25)" className={cn(inputClass, "h-8 text-sm flex-1")} /><Input value={event.time || ''} onChange={(e) => updateEvent(idx, 'time', e.target.value)} placeholder="Time" className={cn(inputClass, "h-8 text-sm w-28")} /></div>
                  <Textarea value={event.description || ''} onChange={(e) => updateEvent(idx, 'description', e.target.value)} placeholder="Description" rows={2} className={cn(inputClass, "text-sm resize-none")} />
                  <ImageUpload label="Event Image" value={event.image_url || ''} onChange={(url) => updateEvent(idx, 'image_url', url)} />
                </div>
              ))}
              {events.length === 0 && <p className="text-center text-zinc-500 text-sm py-4">No events. Click Add to create one.</p>}
            </div></ScrollArea>
          </div>
        </div>)

      case 'reservation':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="Make a Reservation" /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Subtitle</Label><Input value={(content.subtitle as string) || ''} onChange={(e) => setContent({ ...content, subtitle: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Phone Number</Label><Input value={(content.phone as string) || ''} onChange={(e) => setContent({ ...content, phone: e.target.value })} className={inputClass} placeholder="+1 234 567 8900" /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Online Booking URL</Label><Input value={(content.booking_url as string) || ''} onChange={(e) => setContent({ ...content, booking_url: e.target.value })} className={inputClass} placeholder="https://..." /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Button Text</Label><Input value={(content.button_text as string) || ''} onChange={(e) => setContent({ ...content, button_text: e.target.value })} className={inputClass} placeholder="Book Online" /></div>
          <ImageUpload label="Background Image" value={(content.background_image as string) || ''} onChange={(url) => setContent({ ...content, background_image: url })} />
        </div>)

      case 'features':
        const FEATURE_OPTIONS = [
          { id: 'wifi', label: 'Free WiFi' }, { id: 'parking', label: 'Parking' }, { id: 'music', label: 'Live Music' },
          { id: 'pets', label: 'Pet Friendly' }, { id: 'kids', label: 'Kid Friendly' }, { id: 'accessible', label: 'Wheelchair Accessible' },
          { id: 'cards', label: 'Cards Accepted' }, { id: 'outdoor', label: 'Outdoor Seating' }, { id: 'bar', label: 'Full Bar' },
          { id: 'coffee', label: 'Coffee' }, { id: 'vegan', label: 'Vegan Options' },
        ]
        const features = (content.features as { icon: string; title: string; description?: string }[]) || []
        const addFeature = () => setContent({ ...content, features: [...features, { icon: 'wifi', title: '', description: '' }] })
        const updateFeature = (idx: number, field: string, value: string) => { const updated = [...features]; updated[idx] = { ...updated[idx], [field]: value }; setContent({ ...content, features: updated }) }
        const removeFeature = (idx: number) => setContent({ ...content, features: features.filter((_, i) => i !== idx) })
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="What We Offer" /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="text-zinc-300">Features</Label><Button type="button" variant="ghost" size="sm" onClick={addFeature} className="text-blue-400"><Plus className="h-4 w-4 mr-1" />Add</Button></div>
            <ScrollArea className="h-[280px]"><div className="space-y-3 pr-4">
              {features.map((feature, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 space-y-2">
                  <div className="flex gap-2">
                    <select value={feature.icon || 'wifi'} onChange={(e) => updateFeature(idx, 'icon', e.target.value)} className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-sm">
                      {FEATURE_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                    <Input value={feature.title || ''} onChange={(e) => updateFeature(idx, 'title', e.target.value)} placeholder="Feature name" className={cn(inputClass, "h-8 text-sm flex-1")} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(idx)} className="h-8 w-8 text-zinc-500 hover:text-red-400"><X className="h-4 w-4" /></Button>
                  </div>
                  <Input value={feature.description || ''} onChange={(e) => updateFeature(idx, 'description', e.target.value)} placeholder="Description (optional)" className={cn(inputClass, "h-8 text-sm")} />
                </div>
              ))}
              {features.length === 0 && <p className="text-center text-zinc-500 text-sm py-4">No features. Click Add to create one.</p>}
            </div></ScrollArea>
          </div>
        </div>)

      case 'video':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title (optional)</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Video URL</Label><Input value={(content.video_url as string) || ''} onChange={(e) => setContent({ ...content, video_url: e.target.value })} className={inputClass} placeholder="YouTube or Vimeo URL" /><p className="text-xs text-zinc-500">Paste a YouTube or Vimeo video URL</p></div>
        </div>)

      case 'cta':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="Ready to Visit?" /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Subtitle</Label><Input value={(content.subtitle as string) || ''} onChange={(e) => setContent({ ...content, subtitle: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Button Text</Label><Input value={(content.button_text as string) || ''} onChange={(e) => setContent({ ...content, button_text: e.target.value })} className={inputClass} placeholder="View Menu" /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Button URL</Label><Input value={(content.button_url as string) || ''} onChange={(e) => setContent({ ...content, button_url: e.target.value })} className={inputClass} placeholder="Leave empty for menu link" /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Background Color</Label><Input type="color" value={(content.background_color as string) || '#3B82F6'} onChange={(e) => setContent({ ...content, background_color: e.target.value })} className="h-10 w-full" /></div>
        </div>)

      case 'team':
        const members = (content.members as { name: string; role: string; image_url?: string; bio?: string }[]) || []
        const addMember = () => setContent({ ...content, members: [...members, { name: '', role: '', image_url: '', bio: '' }] })
        const updateMember = (idx: number, field: string, value: string) => { const updated = [...members]; updated[idx] = { ...updated[idx], [field]: value }; setContent({ ...content, members: updated }) }
        const removeMember = (idx: number) => setContent({ ...content, members: members.filter((_, i) => i !== idx) })
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="Meet Our Team" /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="text-zinc-300">Team Members</Label><Button type="button" variant="ghost" size="sm" onClick={addMember} className="text-blue-400"><Plus className="h-4 w-4 mr-1" />Add</Button></div>
            <ScrollArea className="h-[340px]"><div className="space-y-3 pr-4">
              {members.map((member, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 space-y-2">
                  <div className="flex gap-2"><Input value={member.name || ''} onChange={(e) => updateMember(idx, 'name', e.target.value)} placeholder="Name" className={cn(inputClass, "h-8 text-sm flex-1")} /><Button type="button" variant="ghost" size="icon" onClick={() => removeMember(idx)} className="h-8 w-8 text-zinc-500 hover:text-red-400"><X className="h-4 w-4" /></Button></div>
                  <Input value={member.role || ''} onChange={(e) => updateMember(idx, 'role', e.target.value)} placeholder="Role (e.g., Head Chef)" className={cn(inputClass, "h-8 text-sm")} />
                  <ImageUpload label="Photo" value={member.image_url || ''} onChange={(url) => updateMember(idx, 'image_url', url)} />
                  <Textarea value={member.bio || ''} onChange={(e) => updateMember(idx, 'bio', e.target.value)} placeholder="Short bio" rows={2} className={cn(inputClass, "text-sm resize-none")} />
                </div>
              ))}
              {members.length === 0 && <p className="text-center text-zinc-500 text-sm py-4">No team members. Click Add to create one.</p>}
            </div></ScrollArea>
          </div>
        </div>)

      case 'text':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title (optional)</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Content</Label><Textarea value={(content.text as string) || ''} onChange={(e) => setContent({ ...content, text: e.target.value })} rows={6} className={inputClass} /></div>
          <ImageUpload label="Image (optional)" value={(content.image_url as string) || ''} onChange={(url) => setContent({ ...content, image_url: url })} />
          <div className="space-y-2"><Label className="text-zinc-300">Image Position</Label>
            <select value={(content.image_position as string) || 'top'} onChange={(e) => setContent({ ...content, image_position: e.target.value })} className="w-full h-10 px-3 rounded bg-zinc-800 border border-zinc-700 text-white">
              <option value="top">Above text</option><option value="left">Left of text</option><option value="right">Right of text</option>
            </select>
          </div>
          <div className="space-y-2"><Label className="text-zinc-300">Text Alignment</Label>
            <select value={(content.alignment as string) || 'left'} onChange={(e) => setContent({ ...content, alignment: e.target.value })} className="w-full h-10 px-3 rounded bg-zinc-800 border border-zinc-700 text-white">
              <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
            </select>
          </div>
          <div className="flex items-center gap-2"><Checkbox checked={content.use_secondary_bg === true} onCheckedChange={(checked) => setContent({ ...content, use_secondary_bg: checked })} /><Label className="text-zinc-300 text-sm">Use secondary background</Label></div>
        </div>)

      case 'location':
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="Find Us" /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Address</Label><Textarea value={(content.address as string) || ''} onChange={(e) => setContent({ ...content, address: e.target.value })} rows={2} className={inputClass} placeholder="123 Main St, City, State" /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Directions / Notes</Label><Input value={(content.directions as string) || ''} onChange={(e) => setContent({ ...content, directions: e.target.value })} className={inputClass} placeholder="e.g., Free parking behind building" /></div>
          <ImageUpload label="Location Photo (optional)" value={(content.image_url as string) || ''} onChange={(url) => setContent({ ...content, image_url: url })} />
          <div className="space-y-2"><Label className="text-zinc-300">Google Maps Embed URL</Label><Input value={(content.map_embed as string) || ''} onChange={(e) => setContent({ ...content, map_embed: e.target.value })} className={inputClass} placeholder="https://www.google.com/maps/embed?..." /><p className="text-xs text-zinc-500">Get embed URL from Google Maps → Share → Embed a map</p></div>
        </div>)

      case 'drinks':
        const drinksItems = (content.drinks as { name: string; description?: string; price: string; category?: string }[]) || []
        const addDrink = () => setContent({ ...content, drinks: [...drinksItems, { name: '', description: '', price: '', category: '' }] })
        const updateDrink = (idx: number, field: string, value: string) => { const updated = [...drinksItems]; updated[idx] = { ...updated[idx], [field]: value }; setContent({ ...content, drinks: updated }) }
        const removeDrink = (idx: number) => setContent({ ...content, drinks: drinksItems.filter((_, i) => i !== idx) })
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} placeholder="Drinks Menu" /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="text-zinc-300">Drinks</Label><Button type="button" variant="ghost" size="sm" onClick={addDrink} className="text-blue-400"><Plus className="h-4 w-4 mr-1" />Add</Button></div>
            <ScrollArea className="h-[300px]"><div className="space-y-3 pr-4">
              {drinksItems.map((drink, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 space-y-2">
                  <div className="flex gap-2"><Input value={drink.category || ''} onChange={(e) => updateDrink(idx, 'category', e.target.value)} placeholder="Category (e.g., Cocktails)" className={cn(inputClass, "h-8 text-sm w-36")} /><Input value={drink.name || ''} onChange={(e) => updateDrink(idx, 'name', e.target.value)} placeholder="Drink name" className={cn(inputClass, "h-8 text-sm flex-1")} /><Button type="button" variant="ghost" size="icon" onClick={() => removeDrink(idx)} className="h-8 w-8 text-zinc-500 hover:text-red-400"><X className="h-4 w-4" /></Button></div>
                  <div className="flex gap-2"><Input value={drink.description || ''} onChange={(e) => updateDrink(idx, 'description', e.target.value)} placeholder="Description" className={cn(inputClass, "h-8 text-sm flex-1")} /><Input value={drink.price || ''} onChange={(e) => updateDrink(idx, 'price', e.target.value)} placeholder="Price" className={cn(inputClass, "h-8 text-sm w-24")} /></div>
                </div>
              ))}
              {drinksItems.length === 0 && <p className="text-center text-zinc-500 text-sm py-4">No drinks. Click Add to create one.</p>}
            </div></ScrollArea>
          </div>
        </div>)

      default:
        return (<div className="space-y-4">
          <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={(content.title as string) || ''} onChange={(e) => setContent({ ...content, title: e.target.value })} className={inputClass} /></div>
          <div className="space-y-2"><Label className="text-zinc-300">Content</Label><Textarea value={(content.text as string) || ''} onChange={(e) => setContent({ ...content, text: e.target.value })} rows={4} className={inputClass} /></div>
        </div>)
    }
  }

  return (<ScrollArea className="space-y-4">{renderFields()}<DialogFooter><Button onClick={() => onSave(content)} disabled={isPending}>{isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button></DialogFooter></ScrollArea>)
}
