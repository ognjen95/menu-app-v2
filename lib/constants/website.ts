import { Layout, FileText, Image as ImageIcon, Star, Phone, Clock, Instagram, Sparkles, Calendar, BookOpen, Video, MousePointer, Users, MapPin, Type, Gift, Wine } from 'lucide-react'
import { UtensilsCrossed } from 'lucide-react'

export const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Banner', icon: Layout, description: 'Large banner with image and text' },
  { type: 'about', label: 'About Section', icon: FileText, description: 'Tell your story' },
  { type: 'gallery', label: 'Image Gallery', icon: ImageIcon, description: 'Showcase photos' },
  { type: 'menu_preview', label: 'Menu Preview', icon: UtensilsCrossed, description: 'Featured menu items' },
  { type: 'testimonials', label: 'Testimonials', icon: Star, description: 'Customer reviews' },
  { type: 'contact', label: 'Contact Info', icon: Phone, description: 'Address and contact details' },
  { type: 'hours', label: 'Opening Hours', icon: Clock, description: 'Business hours' },
  { type: 'social', label: 'Social Links', icon: Instagram, description: 'Social media links' },
  { type: 'events', label: 'Events', icon: Calendar, description: 'Upcoming events & happenings' },
  { type: 'reservation', label: 'Reservations', icon: BookOpen, description: 'Table booking call-to-action' },
  { type: 'features', label: 'Features', icon: Gift, description: 'Amenities & services grid' },
  { type: 'video', label: 'Video', icon: Video, description: 'Embed YouTube or Vimeo' },
  { type: 'cta', label: 'Call to Action', icon: MousePointer, description: 'Promotional banner' },
  { type: 'team', label: 'Team', icon: Users, description: 'Meet the staff/chef' },
  { type: 'text', label: 'Text Block', icon: Type, description: 'Simple text section' },
  { type: 'location', label: 'Location Map', icon: MapPin, description: 'Embedded map' },
  // { type: 'specials', label: 'Daily Specials', icon: Sparkles, description: 'Featured dishes & offers' },
  // { type: 'drinks', label: 'Drinks Menu', icon: Wine, description: 'Cocktails & beverages' },
]

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
  { value: 'Poppins', label: 'Poppins (Clean)' },
  { value: 'Roboto', label: 'Roboto (Classic)' },
  { value: 'Lora', label: 'Lora (Serif)' },
  { value: 'Montserrat', label: 'Montserrat (Bold)' },
]

export const THEME_PRESETS = [
  // Dark Themes
  { 
    name: 'Midnight Blue', 
    primary: '#3B82F6', 
    secondary: '#1E293B', 
    background: '#0F172A', 
    foreground: '#F8FAFC',
    accent: '#22D3EE',
    isDark: true,
  },
  { 
    name: 'Obsidian', 
    primary: '#A855F7', 
    secondary: '#1C1917', 
    background: '#0C0A09', 
    foreground: '#FAFAF9',
    accent: '#F472B6',
    isDark: true,
  },
  { 
    name: 'Cyber Noir', 
    primary: '#10B981', 
    secondary: '#18181B', 
    background: '#09090B', 
    foreground: '#FAFAFA',
    accent: '#14B8A6',
    isDark: true,
  },
  { 
    name: 'Deep Ocean', 
    primary: '#06B6D4', 
    secondary: '#164E63', 
    background: '#0E1726', 
    foreground: '#E0F2FE',
    accent: '#38BDF8',
    isDark: true,
  },
  { 
    name: 'Crimson Night', 
    primary: '#EF4444', 
    secondary: '#1F1315', 
    background: '#0D0809', 
    foreground: '#FEF2F2',
    accent: '#FB923C',
    isDark: true,
  },
  { 
    name: 'Forest Dark', 
    primary: '#22C55E', 
    secondary: '#14241A', 
    background: '#0A120E', 
    foreground: '#F0FDF4',
    accent: '#86EFAC',
    isDark: true,
  },
  // Light Themes
  { 
    name: 'Clean White', 
    primary: '#18181B', 
    secondary: '#F4F4F5', 
    background: '#FFFFFF', 
    foreground: '#18181B',
    accent: '#F97316',
    isDark: false,
  },
  { 
    name: 'Soft Cream', 
    primary: '#B45309', 
    secondary: '#FEF3C7', 
    background: '#FFFBEB', 
    foreground: '#78350F',
    accent: '#F59E0B',
    isDark: false,
  },
  { 
    name: 'Fresh Mint', 
    primary: '#16A34A', 
    secondary: '#DCFCE7', 
    background: '#F0FDF4', 
    foreground: '#14532D',
    accent: '#84CC16',
    isDark: false,
  },
  { 
    name: 'Sky Blue', 
    primary: '#0EA5E9', 
    secondary: '#E0F2FE', 
    background: '#F0F9FF', 
    foreground: '#0C4A6E',
    accent: '#06B6D4',
    isDark: false,
  },
  { 
    name: 'Rose Garden', 
    primary: '#E11D48', 
    secondary: '#FFE4E6', 
    background: '#FFF1F2', 
    foreground: '#881337',
    accent: '#F472B6',
    isDark: false,
  },
  { 
    name: 'Lavender Dreams', 
    primary: '#7C3AED', 
    secondary: '#EDE9FE', 
    background: '#FAF5FF', 
    foreground: '#4C1D95',
    accent: '#A78BFA',
    isDark: false,
  },
  { 
    name: 'Warm Sand', 
    primary: '#92400E', 
    secondary: '#FDE68A', 
    background: '#FFFBEB', 
    foreground: '#451A03',
    accent: '#D97706',
    isDark: false,
  },
  { 
    name: 'Nordic Gray', 
    primary: '#6366F1', 
    secondary: '#E5E7EB', 
    background: '#F9FAFB', 
    foreground: '#1F2937',
    accent: '#8B5CF6',
    isDark: false,
  },
]

