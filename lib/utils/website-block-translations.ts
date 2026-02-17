import type { TranslationField } from '@/features/translations/translation-editor'

/**
 * Defines which fields are translatable for each website block type.
 * These fields will be available in the translation editor.
 */

export type BlockType = 
  | 'hero' 
  | 'about' 
  | 'gallery' 
  | 'menu_preview' 
  | 'contact' 
  | 'hours' 
  | 'testimonials' 
  | 'social' 
  | 'specials' 
  | 'events' 
  | 'reservation' 
  | 'features' 
  | 'video' 
  | 'cta' 
  | 'team' 
  | 'text' 
  | 'location' 
  | 'drinks'

/**
 * Get translatable fields for a specific block type.
 * Returns array of field definitions for the translation editor.
 */
export function getTranslatableFields(blockType: string, content: Record<string, unknown>): TranslationField[] {
  switch (blockType) {
    case 'hero':
      return [
        { key: 'headline', label: 'Headline', type: 'input', placeholder: 'Welcome to our restaurant' },
        { key: 'subheadline', label: 'Subheadline', type: 'textarea', placeholder: 'Experience the finest dining', rows: 2 },
        { key: 'button_text', label: 'Button Text', type: 'input', placeholder: 'View Menu' },
      ]

    case 'about':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'About Us' },
        { key: 'text', label: 'Content', type: 'textarea', placeholder: 'Tell your story...', rows: 4 },
      ]

    case 'gallery':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Gallery' },
      ]

    case 'menu_preview':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Featured Menu Items' },
      ]

    case 'contact':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Contact Us' },
        // Manual contact info fields (when not using locations)
        ...(!content.use_locations ? [
          { key: 'address', label: 'Address', type: 'input' as const, placeholder: '123 Main St' },
        ] : []),
      ]

    case 'hours':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Opening Hours' },
        // Manual hours text (when not using locations)
        ...(!content.use_locations ? [
          { key: 'hours_text', label: 'Hours Text', type: 'textarea' as const, placeholder: 'Mon-Fri: 9am-10pm', rows: 4 },
        ] : []),
      ]

    case 'testimonials': {
      const testimonials = (content.testimonials as { name: string; text: string }[]) || []
      const fields: TranslationField[] = [
        { key: 'title', label: 'Section Title', type: 'input', placeholder: 'What Our Guests Say' },
      ]
      // Add fields for each testimonial
      testimonials.forEach((_, idx) => {
        fields.push(
          { key: `testimonial_${idx}_name`, label: `Testimonial ${idx + 1} - Name`, type: 'input', placeholder: 'Guest name' },
          { key: `testimonial_${idx}_text`, label: `Testimonial ${idx + 1} - Text`, type: 'textarea', placeholder: 'Testimonial text...', rows: 2 },
        )
      })
      return fields
    }

    case 'social':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Follow Us' },
      ]

    case 'specials': {
      const specials = (content.items as { name: string; description?: string; day?: string }[]) || []
      const fields: TranslationField[] = [
        { key: 'title', label: 'Section Title', type: 'input', placeholder: "Today's Specials" },
        { key: 'subtitle', label: 'Subtitle', type: 'input', placeholder: 'Chef recommendations' },
      ]
      // Add fields for each special item
      specials.forEach((_, idx) => {
        fields.push(
          { key: `special_${idx}_name`, label: `Special ${idx + 1} - Name`, type: 'input', placeholder: 'Dish name' },
          { key: `special_${idx}_description`, label: `Special ${idx + 1} - Description`, type: 'textarea', placeholder: 'Description', rows: 2 },
          { key: `special_${idx}_day`, label: `Special ${idx + 1} - Day`, type: 'input', placeholder: 'Monday' },
        )
      })
      return fields
    }

    case 'events': {
      const events = (content.events as { title: string; description?: string; date: string; time?: string }[]) || []
      const fields: TranslationField[] = [
        { key: 'title', label: 'Section Title', type: 'input', placeholder: 'Upcoming Events' },
      ]
      // Add fields for each event
      events.forEach((_, idx) => {
        fields.push(
          { key: `event_${idx}_title`, label: `Event ${idx + 1} - Title`, type: 'input', placeholder: 'Event name' },
          { key: `event_${idx}_description`, label: `Event ${idx + 1} - Description`, type: 'textarea', placeholder: 'Description', rows: 2 },
          { key: `event_${idx}_date`, label: `Event ${idx + 1} - Date`, type: 'input', placeholder: 'Saturday, Jan 25' },
          { key: `event_${idx}_time`, label: `Event ${idx + 1} - Time`, type: 'input', placeholder: '7:00 PM' },
        )
      })
      return fields
    }

    case 'reservation':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Make a Reservation' },
        { key: 'subtitle', label: 'Subtitle', type: 'input', placeholder: 'Book your table today' },
        { key: 'button_text', label: 'Button Text', type: 'input', placeholder: 'Book Online' },
      ]

    case 'features': {
      const features = (content.features as { title: string; description?: string }[]) || []
      const fields: TranslationField[] = [
        { key: 'title', label: 'Section Title', type: 'input', placeholder: 'What We Offer' },
      ]
      // Add fields for each feature
      features.forEach((_, idx) => {
        fields.push(
          { key: `feature_${idx}_title`, label: `Feature ${idx + 1} - Title`, type: 'input', placeholder: 'Feature name' },
          { key: `feature_${idx}_description`, label: `Feature ${idx + 1} - Description`, type: 'input', placeholder: 'Description' },
        )
      })
      return fields
    }

    case 'video':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Watch Our Story' },
      ]

    case 'cta':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Ready to Visit?' },
        { key: 'subtitle', label: 'Subtitle', type: 'input', placeholder: 'Experience the best' },
        { key: 'button_text', label: 'Button Text', type: 'input', placeholder: 'View Menu' },
      ]

    case 'team': {
      const members = (content.members as { name: string; role: string; bio?: string }[]) || []
      const fields: TranslationField[] = [
        { key: 'title', label: 'Section Title', type: 'input', placeholder: 'Meet Our Team' },
      ]
      // Add fields for each team member
      members.forEach((_, idx) => {
        fields.push(
          { key: `member_${idx}_name`, label: `Member ${idx + 1} - Name`, type: 'input', placeholder: 'Name' },
          { key: `member_${idx}_role`, label: `Member ${idx + 1} - Role`, type: 'input', placeholder: 'Head Chef' },
          { key: `member_${idx}_bio`, label: `Member ${idx + 1} - Bio`, type: 'textarea', placeholder: 'Short bio...', rows: 2 },
        )
      })
      return fields
    }

    case 'text':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Section Title' },
        { key: 'text', label: 'Content', type: 'textarea', placeholder: 'Your content here...', rows: 4 },
      ]

    case 'location':
      return [
        { key: 'title', label: 'Title', type: 'input', placeholder: 'Find Us' },
        // Manual fields (when not using locations)
        ...(!content.use_locations ? [
          { key: 'address', label: 'Address', type: 'textarea' as const, placeholder: '123 Main St, City', rows: 2 },
          { key: 'directions', label: 'Directions/Notes', type: 'input' as const, placeholder: 'Free parking behind building' },
        ] : []),
      ]

    case 'drinks': {
      const drinks = (content.drinks as { name: string; description?: string; category?: string }[]) || []
      const fields: TranslationField[] = [
        { key: 'title', label: 'Section Title', type: 'input', placeholder: 'Drinks Menu' },
      ]
      // Add fields for each drink
      drinks.forEach((_, idx) => {
        fields.push(
          { key: `drink_${idx}_name`, label: `Drink ${idx + 1} - Name`, type: 'input', placeholder: 'Drink name' },
          { key: `drink_${idx}_description`, label: `Drink ${idx + 1} - Description`, type: 'input', placeholder: 'Description' },
          { key: `drink_${idx}_category`, label: `Drink ${idx + 1} - Category`, type: 'input', placeholder: 'Cocktails' },
        )
      })
      return fields
    }

    default:
      return [
        { key: 'title', label: 'Title', type: 'input' },
        { key: 'text', label: 'Content', type: 'textarea', rows: 4 },
      ]
  }
}

