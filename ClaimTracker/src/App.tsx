import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import type { Crd2f_promotionclaims } from './generated/models/Crd2f_promotionclaimsModel'
import { DataverseProvider, useDataverse, type ClaimDraft, type DealDraft } from './state/DataverseContext'

type ProofOfExecution = {
  id: string
  channel: string
  assets: string[]
  uploadedBy: string
  timestamp: string
}

type AuditEvent = {
  id: string
  action: string
  user: string
  timestamp: string
  impact: string
}

type VendorProfile = {
  id: string
  name: string
  category: string
  contact: string
  upcomingPromotions: number
  pendingClaims: number
}

type RoleMatrix = {
  role: string
  scope: string
  canEdit: boolean
  canApprove: boolean
  canAudit: boolean
}

const stageFlow = [
  {
    stage: 'Initiation',
    description: 'Deal sheet intake, vendor validations, duplicate controls',
    gate: 'Policy compliance (crd2f_promotiondeal)',
    sla: '48h response',
  },
  {
    stage: 'Approval',
    description: 'Finance + Retail approval routed through systemuser owners',
    gate: 'Budget guardrails',
    sla: '36h approval',
  },
  {
    stage: 'Execution',
    description: 'Proof-of-execution uploads & schedule tracking',
    gate: 'Proof completeness (crd2f_promotionproof)',
    sla: '72h evidence upload',
  },
  {
    stage: 'Settlement',
    description: 'Claim validation, SLA monitoring & auto-escalations',
    gate: 'Audit-ready package',
    sla: '10d settlement',
  },
]

const proofShowcase: ProofOfExecution[] = [
  {
    id: 'POE-7821',
    channel: 'Dubai Mall | Digital',
    assets: ['creative.jpg', 'storefront.mp4'],
    uploadedBy: 'Aisha Khan',
    timestamp: '2026-01-02 11:34',
  },
  {
    id: 'POE-7829',
    channel: 'Online | EDM',
    assets: ['newsletter.png'],
    uploadedBy: 'Marketing Ops',
    timestamp: '2026-01-02 16:20',
  },
  {
    id: 'POE-7834',
    channel: 'Store | Sheikh Zayed',
    assets: ['floorstand.jpg', 'banner.png', 'staff-brief.pdf'],
    uploadedBy: 'Vendor Success',
    timestamp: '2026-01-03 08:05',
  },
]

const vendorSpotlight: VendorProfile[] = [
  {
    id: 'VND-88',
    name: 'Samsung Gulf',
    category: 'Consumer Electronics',
    contact: 'vendors@samsung.com',
    upcomingPromotions: 3,
    pendingClaims: 2,
  },
  {
    id: 'VND-41',
    name: 'HP Middle East',
    category: 'Computing',
    contact: 'hp@partners.com',
    upcomingPromotions: 2,
    pendingClaims: 1,
  },
  {
    id: 'VND-12',
    name: 'Belkin',
    category: 'Accessories',
    contact: 'success@belkin.com',
    upcomingPromotions: 1,
    pendingClaims: 0,
  },
]

const auditTrail: AuditEvent[] = [
  {
    id: 'AUD-9101',
    action: 'Claim CLM-4560 escalated to Finance Director',
    user: 'systemuser: K.AlMansoori',
    timestamp: '2026-01-03 09:42',
    impact: 'SLA threshold reached',
  },
  {
    id: 'AUD-9104',
    action: 'Vendor LG uploaded revised contract addendum',
    user: 'vendor portal',
    timestamp: '2026-01-02 19:15',
    impact: 'Linked to promotiondeal DL-9214',
  },
  {
    id: 'AUD-9109',
    action: 'Marketing validated execution proof POE-7834',
    user: 'systemuser: J.Mathew',
    timestamp: '2026-01-02 17:58',
    impact: 'Ready for finance validation',
  },
  {
    id: 'AUD-9112',
    action: 'Role change: Vendor Success granted read-only claim view',
    user: 'crd2f_userrole',
    timestamp: '2026-01-02 15:11',
    impact: 'Access control update',
  },
]

