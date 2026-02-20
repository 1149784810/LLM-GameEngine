/**
 * GameState - 游戏状态管理核心模块
 * 负责管理游戏的全局状态数据、状态变更监听、数据验证
 * 
 * @module GameState
 * @author LP -> CP-2
 * @version 1.1.0
 */

class GameState {
    constructor() {
        // 当前存档版本号（用于数据迁移）
        this.SAVE_VERSION = 1;
        
        // 玩家数据
        this.playerData = this.getDefaultPlayerData();
        
        // 游戏配置引用
        this.config = null;
        
        // 状态变更监听器
        this.listeners = new Map();
        
        // 状态变更历史（用于调试）
        this.changeHistory = [];
        this.maxHistoryLength = 100;
        
        // 是否已初始化
        this.isInitialized = false;
    }

    /**
     * 获取默认玩家数据结构
     * @returns {Object} 默认玩家数据
     */
    getDefaultPlayerData() {
        return {
            // 存档版本
            saveVersion: this.SAVE_VERSION || 1,
            
            // 金币相关
            currentGold: 0,
            totalGoldEarned: 0,
            totalGoldSpent: 0,
            
            // 点击相关
            totalClicks: 0,
            sessionClicks: 0,
            lastClickTime: 0,
            
            // 连击相关
            comboCount: 0,
            comboMultiplier: 1.0,
            maxCombo: 0,
            
            // 暴击相关
            totalCriticals: 0,
            smallCriticals: 0,
            mediumCriticals: 0,
            megaCriticals: 0,
            
            // GPS相关
            currentGPS: 0,
            lastGPS: 0,  // 用于离线收益计算
            
            // 升级等级
            upgrades: {
                click_power: { level: 0, totalSpent: 0 },
                auto_clicker: { level: 0, totalSpent: 0 },
                double_click: { level: 0, totalSpent: 0 },
                lucky_finger: { level: 0, totalSpent: 0 },
                golden_touch: { level: 0, totalSpent: 0 },
                time_warp: { level: 0, totalSpent: 0 },
                mega_clicker: { level: 0, totalSpent: 0 },
                critical_master: { level: 0, totalSpent: 0 }
            },
            
            // 道具相关
            inventory: {},
            activeBuffs: [],
            
            // 成就相关
            achievements: {},
            milestones: {},
            
            // 离线相关
            exitTime: 0,
            totalOfflineGold: 0,
            
            // 游戏时间
            playTime: 0,
            firstPlayTime: 0,
            lastSaveTime: 0,
            sessionStartTime: 0,
            
            // 设置
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                autoSaveEnabled: true,
                notificationsEnabled: true
            },
            
            // 统计数据
            statistics: {
                highestGold: 0,
                highestGPS: 0,
                highestCombo: 0,
                totalPlaySessions: 0,
                totalUpgradesPurchased: 0,
                totalItemsUsed: 0,
                totalAchievementsUnlocked: 0
            }
        };
    }

    /**
     * 初始化游戏状态
     * @param {Object} config - 游戏配置
     */
    init(config) {
        this.config = config;
        this.playerData.sessionStartTime = Date.now();
        this.isInitialized = true;
        
        // 触发初始化完成事件
        this.emit('initialized', { timestamp: Date.now() });
        
        console.log('[GameState] 初始化完成');
    }

    /**
     * 获取当前金币数量
     * @returns {number} 金币数量
     */
    getGold() {
        return this.playerData.currentGold;
    }

    /**
     * 添加金币
     * @param {number} amount - 金币数量
     * @param {string} source - 来源
     * @returns {Object} 添加结果
     */
    addGold(amount, source = 'unknown') {
        if (typeof amount !== 'number' || amount <= 0) {
            return { success: false, reason: 'invalid_amount' };
        }
        
        const previousGold = this.playerData.currentGold;
        
        // 检查是否超过最大值
        const MAX_GOLD = Number.MAX_SAFE_INTEGER;
        const newGold = Math.min(previousGold + amount, MAX_GOLD);
        const actualGain = newGold - previousGold;
        
        this.playerData.currentGold = newGold;
        this.playerData.totalGoldEarned += actualGain;
        
        // 更新最高金币记录
        if (newGold > this.playerData.statistics.highestGold) {
            this.playerData.statistics.highestGold = newGold;
        }
        
        // 记录变更
        this.recordChange('goldAdded', { 
            amount: actualGain, 
            source, 
            previous: previousGold, 
            current: newGold 
        });
        
        // 触发事件
        this.emit('goldChanged', { 
            amount: actualGain, 
            source, 
            previous: previousGold, 
            current: newGold,
            total: this.playerData.totalGoldEarned
        });
        
        return { success: true, gained: actualGain, total: newGold };
    }

    /**
     * 扣除金币
     * @param {number} amount - 金币数量
     * @param {string} reason - 原因
     * @returns {Object} 扣除结果
     */
    spendGold(amount, reason = 'unknown') {
        if (typeof amount !== 'number' || amount <= 0) {
            return { success: false, reason: 'invalid_amount' };
        }
        
        if (this.playerData.currentGold < amount) {
            return { success: false, reason: 'insufficient_gold', required: amount, current: this.playerData.currentGold };
        }
        
        const previousGold = this.playerData.currentGold;
        
        this.playerData.currentGold -= amount;
        this.playerData.totalGoldSpent += amount;
        
        // 记录变更
        this.recordChange('goldSpent', { 
            amount, 
            reason, 
            previous: previousGold, 
            current: this.playerData.currentGold 
        });
        
        // 触发事件
        this.emit('goldChanged', { 
            amount: -amount, 
            reason, 
            previous: previousGold, 
            current: this.playerData.currentGold,
            totalSpent: this.playerData.totalGoldSpent
        });
        
        return { success: true, spent: amount, remaining: this.playerData.currentGold };
    }

    /**
     * 获取升级等级
     * @param {string} upgradeId - 升级ID
     * @returns {number} 等级
     */
    getUpgradeLevel(upgradeId) {
        return this.playerData.upgrades[upgradeId]?.level || 0;
    }

    /**
     * 升级商品
     * @param {string} upgradeId - 升级ID
     * @param {number} price - 花费的金币
     * @returns {Object} 升级结果
     */
    upgradeItem(upgradeId, price) {
        if (!this.playerData.upgrades[upgradeId]) {
            return { success: false, reason: 'invalid_upgrade' };
        }
        
        const previousLevel = this.playerData.upgrades[upgradeId].level;
        
        this.playerData.upgrades[upgradeId].level++;
        this.playerData.upgrades[upgradeId].totalSpent += price;
        this.playerData.statistics.totalUpgradesPurchased++;
        
        // 记录变更
        this.recordChange('upgrade', { 
            upgradeId, 
            previousLevel, 
            newLevel: this.playerData.upgrades[upgradeId].level,
            price 
        });
        
        // 触发事件
        this.emit('upgradeChanged', { 
            upgradeId, 
            previousLevel, 
            newLevel: this.playerData.upgrades[upgradeId].level,
            price 
        });
        
        return { success: true, newLevel: this.playerData.upgrades[upgradeId].level };
    }

    /**
     * 更新GPS
     * @param {number} gps - 新的GPS值
     */
    updateGPS(gps) {
        const previousGPS = this.playerData.currentGPS;
        this.playerData.currentGPS = gps;
        this.playerData.lastGPS = gps;
        
        // 更新最高GPS记录
        if (gps > this.playerData.statistics.highestGPS) {
            this.playerData.statistics.highestGPS = gps;
        }
        
        // 触发事件
        this.emit('gpsChanged', { previous: previousGPS, current: gps });
    }

    /**
     * 更新点击统计
     * @param {Object} clickResult - 点击结果
     */
    updateClickStats(clickResult) {
        this.playerData.totalClicks++;
        this.playerData.sessionClicks++;
        this.playerData.lastClickTime = Date.now();
        
        // 更新连击记录
        if (clickResult.comboCount > this.playerData.maxCombo) {
            this.playerData.maxCombo = clickResult.comboCount;
        }
        if (clickResult.comboCount > this.playerData.statistics.highestCombo) {
            this.playerData.statistics.highestCombo = clickResult.comboCount;
        }
        
        // 更新暴击统计
        if (clickResult.criticalType !== 'NONE') {
            this.playerData.totalCriticals++;
            switch (clickResult.criticalType) {
                case 'SMALL':
                    this.playerData.smallCriticals++;
                    break;
                case 'MEDIUM':
                    this.playerData.mediumCriticals++;
                    break;
                case 'MEGA':
                    this.playerData.megaCriticals++;
                    break;
            }
        }
        
        // 触发事件
        this.emit('clickUpdated', clickResult);
    }

    /**
     * 添加道具到库存
     * @param {string} itemId - 道具ID
     * @param {number} count - 数量
     */
    addItem(itemId, count = 1) {
        if (!this.playerData.inventory[itemId]) {
            this.playerData.inventory[itemId] = 0;
        }
        this.playerData.inventory[itemId] += count;
        
        this.emit('inventoryChanged', { itemId, count, action: 'add' });
    }

    /**
     * 使用道具
     * @param {string} itemId - 道具ID
     * @returns {boolean} 是否成功使用
     */
    useItem(itemId) {
        if (!this.playerData.inventory[itemId] || this.playerData.inventory[itemId] <= 0) {
            return false;
        }
        
        this.playerData.inventory[itemId]--;
        this.playerData.statistics.totalItemsUsed++;
        
        // 如果数量为0，删除该道具
        if (this.playerData.inventory[itemId] === 0) {
            delete this.playerData.inventory[itemId];
        }
        
        this.emit('inventoryChanged', { itemId, count: -1, action: 'use' });
        return true;
    }

    /**
     * 解锁成就
     * @param {string} achievementId - 成就ID
     */
    unlockAchievement(achievementId) {
        if (!this.playerData.achievements[achievementId]) {
            this.playerData.achievements[achievementId] = {
                unlocked: true,
                unlockedAt: Date.now(),
                claimed: false
            };
            this.playerData.statistics.totalAchievementsUnlocked++;
            
            this.emit('achievementUnlocked', { achievementId });
        }
    }

    /**
     * 领取成就奖励
     * @param {string} achievementId - 成就ID
     * @returns {boolean} 是否成功领取
     */
    claimAchievement(achievementId) {
        const achievement = this.playerData.achievements[achievementId];
        if (!achievement || !achievement.unlocked || achievement.claimed) {
            return false;
        }
        
        achievement.claimed = true;
        achievement.claimedAt = Date.now();
        
        this.emit('achievementClaimed', { achievementId });
        return true;
    }

    /**
     * 更新游戏时间
     * @param {number} deltaTime - 增加的时间（毫秒）
     */
    updatePlayTime(deltaTime) {
        this.playerData.playTime += deltaTime;
    }

    /**
     * 获取完整玩家数据（用于存档）
     * @returns {Object} 玩家数据的深拷贝
     */
    getPlayerData() {
        // 更新存档版本
        this.playerData.saveVersion = this.SAVE_VERSION;
        
        // 深拷贝数据
        return JSON.parse(JSON.stringify(this.playerData));
    }

    /**
     * 加载玩家数据（用于读档）
     * @param {Object} data - 玩家数据
     * @returns {Object} 加载结果
     */
    loadPlayerData(data) {
        // 验证数据
        const validation = this.validatePlayerData(data);
        if (!validation.valid) {
            console.error('[GameState] 数据验证失败:', validation.errors);
            return { success: false, errors: validation.errors };
        }
        
        // 数据迁移（如果需要）
        const migratedData = this.migrateData(data);
        
        // 合并数据（保留默认值中新增的字段）
        this.playerData = this.mergeWithDefaults(migratedData);
        
        // 重置会话相关数据
        this.playerData.sessionClicks = 0;
        this.playerData.sessionStartTime = Date.now();
        this.playerData.comboCount = 0;
        this.playerData.comboMultiplier = 1.0;
        
        // 增加游戏会话计数
        this.playerData.statistics.totalPlaySessions++;
        
        // 记录变更
        this.recordChange('dataLoaded', { timestamp: Date.now() });
        
        // 触发事件
        this.emit('dataLoaded', { timestamp: Date.now() });
        
        console.log('[GameState] 数据加载成功');
        return { success: true };
    }

    /**
     * 验证玩家数据
     * @param {Object} data - 玩家数据
     * @returns {Object} 验证结果
     */
    validatePlayerData(data) {
        const errors = [];
        
        // 检查基本类型
        if (!data || typeof data !== 'object') {
            errors.push('数据格式无效');
            return { valid: false, errors };
        }
        
        // 检查必要字段
        const requiredFields = ['currentGold', 'totalClicks', 'upgrades'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                errors.push(`缺少必要字段: ${field}`);
            }
        }
        
        // 验证金币数据
        if (typeof data.currentGold !== 'number' || data.currentGold < 0) {
            errors.push('金币数据无效');
        }
        
        // 验证升级数据
        if (data.upgrades && typeof data.upgrades === 'object') {
            for (const [id, upgrade] of Object.entries(data.upgrades)) {
                if (typeof upgrade.level !== 'number' || upgrade.level < 0) {
                    errors.push(`升级数据无效: ${id}`);
                }
            }
        }
        
        // 验证成就数据
        if (data.achievements && typeof data.achievements === 'object') {
            for (const [id, achievement] of Object.entries(data.achievements)) {
                if (typeof achievement !== 'object') {
                    errors.push(`成就数据无效: ${id}`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 数据迁移（处理旧版本存档）
     * @param {Object} data - 原始数据
     * @returns {Object} 迁移后的数据
     */
    migrateData(data) {
        const version = data.saveVersion || 0;
        let migratedData = { ...data };
        
        // 版本0 -> 版本1: 添加统计字段
        if (version < 1) {
            console.log('[GameState] 迁移数据: 版本0 -> 版本1');
            migratedData.statistics = migratedData.statistics || {
                highestGold: migratedData.currentGold || 0,
                highestGPS: migratedData.currentGPS || 0,
                highestCombo: migratedData.maxCombo || 0,
                totalPlaySessions: 0,
                totalUpgradesPurchased: 0,
                totalItemsUsed: 0,
                totalAchievementsUnlocked: 0
            };
            migratedData.lastGPS = migratedData.lastGPS || migratedData.currentGPS || 0;
            migratedData.sessionStartTime = Date.now();
        }
        
        // 未来版本的迁移可以在这里添加
        // if (version < 2) { ... }
        
        migratedData.saveVersion = this.SAVE_VERSION;
        return migratedData;
    }

    /**
     * 与默认数据合并（保留新增字段）
     * @param {Object} data - 加载的数据
     * @returns {Object} 合并后的数据
     */
    mergeWithDefaults(data) {
        const defaults = this.getDefaultPlayerData();
        
        // 深度合并函数
        const deepMerge = (target, source) => {
            const result = { ...target };
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        };
        
        return deepMerge(defaults, data);
    }

    /**
     * 记录状态变更（用于调试）
     * @param {string} type - 变更类型
     * @param {Object} data - 变更数据
     */
    recordChange(type, data) {
        this.changeHistory.push({
            type,
            data,
            timestamp: Date.now()
        });
        
        // 限制历史记录长度
        if (this.changeHistory.length > this.maxHistoryLength) {
            this.changeHistory.shift();
        }
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
                    console.error(`[GameState] 事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 重置游戏状态
     */
    reset() {
        this.playerData = this.getDefaultPlayerData();
        this.playerData.firstPlayTime = Date.now();
        this.playerData.sessionStartTime = Date.now();
        this.changeHistory = [];
        
        this.emit('gameReset', { timestamp: Date.now() });
        console.log('[GameState] 游戏状态已重置');
    }

    /**
     * 获取调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            saveVersion: this.SAVE_VERSION,
            gold: this.playerData.currentGold,
            totalClicks: this.playerData.totalClicks,
            gps: this.playerData.currentGPS,
            upgrades: Object.fromEntries(
                Object.entries(this.playerData.upgrades).map(([k, v]) => [k, v.level])
            ),
            listenerCount: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
            historyLength: this.changeHistory.length
        };
    }
}

// 导出模块
window.GameState = GameState;
