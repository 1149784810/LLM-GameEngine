/**
 * Clicker Quest - 成就管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理成就的定义、解锁检测、进度追踪和奖励发放
 */

class AchievementManager {
    constructor(eventBus, goldManager, itemManager, gameData) {
        this.eventBus = eventBus;
        this.goldManager = goldManager;
        this.itemManager = itemManager;
        this.gameData = gameData;
        
        // 已解锁的成就
        this.unlockedAchievements = new Set();
        
        // 成就进度
        this.achievementProgress = new Map();
        
        // 成就点数
        this.totalAchievementPoints = 0;
        
        // 成就定义
        this.achievements = this._defineAchievements();
        
        // 初始化
        this._init();
    }

    /**
     * 初始化成就管理器
     * @private
     */
    _init() {
        // 加载存档数据
        if (this.gameData && this.gameData.achievements) {
            this.loadSaveData(this.gameData.achievements);
        }
        
        // 绑定事件监听
        this._bindEvents();
        
        console.log('[AchievementManager] 初始化完成，已解锁成就:', this.unlockedAchievements.size);
    }

    /**
     * 定义所有成就
     * @private
     * @returns {Object} 成就定义
     */
    _defineAchievements() {
        return {
            // ========== 金币相关成就 ==========
            gold_100: {
                id: 'gold_100',
                name: '小有积蓄',
                description: '累计获得100金币',
                icon: '💰',
                category: 'gold',
                type: 'cumulative',
                target: 100,
                reward: { gold: 50 },
                points: 5
            },
            gold_1000: {
                id: 'gold_1000',
                name: '初露锋芒',
                description: '累计获得1,000金币',
                icon: '💰',
                category: 'gold',
                type: 'cumulative',
                target: 1000,
                reward: { gold: 200 },
                points: 10
            },
            gold_10000: {
                id: 'gold_10000',
                name: '财源广进',
                description: '累计获得10,000金币',
                icon: '💰',
                category: 'gold',
                type: 'cumulative',
                target: 10000,
                reward: { gold: 500 },
                points: 15
            },
            gold_100000: {
                id: 'gold_100000',
                name: '富甲一方',
                description: '累计获得100,000金币',
                icon: '💎',
                category: 'gold',
                type: 'cumulative',
                target: 100000,
                reward: { gold: 2000 },
                points: 25
            },
            gold_1000000: {
                id: 'gold_1000000',
                name: '百万富翁',
                description: '累计获得1,000,000金币',
                icon: '👑',
                category: 'gold',
                type: 'cumulative',
                target: 1000000,
                reward: { gold: 10000 },
                points: 50
            },
            
            // ========== 点击相关成就 ==========
            click_100: {
                id: 'click_100',
                name: '初次尝试',
                description: '累计点击100次',
                icon: '👆',
                category: 'click',
                type: 'cumulative',
                target: 100,
                reward: { gold: 50 },
                points: 5
            },
            click_1000: {
                id: 'click_1000',
                name: '手指灵活',
                description: '累计点击1,000次',
                icon: '👆',
                category: 'click',
                type: 'cumulative',
                target: 1000,
                reward: { gold: 200 },
                points: 10
            },
            click_10000: {
                id: 'click_10000',
                name: '点击达人',
                description: '累计点击10,000次',
                icon: '⚡',
                category: 'click',
                type: 'cumulative',
                target: 10000,
                reward: { gold: 500 },
                points: 15
            },
            click_100000: {
                id: 'click_100000',
                name: '点击大师',
                description: '累计点击100,000次',
                icon: '🌟',
                category: 'click',
                type: 'cumulative',
                target: 100000,
                reward: { gold: 2000 },
                points: 25
            },
            
            // ========== 暴击相关成就 ==========
            crit_10: {
                id: 'crit_10',
                name: '幸运一击',
                description: '累计触发10次暴击',
                icon: '💥',
                category: 'critical',
                type: 'cumulative',
                target: 10,
                reward: { gold: 100 },
                points: 5
            },
            crit_100: {
                id: 'crit_100',
                name: '暴击新星',
                description: '累计触发100次暴击',
                icon: '💥',
                category: 'critical',
                type: 'cumulative',
                target: 100,
                reward: { gold: 500 },
                points: 10
            },
            crit_1000: {
                id: 'crit_1000',
                name: '暴击之王',
                description: '累计触发1,000次暴击',
                icon: '🔥',
                category: 'critical',
                type: 'cumulative',
                target: 1000,
                reward: { gold: 2000 },
                points: 20
            },
            crit_large_10: {
                id: 'crit_large_10',
                name: '大暴击',
                description: '累计触发10次大暴击',
                icon: '🌟',
                category: 'critical',
                type: 'cumulative',
                target: 10,
                reward: { gold: 1000 },
                points: 15
            },
            
            // ========== DPS相关成就 ==========
            dps_100: {
                id: 'dps_100',
                name: '被动收入',
                description: '达到100 DPS',
                icon: '📈',
                category: 'dps',
                type: 'milestone',
                target: 100,
                reward: { gold: 500 },
                points: 10
            },
            dps_1000: {
                id: 'dps_1000',
                name: '自动化生产',
                description: '达到1,000 DPS',
                icon: '📈',
                category: 'dps',
                type: 'milestone',
                target: 1000,
                reward: { gold: 2000 },
                points: 15
            },
            dps_10000: {
                id: 'dps_10000',
                name: '金币工厂',
                description: '达到10,000 DPS',
                icon: '🏭',
                category: 'dps',
                type: 'milestone',
                target: 10000,
                reward: { gold: 10000 },
                points: 25
            },
            dps_100000: {
                id: 'dps_100000',
                name: '金币帝国',
                description: '达到100,000 DPS',
                icon: '🏰',
                category: 'dps',
                type: 'milestone',
                target: 100000,
                reward: { gold: 50000 },
                points: 40
            },
            
            // ========== 道具相关成就 ==========
            item_10: {
                id: 'item_10',
                name: '收藏家',
                description: '购买10个道具',
                icon: '🎁',
                category: 'item',
                type: 'cumulative',
                target: 10,
                reward: { gold: 500 },
                points: 10
            },
            item_50: {
                id: 'item_50',
                name: '道具达人',
                description: '购买50个道具',
                icon: '🎁',
                category: 'item',
                type: 'cumulative',
                target: 50,
                reward: { gold: 2000 },
                points: 20
            },
            item_100: {
                id: 'item_100',
                name: '道具大师',
                description: '购买100个道具',
                icon: '🏆',
                category: 'item',
                type: 'cumulative',
                target: 100,
                reward: { gold: 5000 },
                points: 30
            },
            
            // ========== 特殊成就 ==========
            first_crit: {
                id: 'first_crit',
                name: '初次暴击',
                description: '触发第一次暴击',
                icon: '✨',
                category: 'special',
                type: 'milestone',
                target: 1,
                reward: { gold: 100 },
                points: 5
            },
            first_item: {
                id: 'first_item',
                name: '初次购买',
                description: '购买第一个道具',
                icon: '🛒',
                category: 'special',
                type: 'milestone',
                target: 1,
                reward: { gold: 100 },
                points: 5
            },
            offline_1h: {
                id: 'offline_1h',
                name: '离线收益',
                description: '首次获得离线收益',
                icon: '🌙',
                category: 'special',
                type: 'milestone',
                target: 1,
                reward: { gold: 200 },
                points: 5
            },
            playtime_1h: {
                id: 'playtime_1h',
                name: '游戏新手',
                description: '游戏时长达到1小时',
                icon: '⏰',
                category: 'special',
                type: 'cumulative',
                target: 3600000, // 毫秒
                reward: { gold: 500 },
                points: 10
            },
            playtime_24h: {
                id: 'playtime_24h',
                name: '游戏爱好者',
                description: '游戏时长达到24小时',
                icon: '⏰',
                category: 'special',
                type: 'cumulative',
                target: 86400000, // 毫秒
                reward: { gold: 5000 },
                points: 25
            }
        };
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEvents() {
        // 监听金币变化
        this.eventBus.on(GameEvents.GOLD_CHANGED, (data) => {
            this.checkAchievements('gold', this.goldManager.getTotalGoldEarned());
        });
        
        // 监听点击事件
        this.eventBus.on(GameEvents.CLICK_PERFORMED, (data) => {
            this.checkAchievements('click', data.totalClicks);
        });
        
        // 监听暴击事件
        this.eventBus.on(GameEvents.CRITICAL_HIT, (data) => {
            this.checkAchievements('critical', data.totalCrits);
            if (data.critType === 'large') {
                this.checkAchievements('crit_large', data.totalLargeCrits || 1);
            }
        });
        
        // 监听DPS变化
        this.eventBus.on(GameEvents.DPS_CHANGED, (data) => {
            this.checkAchievements('dps', data.newDPS);
        });
        
        // 监听道具购买
        this.eventBus.on(GameEvents.ITEM_PURCHASED, (data) => {
            this.checkAchievements('item', data.totalItemsPurchased);
        });
        
        // 监听离线收益
        this.eventBus.on(GameEvents.OFFLINE_REWARD_CLAIMED, (data) => {
            this.checkAchievements('offline', 1);
        });
    }

    /**
     * 检查成就
     * @param {string} category - 成就类别
     * @param {number} value - 当前值
     */
    checkAchievements(category, value) {
        // 遍历所有成就
        for (const achievementId in this.achievements) {
            const achievement = this.achievements[achievementId];
            
            // 跳过已解锁的成就
            if (this.unlockedAchievements.has(achievementId)) {
                continue;
            }
            
            // 检查类别
            if (achievement.category !== category) {
                continue;
            }
            
            // 更新进度
            this.achievementProgress.set(achievementId, value);
            
            // 检查是否达成
            if (this._checkCondition(achievement, value)) {
                this._unlockAchievement(achievement);
            }
        }
    }

    /**
     * 检查成就条件
     * @private
     * @param {Object} achievement - 成就数据
     * @param {number} value - 当前值
     * @returns {boolean} 是否达成
     */
    _checkCondition(achievement, value) {
        switch (achievement.type) {
            case 'cumulative':
                // 累计型：当前值 >= 目标值
                return value >= achievement.target;
            case 'milestone':
                // 里程碑型：当前值 >= 目标值
                return value >= achievement.target;
            default:
                return false;
        }
    }

    /**
     * 解锁成就
     * @private
     * @param {Object} achievement - 成就数据
     */
    _unlockAchievement(achievement) {
        // 添加到已解锁列表
        this.unlockedAchievements.add(achievement.id);
        
        // 增加成就点数
        this.totalAchievementPoints += achievement.points;
        
        // 发放奖励
        this._grantReward(achievement.reward);
        
        // 触发成就解锁事件
        this.eventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, {
            achievement: achievement,
            totalPoints: this.totalAchievementPoints
        });
        
        console.log(`[AchievementManager] 成就解锁: ${achievement.name}`);
    }

