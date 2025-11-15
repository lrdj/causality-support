//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here

// Simple date formatter: {{ value | formatDate('yy-MM-dd HH:mm') }}
// Supported tokens: yyyy, yy, MM, dd, HH, mm, ss
addFilter('formatDate', (value, pattern = 'yy-MM-dd HH:mm') => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)

  const pad = (n, l = 2) => String(n).padStart(l, '0')

  const parts = {
    yyyy: d.getFullYear(),
    yy: String(d.getFullYear()).slice(-2),
    MM: pad(d.getMonth() + 1),
    dd: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  }

  let out = pattern
  // Replace longer tokens first to avoid partial replacement
  out = out.replace(/yyyy/g, parts.yyyy)
  out = out.replace(/yy/g, parts.yy)
  out = out.replace(/MM/g, parts.MM)
  out = out.replace(/dd/g, parts.dd)
  out = out.replace(/HH/g, parts.HH)
  out = out.replace(/mm/g, parts.mm)
  out = out.replace(/ss/g, parts.ss)
  return out
})

// Split a block of text into sentences for display
// Usage: {% set sentences = reflection | splitSentences %}
addFilter('splitSentences', (value) => {
  if (!value) return []
  const text = String(value).replace(/\s+/g, ' ').trim()
  if (!text) return []
  const parts = text.match(/[^.!?]+[.!?]?/g) || [text]
  return parts.map(s => s.trim()).filter(Boolean)
})
