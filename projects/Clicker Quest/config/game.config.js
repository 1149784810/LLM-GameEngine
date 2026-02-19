/**
 * Clicker Quest - 游戏配置文件
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 本文件包含游戏的所有可配置参数
 */

const GameConfig = {
    // ========================================
    // 游戏基础配置
    // ========================================
    version: '1.0.0',
    gameName: 'Clicker Quest',
    
    // ========================================
    // 点击系统配置
    // ========================================
    click: {
        // 基础点击金币
        baseGoldPerClick: 1,
        // 点击冷却时间(毫秒)
        cooldown: 50,
        // 点击判定容错范围(像素)
        toleranceRange: 10
    },
    
    // ========================================
    // 暴击系统配置
    // ========================================
    critical: {
        // 小暴击 (2x)
        small: {
            multiplier: 2,
            baseChance: 10,  // 10%
            maxChance: 50    // 50%
        },
        // 中暴击 (5x)
        medium: {
            multiplier: 5,
            baseChance: 5,   // 5%
            maxChance: 25    // 25%
        },
        // 大暴击 (10x)
        large: {
            multiplier: 10,
            baseChance: 1,   // 1%
            maxChance: 10    // 10%
        }
    },
    
    // ========================================
    // 金币系统配置
    // ========================================
    gold: {
        // 离线收益比例
        offlineRewardRatio: 0.5,
        // 离线时长上限(秒) - 24小时
        maxOfflineTime: 86400,
        // 金币显示格式化阈值
        formatThresholds: {
            k: 1000,
            m: 1000000,
            b: 1000000000,
            t: 1000000000000
        }
    },
    
    // ========================================
    // 自动点击器配置
    // ========================================
    autoClickers: [
        {
            id: 'auto_001',
            name: '实习生',
            type: 'Beginner',
            baseDPS: 0.1,
            basePrice: 15,
            priceMultiplier: 1.07,
            maxLevel: 100
        },
        {
            id: 'auto_002',
            name: '员工',
            type: 'Apprentice',
            baseDPS: 1,
            basePrice: 100,
            priceMultiplier: 1.08,
            maxLevel: 100
        },
        {
            id: 'auto_003',
            name: '主管',
            type: 'Skilled',
            baseDPS: 5,
            basePrice: 500,
            priceMultiplier: 1.09,
            maxLevel: 100
        },
        {
            id: 'auto_004',
            name: '经理',
            type: 'Professional',
            baseDPS: 20,
            basePrice: 2000,
            priceMultiplier: 1.10,
            maxLevel: 100
        },
        {
            id: 'auto_005',
            name: '总监',
            type: 'Director',
            baseDPS: 100,
            basePrice: 10000,
            priceMultiplier: 1.11,
            maxLevel: 100
        },
        {
            id: 'auto_006',
            name: 'VP',
            type: 'VP',
            baseDPS: 500,
            basePrice: 50000,
            priceMultiplier: 1.12,
            maxLevel: 100
        },
        {
            id: 'auto_007',
            name: 'CEO',
            type: 'CEO',
            baseDPS: 2000,
            basePrice: 200000,
            priceMultiplier: 1.13,
            maxLevel: 100
        },
        {
            id: 'auto_008',
            name: '董事会',
            type: 'Board',
            baseDPS: 10000,
            basePrice: 1000000,
            priceMultiplier: 1.14,
            maxLevel: 100
        },
        {
            id: 'auto_009',
            name: '集团',
            type: 'Group',
            baseDPS: 50000,
            basePrice: 5000000,
            priceMultiplier: 1.15,
            maxLevel: 100
        },
        {
            id: 'auto_010',
            name: '帝国',
            type: 'Empire',
            baseDPS: 250000,
            basePrice: 25000000,
            priceMultiplier: 1.15,
            maxLevel: 100
        }
    ],
    
    // ========================================
    // 升级配置
    // ========================================
    upgrades: {
        // 点击金币升级
        clickGold: {
            id: 'upgrade_click_gold',
            baseCost: 100,
            costMultiplier: 2,
            maxLevel: 100,
            effectPerLevel: 1
        },
        // 暴击率升级
        critRate: {
            id: 'upgrade_crit_rate',
            baseCost: 500,
            costMultiplier: 2,
            maxLevel: 50,
            effectPerLevel: 1  // +1% per level
        }
    },
    
    // ========================================
    // 道具配置
    // ========================================
    items: {
        // 道具类型
        types: {
            AUTO: 'AUTO',
            BUFF: 'BUFF',
            CONSUMABLE: 'CONSUMABLE',
            PERMANENT: 'PERMANENT'
        },
        // 叠加类型
        stackTypes: {
            STACKABLE: 'STACKABLE',
            REFRESH: 'REFRESH',
            CAP: 'CAP',
            NON_STACKABLE: 'NON_STACKABLE'
        },
        // 稀有度
        rarities: {
            COMMON: { name: '普通', color: '#FFFFFF', multiplier: 1 },
            RARE: { name: '稀有', color: '#4A90D9', multiplier: 1.5 },
            EPIC: { name: '史诗', color: '#9B59B6', multiplier: 2 },
            LEGENDARY: { name: '传说', color: '#FF9800', multiplier: 3 }
        }
    },
    
    // ========================================
    // 存档配置
    // ========================================
    save: {
        // 自动存档间隔(毫秒)
        autoSaveInterval: 30000,
        // 存档key
        storageKey: 'clicker_quest_save',
        // 备份数量
        backupCount: 3,
        // 加密密钥(生产环境应使用更安全的方式)
        encryptionKey: 'clicker_quest_2026'
    },
    
    // ========================================
    // 成就配置
    // ========================================
    achievements: {
        // 成就类型分布
        types: {
            CLICK: '点击成就',
            GOLD: '金币成就',
            ITEM: '道具成就',
            TIME: '时间成就',
            SPECIAL: '特殊成就'
        },
        // 难度分布
        difficulties: {
            EASY: { name: '简单', color: '#4CAF50' },
            MEDIUM: { name: '中等', color: '#2196F3' },
            HARD: { name: '困难', color: '#9B59B6' },
            EXTREME: { name: '极难', color: '#FF9800' },
            LEGENDARY: { name: '传说', color: '#FFD700' }
        }
    },
    
    // ========================================
    // 商店配置
    // ========================================
    shop: {
        // 刷新间隔(毫秒)
        refreshIntervals: {
            daily: 86400000,      // 24小时
            weekly: 604800000,    // 7天
            random4h: 14400000,   // 4小时
            random8h: 28800000,   // 8小时
            random24h: 86400000   // 24小时
        },
        // 随机刷新概率
        randomChances: {
            rare: 0.3,      // 30%
            epic: 0.1,      // 10%
            legendary: 0.05 // 5%
        }
    },
    
    // ========================================
    // UI配置
    // ========================================
    ui: {
        // 动画时长(毫秒)
        animationDuration: {
            fast: 100,
            normal: 200,
            slow: 300
        },
        // 金币飘字持续时间
        floatingTextDuration: 800,
        // 最大显示BUFF数量
        maxVisibleBuffs: 5
    },
    
    // ========================================
    // 音频配置
    // ========================================
    audio: {
        defaultVolume: {
            music: 0.8,
            sfx: 0.7
        }
    },
    
    // ========================================
    // 性能配置
    // ========================================
    performance: {
        // 目标帧率
        targetFPS: 60,
        // 最大金币飘字数量
        maxFloatingTexts: 20
    }
};

// 导出配置(兼容模块化和全局使用)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
} else {
    window.GameConfig = GameConfig;
}
