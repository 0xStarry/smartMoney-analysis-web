<template>
    <v-dialog v-model="visibleLocal" max-width="1200" transition="dialog-bottom-transition">
        <v-card rounded="xl" elevation="0" class="history-card">
            <v-card-title class="d-flex align-center justify-space-between">
                <div class="d-flex align-center gap-2">
                    <v-icon icon="mdi-star-outline" color="warning" class="me-2" />
                    <span>精选聪明钱历史记录</span>
                    <v-menu open-on-hover location="bottom">
                        <template #activator="{ props }">
                            <v-chip v-bind="props" size="small" color="info" variant="flat">共有 {{
                                currentWallets.length
                                }} 个地址</v-chip>
                        </template>
                        <v-card class="addr-popover" elevation="2">
                            <div class="addr-grid">
                                <div v-for="addr in currentWallets" :key="addr" class="addr-item monospace"
                                    :title="addr">
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
                    <v-col cols="12" md="2" class="pe-md-2 mb-2 mb-md-0">
                        <v-select :items="chainOptions" v-model="selectedChain" label="选择链" density="compact"
                            variant="outlined" :hide-details="true" />
                    </v-col>
                    <v-col cols="12" md="2" class="px-md-2 mb-2 mb-md-0">
                        <v-text-field v-model.number="minMcap" type="number" label="市值下限 (USD)" density="compact"
                            variant="outlined" :hide-details="true" />
                    </v-col>
                    <v-col cols="12" md="2" class="px-md-2 mb-2 mb-md-0">
                        <v-select :items="tradeOptions" v-model="selectedTradeTypes" label="交易类型" multiple chips
                            density="compact" variant="outlined" :hide-details="true" />
                    </v-col>
                    <v-col cols="12" md="2" class="px-md-2 mb-2 mb-md-0">
                        <v-select :items="pageSizes" v-model="pageSize" label="每个地址拉取条数" density="compact"
                            variant="outlined" :hide-details="true" />
                    </v-col>
                    <v-col cols="12" md="2" class="px-md-2 mb-2 mb-md-0">
                        <v-text-field v-model.number="recentDays" type="number" label="最近N天" density="compact"
                            variant="outlined" :hide-details="true" min="1" />
                    </v-col>
                    <v-col cols="12" md="2" class="ps-md-2">
                        <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="fetchAll" block>
                            刷新数据
                        </v-btn>
                    </v-col>
                </v-row>

                <v-alert type="info" variant="tonal" class="mb-4">
                    展示 {{ selectedChain === '501' ? 'Solana' : 'BSC' }} (chainId={{ selectedChain }})
                    的买卖记录。根据市值阈值过滤后，按时间倒序展示。
                </v-alert>

                <v-row class="mb-4" align="center" no-gutters>
                    <v-col cols="12">
                        <div class="d-flex align-center gap-4">
                            <div class="me-4">进度：{{ completedRequests }} / {{ totalRequests }}（{{ progress }}%）</div>
                            <v-progress-linear :model-value="progress" height="10" rounded color="primary"
                                style="flex:1" />
                        </div>
                    </v-col>
                </v-row>

                <v-data-table :headers="headers" :items="groupedRows" :loading="loading" :items-per-page="-1"
                    hide-default-footer class="history-table" show-expand v-model:expanded="expanded"
                    :single-expand="true" :item-value="'groupKey'" density="comfortable" fixed-header height="60vh">
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
                                class="addr-link" :title="item.tokenContractAddress">{{
                                    formatAddress(item.tokenContractAddress) }}</a>
                            <v-btn icon="mdi-content-copy" variant="text" size="small"
                                @click="copyAddress(item.tokenContractAddress)" class="copy-btn"
                                :title="`复制 ${item.tokenContractAddress}`" />
                        </div>
                    </template>
                    <template #[`item.walletAddress`]="{ item }">
                        <div class="addr-cell">
                            <a :href="`https://solscan.io/account/${item.walletAddress}`" target="_blank"
                                class="addr-link" :title="item.walletAddress">{{ formatAddress(item.walletAddress)
                                }}</a>
                        </div>
                    </template>
                    <template #[`item.mcap`]="{ item }"><span class="numeric monospace">${{
                        formatNumber(toFixedNumber(item.mcap)) }}</span></template>
                    <template #[`item.turnover`]="{ item }"><span class="numeric monospace">${{
                        formatNumber(toFixedNumber(item.turnover)) }}</span></template>
                    <template #[`item.type`]="{ item }">
                        <v-chip :color="getTypeColor(item.type)" size="small" variant="flat">{{ getTypeText(item.type)
                            }}</v-chip>
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
                                            <td class="text-left">{{ child.timeFormatted }} · {{ child.relativeTime }}
                                            </td>
                                            <td class="text-center">
                                                <v-chip :color="getTypeColor(child.type)" size="x-small"
                                                    variant="flat">{{ getTypeText(child.type) }}</v-chip>
                                            </td>
                                            <td class="text-right">${{ formatNumber(toFixedNumber(child.turnover)) }}
                                            </td>
                                            <td class="text-right">${{ formatNumber(toFixedNumber(child.mcap)) }}</td>
                                            <td class="text-center">
                                                <v-btn size="x-small" variant="text" :href="child.openLink"
                                                    target="_blank" prepend-icon="mdi-open-in-new">TX</v-btn>
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