/**
 * Extract default values from block content for the translation editor.
 * Maps the content fields to the translatable field keys.
 */
export function getDefaultValues(blockType: string, content: Record<string, unknown>): Record<string, string> {
  const values: Record<string, string> = {}

  // Common fields
  if (content.title) values.title = String(content.title)
  if (content.subtitle) values.subtitle = String(content.subtitle)
  if (content.text) values.text = String(content.text)
  if (content.headline) values.headline = String(content.headline)
  if (content.subheadline) values.subheadline = String(content.subheadline)
  if (content.button_text) values.button_text = String(content.button_text)
  if (content.address) values.address = String(content.address)
  if (content.hours_text) values.hours_text = String(content.hours_text)
  if (content.directions) values.directions = String(content.directions)

  // Handle arrays (testimonials, specials, events, features, team, drinks)
  switch (blockType) {
    case 'testimonials': {
      const testimonials = (content.testimonials as { name: string; text: string }[]) || []
      testimonials.forEach((t, idx) => {
        if (t.name) values[`testimonial_${idx}_name`] = t.name
        if (t.text) values[`testimonial_${idx}_text`] = t.text
      })
      break
    }
    case 'specials': {
      const specials = (content.items as { name: string; description?: string; day?: string }[]) || []
      specials.forEach((s, idx) => {
        if (s.name) values[`special_${idx}_name`] = s.name
        if (s.description) values[`special_${idx}_description`] = s.description
        if (s.day) values[`special_${idx}_day`] = s.day
      })
      break
    }
    case 'events': {
      const events = (content.events as { title: string; description?: string; date: string; time?: string }[]) || []
      events.forEach((e, idx) => {
        if (e.title) values[`event_${idx}_title`] = e.title
        if (e.description) values[`event_${idx}_description`] = e.description
        if (e.date) values[`event_${idx}_date`] = e.date
        if (e.time) values[`event_${idx}_time`] = e.time
      })
      break
    }
    case 'features': {
      const features = (content.features as { title: string; description?: string }[]) || []
      features.forEach((f, idx) => {
        if (f.title) values[`feature_${idx}_title`] = f.title
        if (f.description) values[`feature_${idx}_description`] = f.description
      })
      break
    }
    case 'team': {
      const members = (content.members as { name: string; role: string; bio?: string }[]) || []
      members.forEach((m, idx) => {
        if (m.name) values[`member_${idx}_name`] = m.name
        if (m.role) values[`member_${idx}_role`] = m.role
        if (m.bio) values[`member_${idx}_bio`] = m.bio
      })
      break
    }
    case 'drinks': {
      const drinks = (content.drinks as { name: string; description?: string; category?: string }[]) || []
      drinks.forEach((d, idx) => {
        if (d.name) values[`drink_${idx}_name`] = d.name
        if (d.description) values[`drink_${idx}_description`] = d.description
        if (d.category) values[`drink_${idx}_category`] = d.category
      })
      break
    }
  }

  return values
}

