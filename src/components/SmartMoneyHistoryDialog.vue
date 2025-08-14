<template>
    <v-dialog v-model="visibleLocal" max-width="1200" transition="dialog-bottom-transition">
        <v-card rounded="xl" elevation="0" class="history-card">
            <v-card-title class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
                    <v-icon icon="mdi-star-outline" color="warning" class="me-2" />
                    <span>精选聪明钱历史记录</span>
                    <v-menu open-on-hover location="bottom">
                        <template #activator="{ props }">
                            <v-chip v-bind="props" size="small" color="info" variant="flat">共有 {{ curatedWallets.length }} 个地址</v-chip>
                        </template>
                        <v-card class="addr-popover" elevation="2">
                            <div class="addr-grid">
                                <div v-for="addr in curatedWallets" :key="addr" class="addr-item monospace" :title="addr">
                                    {{ formatAddress(addr) }}
                                </div>
                            </div>
                        </v-card>
                    </v-menu>
                    <v-chip size="small" color="success" variant="flat" v-if="filteredRows.length">筛后 {{
                        filteredRows.length }} 条</v-chip>
                </div>
                <v-btn icon="mdi-close" variant="text" @click="visibleLocal = false" />
            </v-card-title>

            <v-card-text>
                <v-row class="mb-4" align="center" no-gutters>
                    <v-col cols="12" md="3" class="pe-md-2 mb-2 mb-md-0">
                        <v-text-field v-model.number="minMcap" type="number" label="市值下限 (USD)" density="compact"
                            variant="outlined" :hide-details="true" />
                    </v-col>
                    <v-col cols="12" md="3" class="px-md-2 mb-2 mb-md-0">
                        <v-select :items="tradeOptions" v-model="selectedTradeTypes" label="交易类型" multiple chips
                            density="compact" variant="outlined" :hide-details="true" />
                    </v-col>
                    <v-col cols="12" md="3" class="px-md-2 mb-2 mb-md-0">
                        <v-select :items="pageSizes" v-model="pageSize" label="每个地址拉取条数" density="compact"
                            variant="outlined" :hide-details="true" />
                    </v-col>
                    <v-col cols="12" md="3" class="ps-md-2 d-flex gap-2">
                        <v-text-field v-model.number="recentDays" type="number" label="最近N天" density="compact"
                            variant="outlined" :hide-details="true" min="1" />
                        <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="fetchAll">
                            刷新数据
                        </v-btn>
                    </v-col>
                </v-row>

                <v-alert type="info" variant="tonal" class="mb-4">
                    展示 Solana (chainId=501) 的买卖记录。根据市值阈值过滤后，按时间倒序展示。
                </v-alert>

                <v-row class="mb-4" align="center" no-gutters>
                    <v-col cols="12">
                        <div class="d-flex align-center gap-4">
                            <div class="me-4">进度：{{ completedRequests }} / {{ totalRequests }}（{{ progress }}%）</div>
                            <v-progress-linear :model-value="progress" height="10" rounded color="primary" style="flex:1" />
                        </div>
                    </v-col>
                </v-row>

                <v-data-table :headers="headers" :items="groupedRows" :loading="loading" :items-per-page="-1"
                    hide-default-footer class="history-table" show-expand v-model:expanded="expanded" :single-expand="true" :item-value="'groupKey'"
                    density="comfortable" fixed-header height="60vh">
                    <template #[`item.time`]="{ item }">
                        <span>{{ item.timeFormatted }} · {{ item.relativeTime }}</span>
                    </template>
                    <template #[`item.token`]="{ item }">
                        <div class="d-flex align-center gap-2">
                            <v-avatar size="20">
                                <v-img :src="item.tokenLogo" alt="logo" />
                            </v-avatar>
                            <span>{{ item.tokenSymbol }}</span>
                        </div>
                    </template>
                    <template #[`item.tokenContractAddress`]="{ item }">
                        <div class="addr-cell">
                            <a :href="`https://dexscreener.com/solana/${item.tokenContractAddress}`" target="_blank"
                                class="addr-link" :title="item.tokenContractAddress">{{ formatAddress(item.tokenContractAddress) }}</a>
                        </div>
                    </template>
                    <template #[`item.walletAddress`]="{ item }">
                        <div class="addr-cell">
                            <a :href="`https://solscan.io/account/${item.walletAddress}`" target="_blank"
                                class="addr-link" :title="item.walletAddress">{{ formatAddress(item.walletAddress) }}</a>
                        </div>
                    </template>
                    <template #[`item.mcap`]="{ item }"><span class="numeric monospace">${{ formatNumber(toFixedNumber(item.mcap)) }}</span></template>
                    <template #[`item.turnover`]="{ item }"><span class="numeric monospace">${{ formatNumber(toFixedNumber(item.turnover)) }}</span></template>
                    <template #[`item.type`]="{ item }">
                        <v-chip :color="getTypeColor(item.type)" size="small" variant="flat">{{ getTypeText(item.type) }}</v-chip>
                    </template>
                    <template #[`item.tx`]="{ item }">
                        <v-btn v-if="!item.isGroup" size="small" variant="text" :href="item.openLink" target="_blank"
                            prepend-icon="mdi-open-in-new">TX</v-btn>
                    </template>
                    <template #expanded-row="{ item }">
                        <td :colspan="headers.length" class="pa-0">
                            <div class="expanded-wrap">
                                <v-table density="compact" class="expanded-table">
                                    <thead>
                                        <tr>
                                            <th class="text-left">时间</th>
                                            <th class="text-center">类型</th>
                                            <th class="text-right">成交额</th>
                                            <th class="text-right">市值</th>
                                            <th class="text-center">交易</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="child in item.children" :key="child.openLink">
                                            <td class="text-left">{{ child.timeFormatted }} · {{ child.relativeTime }}</td>
                                            <td class="text-center">
                                                <v-chip :color="getTypeColor(child.type)" size="x-small" variant="flat">{{ getTypeText(child.type) }}</v-chip>
                                            </td>
                                            <td class="text-right">${{ formatNumber(toFixedNumber(child.turnover)) }}</td>
                                            <td class="text-right">${{ formatNumber(toFixedNumber(child.mcap)) }}</td>
                                            <td class="text-center">
                                                <v-btn size="x-small" variant="text" :href="child.openLink" target="_blank" prepend-icon="mdi-open-in-new">TX</v-btn>
                                            </td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </div>
                        </td>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>
    </v-dialog>