    /**
     * 发放奖励
     * @private
     * @param {Object} reward - 奖励数据
     */
    _grantReward(reward) {
        if (!reward) return;
        
        // 金币奖励
        if (reward.gold && this.goldManager) {
            this.goldManager.addGold(reward.gold, 'achievement');
        }
        
        // 道具奖励（预留扩展）
        if (reward.item && this.itemManager) {
            // TODO: 发放道具奖励
        }
    }

    /**
     * 获取成就进度
     * @param {string} achievementId - 成就ID
     * @returns {Object} 进度信息
     */
    getProgress(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return null;
        
        const current = this.achievementProgress.get(achievementId) || 0;
        const target = achievement.target;
        const percentage = Math.min(100, (current / target) * 100);
        
        return {
            achievement: achievement,
            current: current,
            target: target,
            percentage: percentage,
            isUnlocked: this.unlockedAchievements.has(achievementId)
        };
    }

    /**
     * 获取所有成就
     * @param {string} category - 类别（可选）
     * @returns {Array} 成就列表
     */
    getAllAchievements(category = null) {
        const result = [];
        
        for (const achievementId in this.achievements) {
            const achievement = this.achievements[achievementId];
            
            // 过滤类别
            if (category && achievement.category !== category) {
                continue;
            }
            
            const progress = this.getProgress(achievementId);
            result.push(progress);
        }
        
        return result;
    }

