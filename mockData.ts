import type {
  Campaign,
  ConversionEvent,
  Device,
  GenerationEvent,
  ModerationEvent,
  Site,
} from '@/types/domain'

export const DEMO_END_DATE = '2026-10-01'

export const sites: Site[] = [
  { id: 'site-01', name: '上海 · 五角场店', city: '上海', type: '旗舰店', status: 'active', accent: '#2d62ce' },
  { id: 'site-02', name: '北京 · 三里屯店', city: '北京', type: '概念店', status: 'active', accent: '#159b79' },
  { id: 'site-03', name: '杭州 · 湖滨店', city: '杭州', type: '旗舰店', status: 'active', accent: '#c7831d' },
  { id: 'site-04', name: '广州 · 天环店', city: '广州', type: '快闪店', status: 'active', accent: '#7c5cc4' },
  { id: 'site-05', name: '深圳 · 万象城店', city: '深圳', type: '概念店', status: 'paused', accent: '#d04a4a' },
]

export const campaigns: Campaign[] = [
  { id: 'campaign-spring', name: '秋日灵感穿搭', modelVersion: 'StyleMix 3.2', moderationPolicy: '标准审核' },
  { id: 'campaign-city', name: '城市漫游计划', modelVersion: 'StyleMix 3.2', moderationPolicy: '加强审核' },
  { id: 'campaign-gift', name: '会员专属写真', modelVersion: 'PortraitFlow 2.8', moderationPolicy: '标准审核' },
]

export const devices: Device[] = [
  { id: 'device-101', name: '沪·互动屏 01', siteId: 'site-01', status: 'online', lastHeartbeat: '2026-10-01 18:29:42', activeJobs: 4, modelVersion: 'StyleMix 3.2' },
  { id: 'device-102', name: '沪·互动屏 02', siteId: 'site-01', status: 'online', lastHeartbeat: '2026-10-01 18:29:38', activeJobs: 2, modelVersion: 'StyleMix 3.2' },
  { id: 'device-201', name: '京·互动屏 01', siteId: 'site-02', status: 'online', lastHeartbeat: '2026-10-01 18:29:51', activeJobs: 5, modelVersion: 'StyleMix 3.2' },
  { id: 'device-202', name: '京·互动屏 02', siteId: 'site-02', status: 'maintenance', lastHeartbeat: '2026-10-01 17:58:06', activeJobs: 0, modelVersion: 'StyleMix 3.2', lastError: '镜头校准中' },
  { id: 'device-301', name: '杭·互动屏 01', siteId: 'site-03', status: 'online', lastHeartbeat: '2026-10-01 18:29:20', activeJobs: 3, modelVersion: 'StyleMix 3.2' },
  { id: 'device-302', name: '杭·互动屏 02', siteId: 'site-03', status: 'offline', lastHeartbeat: '2026-10-01 18:24:12', activeJobs: 0, modelVersion: 'StyleMix 3.2', lastError: '网络心跳超时' },
  { id: 'device-401', name: '穗·互动屏 01', siteId: 'site-04', status: 'online', lastHeartbeat: '2026-10-01 18:29:48', activeJobs: 4, modelVersion: 'PortraitFlow 2.8' },
  { id: 'device-402', name: '穗·互动屏 02', siteId: 'site-04', status: 'online', lastHeartbeat: '2026-10-01 18:29:27', activeJobs: 2, modelVersion: 'PortraitFlow 2.8' },
  { id: 'device-501', name: '深·互动屏 01', siteId: 'site-05', status: 'online', lastHeartbeat: '2026-10-01 18:29:55', activeJobs: 1, modelVersion: 'StyleMix 3.2' },
  { id: 'device-502', name: '深·互动屏 02', siteId: 'site-05', status: 'online', lastHeartbeat: '2026-10-01 18:29:31', activeJobs: 2, modelVersion: 'StyleMix 3.2' },
]