</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { contractAPI } from '@/api/index.js'
import { formatAddress, formatNumber, formatSolanaBlockTimeToUTC8, formatRelativeTime } from '@/utils/index.js'

const props = defineProps({
    visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'show-message'])

const visibleLocal = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
})

// 本地精选地址（可替换为你的地址列表）
const curatedWallets = ref([
    '9yYya3F5EJoLnBNKW6z4bZvyQytMXzDcpU5D6yYr4jqL',
    '7azv99nzG6KYzkAP3uTN7trfUFtEqzXw1Pxy8MsR8R6P',
    'HUzZ1MrEUXrdPJoAnn5B8uTcshwyyXxFW1EqY2dvcVhe',
    'winkACDSxstg19HJgX1pwDGpD8f2ZpiqqAjyAbkgXLu',
    '5h7yzwmrGoG2BmxNCqNR2EnSv1LWCFo7n6SKSh5ZWkfE',
    'HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp',
    'FTg1gqW7vPm4kdU1LPM7JJnizbgPdRDy2PitKw6mY27j',
    'DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm',
    '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP',
    'EfwJn8cXCYhcGrsavxWSDbUFHPrCK9gvdCr6AVywFBPg',
    '3qAKQ1c6gawUVNheSBmUVhMgKg7EqT1aHw72ZKmC8Jmk',
    '3JbCsBJbRncrJbwmKYo5ww3uMuRgZ2LkS9LY7pZxu5v1',
    'Ay9wnuZCRTceZJuRpGZnuwYZuWdsviM4cMiCwFoSQiPH',
    '42cfcPtPRHN6YQkWMzFhD9N67XWNZnAARYdMoR7RjsLX',
    '2m5498hY3hpSvm1pVyZwwyU6bpQGFGu3PADSoEoZFXQB',
    '45yBcpnzFTqLYQJtjxsa1DdZkgrTYponCg6yLQ6LQPu6',
    '8zFZHuSRuDpuAR7J6FzwyF3vKNx4CVW3DFHJerQhc7Zd',
    'CWvdyvKHEu8Z6QqGraJT3sLPyp9bJfFhoXcxUYRKC8ou',
    'D6nUhQ7o3TQwk243mgVS5hsdkuJk71fxZib3KxY4Upyv',
    'G1pRtSyKuWSjTqRDcazzKBDzqEF96i1xSURpiXj3yFcc',
    'HaZtFxgw99iM97LxmwFuDW6k4MP1XwsWTGoy7GUoSELj',
    'A4DCAjDwkq5jYhNoZ5Xn2NbkTLimARkerVv81w2dhXgL',
    '9688Erg7hv2HwdJjRR5Q1VSMbur7T6X6LuFat1R8o9Gr',
    '71CPXu3TvH3iUKaY1bNkAAow24k6tjH473SsKprQBABC',
    'DScqtGwFoDTme2Rzdjpdb2w7CtuKc6Z8KF7hMhbx8ugQ',
    '8T9mnATndr2aUw9r28uTtxKSh2JfqJwrctW6XaWPHTgy',
    '8yJFWmVTQq69p6VJxGwpzW7ii7c5J9GRAtHCNMMQPydj',
    'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm',
    'GFJhtZuENEB9StZiacHUd1aoBoCtY2wWLskhgwcyfaYN',
    '3rSZJHysEk2ueFVovRLtZ8LGnQBMZGg96H2Q4jErspAF',
    '4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t'
])