    /**
     * 获取已解锁的成就
     * @returns {Array} 已解锁成就列表
     */
    getUnlockedAchievements() {
        const result = [];
        
        this.unlockedAchievements.forEach(achievementId => {
            const achievement = this.achievements[achievementId];
            if (achievement) {
                result.push({
                    ...achievement,
                    unlockedAt: Date.now() // 可以从存档中读取实际解锁时间
                });
            }
        });
        
        return result;
    }

    /**
     * 获取成就统计
     * @returns {Object} 统计信息
     */
    getStats() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.unlockedAchievements.size;
        const totalPoints = this.totalAchievementPoints;
        const maxPoints = Object.values(this.achievements)
            .reduce((sum, a) => sum + a.points, 0);
        
        return {
            total: total,
            unlocked: unlocked,
            percentage: (unlocked / total) * 100,
            totalPoints: totalPoints,
            maxPoints: maxPoints,
            pointsPercentage: (totalPoints / maxPoints) * 100
        };
    }

    /**
     * 获取存档数据
     * @returns {Object} 存档数据
     */
    getSaveData() {
        return {
            unlockedAchievements: Array.from(this.unlockedAchievements),
            achievementProgress: Object.fromEntries(this.achievementProgress),
            totalAchievementPoints: this.totalAchievementPoints
        };
    }

    /**
     * 加载存档数据
     * @param {Object} data - 存档数据
     */
    loadSaveData(data) {
        if (!data) return;
        
        if (data.unlockedAchievements) {
            this.unlockedAchievements = new Set(data.unlockedAchievements);
        }
        
        if (data.achievementProgress) {
            this.achievementProgress = new Map(Object.entries(data.achievementProgress));
        }
        
        if (data.totalAchievementPoints) {
            this.totalAchievementPoints = data.totalAchievementPoints;
        }
    }

    /**
     * 重置成就
     */
    reset() {
        this.unlockedAchievements.clear();
        this.achievementProgress.clear();
        this.totalAchievementPoints = 0;
        
        console.log('[AchievementManager] 成就已重置');
    }

    /**
     * 销毁成就管理器
     */
    destroy() {
        // 清理事件监听
        this.eventBus.clear(GameEvents.GOLD_CHANGED);
        this.eventBus.clear(GameEvents.CLICK_PERFORMED);
        this.eventBus.clear(GameEvents.CRITICAL_HIT);
        this.eventBus.clear(GameEvents.DPS_CHANGED);
        this.eventBus.clear(GameEvents.ITEM_PURCHASED);
        this.eventBus.clear(GameEvents.OFFLINE_REWARD_CLAIMED);
        
        console.log('[AchievementManager] 已销毁');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementManager;
} else {
    window.AchievementManager = AchievementManager;
}
