'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Building2,
  User,
  Wrench,
  Cpu,
  Eye,
  FileText,
} from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import type { OnboardingFormData } from '@/lib/admin-types'
import {
  BUSINESS_TYPES,
  COMPANY_SIZES,
  FOUND_VIA,
  CRM_OPTIONS,
  COMM_TOOLS,
  MARKETING_TOOLS,
  SCHEDULING_TOOLS,
  PM_TOOLS,
  ECOMM_TOOLS,
  KEY_METRICS,
  BUDGET_RANGES,
  DECISION_TIMELINES,
  FIT_ASSESSMENTS,
  EFFORT_LEVELS,
} from '@/lib/admin-types'

const SECTIONS = [
  { key: 'prospect', label: 'Prospect Details', icon: User },
  { key: 'pain', label: 'Their Pain', icon: Wrench },
  { key: 'tech', label: 'Tech Stack', icon: Cpu },
  { key: 'vision', label: 'Their Vision', icon: Eye },
  { key: 'notes', label: 'Internal Notes', icon: FileText },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

function inputClass(error: boolean) {
  return `w-full bg-white/5 border rounded-lg px-4 py-3 min-h-[48px] text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-[#C8A96E] focus:ring-2 focus:ring-[#C8A96E]/20 ${
    error ? 'border-red-400' : 'border-white/10'
  }`
}

function labelClass() {
  return 'block text-xs font-medium text-white/50 uppercase tracking-wide mb-2'
}

interface MultiCheckboxProps {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (selected: string[]) => void
  otherValue?: string
  onOtherChange?: (val: string) => void
}

function MultiCheckbox({
  label,
  options,
  selected,
  onChange,
  otherValue,
  onOtherChange,
}: MultiCheckboxProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  return (
    <div>
      <p className={labelClass()}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                on
                  ? 'bg-[#2A6B5A] border-[#2A6B5A] text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'
              }`}
            >
              {opt}
            </button>
          )
        })}
        {otherValue !== undefined && (
          <button
            type="button"
            onClick={() => {
              if (selected.includes('Other')) {
                onChange(selected.filter((s) => s !== 'Other'))
              } else {
                onChange([...selected, 'Other'])
              }
            }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              selected.includes('Other')
                ? 'bg-[#2A6B5A] border-[#2A6B5A] text-white'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'
            }`}
          >
            + Other
          </button>
        )}
      </div>
      {otherValue !== undefined && selected.includes('Other') && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => onOtherChange?.(e.target.value)}
          placeholder="Specify other..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 mt-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#C8A96E]/20"
        />
      )}
    </div>
  )
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className={labelClass()}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                on
                  ? 'bg-[#2A6B5A] border-[#2A6B5A] text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const defaultForm: OnboardingFormData = {
  fullName: '',
  email: '',
  companyName: '',
  businessType: '',
  companySize: '',
  websiteUrl: '',
  linkedinUrl: '',
  foundVia: '',
  meetingDate: '',
  biggestHeadache: '',
  manualTasks: '',
  hoursPerWeek: 0,
  teamStructure: '',
  biggestFear: '',
  crm: [],
  crmOther: '',
  communicationTools: [],
  marketingTools: [],
  marketingToolsOther: '',
  schedulingTools: [],
  projectManagement: [],
  ecommerce: [],
  ecommerceOther: '',
  otherSoftware: '',
  currentlyUsingAutomation: '',
  automationDetails: '',
  willingToSwitchTools: '',
  dreamScenario: '',
  whatWouldStop: '',
  keyMetric: '',
  budgetRange: '',
  decisionTimeline: '',
  decisionMakers: '',
  fitAssessment: '',
  redFlags: '',
  strongestPainPoint: '',
  recommendedAutomation: '',
  estimatedEffort: '',
}

