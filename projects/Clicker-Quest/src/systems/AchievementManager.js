/**
 * AchievementManager - 成就管理系统
 * 负责成就进度追踪、成就解锁检测、奖励发放
 * 
 * @module AchievementManager
 * @author LP -> LvP-1
 * @version 1.0.0
 */

class AchievementManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // 成就配置
        this.achievementsConfig = {};
        
        // 成就状态统计
        this.achievementState = {
            unlockedCount: 0,
            claimedCount: 0,
            totalCount: 0
        };
        
        // 分类列表
        this.categories = ['click', 'gold', 'upgrade', 'crit', 'offline'];
        
        // 分类名称映射
        this.categoryNames = {
            'click': '点击',
            'gold': '金币',
            'upgrade': '升级',
            'crit': '暴击',
            'offline': '离线'
        };
        
        // 事件监听器
        this.listeners = new Map();
    }

    /**
     * 初始化成就系统
     * @param {Object} config - 成就配置
     */
    init(config) {
        this.achievementsConfig = config || {};
        this.achievementState.totalCount = Object.keys(this.achievementsConfig).length;
        
        // 初始化玩家成就数据
        if (!this.gameState.playerData.achievements) {
            this.gameState.playerData.achievements = {};
        }
        
        // 统计已解锁和已领取数量
        this.recalculateStats();
        
        // 绑定游戏事件监听
        this.bindGameEvents();
        
        console.log(`AchievementManager initialized with ${this.achievementState.totalCount} achievements`);
    }

    /**
     * 绑定游戏事件监听
     */
    bindGameEvents() {
        // 监听金币变化
        this.gameState.on('goldChanged', (data) => {
            this.checkAchievementsByCategory('gold');
        });
        
        // 监听升级变化
        this.gameState.on('upgradeChanged', (data) => {
            this.checkAchievementsByCategory('upgrade');
        });
        
        // 监听暴击
        this.gameState.on('criticalHit', (data) => {
            this.checkAchievementsByCategory('crit');
        });
        
        // 监听离线收益
        this.gameState.on('offlineReward', (data) => {
            this.checkAchievementsByCategory('offline');
        });
    }

    /**
     * 重新计算统计数据
     */
    recalculateStats() {
        let unlocked = 0;
        let claimed = 0;
        
        for (const achievementId in this.achievementsConfig) {
            const playerAchievement = this.gameState.playerData.achievements[achievementId];
            if (playerAchievement) {
                if (playerAchievement.status === 'UNLOCKED' || playerAchievement.status === 'CLAIMED') {
                    unlocked++;
                }
                if (playerAchievement.status === 'CLAIMED') {
                    claimed++;
                }
            }
        }
        
        this.achievementState.unlockedCount = unlocked;
        this.achievementState.claimedCount = claimed;
    }

    /**
     * 获取成就信息
     * @param {string} achievementId - 成就ID
     * @returns {Object} 成就信息
     */
    getAchievement(achievementId) {
        const baseAchievement = this.achievementsConfig[achievementId];
        if (!baseAchievement) return null;
        
        const playerAchievement = this.gameState.playerData.achievements[achievementId] || {
            status: 'LOCKED',
            progress: 0,
            unlockedAt: null,
            claimedAt: null
        };
        
        const currentValue = this.getCurrentValue(achievementId);
        const targetValue = this.getTargetValue(achievementId);
        const progress = targetValue > 0 ? Math.min(currentValue / targetValue, 1) : 0;
        
        return {
            ...baseAchievement,
            ...playerAchievement,
            currentValue,
            targetValue,
            progress,
            progressPercent: Math.floor(progress * 100)
        };
    }

    /**
     * 获取成就列表
     * @param {string} category - 分类筛选 (all/click/gold/upgrade/crit/offline)
     * @returns {Array} 成就列表
     */
    getAchievements(category = 'all') {
        const achievements = [];
        
        for (const achievementId in this.achievementsConfig) {
            const achievement = this.getAchievement(achievementId);
            if (achievement) {
                // 处理隐藏成就
                if (achievement.hidden && achievement.status === 'LOCKED') {
                    // 隐藏成就在未解锁前只显示基本信息
                    achievements.push({
                        id: achievement.id,
                        name: '???',
                        description: '???',
                        category: achievement.category,
                        status: 'LOCKED',
                        hidden: true,
                        icon: '❓'
                    });
                } else if (category === 'all' || achievement.category === category) {
                    achievements.push(achievement);
                }
            }
        }
        
        // 按状态和进度排序：已解锁 > 进行中 > 未开始
        return achievements.sort((a, b) => {
            const statusOrder = { 'UNLOCKED': 0, 'LOCKED': 1, 'CLAIMED': 2 };
            const orderA = statusOrder[a.status] ?? 1;
            const orderB = statusOrder[b.status] ?? 1;
            
            if (orderA !== orderB) return orderA - orderB;
            return (b.progress || 0) - (a.progress || 0);
        });
    }

    /**
     * 获取当前进度值
     * @param {string} achievementId - 成就ID
     * @returns {number} 当前进度值
     */
    getCurrentValue(achievementId) {
        const achievement = this.achievementsConfig[achievementId];
        if (!achievement) return 0;
        
        const condition = achievement.condition;
        
        // 根据条件类型获取对应统计值
        if (condition.clicks !== undefined) {
            return this.gameState.playerData.totalClicks || 0;
        }
        if (condition.totalGold !== undefined) {
            return this.gameState.playerData.totalGoldEarned || 0;
        }
        if (condition.upgrades !== undefined) {
            // 计算总升级次数
            let total = 0;
            const upgrades = this.gameState.playerData.upgrades;
            if (upgrades) {
                for (const upgradeId in upgrades) {
                    total += upgrades[upgradeId].level || 0;
                }
            }
            return total;
        }
        if (condition.crits !== undefined) {
            return this.gameState.playerData.totalCriticals || 0;
        }
        if (condition.offlineGold !== undefined) {
            return this.gameState.playerData.totalOfflineGold || 0;
        }
        if (condition.offlineEarned !== undefined) {
            // 离线收益是否已获得
            return (this.gameState.playerData.totalOfflineGold || 0) > 0 ? 1 : 0;
        }
        // 新增条件类型
        if (condition.maxCombo !== undefined) {
            return this.gameState.playerData.maxCombo || 0;
        }
        if (condition.megaCriticals !== undefined) {
            return this.gameState.playerData.megaCriticals || 0;
        }
        if (condition.mediumCriticals !== undefined) {
            return this.gameState.playerData.mediumCriticals || 0;
        }
        if (condition.smallCriticals !== undefined) {
            return this.gameState.playerData.smallCriticals || 0;
        }
        if (condition.totalGoldSpent !== undefined) {
            return this.gameState.playerData.totalGoldSpent || 0;
        }
        if (condition.currentGold !== undefined) {
            return this.gameState.playerData.currentGold || 0;
        }
        if (condition.gps !== undefined) {
            return this.gameState.playerData.currentGPS || 0;
        }
        if (condition.playTime !== undefined) {
            // 游戏时间转换为分钟
            return Math.floor((this.gameState.playerData.playTime || 0) / 60000);
        }
        
        return 0;
    }

    /**
     * 获取目标值
     * @param {string} achievementId - 成就ID
     * @returns {number} 目标值
     */
    getTargetValue(achievementId) {
        const achievement = this.achievementsConfig[achievementId];
        if (!achievement) return 0;
        
        const condition = achievement.condition;
        
        if (condition.offlineEarned !== undefined) {
            return 1; // 布尔类型条件，目标为1
        }
        
        // 返回第一个定义的条件值
        return condition.clicks || condition.totalGold || condition.upgrades || 
               condition.crits || condition.offlineGold || condition.maxCombo ||
               condition.megaCriticals || condition.mediumCriticals || condition.smallCriticals ||
               condition.totalGoldSpent || condition.currentGold || condition.gps ||
               condition.playTime || 0;
    }

    /**
     * 检查进度
     * @param {string} achievementId - 成就ID
     * @returns {Object} 进度信息
     */
    checkProgress(achievementId) {
        const achievement = this.achievementsConfig[achievementId];
        if (!achievement) return null;
        
        const currentValue = this.getCurrentValue(achievementId);
        const targetValue = this.getTargetValue(achievementId);
        const progress = targetValue > 0 ? Math.min(currentValue / targetValue, 1) : 0;
        
        return {
            currentValue,
            targetValue,
            progress,
            progressPercent: Math.floor(progress * 100),
            isComplete: currentValue >= targetValue
        };
    }

    /**
     * 检查所有成就
     * @returns {Array} 新解锁的成就ID列表
     */
    checkAllAchievements() {
        const newlyUnlocked = [];
        
        for (const achievementId in this.achievementsConfig) {
            if (this.checkAchievement(achievementId)) {
                newlyUnlocked.push(achievementId);
            }
        }
        
        return newlyUnlocked;
    }

    /**
     * 按分类检查成就
     * @param {string} category - 成就分类
     * @returns {Array} 新解锁的成就ID列表
     */
    checkAchievementsByCategory(category) {
        const newlyUnlocked = [];
        
        for (const achievementId in this.achievementsConfig) {
            const achievement = this.achievementsConfig[achievementId];
            if (achievement.category === category) {
                if (this.checkAchievement(achievementId)) {
                    newlyUnlocked.push(achievementId);
                }
            }
        }
        
        return newlyUnlocked;
    }

    /**
     * 检查单个成就
     * @param {string} achievementId - 成就ID
     * @returns {boolean} 是否新解锁
     */
    checkAchievement(achievementId) {
        const achievement = this.achievementsConfig[achievementId];
        if (!achievement) return false;
        
        const playerAchievement = this.gameState.playerData.achievements[achievementId];
        
        // 已领取则跳过
        if (playerAchievement?.status === 'CLAIMED') return false;
        
        // 已解锁但未领取也跳过
        if (playerAchievement?.status === 'UNLOCKED') {
            // 更新进度显示
            const progress = this.checkProgress(achievementId);
            if (progress) {
                playerAchievement.progress = progress.progress;
            }
            return false;
        }
        
        // 检查前置成就
        if (achievement.prerequisite) {
            const prereq = this.gameState.playerData.achievements[achievement.prerequisite];
            if (!prereq || prereq.status !== 'CLAIMED') {
                return false;
            }
        }
        
        // 检查进度
        const progress = this.checkProgress(achievementId);
        if (!progress) return false;
        
        // 初始化成就数据
        if (!this.gameState.playerData.achievements[achievementId]) {
            this.gameState.playerData.achievements[achievementId] = {
                status: 'LOCKED',
                progress: 0,
                unlockedAt: null,
                claimedAt: null
            };
        }
        
        // 更新进度
        this.gameState.playerData.achievements[achievementId].progress = progress.progress;
        
        // 检查是否达成
        if (progress.isComplete && this.gameState.playerData.achievements[achievementId].status !== 'UNLOCKED') {
            this.unlockAchievement(achievementId);
            return true;
        }
        
        return false;
    }

    /**
     * 解锁成就
     * @param {string} achievementId - 成就ID
     */
    unlockAchievement(achievementId) {
        const achievement = this.achievementsConfig[achievementId];
        if (!achievement) return;
        
        this.gameState.playerData.achievements[achievementId] = {
            status: 'UNLOCKED',
            progress: 1,
            unlockedAt: Date.now(),
            claimedAt: null
        };
        
        this.achievementState.unlockedCount++;
        
        // 触发成就解锁事件
        this.emit('achievementUnlocked', {
            achievementId,
            achievement: this.getAchievement(achievementId)
        });
        
        // 同时触发GameState事件
        this.gameState.emit('achievementUnlocked', {
            achievementId,
            achievement: this.getAchievement(achievementId)
        });
        
        console.log(`Achievement unlocked: ${achievement.name}`);
    }

    /**
     * 领取成就奖励
     * @param {string} achievementId - 成就ID
     * @returns {Object} 领取结果
     */
    claimReward(achievementId) {
        const playerAchievement = this.gameState.playerData.achievements[achievementId];
        
        // 验证状态
        if (!playerAchievement || playerAchievement.status !== 'UNLOCKED') {
            return { success: false, message: '成就未解锁或已领取' };
        }
        
        const achievement = this.achievementsConfig[achievementId];
        if (!achievement) {
            return { success: false, message: '成就不存在' };
        }
        
        const reward = achievement.reward;
        const rewardDetails = [];
        
        // 发放金币奖励
        if (reward.gold) {
            this.gameState.addGold(reward.gold, `achievement_${achievementId}`);
            rewardDetails.push({ type: 'gold', value: reward.gold });
        }
        
        // 发放道具奖励
        if (reward.item) {
            // 通过GameState添加道具
            if (this.gameState.addItem) {
                this.gameState.addItem(reward.item, 1);
            } else if (this.gameState.playerData.inventory) {
                const currentCount = this.gameState.playerData.inventory[reward.item] || 0;
                this.gameState.playerData.inventory[reward.item] = currentCount + 1;
            }
            rewardDetails.push({ type: 'item', value: reward.item, count: 1 });
        }
        
        // 更新状态
        playerAchievement.status = 'CLAIMED';
        playerAchievement.claimedAt = Date.now();
        
        this.achievementState.claimedCount++;
        
        // 触发领取事件
        this.emit('achievementClaimed', {
            achievementId,
            reward: rewardDetails
        });
        
        return {
            success: true,
            message: '奖励已领取',
            reward: rewardDetails,
            achievement: this.getAchievement(achievementId)
        };
    }

    /**
     * 批量领取所有可领取奖励
     * @returns {Object} 领取结果
     */
    claimAllRewards() {
        const results = [];
        let totalGold = 0;
        const items = [];
        
        for (const achievementId in this.achievementsConfig) {
            const playerAchievement = this.gameState.playerData.achievements[achievementId];
            if (playerAchievement?.status === 'UNLOCKED') {
                const result = this.claimReward(achievementId);
                if (result.success) {
                    results.push(result);
                    
                    // 统计奖励
                    result.reward.forEach(r => {
                        if (r.type === 'gold') totalGold += r.value;
                        if (r.type === 'item') items.push(r.value);
                    });
                }
            }
        }
        
        return {
            success: results.length > 0,
            count: results.length,
            totalGold,
            items,
            details: results
        };
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            ...this.achievementState,
            progressPercent: this.achievementState.totalCount > 0 
                ? Math.floor((this.achievementState.claimedCount / this.achievementState.totalCount) * 100)
                : 0
        };
    }

    /**
     * 获取分类统计
     * @returns {Object} 分类统计
     */
    getCategoryStats() {
        const stats = {};
        
        this.categories.forEach(category => {
            const achievements = this.getAchievements(category);
            const unlocked = achievements.filter(a => a.status === 'UNLOCKED' || a.status === 'CLAIMED').length;
            const claimed = achievements.filter(a => a.status === 'CLAIMED').length;
            
            stats[category] = {
                name: this.categoryNames[category],
                total: achievements.length,
                unlocked,
                claimed,
                progress: achievements.length > 0 ? Math.floor((claimed / achievements.length) * 100) : 0
            };
        });
        
        return stats;
    }

    /**
     * 获取下一个里程碑成就
     * @returns {Object} 下一个里程碑成就
     */
    getNextMilestone() {
        let nextAchievement = null;
        let maxProgress = -1;
        
        for (const achievementId in this.achievementsConfig) {
            const achievement = this.getAchievement(achievementId);
            
            // 跳过已完成和隐藏成就
            if (achievement.status === 'CLAIMED' || (achievement.hidden && achievement.status === 'LOCKED')) {
                continue;
            }
            
            // 找进度最高的未完成成就
            if (achievement.progress > maxProgress) {
                maxProgress = achievement.progress;
                nextAchievement = achievement;
            }
        }
        
        return nextAchievement;
    }

    /**
     * 获取最近解锁的成就
     * @param {number} limit - 数量限制
     * @returns {Array} 最近解锁的成就列表
     */
    getRecentlyUnlocked(limit = 5) {
        const unlocked = [];
        
        for (const achievementId in this.gameState.playerData.achievements) {
            const playerAchievement = this.gameState.playerData.achievements[achievementId];
            if (playerAchievement.unlockedAt) {
                const achievement = this.getAchievement(achievementId);
                if (achievement) {
                    unlocked.push({
                        ...achievement,
                        unlockedAt: playerAchievement.unlockedAt
                    });
                }
            }
        }
        
        // 按解锁时间降序排序
        return unlocked
            .sort((a, b) => b.unlockedAt - a.unlockedAt)
            .slice(0, limit);
    }

    /**
     * 检查是否有可领取的奖励
     * @returns {boolean} 是否有可领取奖励
     */
    hasClaimableRewards() {
        for (const achievementId in this.gameState.playerData.achievements) {
            if (this.gameState.playerData.achievements[achievementId].status === 'UNLOCKED') {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取可领取奖励数量
     * @returns {number} 可领取奖励数量
     */
    getClaimableCount() {
        let count = 0;
        for (const achievementId in this.gameState.playerData.achievements) {
            if (this.gameState.playerData.achievements[achievementId].status === 'UNLOCKED') {
                count++;
            }
        }
        return count;
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {Object} data - 数据
     */
    emit(event, data = {}) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in achievement event listener (${event}):`, error);
                }
            });
        }
    }

    /**
     * 重置成就数据（用于重置游戏）
     */
    reset() {
        this.gameState.playerData.achievements = {};
        this.achievementState = {
            unlockedCount: 0,
            claimedCount: 0,
            totalCount: Object.keys(this.achievementsConfig).length
        };
        this.emit('achievementsReset');
    }
}

// 导出模块
window.AchievementManager = AchievementManager;