const roleMatrix: RoleMatrix[] = [
  {
    role: 'Retail Programs',
    scope: 'Deal initiation & supporting docs',
    canEdit: true,
    canApprove: false,
    canAudit: false,
  },
  {
    role: 'Finance Ops',
    scope: 'Claim validation & settlement',
    canEdit: true,
    canApprove: true,
    canAudit: true,
  },
  {
    role: 'Marketing Ops',
    scope: 'Proof-of-execution & campaign health',
    canEdit: true,
    canApprove: false,
    canAudit: true,
  },
  {
    role: 'Vendor Portal (external)',
    scope: 'Read-only promotion view & uploads',
    canEdit: false,
    canApprove: false,
    canAudit: false,
  },
]

const validationControls = [
  'Duplicate deal entry detection before submission',
  'Contract expiry validation against promotion dates',
  'Mandatory proof attachments per channel',
  'Automated budget cap check vs vendor agreement',
  'Two-step approval for claims above AED 500K',
  'Document retention flag for finance / audit',
]

const trainingResources = [
  {
    title: 'Digital Deal Sheet Playbook',
    format: 'Interactive manual',
    target: 'Retail & Vendor teams',
  },
  {
    title: 'Finance SLA cockpit walkthrough',
    format: 'Live session + recording',
    target: 'Finance & Compliance',
  },
  {
    title: 'Vendor portal onboarding kit',
    format: 'Self-serve FAQ + video',
    target: 'Partner ecosystem',
  },
]

const currencyFormatter = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(value?: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return dateFormatter.format(parsed)
}

function formatAmount(value?: string) {
  if (!value) return '—'
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return value
  }
  return currencyFormatter.format(parsed)
}

function getClaimStatus(claim: Crd2f_promotionclaims) {
  if (claim.statuscode === 2) {
    return { label: 'Breached', className: 'status-breached' }
  }
  if (claim.statecode === 1) {
    return { label: 'At Risk', className: 'status-at-risk' }
  }
  return { label: 'On Track', className: 'status-on-track' }
}