export function OnboardingForm() {
  const router = useRouter()
  const [form, setForm] = useState<OnboardingFormData>(defaultForm)
  const [section, setSection] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const update = <K extends keyof OnboardingFormData>(
    key: K,
    value: OnboardingFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validateSection = (): boolean => {
    const errs: Record<string, string> = {}

    if (section === 0) {
      if (!form.fullName.trim()) errs.fullName = 'Required'
      if (!form.email.trim()) errs.email = 'Required'
      if (!form.companyName.trim()) errs.companyName = 'Required'
      if (!form.businessType) errs.businessType = 'Required'
    }

    if (section === 1) {
      if (!form.biggestHeadache.trim()) errs.biggestHeadache = 'Required'
      if (!form.manualTasks.trim()) errs.manualTasks = 'Required'
      if (!form.hoursPerWeek || form.hoursPerWeek <= 0)
        errs.hoursPerWeek = 'Enter hours per week'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateSection()) setSection((s) => Math.min(s + 1, SECTIONS.length - 1))
  }

  const handleBack = () => setSection((s) => Math.max(s - 1, 0))

  const handleSubmit = () => {
    setSaving(true)
    try {
      localStorage.setItem('co_onboarding_data', JSON.stringify(form))
      setSaved(true)
      setTimeout(() => {
        router.push('/admin/proposal')
      }, 800)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-[#2A6B5A]/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-[#2A6B5A]" />
        </div>
        <p className="text-white font-heading text-xl font-bold mb-2">
          Intake Saved!
        </p>
        <p className="text-white/50 text-sm">
          Redirecting to proposal builder...
        </p>
      </div>
    )
  }

  const renderSection = () => {
    const s = SECTIONS[section]

    switch (s.key) {
      case 'prospect':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass()} htmlFor="fullName">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass(!!errors.fullName)}
                />
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className={labelClass()} htmlFor="email">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="jane@company.com"
                  className={inputClass(!!errors.email)}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass()} htmlFor="companyName">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={form.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                  placeholder="Acme Corp"
                  className={inputClass(!!errors.companyName)}
                />
                {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <label className={labelClass()} htmlFor="businessType">
                  Business Type <span className="text-red-400">*</span>
                </label>
                <select
                  id="businessType"
                  value={form.businessType}
                  onChange={(e) => update('businessType', e.target.value)}
                  className={`${inputClass(!!errors.businessType)} appearance-none ${!form.businessType ? 'text-white/30' : 'text-white'}`}
                >
                  <option value="" disabled>Select type</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t} className="text-[#1C1612]">{t}</option>
                  ))}
                </select>
                {errors.businessType && <p className="text-red-400 text-xs mt-1">{errors.businessType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <RadioGroup
                label="Company Size"
                options={COMPANY_SIZES}
                value={form.companySize}
                onChange={(v) => update('companySize', v)}
              />
              <RadioGroup
                label="How They Found Us"
                options={FOUND_VIA}
                value={form.foundVia}
                onChange={(v) => update('foundVia', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass()} htmlFor="websiteUrl">Website URL</label>
                <input
                  id="websiteUrl"
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => update('websiteUrl', e.target.value)}
                  placeholder="https://acme.com"
                  className={inputClass(false)}
                />
              </div>
              <div>
                <label className={labelClass()} htmlFor="linkedinUrl">LinkedIn URL</label>
                <input
                  id="linkedinUrl"
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => update('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/janesmith"
                  className={inputClass(false)}
                />
              </div>
            </div>

            <div>
              <label className={labelClass()} htmlFor="meetingDate">Meeting Date</label>
              <input
                id="meetingDate"
                type="date"
                value={form.meetingDate}
                onChange={(e) => update('meetingDate', e.target.value)}
                className={inputClass(false)}
              />
            </div>
          </div>
        )

      case 'pain':
        return (
          <div className="space-y-5">
            <div>
              <label className={labelClass()} htmlFor="biggestHeadache">
                What is their biggest operational headache? <span className="text-red-400">*</span>
              </label>
              <p className="text-white/30 text-xs mb-2">In their own words if possible</p>
              <textarea
                id="biggestHeadache"
                rows={3}
                value={form.biggestHeadache}
                onChange={(e) => update('biggestHeadache', e.target.value)}
                placeholder="Describe the main pain point..."
                className={inputClass(!!errors.biggestHeadache)}
              />
              {errors.biggestHeadache && <p className="text-red-400 text-xs mt-1">{errors.biggestHeadache}</p>}
            </div>

            <div>
              <label className={labelClass()} htmlFor="manualTasks">
                What tasks are they doing manually that could be automated? <span className="text-red-400">*</span>
              </label>
              <textarea
                id="manualTasks"
                rows={3}
                value={form.manualTasks}
                onChange={(e) => update('manualTasks', e.target.value)}
                placeholder="Describe the manual processes..."
                className={inputClass(!!errors.manualTasks)}
              />
              {errors.manualTasks && <p className="text-red-400 text-xs mt-1">{errors.manualTasks}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass()} htmlFor="hoursPerWeek">
                  Hours/week on these tasks <span className="text-red-400">*</span>
                </label>
                <input
                  id="hoursPerWeek"
                  type="number"
                  min={0}
                  value={form.hoursPerWeek || ''}
                  onChange={(e) => update('hoursPerWeek', parseInt(e.target.value) || 0)}
                  placeholder="15"
                  className={inputClass(!!errors.hoursPerWeek)}
                />
                {errors.hoursPerWeek && <p className="text-red-400 text-xs mt-1">{errors.hoursPerWeek}</p>}
              </div>
              <div>
                <label className={labelClass()} htmlFor="teamStructure">
                  Current team structure
                </label>
                <textarea
                  id="teamStructure"
                  rows={2}
                  value={form.teamStructure}
                  onChange={(e) => update('teamStructure', e.target.value)}
                  placeholder="e.g. 3 agents, 1 admin, 1 manager..."
                  className={inputClass(false)}
                />
              </div>
            </div>

            <div>
              <label className={labelClass()} htmlFor="biggestFear">
                Their biggest fear about automation
              </label>
              <textarea
                id="biggestFear"
                rows={2}
                value={form.biggestFear}
                onChange={(e) => update('biggestFear', e.target.value)}
                placeholder="e.g. losing the personal touch, job replacement, cost..."
                className={inputClass(false)}
              />
            </div>
          </div>
        )

      case 'tech':
        return (
          <div className="space-y-5">
            <MultiCheckbox
              label="CRM They Use"
              options={CRM_OPTIONS}
              selected={form.crm}
              onChange={(v) => update('crm', v)}
              otherValue={form.crmOther}
              onOtherChange={(v) => update('crmOther', v)}
            />

            <MultiCheckbox
              label="Communication Tools"
              options={COMM_TOOLS}
              selected={form.communicationTools}
              onChange={(v) => update('communicationTools', v)}
            />

            <MultiCheckbox
              label="Marketing Tools"
              options={MARKETING_TOOLS}
              selected={form.marketingTools}
              onChange={(v) => update('marketingTools', v)}
              otherValue={form.marketingToolsOther}
              onOtherChange={(v) => update('marketingToolsOther', v)}
            />

            <RadioGroup
              label="Scheduling / Calendar"
              options={SCHEDULING_TOOLS}
              value={form.schedulingTools[0] || ''}
              onChange={(v) => update('schedulingTools', v ? [v] : [])}
            />

            <MultiCheckbox
              label="Project Management"
              options={PM_TOOLS}
              selected={form.projectManagement}
              onChange={(v) => update('projectManagement', v)}
            />

            <MultiCheckbox
              label="E-commerce"
              options={ECOMM_TOOLS}
              selected={form.ecommerce}
              onChange={(v) => update('ecommerce', v)}
              otherValue={form.ecommerceOther}
              onOtherChange={(v) => update('ecommerceOther', v)}
            />

            <div>
              <label className={labelClass()} htmlFor="otherSoftware">
                Any other key software?
              </label>
              <textarea
                id="otherSoftware"
                rows={2}
                value={form.otherSoftware}
                onChange={(e) => update('otherSoftware', e.target.value)}
                placeholder="QuickBooks, Stripe, Zapier..."
                className={inputClass(false)}
              />
            </div>

            <div>
              <p className={labelClass()}>Do they currently use any automation?</p>
              <div className="flex gap-2">
                {['Yes', 'No', 'Partial'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update('currentlyUsingAutomation', opt)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                      form.currentlyUsingAutomation === opt
                        ? 'bg-[#2A6B5A] border-[#2A6B5A] text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {(form.currentlyUsingAutomation === 'Yes' || form.currentlyUsingAutomation === 'Partial') && (
              <div>
                <label className={labelClass()} htmlFor="automationDetails">
                  What are they using?
                </label>
                <textarea
                  id="automationDetails"
                  rows={2}
                  value={form.automationDetails}
                  onChange={(e) => update('automationDetails', e.target.value)}
                  placeholder="Describe their current automation setup..."
                  className={inputClass(false)}
                />
              </div>
            )}

            <div>
              <p className={labelClass()}>Are they willing to switch tools if needed?</p>
              <div className="flex gap-2">
                {['Yes', 'No', 'Maybe'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update('willingToSwitchTools', opt)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                      form.willingToSwitchTools === opt
                        ? 'bg-[#2A6B5A] border-[#2A6B5A] text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'vision':
        return (
          <div className="space-y-5">
            <div>
              <label className={labelClass()} htmlFor="dreamScenario">
                What does their dream scenario look like in 6 months?
              </label>
              <p className="text-white/30 text-xs mb-2">What would make them say &ldquo;wow&rdquo;?</p>
              <textarea
                id="dreamScenario"
                rows={3}
                value={form.dreamScenario}
                onChange={(e) => update('dreamScenario', e.target.value)}
                placeholder="Describe their ideal outcome..."
                className={inputClass(false)}
              />
            </div>

            <div>
              <label className={labelClass()} htmlFor="whatWouldStop">
                What would they stop doing if automation handled it?
              </label>
              <textarea
                id="whatWouldStop"
                rows={2}
                value={form.whatWouldStop}
                onChange={(e) => update('whatWouldStop', e.target.value)}
                placeholder="The tasks they'd love to eliminate..."
                className={inputClass(false)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <RadioGroup
                label="Metric That Matters Most"
                options={KEY_METRICS}
                value={form.keyMetric}
                onChange={(v) => update('keyMetric', v)}
              />

              <RadioGroup
                label="Budget Range"
                options={BUDGET_RANGES}
                value={form.budgetRange}
                onChange={(v) => update('budgetRange', v)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <RadioGroup
                label="Decision Timeline"
                options={DECISION_TIMELINES}
                value={form.decisionTimeline}
                onChange={(v) => update('decisionTimeline', v)}
              />
              <div>
                <label className={labelClass()} htmlFor="decisionMakers">
                  Who else is involved in the decision?
                </label>
                <input
                  id="decisionMakers"
                  type="text"
                  value={form.decisionMakers}
                  onChange={(e) => update('decisionMakers', e.target.value)}
                  placeholder="e.g. Partner, COO, Board..."
                  className={inputClass(false)}
                />
              </div>
            </div>
          </div>
        )

      case 'notes':
        return (
          <div className="space-y-5">
            <div>
              <RadioGroup
                label="Overall Fit Assessment"
                options={FIT_ASSESSMENTS}
                value={form.fitAssessment}
                onChange={(v) => update('fitAssessment', v)}
              />
            </div>

            <div>
              <label className={labelClass()} htmlFor="redFlags">
                Red Flags Noticed
              </label>
              <textarea
                id="redFlags"
                rows={2}
                value={form.redFlags}
                onChange={(e) => update('redFlags', e.target.value)}
                placeholder="Any concerns or hesitations..."
                className={inputClass(false)}
              />
            </div>

            <div>
              <label className={labelClass()} htmlFor="strongestPainPoint">
                What&apos;s the strongest pain point to lead with?
              </label>
              <textarea
                id="strongestPainPoint"
                rows={2}
                value={form.strongestPainPoint}
                onChange={(e) => update('strongestPainPoint', e.target.value)}
                placeholder="The angle that resonated most..."
                className={inputClass(false)}
              />
            </div>

            <div>
              <label className={labelClass()} htmlFor="recommendedAutomation">
                My recommended automation to pitch
              </label>
              <textarea
                id="recommendedAutomation"
                rows={2}
                value={form.recommendedAutomation}
                onChange={(e) => update('recommendedAutomation', e.target.value)}
                placeholder="What you think they need most..."
                className={inputClass(false)}
              />
            </div>

            <div>
              <RadioGroup
                label="Estimated Effort Level"
                options={EFFORT_LEVELS}
                value={form.estimatedEffort}
                onChange={(v) => update('estimatedEffort', v)}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const SectionIcon = SECTIONS[section].icon

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
      {/* Section indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {SECTIONS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                i === section
                  ? 'bg-[#C8A96E] text-white'
                  : i < section
                  ? 'bg-[#2A6B5A] text-white'
                  : 'bg-white/10 text-white/30'
              }`}
            >
              {i < section ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={`text-[10px] font-medium hidden sm:inline ${
                i === section ? 'text-[#C8A96E]' : 'text-white/40'
              }`}
            >
              {s.label}
            </span>
            {i < SECTIONS.length - 1 && (
              <div
                className={`w-6 h-px sm:w-10 ${
                  i < section ? 'bg-[#2A6B5A]' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Section card */}
      <motion.div
        key={section}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[#1C3D32] rounded-2xl border border-white/10 p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#C8A96E]/10 flex items-center justify-center">
            <SectionIcon className="w-4 h-4 text-[#C8A96E]" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-white tracking-tight">
              {SECTIONS[section].label}
            </h2>
            <p className="text-white/30 text-[10px]">
              {section === 0
                ? 'Basic info about the prospect'
                : section === 1
                ? 'Their current operational pain'
                : section === 2
                ? 'What tools they use'
                : section === 3
                ? 'What they want to achieve'
                : 'Your private notes'}
            </p>
          </div>
        </div>

        {renderSection()}
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={section === 0}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => {
              localStorage.setItem('co_onboarding_data', JSON.stringify(form))
            }}
            className="text-xs text-white/40 hover:text-white/70 px-3 py-2 rounded-lg transition-colors"
          >
            Save Draft
          </button>

          {section < SECTIONS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-[#C8A96E] hover:bg-[#2A6B5A] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#2A6B5A] hover:bg-[#1A4A3B] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Save & Build Proposal
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
