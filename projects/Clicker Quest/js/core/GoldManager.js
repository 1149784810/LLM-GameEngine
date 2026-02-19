/**
 * Clicker Quest - 金币管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理金币的获取、消耗、显示格式化，以及金币相关事件的触发
 */

class GoldManager {
    constructor(eventBus, gameData) {
        this.eventBus = eventBus;
        this.gameData = gameData;
        
        // 金币状态
        this.currentGold = 0;
        this.totalGoldEarned = 0;
        this.totalGoldSpent = 0;
        
        // 全局倍率
        this.globalMultiplier = 1;
        
        // 数字格式化器
        this.formatter = new NumberFormatter();
        
        // 初始化
        this._init();
    }

    /**
     * 初始化金币管理器
     * @private
     */
    _init() {
        // 从gameData加载金币数据
        if (this.gameData && this.gameData.gold) {
            this.loadSaveData(this.gameData.gold);
        }
        
        // 绑定事件监听
        this._bindEvents();
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEvents() {
        if (!this.eventBus) return;
        
        // 监听全局倍率变化事件（如果有）
        // this.eventBus.on('MULTIPLIER_CHANGED', this._onMultiplierChanged, this);
    }

    /**
     * 获取当前金币数量
     * @returns {number} 当前金币
     */
    getCurrentGold() {
        return this.currentGold;
    }

    /**
     * 获取累计获得金币
     * @returns {number} 累计获得金币
     */
    getTotalGoldEarned() {
        return this.totalGoldEarned;
    }

    /**
     * 获取累计消耗金币
     * @returns {number} 累计消耗金币
     */
    getTotalGoldSpent() {
        return this.totalGoldSpent;
    }

    /**
     * 增加金币
     * @param {number} amount - 增加数量
     * @param {string} source - 金币来源
     * @returns {number} 实际增加的金币数量
     */
    addGold(amount, source = GoldSource.OTHER) {
        // 参数验证
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            console.warn('[GoldManager] addGold: 无效的金币数量', amount);
            return 0;
        }
        
        // 记录旧值
        const oldGold = this.currentGold;
        
        // 应用全局倍率
        const actualAmount = amount * this.globalMultiplier;
        
        // 更新金币
        this.currentGold += actualAmount;
        this.totalGoldEarned += actualAmount;
        
        // 触发金币获得事件
        if (this.eventBus) {
            this.eventBus.emit(GameEvents.GOLD_EARNED, {
                amount: actualAmount,
                source: source,
                multiplier: this.globalMultiplier,
                total: this.currentGold
            });
            
            // 触发金币变化事件
            this.eventBus.emit(GameEvents.GOLD_CHANGED, {
                oldGold: oldGold,
                newGold: this.currentGold,
                change: actualAmount,
                source: source
            });
        }
        
        return actualAmount;
    }

    /**
     * 消耗金币
     * @param {number} amount - 消耗数量
     * @param {string} purpose - 消耗用途
     * @returns {boolean} 消耗是否成功
     */
    spendGold(amount, purpose = GoldPurpose.OTHER) {
        // 参数验证
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            console.warn('[GoldManager] spendGold: 无效的金币数量', amount);
            return false;
        }
        
        // 检查金币是否足够
        if (!this.hasEnoughGold(amount)) {
            console.warn('[GoldManager] spendGold: 金币不足', {
                required: amount,
                current: this.currentGold
            });
            return false;
        }
        
        // 记录旧值
        const oldGold = this.currentGold;
        
        // 扣除金币
        this.currentGold -= amount;
        this.totalGoldSpent += amount;
        
        // 触发金币消耗事件
        if (this.eventBus) {
            this.eventBus.emit(GameEvents.GOLD_SPENT, {
                amount: amount,
                purpose: purpose,
                total: this.currentGold
            });
            
            // 触发金币变化事件
            this.eventBus.emit(GameEvents.GOLD_CHANGED, {
                oldGold: oldGold,
                newGold: this.currentGold,
                change: -amount,
                purpose: purpose
            });
        }
        