// 复制地址到剪贴板
const copyAddress = async (address) => {
    try {
        await navigator.clipboard.writeText(address)
        emit('show-message', '地址已复制到剪贴板', 'success')
    } catch (err) {
        emit('show-message', '复制失败，请手动复制', 'error')
    }
}

const visibleLocal = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
})

// 本地精选地址（可替换为你的地址列表）
const SolCuratedWallets = ref([
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
    '4Be9CvxqHW6BYiRAxW9Q3xu1ycTMWaL5z8NX4HR3ha7t',
    'HYWo71Wk9PNDe5sBaRKazPnVyGnQDiwgXCFKvgAQ1ENp'
])

const bscCurateWallets = ref([
    '0x993d7cd5067d4507b59af0020a64692a4442e2bc',
    '0xa4f1d968c7b2580efe01cfff3e9c627060618cd0',
    '0x7d9471511a6c027e978adaf02014c3d2f40a0571',
    '0x176e6378b7c9010f0456bee76ce3039d36dc37c8',
    '0x7e8fb0392542812476d9f2d0d71c01d1fa0776c5',
    '0x7a2363a401b2340c7941dd2eeff0196a5078d2e6',
    '0xa3d297423b17a3894dddd582dc41ff20e237ab75',
    '0x664d6645a04be9e27a8b33088f85025f29d45dc1',
    '0xa7d4ffc4eca3c71af150ce302560a9d04a1d2b9f',
    '0xa4de109e414acedf0a40c6937515740ef7761919',
    '0xb4829baf3c6d92c943425feb493e40bf7f0100d8',
    '0x44d1cf677ba8ce96bfa398e6cabce5aea891566f',
    '0x7592ca1ad468ddac5a97a5625c1c55e36338f786',
    '0x07cdaf0140c60a0c34681065abf49bb8d85b8cbe',
    '0xe3728fd0ca12381787a05755889bf88950eba3cd',
    '0x6df7f71f8c9786dcbb127bb957e3ec9695d7a66e',
    '0xf78b066050e00fdb9b980e265aa9f317ef4b947c',
    '0xf10ba5ab6d29818d387b5af3faf8e10502754988',
    '0x4e250b99a507ef8ef00c070cfbc719cfb4387a74',
    '0x0a6ae2a16564109cefc178f6df7d98dd60cb6d5c',
    '0x077b9981bc8a2ca417cea41861111da63266988b',
    '0xbc2255fb3746403cf1858a69cdabd2e9be77c538',
    '0x9ba457f105bffac35d67138fecb32a86428c02a2',
    '0x52c9357020a67ba1e39a583c582988ca7b9f2cc4',
    '0xeff07c10eca0575ffa021601c138152efbe9657d',
    '0x9897b49174dc565730ef1d116d80081574ccb3ec',
    '0xd41feaa24dede516a501862cf1f376defb811772',
    '0x6f20ab4899817c8d9228b0978d4fdbebb8ceaeec',
    '0xde1430d9116b17c09bc16281140eb60995858f6b',
    '0x4e0cdf71d301133a896f33fdb726ded87fbc68d3',
    '0xf200ca045110621d3ea98394ae8b7c0467ef7110',
    '0x3475831749ea6c9992e638d01427453b9cc83a12',
    '0x4358cc14888517451baa0b84469221a3feef85cc',
    '0xb9ff27372bedd2515c20515bb7d89d0ec962e0e8',
    '0x7f3fb054e59bc0ceaca7c13423a66565795128c7',
    '0x52616daf9dc68468506a84f9b5c11079e21d7b4c',
    '0xe8ba9e9fb14fe380cda3bb098cb573301fdbbcda',
    '0xa8fcc482f8e04a0d9c4e11f18fee714f48eda4b4',
    '0x5afe6b5b52ce166359db16001e4d801f9f34f125',
    '0xa18309eaa80f271738ea2de6578006ddffaf9dab',
    '0xeb89055e16ae1c1e42ad6770a7344ff5c7b4f31d',
    '0x2b739e4acd1b53132be487d57bbd71b7e8768057',
    '0x695b065ddf17ca69f4b1b77f1a0680cd438f1970',
    '0xf54f69832ac99e66e29caf854aa972388b3c25bd',
    '0x558e254c1399766bddbabe6a5b3d44ccf627dbc4',
    '0xfcfc3cd8cc507d73619221629131f209bff937b6',
    '0x77a692e79fff538aa4c4101aefdbc8f724b4f54f',
    '0x4df495b783a9e849eebbe431d881d43a26f0f686',
    '0xf100af33f90445d1d482fb63df3f6cdb475eeb0f',
    '0x0f84d2da979180394fbf9c4499febd0f602a6767',
    '0x666a01ef0f1888ee1e94ee9ab34f4714c21beeea',
    '0x9f12f27e9d64ed061fec82d61b46702189f529d4',
    '0xa0b2759802f050bed231a7cc109bb2afe9f6078e',
    '0x2364a0fbbb1c8d063daf1adce136b9f5fb3d7eb8',
    '0x00567d0e8187ee3ae5ea55b531fd436266b15d9e',
    '0xb131e3f2d756183432a0b892523cc4c886f6f914',
    '0x4959ad9145030d5a2f3cce66ca4da8b3d35dbe1d',
    '0x8aab2decdccfa5f2bd4f5bf6545ded7ceab11c49',
    '0x928743e2b2edff9d87b570b2db0928074785ac38',
    '0x1bbd23f857be358643365e268556691f89c48e00',
    '0xe45966b2b3b7868c07db92016188ffa86356053e',
    '0x8f6d0f905e3db36349474334b530e1ad6a0bb330',
    '0x7551fd7a88afd941ddcc0a4f1cb62cf85afdae61',
    '0x0314e136b60931c443d352eb083af26c04db3f12',
    '0x72bb99200a89e608658a9032aad5aef6a41dd46f',
    '0x06d90948fde68893600ee352a4e8d440731c6547',
    '0x9dbfded199ee3a6b291c223e65f97d387156aada',
    '0xeb1222a0c07d4e62b0235d8b4b3e7e617d259be2',
    '0x914b6cd608bfb6dce32c4629096d4961a448b1d3',
    '0xedc7c552077bbe04f61a52c9d17bce85154f1fc4',
    '0x979c9b3c6d9b370209b9c771d6b34ff091698364',
    '0x9debaf794213659d12b289653588f1339c11e209',
    '0xcc264070a633591502f16a19ecffb4851ba2c2d7',
    '0x819ac645ff9bdda7fd6f1fdf8dabc584c88578a6',
    '0x592ba6876b70f795ec14601c69a03e5ea2268f50',
    '0x41ccc209d3ba4e81ef0c1fcb6d191127fb5b42f5',
    '0x13c0e0590412fcf5b9adcde9178d5c0bdd19a550',
    '0x2048924b957edb87084c57ec0d38437e3330521a',
    '0xd4229d8166dbaa45689589d59fa968abc840b20f',
    '0x3d06315c94ac30b6061c91caf748fc2db04a89f4',
    '0x3e57efef507b4db7acfa2ee79ceca6b19e18d106',
    '0x4b10707123c79f6e99be486dcd95d60323988d76',
    '0x07cca5374b11c668e0f424b7ed6d68c768721d3d',
    '0x567469503dbe791e2676e838cd39c115feb34e60',
    '0x7b9761145ef55f33dfcd514f1e20f5313da978af',
    '0x5b15c5cd7caeb8df8d7c2e49e449f4b0fd5660c5',
    '0xdbcab9fb33375cfa6fa1a1c4982e740f2d1fb979',
    '0xb5b731f340554b672f686ca8459d55ced5e5bda4',
    '0x5250dbcf6ac11c4c2cbd8dcaf5a6d019f3268ea8',
    '0x2f84ebb2f7f8edcf8e83a75a12f32bd8d99de3e0',
    '0x3a8f9f86b0a23185853d70472b0068220d9b44db',
    '0xd03353d8a531a7b05509f35fadef3e042188bdb5',
    '0x7325f5ba83cf8942b3941d874bf1aac13f0d5108',
    '0xc1a3f323b26aff63bb18db0f61b49324e2583d5c',
    '0x86e0f0ea0d345d852f5918893924d61c18e6e766',
    '0x3f85a5d2e0c6a0585c31229a325247c0ef07bc18',
    '0xf6dc9b733594900bf3e4b2d5c874f7b4b0705569',
    '0x7b57192eccd676107ef9fd2e0ab0815e596cbf98',
    '0xc40644aa6e0dcb974109bacad3c6215a22ca9470',
])


