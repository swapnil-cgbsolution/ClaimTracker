import { useMemo, useState } from 'react'
import './App.css'

type PromotionDeal = {
  id: string
  name: string
  vendor: string
  value: number
  stage: string
  approvalOwner: string
  slaHours: number
  risk: 'Low' | 'Medium' | 'High'
}

type ClaimRecord = {
  claimId: string
  dealRef: string
  amount: number
  stage: string
  slaStatus: 'On Track' | 'At Risk' | 'Breached'
  owner: string
}

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

const deals: PromotionDeal[] = [
  {
    id: 'DL-9087',
    name: 'Back-to-School Bundle',
    vendor: 'HP Middle East',
    value: 420000,
    stage: 'Initiation',
    approvalOwner: 'Retail Programs',
    slaHours: 48,
    risk: 'Low',
  },
  {
    id: 'DL-9131',
    name: 'Festive Weekend Flash Sale',
    vendor: 'Samsung',
    value: 610000,
    stage: 'Approval',
    approvalOwner: 'Finance Review',
    slaHours: 36,
    risk: 'Medium',
  },
  {
    id: 'DL-9190',
    name: 'Accessory Add-on Booster',
    vendor: 'Belkin',
    value: 125000,
    stage: 'Execution',
    approvalOwner: 'Marketing Ops',
    slaHours: 72,
    risk: 'Low',
  },
  {
    id: 'DL-9214',
    name: 'Vendor Funded Warranty',
    vendor: 'LG Electronics',
    value: 880000,
    stage: 'Settlement',
    approvalOwner: 'Finance Ops',
    slaHours: 24,
    risk: 'High',
  },
]

const claims: ClaimRecord[] = [
  {
    claimId: 'CLM-4551',
    dealRef: 'DL-9131',
    amount: 245000,
    stage: 'Validation',
    slaStatus: 'On Track',
    owner: 'Finance Review',
  },
  {
    claimId: 'CLM-4557',
    dealRef: 'DL-9214',
    amount: 610000,
    stage: 'Finance Review',
    slaStatus: 'At Risk',
    owner: 'Finance Ops',
  },
  {
    claimId: 'CLM-4560',
    dealRef: 'DL-9190',
    amount: 98000,
    stage: 'Settlement',
    slaStatus: 'Breached',
    owner: 'Payments',
  },
]

