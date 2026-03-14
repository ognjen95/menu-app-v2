// Trial period mapper (in days)
const TRIAL_PERIODS = {
  '7': 7,
  '14': 14,
  '30': 30,
  '60': 60,
  '90': 90,
} as const

type TrialPeriodKey = keyof typeof TRIAL_PERIODS
type TrialPeriodValue = typeof TRIAL_PERIODS[TrialPeriodKey]

const TRIAL_PERIOD_DEFAULT_DAYS = process.env.TRIAL_PERIOD_DEFAULT_DAYS || '90'
const days = TRIAL_PERIODS[TRIAL_PERIOD_DEFAULT_DAYS as TrialPeriodKey] || 90

export const getTrialEndDate = (): string => {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}