const selectedChain = ref('501')
const chainOptions = [
    { title: 'Solana', value: '501' },
    { title: 'BSC', value: '56' }
]
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

const currentWallets = computed(() => {
    return selectedChain.value === '501' ? SolCuratedWallets.value : bscCurateWallets.value
})

const loading = ref(false)
const rows = ref([])
const completedRequests = ref(0)
const totalRequests = computed(() => {
    const typeCount = (selectedTradeTypes.value && selectedTradeTypes.value.length) ? selectedTradeTypes.value.length : 2
    return currentWallets.value.length * typeCount
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
        const res = await getWalletHistoryWithRetry({ walletAddress: wallet, chainId: selectedChain.value, pageSize: pageSize.value, tradeType: t })
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
    if (!currentWallets.value.length) {
        emit('show-message', '地址列表为空，请先配置精选地址', 'warning')
        return
    }
    loading.value = true
    rows.value = []
    completedRequests.value = 0
    try {
        // 顺序获取所有地址数据，控制请求速率，最终一次性渲染
        const aggregated = []
        for (const wallet of currentWallets.value) {
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
    // 已关闭首次自动拉取
    // if (v && !rows.value.length) {
    //     fetchAll()
    // }
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

.copy-btn {
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.6;
    transition: all 0.3s ease;
}

.copy-btn:hover {
    color: #0066cc;
    opacity: 1;
}

.v-theme--dark .copy-btn:hover {
    color: #00d4ff;
    opacity: 1;
}

.monospace {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.numeric {
    text-align: right;
}

.expanded-wrap {
    background: rgba(0, 0, 0, 0.02);
}

.v-theme--dark .expanded-wrap {
    background: rgba(255, 255, 255, 0.03);
}

.expanded-table {
    width: 100%;
}

.expanded-table thead th {
    font-weight: 600;
    opacity: 0.8;
}

.expanded-table tbody tr:hover {
    background: rgba(0, 0, 0, 0.03);
}

.v-theme--dark .expanded-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.05);
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
