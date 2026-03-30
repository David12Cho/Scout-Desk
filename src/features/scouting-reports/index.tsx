import { useState, useEffect, useCallback } from 'react'
import type { ScoutingReport } from '@/types'
import { reportsStore } from '@/lib/reports.store'
import ReportList from './ReportList'
import ReportForm from './ReportForm'

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'view'; id: string }

export default function ScoutingReports() {
  const [view, setView] = useState<View>({ kind: 'list' })
  const [reports, setReports] = useState<ScoutingReport[]>([])

  const loadReports = useCallback(async () => {
    const all = await reportsStore.getAll()
    // Sort newest first
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    setReports(all)
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Flush pending on reconnect
  useEffect(() => {
    function onOnline() { reportsStore.flushPending().then(loadReports) }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [loadReports])

  const selectedReport =
    view.kind === 'view' ? reports.find((r) => r.id === view.id) : undefined

  if (view.kind === 'new') {
    return (
      <ReportForm
        onSave={() => { loadReports(); setView({ kind: 'list' }) }}
        onCancel={() => setView({ kind: 'list' })}
      />
    )
  }

  if (view.kind === 'view') {
    return (
      <ReportForm
        report={selectedReport}
        onSave={() => { loadReports(); setView({ kind: 'list' }) }}
        onCancel={() => setView({ kind: 'list' })}
      />
    )
  }

  return (
    <ReportList
      reports={reports}
      onSelect={(id) => setView({ kind: 'view', id })}
      onNew={() => setView({ kind: 'new' })}
    />
  )
}