// Full website templates with theme + preset blocks
export type WebsiteTemplate = {
  id: string
  name: string
  description: string
  previewImage?: string
  theme: {
    primary_color: string
    secondary_color: string
    background_color: string
    foreground_color: string
    accent_color: string
    font_heading: string
    font_body: string
  }
  blocks: Array<{
    type: string
    content: Record<string, unknown>
    settings: { padding: string; background: string; alignment: string }
  }>
}

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: 'elegant-bistro',
    name: 'Elegant Bistro',
    description: 'Sophisticated dark theme perfect for upscale restaurants and fine dining',
    theme: {
      primary_color: '#D4AF37',
      secondary_color: '#1C1917',
      background_color: '#0C0A09',
      foreground_color: '#FAFAF9',
      accent_color: '#F5E6C8',
      font_heading: 'Playfair Display',
      font_body: 'Lora',
    },
    blocks: [
      {
        type: 'hero',
        content: {
          headline: 'Experience Culinary Excellence',
          subheadline: 'Where tradition meets innovation in every dish',
          button_text: 'View Our Menu',
          image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
        },
        settings: { padding: 'large', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'about',
        content: {
          title: 'Our Story',
          text: 'Welcome to our restaurant, where every dish tells a story. Our passionate chefs combine the finest ingredients with time-honored techniques to create unforgettable dining experiences. From farm to table, we are committed to excellence in every bite.',
          image_url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80',
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'left' },
      },
      {
        type: 'features',
        content: {
          title: 'What We Offer',
          features: [
            { icon: 'wifi', title: 'Free WiFi', description: 'Stay connected' },
            { icon: 'parking', title: 'Valet Parking', description: 'Convenient parking' },
            { icon: 'bar', title: 'Craft Cocktails', description: 'Expert mixology' },
            { icon: 'accessible', title: 'Accessible', description: 'Wheelchair friendly' },
          ],
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'reservation',
        content: {
          title: 'Reserve Your Table',
          subtitle: 'Join us for an unforgettable dining experience',
          phone: '+1 (555) 123-4567',
          button_text: 'Book Online',
        },
        settings: { padding: 'large', background: 'primary', alignment: 'center' },
      },
      {
        type: 'contact',
        content: {
          title: 'Visit Us',
          address: '123 Gourmet Street, Culinary District',
          phone: '+1 (555) 123-4567',
          email: 'reservations@restaurant.com',
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'hours',
        content: {
          title: 'Opening Hours',
          hours_text: 'Monday - Thursday: 5:00 PM - 10:00 PM\nFriday - Saturday: 5:00 PM - 11:00 PM\nSunday: 4:00 PM - 9:00 PM',
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'location',
        content: {
          title: 'Find Us',
          use_locations: false,
          show_address: true,
          address: '123 Gourmet Street, Culinary District',
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
    ],
  },
  {
    id: 'modern-cafe',
    name: 'Modern Café',
    description: 'Clean, minimal light theme ideal for cafes and casual eateries',
    theme: {
      primary_color: '#16A34A',
      secondary_color: '#F0FDF4',
      background_color: '#FFFFFF',
      foreground_color: '#14532D',
      accent_color: '#84CC16',
      font_heading: 'Poppins',
      font_body: 'Inter',
    },
    blocks: [
      {
        type: 'hero',
        content: {
          headline: 'Fresh. Local. Delicious.',
          subheadline: 'Your neighborhood café serving up smiles since 2015',
          button_text: 'See Our Menu',
          image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80',
        },
        settings: { padding: 'large', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'menu_preview',
        content: {
          title: 'Customer Favorites',
          item_ids: [],
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'about',
        content: {
          title: 'Welcome to Our Café',
          text: 'We believe that great food starts with great ingredients. Every morning, our team handpicks the freshest produce from local farmers. Whether you\'re stopping by for your morning coffee or a leisurely lunch, we\'re here to brighten your day.',
          image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'left' },
      },
      {
        type: 'testimonials',
        content: {
          title: 'What Our Guests Say',
          testimonials: [
            { name: 'Sarah M.', text: 'The best coffee in town! The staff is always so friendly and welcoming.' },
            { name: 'James K.', text: 'Their avocado toast is legendary. I come here every weekend!' },
            { name: 'Emily R.', text: 'Such a cozy atmosphere. Perfect for working or catching up with friends.' },
          ],
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'social',
        content: {
          title: 'Follow Our Journey',
          links: {
            instagram: 'https://instagram.com',
            facebook: 'https://facebook.com',
          },
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'contact',
        content: {
          title: 'Find Us',
          address: '456 Coffee Lane, Downtown',
          phone: '+1 (555) 987-6543',
          email: 'hello@cafe.com',
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'location',
        content: {
          title: 'Our Location',
          use_locations: false,
          show_address: true,
          address: '456 Coffee Lane, Downtown',
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
      },
    ],
  },
  {
    id: 'urban-eatery',
    name: 'Urban Eatery',
    description: 'Bold, contemporary dark theme for trendy restaurants and bars',
    theme: {
      primary_color: '#EF4444',
      secondary_color: '#18181B',
      background_color: '#09090B',
      foreground_color: '#FAFAFA',
      accent_color: '#FB923C',
      font_heading: 'Montserrat',
      font_body: 'Roboto',
    },
    blocks: [
      {
        type: 'hero',
        content: {
          headline: 'Bold Flavors. Good Vibes.',
          subheadline: 'Where great food meets unforgettable nights',
          button_text: 'Explore Menu',
          image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&q=80',
        },
        settings: { padding: 'large', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'menu_preview',
        content: {
          title: 'Our Favorites',
          item_ids: [],
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'gallery',
        content: {
          title: 'The Vibe',
          images: [
            'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
            'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&q=80',
            'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80',
          ],
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'events',
        content: {
          title: 'What\'s Happening',
          events: [
            { title: 'Live DJ Night', date: 'Every Friday', time: '9 PM', description: 'Dance the night away with our resident DJ' },
            { title: 'Wine Wednesday', date: 'Every Wednesday', time: '6 PM', description: 'Half-price bottles from our curated selection' },
          ],
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'reservation',
        content: {
          title: 'Book Your Experience',
          subtitle: 'Reserve now and get ready for a night to remember',
          phone: '+1 (555) 456-7890',
          button_text: 'Reserve a Table',
        },
        settings: { padding: 'large', background: 'primary', alignment: 'center' },
      },
      {
        type: 'hours',
        content: {
          title: 'Hours',
          hours_text: 'Tuesday - Thursday: 5:00 PM - 12:00 AM\nFriday - Saturday: 5:00 PM - 2:00 AM\nSunday: 4:00 PM - 10:00 PM\nMonday: Closed',
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'contact',
        content: {
          title: 'Get In Touch',
          address: '321 Urban Street, City Center',
          phone: '+1 (555) 456-7890',
          email: 'info@urbaneatery.com',
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'location',
        content: {
          title: 'Find Us',
          use_locations: false,
          show_address: true,
          address: '321 Urban Street, City Center',
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
      },
    ],
  },
  {
    id: 'coastal-seafood',
    name: 'Coastal Seafood',
    description: 'Fresh, ocean-inspired theme for seafood restaurants',
    theme: {
      primary_color: '#0EA5E9',
      secondary_color: '#E0F2FE',
      background_color: '#F0F9FF',
      foreground_color: '#0C4A6E',
      accent_color: '#06B6D4',
      font_heading: 'Playfair Display',
      font_body: 'Poppins',
    },
    blocks: [
      {
        type: 'hero',
        content: {
          headline: 'Ocean to Table',
          subheadline: 'The freshest catch, prepared with passion',
          button_text: 'View Menu',
          image_url: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=1920&q=80',
        },
        settings: { padding: 'large', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'about',
        content: {
          title: 'Our Commitment to Freshness',
          text: 'Every day, we source our seafood directly from local fishermen who share our commitment to sustainability. From the dock to your plate, we ensure every dish celebrates the ocean\'s finest offerings.',
          image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'left' },
      },
      {
        type: 'menu_preview',
        content: {
          title: 'Fresh From The Sea',
          item_ids: [],
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'features',
        content: {
          title: 'The Experience',
          features: [
            { icon: 'outdoor', title: 'Waterfront Dining', description: 'Stunning views' },
            { icon: 'bar', title: 'Raw Bar', description: 'Fresh daily' },
            { icon: 'vegan', title: 'Sustainable', description: 'Ocean-friendly' },
            { icon: 'parking', title: 'Free Parking', description: 'Convenient access' },
          ],
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
      },
      {
        type: 'reservation',
        content: {
          title: 'Reserve Your Waterfront Table',
          subtitle: 'Limited seating with ocean views',
          phone: '+1 (555) SEA-FOOD',
          button_text: 'Book Now',
        },
        settings: { padding: 'large', background: 'primary', alignment: 'center' },
      },
      {
        type: 'contact',
        content: {
          title: 'Visit Us',
          address: '789 Harbor Drive, Oceanfront',
          phone: '+1 (555) 732-3663',
          email: 'info@coastalseafood.com',
        },
        settings: { padding: 'medium', background: 'secondary', alignment: 'center' },
      },
      {
        type: 'location',
        content: {
          title: 'Our Location',
          use_locations: false,
          show_address: true,
          address: '789 Harbor Drive, Oceanfront',
        },
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
      },
    ],
  },
]