const minMcap = ref(500000)
const selectedTradeTypes = ref([1])
const tradeOptions = [
    { title: '买入', value: 1 },
    { title: '卖出', value: 2 }
]
const pageSizes = [50, 100, 200]
const pageSize = ref(100)
const recentDays = ref(3)
const groupByToken = ref(true)
const expanded = ref([])

const loading = ref(false)
const rows = ref([])
const completedRequests = ref(0)
const totalRequests = computed(() => {
    const typeCount = (selectedTradeTypes.value && selectedTradeTypes.value.length) ? selectedTradeTypes.value.length : 2
    return curatedWallets.value.length * typeCount
})
const progress = computed(() => {
    if (!totalRequests.value) return 0
    return Math.min(100, Math.round((completedRequests.value / totalRequests.value) * 100))
})

const headers = [
    { title: '时间', key: 'time', align: 'start', width: 170 },
    { title: '类型', key: 'type', align: 'center', width: 80 },
    { title: '代币', key: 'token', align: 'start', width: 160 },
    { title: '代币地址', key: 'tokenContractAddress', align: 'start', width: 220 },
    { title: '成交额', key: 'turnover', align: 'end', width: 120 },
    { title: '市值', key: 'mcap', align: 'end', width: 140 },
    { title: '钱包', key: 'walletAddress', align: 'start', width: 220 },
    // { title: '交易', key: 'tx', align: 'center', width: 80 }
]

// 分组逻辑
const groupedRows = computed(() => {
    const groups = new Map()
    for (const row of filteredRows.value) {
        const groupKey = `${row.walletAddress}_${row.tokenContractAddress}`
        if (!groups.has(groupKey)) {
            groups.set(groupKey, {
                ...row,
                isGroup: true,
                children: [],
                totalTurnover: 0,
                groupKey
            })
        }
        const group = groups.get(groupKey)
        group.children.push(row)
        group.totalTurnover += (parseFloat(row.turnover) || 0)
    }
    return Array.from(groups.values()).map(group => {
        group.children.sort((a, b) => b.blockTime - a.blockTime)
        const latest = group.children[0]
        const types = [...new Set(group.children.map(c => c.type))]
        const mixedType = types.length > 1 ? 'mixed' : types[0]
        return {
            ...group,
            timeFormatted: latest.timeFormatted,
            relativeTime: latest.relativeTime,
            blockTime: latest.blockTime,
            turnover: group.totalTurnover,
            mcap: latest.mcap,
            type: mixedType
        }
    }).sort((a, b) => b.blockTime - a.blockTime)
})

const displayItems = computed(() => {
    return groupByToken.value ? groupedRows.value : filteredRows.value
})

const getTypeColor = (type) => {
    if (type === 1) return 'success'
    if (type === 2) return 'error'
    return 'warning'
}

const getTypeText = (type) => {
    if (type === 1) return '买入'
    if (type === 2) return '卖出'
    return '混合'
}

