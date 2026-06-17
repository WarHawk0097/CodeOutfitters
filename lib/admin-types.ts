export interface OnboardingFormData {
  fullName: string
  email: string
  companyName: string
  businessType: string
  companySize: string
  websiteUrl: string
  linkedinUrl: string
  foundVia: string
  meetingDate: string
  biggestHeadache: string
  manualTasks: string
  hoursPerWeek: number
  teamStructure: string
  biggestFear: string
  crm: string[]
  crmOther: string
  communicationTools: string[]
  marketingTools: string[]
  marketingToolsOther: string
  schedulingTools: string[]
  projectManagement: string[]
  ecommerce: string[]
  ecommerceOther: string
  otherSoftware: string
  currentlyUsingAutomation: string
  automationDetails: string
  willingToSwitchTools: string
  dreamScenario: string
  whatWouldStop: string
  keyMetric: string
  budgetRange: string
  decisionTimeline: string
  decisionMakers: string
  fitAssessment: string
  redFlags: string
  strongestPainPoint: string
  recommendedAutomation: string
  estimatedEffort: string
}

export interface ProposalOutput {
  executiveSummary: string
  challenge: string
  recommendation: string
  practicalLook: string
  technicalApproach: string
  requirements: string[]
  timeline: { week: string; deliverable: string }[]
  investment: string
  whyUs: string[]
  nextSteps: string[]
  futureOpportunities: string
}

export const BUSINESS_TYPES = [
  'Real Estate',
  'E-commerce',
  'Healthcare',
  'Legal',
  'Restaurant',
  'Service Business',
  'Other',
] as const

export const COMPANY_SIZES = [
  'Solo',
  '2-10',
  '11-50',
  '51-200',
  '200+',
] as const

export const FOUND_VIA = [
  'LinkedIn',
  'Referral',
  'Cold Outreach',
  'Website',
  'Other',
] as const

export const CRM_OPTIONS = [
  'Salesforce',
  'HubSpot',
  'Zoho',
  'Pipedrive',
  'Monday.com',
  'Notion',
  'Airtable',
  'None',
] as const

export const COMM_TOOLS = [
  'Gmail',
  'Outlook',
  'Slack',
  'WhatsApp',
  'SMS',
] as const

export const MARKETING_TOOLS = [
  'Mailchimp',
  'ActiveCampaign',
  'Klaviyo',
  'ConvertKit',
  'None',
] as const

export const SCHEDULING_TOOLS = [
  'Google Calendar',
  'Calendly',
  'Acuity',
  'None',
] as const

export const PM_TOOLS = [
  'Asana',
  'Trello',
  'ClickUp',
  'Monday',
  'Notion',
  'None',
] as const

export const ECOMM_TOOLS = [
  'Shopify',
  'WooCommerce',
  'None',
] as const

export const KEY_METRICS = [
  'Time saved',
  'Revenue increase',
  'Customer experience',
  'Cost reduction',
  'Error reduction',
  'Other',
] as const

export const BUDGET_RANGES = [
  'Under $500',
  '$500–$1,000',
  '$1,000–$2,500',
  '$2,500–$5,000',
  '$5,000+',
  'Flexible',
  'Undisclosed',
] as const

export const DECISION_TIMELINES = [
  'This week',
  'This month',
  'Next quarter',
  'Just exploring',
] as const

export const FIT_ASSESSMENTS = [
  'Great fit',
  'Good fit',
  'Uncertain',
  'Poor fit',
] as const

export const EFFORT_LEVELS = [
  'Simple (1–2 days)',
  'Medium (1 week)',
  'Complex (2–4 weeks)',
  'Ongoing',
] as const
