'use client'
import { useState } from 'react'

interface Props {
  id: string
  title: string
  body: string
  date: string
}

export default function AnnouncementCard({ title, body, date }: Props) {
  const [expanded, setExpanded] = useState(false)
  const preview = body.length > 200 ? body.slice(0, 200) + '…' : body

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{expanded ? body : preview}</p>
      {body.length > 200 && (
        <button onClick={() => setExpanded(!expanded)} className="text-brand-600 text-xs font-semibold mt-2 hover:underline">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