        return true;
    }

    /**
     * 检查是否有足够金币
     * @param {number} amount - 需要的金币数量
     * @returns {boolean} 是否足够
     */
    hasEnoughGold(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return false;
        }
        return this.currentGold >= amount;
    }

    /**
     * 设置全局倍率
     * @param {number} multiplier - 倍率值
     */
    setGlobalMultiplier(multiplier) {
        // 参数验证
        if (typeof multiplier !== 'number' || isNaN(multiplier) || multiplier < 0) {
            console.warn('[GoldManager] setGlobalMultiplier: 无效的倍率值', multiplier);
            return;
        }
        
        const oldMultiplier = this.globalMultiplier;
        this.globalMultiplier = multiplier;
        
        console.log(`[GoldManager] 全局倍率已更新: ${oldMultiplier} -> ${multiplier}`);
    }

    /**
     * 获取全局倍率
     * @returns {number} 当前全局倍率
     */
    getGlobalMultiplier() {
        return this.globalMultiplier;
    }

    /**
     * 格式化金币显示
     * @param {number} amount - 金币数量
     * @returns {string} 格式化后的字符串
     */
    formatGold(amount) {
        return this.formatter.formatGold(amount);
    }

    /**
     * 格式化DPS显示
     * @param {number} dps - DPS值
     * @returns {string} 格式化后的字符串
     */
    formatDPS(dps) {
        return this.formatter.formatDPS(dps);
    }

    /**
     * 获取金币变化百分比
     * @param {number} oldGold - 旧金币数量
     * @param {number} newGold - 新金币数量
     * @returns {number} 变化百分比
     */
    getChangePercentage(oldGold, newGold) {
        if (oldGold === 0) return newGold > 0 ? 100 : 0;
        return ((newGold - oldGold) / oldGold) * 100;
    }

    /**
     * 重置金币数据
     */
    reset() {
        this.currentGold = 0;
        this.totalGoldEarned = 0;
        this.totalGoldSpent = 0;
        this.globalMultiplier = 1;
        
        console.log('[GoldManager] 金币数据已重置');
        
        // 触发重置事件
        if (this.eventBus) {
            this.eventBus.emit(GameEvents.GOLD_CHANGED, {
                oldGold: 0,
                newGold: 0,
                change: 0,
                source: 'reset'
            });
        }
    }

    /**
     * 获取金币数据用于存档
     * @returns {Object} 金币数据
     */
    getSaveData() {
        return {
            currentGold: this.currentGold,
            totalGoldEarned: this.totalGoldEarned,
            totalGoldSpent: this.totalGoldSpent,
            globalMultiplier: this.globalMultiplier
        };
    }

    /**
     * 从存档数据恢复
     * @param {Object} data - 存档数据
     */
    loadSaveData(data) {
        if (!data) {
            console.warn('[GoldManager] loadSaveData: 无效的存档数据');
            return;
        }
        
        // 恢复金币数据
        this.currentGold = data.currentGold || 0;
        this.totalGoldEarned = data.totalGoldEarned || 0;
        this.totalGoldSpent = data.totalGoldSpent || 0;
        this.globalMultiplier = data.globalMultiplier || 1;
        
        console.log('[GoldManager] 存档数据已加载', {
            currentGold: this.formatGold(this.currentGold),
            totalEarned: this.formatGold(this.totalGoldEarned),
            totalSpent: this.formatGold(this.totalGoldSpent),
            multiplier: this.globalMultiplier
        });
    }

    /**
     * 获取金币统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            currentGold: this.currentGold,
            totalGoldEarned: this.totalGoldEarned,
            totalGoldSpent: this.totalGoldSpent,
            globalMultiplier: this.globalMultiplier,
            formatted: {
                currentGold: this.formatGold(this.currentGold),
                totalGoldEarned: this.formatGold(this.totalGoldEarned),
                totalGoldSpent: this.formatGold(this.totalGoldSpent)
            }
        };
    }

    /**
     * 设置金币（用于调试或特殊场景）
     * @param {number} amount - 金币数量
     */
    setGold(amount) {
        if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
            console.warn('[GoldManager] setGold: 无效的金币数量', amount);
            return;
        }
        
        const oldGold = this.currentGold;
        this.currentGold = amount;
        
        if (this.eventBus) {
            this.eventBus.emit(GameEvents.GOLD_CHANGED, {
                oldGold: oldGold,
                newGold: this.currentGold,
                change: this.currentGold - oldGold,
                source: 'debug'
            });
        }
    }
}

// 金币来源枚举
const GoldSource = {
    MANUAL_CLICK: 'manual_click',      // 手动点击
    AUTO_CLICKER: 'auto_clicker',      // 自动点击器
    ACHIEVEMENT: 'achievement',        // 成就奖励
    OFFLINE_REWARD: 'offline_reward',  // 离线收益
    AD_REWARD: 'ad_reward',           // 广告奖励
    OTHER: 'other'                     // 其他
};

// 金币用途枚举
const GoldPurpose = {
    BUY_AUTO_CLICKER: 'buy_auto_clicker',  // 购买自动点击器
    UPGRADE_CLICK: 'upgrade_click',        // 升级点击
    UPGRADE_CRITICAL: 'upgrade_critical',  // 升级暴击
    BUY_ITEM: 'buy_item',                  // 购买道具
    RESET_SKILL: 'reset_skill',            // 重置技能
    OTHER: 'other'                         // 其他
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoldManager, GoldSource, GoldPurpose };
} else {
    window.GoldManager = GoldManager;
    window.GoldSource = GoldSource;
    window.GoldPurpose = GoldPurpose;
}
