import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { getContext } from '@microsoft/power-apps/app'
import type { IContext } from '@microsoft/power-apps/app'
import type {
  Crd2f_promotiondeals,
  Crd2f_promotiondealsBase,
} from '../generated/models/Crd2f_promotiondealsModel'
import type {
  Crd2f_promotionclaims,
  Crd2f_promotionclaimsBase,
} from '../generated/models/Crd2f_promotionclaimsModel'
import type { Crd2f_vendors } from '../generated/models/Crd2f_vendorsModel'
import { Crd2f_promotiondealsService } from '../generated/services/Crd2f_promotiondealsService'
import { Crd2f_promotionclaimsService } from '../generated/services/Crd2f_promotionclaimsService'
import { Crd2f_vendorsService } from '../generated/services/Crd2f_vendorsService'

export type DealDraft = {
  name: string
  description?: string
  category?: string
  startDate?: string
  endDate?: string
}

export type ClaimDraft = {
  claimNumber: string
  amount?: string
  claimDate?: string
  dealId?: string
  vendorId?: string
}

type DataverseContextValue = {
  user?: IContext['user']
  deals: Crd2f_promotiondeals[]
  claims: Crd2f_promotionclaims[]
  vendors: Crd2f_vendors[]
  loading: boolean
  syncing: boolean
  error?: string
  refresh: () => Promise<void>
  createDeal: (draft: DealDraft) => Promise<void>
  createClaim: (draft: ClaimDraft) => Promise<void>
}

const DataverseContext = createContext<DataverseContextValue | undefined>(undefined)

function buildLookupPath(entitySet: string, id: string) {
  return `/${entitySet}(${id})`
}

export function DataverseProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<IContext['user']>()
  const [deals, setDeals] = useState<Crd2f_promotiondeals[]>([])
  const [claims, setClaims] = useState<Crd2f_promotionclaims[]>([])
  const [vendors, setVendors] = useState<Crd2f_vendors[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string>()

  const fetchData = useCallback(async () => {
    const [dealResponse, claimResponse, vendorResponse] = await Promise.all([
      Crd2f_promotiondealsService.getAll({
        orderBy: ['createdon desc'],
        top: 50,
        select: [
          'crd2f_promotiondealid',
          'crd2f_dealname',
          'crd2f_description',
          'crd2f_category',
          'crd2f_startdate',
          'crd2f_enddate',
          'statecode',
          'statuscode',
          'ownerid',
          'owneridname',
          'createdon',
        ],
      }),
      Crd2f_promotionclaimsService.getAll({
        orderBy: ['createdon desc'],
        top: 50,
        select: [
          'crd2f_promotionclaimid',
          'crd2f_claimnumber',
          'crd2f_claimamount',
          'crd2f_claimdate',
          'statecode',
          'statuscode',
          'crd2f_dealname',
          'crd2f_vendorname',
          '_crd2f_deal_value',
          '_crd2f_vendor_value',
          'createdon',
        ],
      }),
      Crd2f_vendorsService.getAll({
        orderBy: ['createdon desc'],
        select: [
          'crd2f_vendorid',
          'crd2f_vendorname',
          'crd2f_email',
          'crd2f_contactperson',
          'crd2f_phone',
        ],
      }),
    ])

    setDeals(dealResponse.data ?? [])
    setClaims(claimResponse.data ?? [])
    setVendors(vendorResponse.data ?? [])
  }, [])

  const withSync = useCallback(
    async (operation: () => Promise<void>) => {
      setSyncing(true)
      try {
        await operation()
        setError(undefined)
      } catch (err) {
        setError((err as Error).message)
        throw err
      } finally {
        setSyncing(false)
      }
    },
    []
  )

  const refresh = useCallback(async () => {
    await withSync(fetchData)
  }, [fetchData, withSync])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const context = await getContext()
        if (!cancelled) {
          setUser(context.user)
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
        }
      }

      try {
        await fetchData()
        if (!cancelled) {
          setError(undefined)
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [fetchData])

  const createDeal = useCallback(
    async (draft: DealDraft) => {
      if (!user?.objectId) {
        throw new Error('User context is not available yet. Try refreshing the app.')
      }

      await withSync(async () => {
        await Crd2f_promotiondealsService.create({
          crd2f_dealname: draft.name,
          crd2f_description: draft.description,
          crd2f_category: draft.category,
          crd2f_startdate: draft.startDate ? new Date(draft.startDate).toISOString() : undefined,
          crd2f_enddate: draft.endDate ? new Date(draft.endDate).toISOString() : undefined,
          ownerid: user.objectId,
          owneridtype: 'systemusers',
          statecode: 0,
        } as Omit<Crd2f_promotiondealsBase, 'crd2f_promotiondealid'>)
        await fetchData()
      })
    },
    [fetchData, user, withSync]
  )

  const createClaim = useCallback(
    async (draft: ClaimDraft) => {
      if (!user?.objectId) {
        throw new Error('User context is not available yet. Try refreshing the app.')
      }

      await withSync(async () => {
        const payload: Partial<Omit<Crd2f_promotionclaimsBase, 'crd2f_promotionclaimid'>> &
          Record<string, unknown> = {
          crd2f_claimnumber: draft.claimNumber,
          crd2f_claimamount: draft.amount,
          crd2f_claimdate: draft.claimDate ? new Date(draft.claimDate).toISOString() : undefined,
          ownerid: user.objectId,
          owneridtype: 'systemusers',
          statecode: 0,
        }

        if (draft.dealId) {
          payload['crd2f_Deal@odata.bind'] = buildLookupPath('crd2f_promotiondeals', draft.dealId)
        }

        if (draft.vendorId) {
          payload['crd2f_Vendor@odata.bind'] = buildLookupPath('crd2f_vendors', draft.vendorId)
        }

        await Crd2f_promotionclaimsService.create(
          payload as Omit<Crd2f_promotionclaimsBase, 'crd2f_promotionclaimid'>
        )
        await fetchData()
      })
    },
    [fetchData, user, withSync]
  )

  const value = useMemo(
    () => ({
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
    }),
    [user, deals, claims, vendors, loading, syncing, error, refresh, createDeal, createClaim]
  )

  return <DataverseContext.Provider value={value}>{children}</DataverseContext.Provider>
}

export function useDataverse() {
  const context = useContext(DataverseContext)
  if (!context) {
    throw new Error('useDataverse must be used within a DataverseProvider')
  }
  return context
}