const siteProfiles = {
  'site-01': { success: 0.965, duration: 8.8, scan: 0.3, share: 0.3, reject: 0.025 },
  'site-02': { success: 0.949, duration: 15.2, scan: 0.32, share: 0.1, reject: 0.03 },
  'site-03': { success: 0.865, duration: 10.7, scan: 0.26, share: 0.1, reject: 0.052 },
  'site-04': { success: 0.956, duration: 9.5, scan: 0.25, share: 0.05, reject: 0.021 },
  'site-05': { success: 0.94, duration: 11.2, scan: 0.28, share: 0.38, reject: 0.034 },
} as const

const rejectReasons = [
  '人物边界不完整',
  '疑似品牌元素',
  '画面构图超出提示词范围',
]

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function dateOffset(dayOffset: number) {
  const date = new Date(`${DEMO_END_DATE}T00:00:00`)
  date.setDate(date.getDate() - dayOffset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const generationEvents: GenerationEvent[] = []
export const conversionEvents: ConversionEvent[] = []
export const moderationEvents: ModerationEvent[] = []

let eventIndex = 0
for (let dayOffset = 29; dayOffset >= 0; dayOffset -= 1) {
  const date = dateOffset(dayOffset)
  const weekday = new Date(`${date}T00:00:00`).getDay()
  const weekendFactor = weekday === 0 || weekday === 6 ? 1.3 : 1
  sites.forEach((site, siteIndex) => {
    const profile = siteProfiles[site.id as keyof typeof siteProfiles]
    const hasSuccessDrop = site.id === 'site-01' && date === '2026-09-27'
    const baseVolume = 14 + ((dayOffset + siteIndex * 3) % 8)
    const dailyVolume = Math.round(baseVolume * weekendFactor * (hasSuccessDrop ? 1.45 : 1))
    for (let index = 0; index < dailyVolume; index += 1) {
      const seed = dayOffset * 101 + siteIndex * 19 + index * 7
      const successProbability = hasSuccessDrop ? 0.6 : profile.success
      const success = pseudoRandom(seed) < successProbability
      const hour = 10 + Math.floor(pseudoRandom(seed + 31) * 10)
      const minute = Math.floor(pseudoRandom(seed + 37) * 60)
      const device = devices.filter((item) => item.siteId === site.id)[index % 2]
      const duration = Number((profile.duration + (pseudoRandom(seed + 2) - 0.5) * 3 + (success ? 0 : 2.2)).toFixed(1))
      const sessionId = `session-${dayOffset}-${siteIndex}-${index}`
      const generation: GenerationEvent = {
        id: `generation-${eventIndex}`,
        date,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        sessionId,
        siteId: site.id,
        deviceId: device.id,
        campaignId: campaigns[(siteIndex + index) % campaigns.length].id,
        status: success ? 'success' : 'failed',
        durationSec: Math.max(3.4, duration),
      }
      generationEvents.push(generation)

      if (success) {
        if (pseudoRandom(seed + 3) < profile.scan) {
          conversionEvents.push({ id: `scan-${eventIndex}`, date, sessionId, siteId: site.id, type: 'scan' })
          if (pseudoRandom(seed + 4) < profile.share) {
            conversionEvents.push({ id: `share-${eventIndex}`, date, sessionId, siteId: site.id, type: 'share' })
          }
        }
        const moderationRoll = pseudoRandom(seed + 5)
        const reviewing = moderationRoll >= profile.reject && moderationRoll < profile.reject + 0.05
        const rejected = moderationRoll < profile.reject
        moderationEvents.push({
          id: `moderation-${eventIndex}`,
          date,
          sessionId,
          siteId: site.id,
          result: reviewing ? 'reviewing' : rejected ? 'rejected' : 'approved',
          reason: rejected ? rejectReasons[(siteIndex + index + dayOffset) % rejectReasons.length] : undefined,
        })
      }
      eventIndex += 1
    }
  })
}