function Workspace() {
  const {
    user,
    deals,
    claims,
    vendors,
    loading,
    syncing,
    error,
    refresh,
    createDeal,
    createClaim,
  } = useDataverse()

  const [selectedDealId, setSelectedDealId] = useState<string>()
  const [selectedClaimId, setSelectedClaimId] = useState<string>()
  const [dealFormOpen, setDealFormOpen] = useState(false)
  const [claimFormOpen, setClaimFormOpen] = useState(false)
  const [dealForm, setDealForm] = useState<DealDraft>({
    name: '',
    category: '',
    startDate: '',
    endDate: '',
    description: '',
  })
  const [claimForm, setClaimForm] = useState<ClaimDraft>({
    claimNumber: '',
    amount: '',
    claimDate: '',
    dealId: '',
    vendorId: '',
  })
  const [dealFeedback, setDealFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [claimFeedback, setClaimFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  useEffect(() => {
    if (!deals.length) {
      setSelectedDealId(undefined)
      return
    }
    if (!selectedDealId || !deals.some((deal) => deal.crd2f_promotiondealid === selectedDealId)) {
      setSelectedDealId(deals[0].crd2f_promotiondealid)
    }
  }, [deals, selectedDealId])

  useEffect(() => {
    if (!claims.length) {
      setSelectedClaimId(undefined)
      return
    }
    if (!selectedClaimId || !claims.some((claim) => claim.crd2f_promotionclaimid === selectedClaimId)) {
      setSelectedClaimId(claims[0].crd2f_promotionclaimid)
    }
  }, [claims, selectedClaimId])

  useEffect(() => {
    if (!claimForm.dealId && selectedDealId) {
      setClaimForm((prev) => ({ ...prev, dealId: selectedDealId }))
    }
  }, [claimForm.dealId, selectedDealId])

  const selectedDeal = useMemo(
    () => deals.find((deal) => deal.crd2f_promotiondealid === selectedDealId),
    [deals, selectedDealId]
  )

  const selectedDealClaims = useMemo(
    () =>
      selectedDeal
        ? claims.filter((claim) => claim._crd2f_deal_value === selectedDeal.crd2f_promotiondealid)
        : [],
    [claims, selectedDeal]
  )

  const selectedClaim = useMemo(
    () => claims.find((claim) => claim.crd2f_promotionclaimid === selectedClaimId),
    [claims, selectedClaimId]
  )

  const alertClaims = useMemo(() => claims.slice(0, 4), [claims])
  const slaBreaches = useMemo(() => claims.filter((claim) => claim.statuscode === 2), [claims])
  const slaHealth = useMemo(() => {
    if (!claims.length) return 100
    return Math.round(((claims.length - slaBreaches.length) / claims.length) * 100)
  }, [claims, slaBreaches])

  const heroStats = useMemo(
    () => ({
      deals: deals.length,
      documents: claims.length,
      vendors: vendors.length,
      openClaims: claims.filter((claim) => claim.statecode === 0).length,
    }),
    [claims, deals, vendors]
  )

  const statusTiles = useMemo(
    () => [
      { label: 'Active deals', value: deals.length, table: 'crd2f_promotiondeal' },
      { label: 'Claims filed', value: claims.length, table: 'crd2f_promotionclaim' },
      {
        label: 'Vendors synced',
        value: vendors.length,
        table: 'crd2f_vendor',
      },
      {
        label: 'Claims needing attention',
        value: slaBreaches.length,
        table: 'crd2f_promotionclaim',
      },
    ],
    [claims, deals, slaBreaches.length, vendors]
  )

  const resetDealForm = () => {
    setDealForm({ name: '', category: '', startDate: '', endDate: '', description: '' })
  }

  const resetClaimForm = () => {
    setClaimForm({ claimNumber: '', amount: '', claimDate: '', dealId: '', vendorId: '' })
  }

  const handleDealSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDealFeedback(null)
    if (!dealForm.name.trim()) {
      setDealFeedback({ type: 'error', message: 'Deal name is required.' })
      return
    }

    try {
      await createDeal(dealForm)
      setDealFeedback({ type: 'success', message: 'Promotion deal created successfully.' })
      setDealFormOpen(false)
      resetDealForm()
    } catch (err) {
      setDealFeedback({ type: 'error', message: (err as Error).message })
    }
  }

  const handleClaimSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setClaimFeedback(null)
    if (!claimForm.claimNumber.trim()) {
      setClaimFeedback({ type: 'error', message: 'Claim number is required.' })
      return
    }

    try {
      await createClaim(claimForm)
      setClaimFeedback({ type: 'success', message: 'Claim submitted to Dataverse.' })
      setClaimFormOpen(false)
      resetClaimForm()
    } catch (err) {
      setClaimFeedback({ type: 'error', message: (err as Error).message })
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Sharaf DG · Promotion Command Center</p>
          <h1>Claim Tracker for vendor-funded promotions</h1>
          <p className="lead">
            A single, secure workspace orchestrating deal sheets, approvals, proof of execution, and claim settlement
            directly against Dataverse.
          </p>
          <div className="hero__actions">
            <button className="cta" onClick={() => refresh()} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Refresh data'}
            </button>
            <button className="ghost" disabled>
              {user?.fullName ?? 'Resolving user…'}
            </button>
          </div>
        </div>
        <div className="hero__metrics">
          <div className="metric-card">
            <span>Active deals</span>
            <strong>{heroStats.deals}</strong>
            <small>crd2f_promotiondeal</small>
          </div>
          <div className="metric-card">
            <span>Claims logged</span>
            <strong>{heroStats.documents}</strong>
            <small>crd2f_promotionclaim</small>
          </div>
          <div className="metric-card">
            <span>Vendors engaged</span>
            <strong>{heroStats.vendors}</strong>
            <small>crd2f_vendor</small>
          </div>
          <div className="metric-card">
            <span>Open claims</span>
            <strong>{heroStats.openClaims}</strong>
            <small>State · Active</small>
          </div>
        </div>
      </header>

      {error && <div className="inline-error">{error}</div>}
      {loading && <div className="inline-feedback muted">Loading Dataverse data…</div>}

      <section className="insights-grid">
        <article className="insight-card">
          <div>
            <p className="eyebrow">Centralized repository</p>
            <h2>Every promotion artifact in one vault</h2>
            <p>
              Store deal sheets, agreements, proofs, and claim notes with lineage back to the originating Dataverse
              tables. Finance, Retail, Marketing, and Vendor Management operate on the same source of truth.
            </p>
          </div>
          <ul>
            <li>crd2f_promotiondeal · Business terms</li>
            <li>crd2f_promotionproof · Execution media</li>
            <li>crd2f_promotionclaim · Settlement packets</li>
          </ul>
        </article>
        <article className="insight-card">
          <div>
            <p className="eyebrow">Workflow automation</p>
            <h2>Initiation → approvals → execution → settlement</h2>
            <p>
              Digitally route submissions, approvals, document uploads, and control gates. Smart escalations trigger when
              SLA thresholds are crossed.
            </p>
          </div>
          <div className="workflow-badges">
            {stageFlow.map((stage) => (
              <span key={stage.stage}>{stage.stage}</span>
            ))}
          </div>
        </article>
        <article className="insight-card">
          <div>
            <p className="eyebrow">Real-time alerts</p>
            <h2>Status feeds & proactive nudges</h2>
            <p>
              System-generated notifications flag pending approvals, proof deadlines, claim cut-off dates, and
              escalations for leadership visibility.
            </p>
          </div>
          <div className="alert-feed">
            {alertClaims.length === 0 && <p className="muted">No claims have been synced yet.</p>}
            {alertClaims.map((claim) => {
              const status = getClaimStatus(claim)
              return (
                <div key={claim.crd2f_promotionclaimid} className={`alert-chip ${status.className}`}>
                  <strong>{claim.crd2f_claimnumber}</strong>
                  <span>{status.label}</span>
                  <small>{claim.crd2f_dealname ?? 'Unlinked deal'}</small>
                </div>
              )
            })}
          </div>
        </article>
        <article className="insight-card">
          <div>
            <p className="eyebrow">Vendor contracts</p>
            <h2>Every claim tied back to the source agreement</h2>
            <p>
              Validate promotional claims against stored vendor contracts. Exceptions are blocked unless matching
              commercial terms exist.
            </p>
          </div>
          <div className="contract-pill">Linked agreements · 100% coverage</div>
        </article>
      </section>

      <section className="workflow live-ops">
        <div className="section-heading">
          <h2>Live promotion & claim workspace</h2>
          <p>Read + write operations use the generated services and the Power Apps host context.</p>
        </div>
        <div className="ops-grid">
          <article className="ops-panel">
            <header className="ops-panel__header">
              <div>
                <p className="eyebrow">Promotions</p>
                <h3>Promotion deal library</h3>
                <p className="muted">
                  {deals.length ? `${deals.length} records loaded from crd2f_promotiondeal.` : 'No promotions found yet.'}
                </p>
              </div>
              <button className="cta" onClick={() => setDealFormOpen((open) => !open)}>
                {dealFormOpen ? 'Close form' : 'New deal'}
              </button>
            </header>

            <div className="ops-panel__body">
              <div className="ops-panel__list">
                <table className="entity-table">
                  <thead>
                    <tr>
                      <th>Deal</th>
                      <th>Status</th>
                      <th>Start</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr
                        key={deal.crd2f_promotiondealid}
                        className={deal.crd2f_promotiondealid === selectedDealId ? 'selected' : ''}
                        onClick={() => setSelectedDealId(deal.crd2f_promotiondealid)}
                      >
                        <td>
                          <strong>{deal.crd2f_dealname ?? 'Untitled deal'}</strong>
                          <small>{deal.crd2f_category ?? '—'}</small>
                        </td>
                        <td>
                          <span className={`pill ${deal.statecode === 0 ? 'pill-success' : 'pill-neutral'}`}>
                            {deal.statecode === 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{formatDate(deal.crd2f_startdate)}</td>
                        <td>{formatDate(deal.modifiedon ?? deal.createdon)}</td>
                      </tr>
                    ))}
                    {!deals.length && (
                      <tr>
                        <td colSpan={4} className="muted">
                          No Dataverse promotions yet. Use "New deal" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="ops-panel__detail">
                {selectedDeal ? (
                  <div className="entity-detail">
                    <header>
                      <h3>{selectedDeal.crd2f_dealname ?? 'Untitled deal'}</h3>
                      <span className={`pill ${selectedDeal.statecode === 0 ? 'pill-success' : 'pill-neutral'}`}>
                        {selectedDeal.statecode === 0 ? 'Active' : 'Inactive'}
                      </span>
                    </header>
                    <p>{selectedDeal.crd2f_description ?? 'No description provided yet.'}</p>
                    <dl>
                      <div>
                        <dt>Owner</dt>
                        <dd>{selectedDeal.owneridname ?? 'Current user'}</dd>
                      </div>
                      <div>
                        <dt>Category</dt>
                        <dd>{selectedDeal.crd2f_category ?? '—'}</dd>
                      </div>
                      <div>
                        <dt>Start · End</dt>
                        <dd>
                          {formatDate(selectedDeal.crd2f_startdate)} → {formatDate(selectedDeal.crd2f_enddate)}
                        </dd>
                      </div>
                    </dl>
                    <section>
                      <h4>Linked claims</h4>
                      {selectedDealClaims.length === 0 && <p className="muted">No claims tied to this deal yet.</p>}
                      <ul>
                        {selectedDealClaims.slice(0, 3).map((claim) => (
                          <li key={claim.crd2f_promotionclaimid}>
                            <strong>{claim.crd2f_claimnumber}</strong> · {formatAmount(claim.crd2f_claimamount)}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                ) : (
                  <p className="muted">Select a promotion to inspect details.</p>
                )}
              </div>
            </div>

            {dealFormOpen && (
              <form className="entity-form" onSubmit={handleDealSubmit}>
                <div className="form-grid">
                  <label>
                    <span>Deal name *</span>
                    <input
                      type="text"
                      value={dealForm.name}
                      onChange={(event) => setDealForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    <span>Category</span>
                    <input
                      type="text"
                      value={dealForm.category}
                      onChange={(event) => setDealForm((prev) => ({ ...prev, category: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Start date</span>
                    <input
                      type="date"
                      value={dealForm.startDate}
                      onChange={(event) => setDealForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>End date</span>
                    <input
                      type="date"
                      value={dealForm.endDate}
                      onChange={(event) => setDealForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    />
                  </label>
                </div>
                <label>
                  <span>Description</span>
                  <textarea
                    value={dealForm.description}
                    onChange={(event) => setDealForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                  />
                </label>
                {dealFeedback && (
                  <p className={dealFeedback.type === 'error' ? 'inline-error' : 'inline-feedback success'}>
                    {dealFeedback.message}
                  </p>
                )}
                <div className="form-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setDealFormOpen(false)
                      resetDealForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cta" disabled={syncing}>
                    {syncing ? 'Saving…' : 'Save deal'}
                  </button>
                </div>
              </form>
            )}
          </article>

          <article className="ops-panel">
            <header className="ops-panel__header">
              <div>
                <p className="eyebrow">Claims</p>
                <h3>Claim cockpit</h3>
                <p className="muted">
                  {claims.length
                    ? `${claims.length} records loaded from crd2f_promotionclaim.`
                    : 'No claims submitted yet.'}
                </p>
              </div>
              <button className="cta" onClick={() => setClaimFormOpen((open) => !open)}>
                {claimFormOpen ? 'Close form' : 'Add claim'}
              </button>
            </header>

            <div className="ops-panel__body">
              <div className="ops-panel__list">
                <table className="entity-table">
                  <thead>
                    <tr>
                      <th>Claim</th>
                      <th>Deal</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => {
                      const status = getClaimStatus(claim)
                      return (
                        <tr
                          key={claim.crd2f_promotionclaimid}
                          className={claim.crd2f_promotionclaimid === selectedClaimId ? 'selected' : ''}
                          onClick={() => setSelectedClaimId(claim.crd2f_promotionclaimid)}
                        >
                          <td>
                            <strong>{claim.crd2f_claimnumber}</strong>
                            <small>{formatDate(claim.crd2f_claimdate)}</small>
                          </td>
                          <td>{claim.crd2f_dealname ?? 'Unlinked'}</td>
                          <td>{formatAmount(claim.crd2f_claimamount)}</td>
                          <td>
                            <span className={`pill ${status.className}`}>{status.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                    {!claims.length && (
                      <tr>
                        <td colSpan={4} className="muted">
                          No Dataverse claims yet. Use "Add claim" to raise one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="ops-panel__detail">
                {selectedClaim ? (
                  <div className="entity-detail">
                    <header>
                      <h3>{selectedClaim.crd2f_claimnumber}</h3>
                      <span className={`pill ${getClaimStatus(selectedClaim).className}`}>
                        {getClaimStatus(selectedClaim).label}
                      </span>
                    </header>
                    <dl>
                      <div>
                        <dt>Deal</dt>
                        <dd>{selectedClaim.crd2f_dealname ?? 'Unlinked'}</dd>
                      </div>
                      <div>
                        <dt>Vendor</dt>
                        <dd>{selectedClaim.crd2f_vendorname ?? 'Not specified'}</dd>
                      </div>
                      <div>
                        <dt>Amount</dt>
                        <dd>{formatAmount(selectedClaim.crd2f_claimamount)}</dd>
                      </div>
                      <div>
                        <dt>Claim date</dt>
                        <dd>{formatDate(selectedClaim.crd2f_claimdate)}</dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <p className="muted">Select a claim to drill into details.</p>
                )}
              </div>
            </div>

            {claimFormOpen && (
              <form className="entity-form" onSubmit={handleClaimSubmit}>
                <div className="form-grid">
                  <label>
                    <span>Claim number *</span>
                    <input
                      type="text"
                      value={claimForm.claimNumber}
                      onChange={(event) => setClaimForm((prev) => ({ ...prev, claimNumber: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    <span>Claim amount (AED)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={claimForm.amount}
                      onChange={(event) => setClaimForm((prev) => ({ ...prev, amount: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Claim date</span>
                    <input
                      type="date"
                      value={claimForm.claimDate}
                      onChange={(event) => setClaimForm((prev) => ({ ...prev, claimDate: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Deal</span>
                    <select
                      value={claimForm.dealId}
                      onChange={(event) => setClaimForm((prev) => ({ ...prev, dealId: event.target.value }))}
                    >
                      <option value="">Select a deal</option>
                      {deals.map((deal) => (
                        <option key={deal.crd2f_promotiondealid} value={deal.crd2f_promotiondealid}>
                          {deal.crd2f_dealname ?? 'Untitled deal'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Vendor</span>
                    <select
                      value={claimForm.vendorId}
                      onChange={(event) => setClaimForm((prev) => ({ ...prev, vendorId: event.target.value }))}
                    >
                      <option value="">Select a vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.crd2f_vendorid} value={vendor.crd2f_vendorid}>
                          {vendor.crd2f_vendorname}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {claimFeedback && (
                  <p className={claimFeedback.type === 'error' ? 'inline-error' : 'inline-feedback success'}>
                    {claimFeedback.message}
                  </p>
                )}
                <div className="form-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setClaimFormOpen(false)
                      resetClaimForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cta" disabled={syncing}>
                    {syncing ? 'Submitting…' : 'Submit claim'}
                  </button>
                </div>
              </form>
            )}
          </article>
        </div>
      </section>

      <section className="status-alerts">
        <div className="status-board">
          <div className="section-heading">
            <h2>Status radar</h2>
            <p>Live tiles mapped to Dataverse tables.</p>
          </div>
          <div className="status-grid">
            {statusTiles.map((tile) => (
              <div key={tile.label} className="status-tile">
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
                <small>{tile.table}</small>
                <em>{syncing ? 'Syncing…' : 'Up to date'}</em>
              </div>
            ))}
          </div>
        </div>
        <div className="sla-card">
          <p className="eyebrow">SLA cockpit</p>
          <h2>{slaHealth}% on-time</h2>
          <p>
            {slaBreaches.length} claim(s) require attention. Escalations auto-issue to Finance + Retail leadership with
            context from crd2f_audittrail.
          </p>
          <ul>
            {slaBreaches.map((claim) => (
              <li key={claim.crd2f_promotionclaimid}>
                <strong>{claim.crd2f_claimnumber}</strong> {formatAmount(claim.crd2f_claimamount)} · Breached
              </li>
            ))}
            {!slaBreaches.length && <li className="muted">All tracked claims are within SLA.</li>}
          </ul>
        </div>
      </section>

      <section className="repository">
        <div className="section-heading">
          <h2>Proof of execution vault</h2>
          <p>Uploads powered by crd2f_promotionproof with validation gates.</p>
        </div>
        <div className="repository-grid">
          {proofShowcase.map((proof) => (
            <article key={proof.id} className="repository-card">
              <header>
                <strong>{proof.channel}</strong>
                <span>{proof.timestamp}</span>
              </header>
              <ul>
                {proof.assets.map((asset) => (
                  <li key={asset}>{asset}</li>
                ))}
              </ul>
              <footer>Uploaded by {proof.uploadedBy} · Linked deal evidence</footer>
            </article>
          ))}
        </div>
      </section>

      <section className="vendor-interface">
        <div className="section-heading">
          <h2>Vendor collaboration</h2>
          <p>Secure, limited-access workspace referencing crd2f_vendor & systemuser.</p>
        </div>
        <div className="vendor-grid">
          {vendorSpotlight.map((vendor) => (
            <article key={vendor.id} className="vendor-card">
              <header>
                <strong>{vendor.name}</strong>
                <span>{vendor.category}</span>
              </header>
              <p>{vendor.contact}</p>
              <div className="vendor-stats">
                <div>
                  <span>Upcoming promos</span>
                  <strong>{vendor.upcomingPromotions}</strong>
                </div>
                <div>
                  <span>Pending claims</span>
                  <strong>{vendor.pendingClaims}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="audit-access">
        <div className="audit-panel">
          <div className="section-heading">
            <h2>Comprehensive audit trail</h2>
            <p>crd2f_audittrail keeps every action time-stamped & user-attributed.</p>
          </div>
          <ul className="audit-list">
            {auditTrail.map((event) => (
              <li key={event.id}>
                <strong>{event.action}</strong>
                <span>{event.timestamp}</span>
                <small>{event.user}</small>
                <p>{event.impact}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="access-panel">
          <div className="section-heading">
            <h2>Role-based access</h2>
            <p>Enforced through crd2f_userrole + systemuser assignments.</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Scope</th>
                <th>Edit</th>
                <th>Approve</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {roleMatrix.map((role) => (
                <tr key={role.role}>
                  <td>{role.role}</td>
                  <td>{role.scope}</td>
                  <td>{role.canEdit ? '●' : '—'}</td>
                  <td>{role.canApprove ? '●' : '—'}</td>
                  <td>{role.canAudit ? '●' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="validation">
        <div className="section-heading">
          <h2>Validation rules & control gates</h2>
          <p>Prevents duplicates, expired promotions, incomplete packages, and missing approvals.</p>
        </div>
        <ul className="validation-list">
          {validationControls.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="training">
        <div className="section-heading">
          <h2>Training & change management</h2>
          <p>Structured adoption plan, manuals, and FAQ bundles.</p>
        </div>
        <div className="training-grid">
          {trainingResources.map((resource) => (
            <article key={resource.title} className="training-card">
              <h3>{resource.title}</h3>
              <p>{resource.format}</p>
              <span>{resource.target}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function App() {
  return (
    <DataverseProvider>
      <Workspace />
    </DataverseProvider>
  )
}

export default App