const toFixedNumber = (val) => {
    const num = parseFloat(val)
    if (isNaN(num)) return 0
    return Math.round(num)
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const isTooManyRequestsError = (e) => {
    const msg = e?.message || ''
    const resMsg = e?.response?.data?.msg || e?.response?.data?.detailMsg || ''
    return e?.response?.status === 429 || /too many requests/i.test(msg) || /too many requests/i.test(resMsg)
}

const getWalletHistoryWithRetry = async (params, retries = 3, baseDelayMs = 600) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await contractAPI.getWalletTradeHistory(params)
        } catch (e) {
            if (attempt < retries && isTooManyRequestsError(e)) {
                const backoff = baseDelayMs * Math.pow(2, attempt)
                await sleep(backoff)
                continue
            }
            throw e
        }
    }
}

const filteredRows = computed(() => {
    const min = Number(minMcap.value) || 0
    const days = Number(recentDays.value) || 0
    const threshold = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0
    return rows.value
        .filter(r => selectedTradeTypes.value.includes(r.type))
        .filter(r => (parseFloat(r.mcap) || 0) >= min)
        .filter(r => (Number(r.blockTime) || 0) >= threshold)
        .sort((a, b) => b.blockTime - a.blockTime)
})

const mapRow = (raw, walletAddress, tradeType) => ({
    timeFormatted: formatSolanaBlockTimeToUTC8(raw.blockTime),
    blockTime: Number(raw.blockTime),
    relativeTime: formatRelativeTime(raw.blockTime),
    tokenContractAddress: raw.tokenContractAddress,
    tokenSymbol: raw.tokenSymbol,
    tokenLogo: raw.tokenLogo,
    turnover: raw.turnover,
    mcap: raw.mcap,
    type: tradeType,
    openLink: raw.openLink,
    walletAddress
})

const fetchForWallet = async (wallet) => {
    const results = []
    const types = selectedTradeTypes.value.length ? selectedTradeTypes.value : [1, 2]
    for (const t of types) {
        const res = await getWalletHistoryWithRetry({ walletAddress: wallet, chainId: '501', pageSize: pageSize.value, tradeType: t })
        if (res && res.data && Array.isArray(res.data.rows)) {
            for (const r of res.data.rows) {
                results.push(mapRow(r, wallet, t))
            }
        }
        completedRequests.value += 1
        // 请求之间添加小延迟，进一步降低触发限频概率
        await sleep(250)
    }
    return results
}

const fetchAll = async () => {
    if (!curatedWallets.value.length) {
        emit('show-message', '地址列表为空，请先配置精选地址', 'warning')
        return
    }
    loading.value = true
    rows.value = []
    completedRequests.value = 0
    try {
        // 顺序获取所有地址数据，控制请求速率，最终一次性渲染
        const aggregated = []
        for (const wallet of curatedWallets.value) {
            const list = await fetchForWallet(wallet)
            aggregated.push(...list)
            // 地址之间增加延迟
            await sleep(200)
        }
        rows.value = aggregated
        emit('show-message', `拉取完成，共 ${aggregated.length} 条`, 'success')
    } catch (e) {
        emit('show-message', e?.message || '拉取失败', 'error')
    } finally {
        loading.value = false
    }
}


watch(() => props.visible, (v) => {
    if (v && !rows.value.length) {
        // 自动首次拉取
        fetchAll()
    }
})

defineExpose({ fetchAll })
</script>

<style scoped>
.history-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 102, 204, 0.2);
}

.v-theme--dark .history-card {
    background: rgba(26, 26, 46, 0.9);
    border: 1px solid rgba(0, 212, 255, 0.3);
}

.addr-link {
    color: #0066cc;
    text-decoration: none;
}

.v-theme--dark .addr-link {
    color: #00d4ff;
}

.history-table {
    background: transparent;
}

.history-table :deep(.v-data-table__th) {
    white-space: nowrap;
}

.addr-cell {
    display: flex;
    align-items: center;
    gap: 6px;
}

.monospace {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.numeric {
    text-align: right;
}

.expanded-wrap {
    background: rgba(0,0,0,0.02);
}

.v-theme--dark .expanded-wrap {
    background: rgba(255,255,255,0.03);
}

.expanded-table {
    width: 100%;
}

.expanded-table thead th {
    font-weight: 600;
    opacity: 0.8;
}

.expanded-table tbody tr:hover {
    background: rgba(0,0,0,0.03);
}

.v-theme--dark .expanded-table tbody tr:hover {
    background: rgba(255,255,255,0.05);
}

.addr-popover {
    padding: 8px 12px;
    max-height: 300px;
    overflow-y: auto;
}

.addr-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 1fr));
    gap: 8px 16px;
}

.addr-item {
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.85;
}
</style>