/**
 * Convert translation values from TranslationEditor format to API format.
 * TranslationEditor uses: { [langCode]: { [field]: value } }
 * API expects: [{ key: string, language_code: string, value: string }]
 */
export function convertTranslationsToApiFormat(
  blockId: string,
  translations: Record<string, Record<string, string>>
): { key: string; language_code: string; value: string }[] {
  const result: { key: string; language_code: string; value: string }[] = []

  Object.entries(translations).forEach(([langCode, fields]) => {
    Object.entries(fields).forEach(([fieldKey, value]) => {
      if (value && value.trim()) {
        result.push({
          key: `website_block.${blockId}.${fieldKey}`,
          language_code: langCode,
          value: value.trim(),
        })
      }
    })
  })

  return result
}

/**
 * Convert translations from API format to TranslationEditor format.
 * API returns: [{ key: string, language_code: string, value: string }]
 * TranslationEditor expects: { [langCode]: { [field]: value } }
 */
export function convertTranslationsFromApiFormat(
  blockId: string,
  translations: { key: string; language_code: string; value: string }[]
): Record<string, Record<string, string>> {
  const prefix = `website_block.${blockId}.`
  const result: Record<string, Record<string, string>> = {}

  translations.forEach((t) => {
    if (t.key.startsWith(prefix)) {
      const fieldKey = t.key.replace(prefix, '')
      if (!result[t.language_code]) {
        result[t.language_code] = {}
      }
      result[t.language_code][fieldKey] = t.value
    }
  })

  return result
}
