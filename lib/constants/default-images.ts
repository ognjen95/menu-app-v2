/**
 * Default images for website blocks
 * Using local placeholder image from /public folder
 */

import { BASE_PUBLIC_WEBSITE_IMAGES } from "../utils/s3-storage"

// Default placeholder image
const DEFAULT_IMAGE = '/hero.png'
const HERO_IMAGE = `${BASE_PUBLIC_WEBSITE_IMAGES}/waiter-bar-pos.png`
const ABOUT_IMAGE = `${BASE_PUBLIC_WEBSITE_IMAGES}/restaurant-interior.png`
const QR_MENU_WITH_BG = `${BASE_PUBLIC_WEBSITE_IMAGES}/qr-menu-with-bg.png`
const PROFILE_IMAGE = `${BASE_PUBLIC_WEBSITE_IMAGES}/profile.png`

// Hero block images - large, high-quality backgrounds
export const HERO_IMAGES = {
  restaurant: HERO_IMAGE,
  cafe: HERO_IMAGE,
  bar: HERO_IMAGE,
  seafood: HERO_IMAGE,
  pizzeria: HERO_IMAGE,
  bakery: HERO_IMAGE,
  sushi: HERO_IMAGE,
  fastFood: HERO_IMAGE,
  default: HERO_IMAGE,
} as const

// About section images - medium sized, warm atmosphere
export const ABOUT_IMAGES = {
  restaurant: ABOUT_IMAGE,
  cafe: ABOUT_IMAGE,
  bar: ABOUT_IMAGE,
  seafood: ABOUT_IMAGE,
  kitchen: ABOUT_IMAGE,
  chef: ABOUT_IMAGE,
  team: ABOUT_IMAGE,
  ingredients: ABOUT_IMAGE,
  default: ABOUT_IMAGE,
} as const

const DEFAULT_GALLERY = [HERO_IMAGE, ABOUT_IMAGE, QR_MENU_WITH_BG, DEFAULT_IMAGE]
// Gallery images - variety of food and atmosphere shots
export const GALLERY_IMAGES = {
  restaurant: DEFAULT_GALLERY,
  cafe: DEFAULT_GALLERY,
  bar: DEFAULT_GALLERY,
  food: DEFAULT_GALLERY,
  default: DEFAULT_GALLERY,
} as const

// Food/Menu item placeholder images
export const FOOD_IMAGES = {
  appetizer: DEFAULT_IMAGE,
  mainCourse: DEFAULT_IMAGE,
  dessert: DEFAULT_IMAGE,
  drink: DEFAULT_IMAGE,
  coffee: DEFAULT_IMAGE,
  pizza: DEFAULT_IMAGE,
  burger: DEFAULT_IMAGE,
  sushi: DEFAULT_IMAGE,
  salad: DEFAULT_IMAGE,
  pasta: DEFAULT_IMAGE,
  steak: DEFAULT_IMAGE,
  seafood: DEFAULT_IMAGE,
  default: DEFAULT_IMAGE,
} as const

// Team/Staff images
export const TEAM_IMAGES = {
  chef: PROFILE_IMAGE,
  waiter: PROFILE_IMAGE,
  barista: PROFILE_IMAGE,
  team: PROFILE_IMAGE,
  default: PROFILE_IMAGE,
} as const

// Default block images by block type
export const DEFAULT_BLOCK_IMAGES = {
  hero: HERO_IMAGES.default,
  about: ABOUT_IMAGES.default,
  gallery: GALLERY_IMAGES.default,
  menu_preview: FOOD_IMAGES.default,
  testimonials: ABOUT_IMAGES.restaurant,
  contact: ABOUT_IMAGES.restaurant,
  hours: ABOUT_IMAGES.cafe,
  social: GALLERY_IMAGES.cafe[0],
  features: ABOUT_IMAGES.restaurant,
  reservation: HERO_IMAGES.restaurant,
  events: HERO_IMAGES.bar,
  location: ABOUT_IMAGES.restaurant,
  custom: ABOUT_IMAGES.default,
} as const

export type BlockType = keyof typeof DEFAULT_BLOCK_IMAGES