const proofs: ProofOfExecution[] = [
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

const vendors: VendorProfile[] = [
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

const statusBoard = [
  { label: 'Pending approvals', value: 12, trend: '+3', table: 'crd2f_promotionstatus' },
  { label: 'Claims at risk', value: 4, trend: '+1', table: 'crd2f_promotionclaim' },
  { label: 'Escalations', value: 2, trend: '0', table: 'crd2f_audittrail' },
  { label: 'Vendor tasks', value: 9, trend: '-2', table: 'crd2f_vendor' },
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

function App() {
  const [activeStage, setActiveStage] = useState(stageFlow[1].stage)

  const repositoryStats = useMemo(
    () => ({
      deals: deals.length,
      documents: proofs.reduce((acc, proof) => acc + proof.assets.length, 0),
      vendors: vendors.length,
      openClaims: claims.length,
    }),
    []
  )

  const stageQueue = useMemo(
    () => deals.filter((deal) => deal.stage === activeStage),
    [activeStage]
  )

  const slaBreaches = useMemo(
    () => claims.filter((claim) => claim.slaStatus !== 'On Track'),
    []
  )

  const slaHealth = Math.round(
    ((claims.length - slaBreaches.length) / claims.length) * 100
  )

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Sharaf DG · Promotion Command Center</p>
          <h1>Claim Tracker for vendor-funded promotions</h1>
          <p className="lead">
            A single, secure workspace orchestrating deal sheets, approvals, proof of
            execution, and claim settlement. Every action is versioned, every
            stakeholder stays informed, and every SLA is monitored.
          </p>
          <div className="hero__actions">
            <button className="cta">Launch workflow</button>
            <button className="ghost">View vendor portal</button>
          </div>
        </div>
        <div className="hero__metrics">
          <div className="metric-card">
            <span>Active deals</span>
            <strong>{repositoryStats.deals}</strong>
            <small>crd2f_promotiondeal</small>
          </div>
          <div className="metric-card">
            <span>Documents stored</span>
            <strong>{repositoryStats.documents}</strong>
            <small>crd2f_promotionproof</small>
          </div>
          <div className="metric-card">
            <span>Vendors engaged</span>
            <strong>{repositoryStats.vendors}</strong>
            <small>crd2f_vendor</small>
          </div>
          <div className="metric-card">
            <span>Open claims</span>
            <strong>{repositoryStats.openClaims}</strong>
            <small>crd2f_promotionclaim</small>
          </div>
        </div>
      </header>

      <section className="insights-grid">
        <article className="insight-card">
          <div>
            <p className="eyebrow">Centralized repository</p>
            <h2>Every promotion artifact in one vault</h2>
            <p>
              Store deal sheets, agreements, proofs, and claim notes with lineage back to
              the originating Dataverse tables. Finance, Retail, Marketing, and Vendor
              Management operate on the same source of truth.
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
              Digitally route submissions, approvals, document uploads, and control gates.
              Smart escalations trigger when SLA thresholds are crossed.
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
              System-generated notifications flag pending approvals, proof deadlines,
              claim cut-off dates, and escalations for leadership visibility.
            </p>
          </div>
          <div className="alert-feed">
            {claims.map((claim) => (
              <div
                key={claim.claimId}
                className={`alert-chip status-${claim.slaStatus
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
              >
                <strong>{claim.claimId}</strong>
                <span>{claim.slaStatus}</span>
                <small>{claim.stage}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="insight-card">
          <div>
            <p className="eyebrow">Vendor contracts</p>
            <h2>Every claim tied back to the source agreement</h2>
            <p>
              Validate promotional claims against stored vendor contracts. Exceptions are
              blocked unless matching commercial terms exist.
            </p>
          </div>
          <div className="contract-pill">Linked agreements · 100% coverage</div>
        </article>
      </section>

      <section className="workflow">
        <div className="section-heading">
          <h2>Deal & claim workflow</h2>
          <p>Governed via crd2f_promotionstatus with systemuser ownership and audit logs.</p>
        </div>
        <div className="timeline">
          {stageFlow.map((stage) => (
            <button
              key={stage.stage}
              className={`timeline-step ${activeStage === stage.stage ? 'active' : ''}`}
              onClick={() => setActiveStage(stage.stage)}
            >
              <span>{stage.stage}</span>
              <p>{stage.description}</p>
              <small>
                Control gate: {stage.gate} · SLA {stage.sla}
              </small>
            </button>
          ))}
        </div>
        <div className="stage-detail">
          <div>
            <h3>Queue · {activeStage}</h3>
            <p>{stageQueue.length} deal(s) waiting on this gate.</p>
          </div>
          <div className="deal-pills">
            {stageQueue.map((deal) => (
              <div key={deal.id} className={`deal-pill risk-${deal.risk.toLowerCase()}`}>
                <strong>{deal.name}</strong>
                <span>{deal.vendor}</span>
                <small>SLA {deal.slaHours}h · Owner {deal.approvalOwner}</small>
              </div>
            ))}
            {stageQueue.length === 0 && <p className="muted">No deals in this stage.</p>}
          </div>
        </div>
      </section>

      <section className="status-alerts">
        <div className="status-board">
          <div className="section-heading">
            <h2>Status radar</h2>
            <p>Live tiles mapped to Dataverse tables.</p>
          </div>
          <div className="status-grid">
            {statusBoard.map((tile) => (
              <div key={tile.label} className="status-tile">
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
                <small>{tile.table}</small>
                <em>{tile.trend} today</em>
              </div>
            ))}
          </div>
        </div>
        <div className="sla-card">
          <p className="eyebrow">SLA cockpit</p>
          <h2>{slaHealth}% on-time</h2>
          <p>
            {slaBreaches.length} claim(s) require attention. Escalations auto-issue to
            Finance + Retail leadership with context from crd2f_audittrail.
          </p>
          <ul>
            {slaBreaches.map((claim) => (
              <li key={claim.claimId}>
                <strong>{claim.claimId}</strong> {currencyFormatter.format(claim.amount)} ·{' '}
                {claim.slaStatus}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="repository">
        <div className="section-heading">
          <h2>Proof of execution vault</h2>
          <p>Uploads powered by crd2f_promotionproof with validation gates.</p>
        </div>
        <div className="repository-grid">
          {proofs.map((proof) => (
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
              <footer>
                Uploaded by {proof.uploadedBy} · Linked deal evidence
              </footer>
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
          {vendors.map((vendor) => (
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

export default App
