/**
 * Clicker Quest - 暴击系统
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理暴击判定、暴击概率和暴击倍率
 */

class CriticalHitSystem {
    constructor(eventBus, gameData) {
        this.eventBus = eventBus;
        this.gameData = gameData;
        
        // 暴击配置
        this.config = GameConfig.critical;
        
        // 暴击概率加成
        this.smallCritBonus = 0;
        this.mediumCritBonus = 0;
        this.largeCritBonus = 0;
        
        // 暴击统计
        this.totalSmallCrits = 0;
        this.totalMediumCrits = 0;
        this.totalLargeCrits = 0;
        
        // 初始化
        this._init();
    }

    /**
     * 初始化暴击系统
     * @private
     */
    _init() {
        // 从gameData加载暴击数据
        if (this.gameData && this.gameData.critical) {
            this.loadSaveData(this.gameData.critical);
        }
        
        // 绑定事件监听
        this._bindEvents();
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEvents() {
        // 监听重置事件
        if (this.eventBus) {
            this.eventBus.on('game:reset', this.reset.bind(this));
        }
    }

    /**
     * 计算暴击结果
     * @returns {Object} 暴击结果 { level, multiplier }
     */
    calculateCriticalHit() {
        // 生成随机数 (0-100)
        const random = Math.random() * 100;
        
        // 获取各等级暴击概率
        const largeCritChance = this.getCriticalChance(CriticalLevel.LARGE);
        const mediumCritChance = this.getCriticalChance(CriticalLevel.MEDIUM);
        const smallCritChance = this.getCriticalChance(CriticalLevel.SMALL);
        
        // 累计概率判定（优先判定高等级暴击）
        // 大暴击范围: 0 ~ largeCritChance
        // 中暴击范围: largeCritChance ~ largeCritChance + mediumCritChance
        // 小暴击范围: largeCritChance + mediumCritChance ~ largeCritChance + mediumCritChance + smallCritChance
        
        if (random < largeCritChance) {
            // 大暴击
            this.totalLargeCrits++;
            return {
                level: CriticalLevel.LARGE,
                multiplier: this.config.large.multiplier
            };
        } else if (random < largeCritChance + mediumCritChance) {
            // 中暴击
            this.totalMediumCrits++;
            return {
                level: CriticalLevel.MEDIUM,
                multiplier: this.config.medium.multiplier
            };
        } else if (random < largeCritChance + mediumCritChance + smallCritChance) {
            // 小暴击
            this.totalSmallCrits++;
            return {
                level: CriticalLevel.SMALL,
                multiplier: this.config.small.multiplier
            };
        }
        
        // 普通点击
        return {
            level: CriticalLevel.NONE,
            multiplier: 1
        };
    }

    /**
     * 获取暴击概率
     * @param {string} level - 暴击等级
     * @returns {number} 暴击概率（百分比）
     */
    getCriticalChance(level) {
        let baseChance, maxChance, bonus;
        
        switch (level) {
            case CriticalLevel.SMALL:
                baseChance = this.config.small.baseChance;
                maxChance = this.config.small.maxChance;
                bonus = this.smallCritBonus;
                break;
            case CriticalLevel.MEDIUM:
                baseChance = this.config.medium.baseChance;
                maxChance = this.config.medium.maxChance;
                bonus = this.mediumCritBonus;
                break;
            case CriticalLevel.LARGE:
                baseChance = this.config.large.baseChance;
                maxChance = this.config.large.maxChance;
                bonus = this.largeCritBonus;
                break;
            default:
                return 0;
        }
        
        // 公式: baseChance + bonus，不超过maxChance
        const finalChance = baseChance + bonus;
        return Math.min(finalChance, maxChance);
    }

    /**
     * 获取暴击倍率
     * @param {string} level - 暴击等级
     * @returns {number} 暴击倍率
     */
    getCriticalMultiplier(level) {
        switch (level) {
            case CriticalLevel.SMALL:
                return this.config.small.multiplier;
            case CriticalLevel.MEDIUM:
                return this.config.medium.multiplier;
            case CriticalLevel.LARGE:
                return this.config.large.multiplier;
            default:
                return 1;
        }
    }

    /**
     * 增加暴击概率加成
     * @param {string} level - 暴击等级
     * @param {number} bonus - 加成值（百分比）
     */
    addCriticalChanceBonus(level, bonus) {
        if (typeof bonus !== 'number' || bonus < 0) {
            console.warn('[CriticalHitSystem] 无效的暴击加成值:', bonus);
            return;
        }
        
        switch (level) {
            case CriticalLevel.SMALL:
                this.smallCritBonus += bonus;
                break;
            case CriticalLevel.MEDIUM:
                this.mediumCritBonus += bonus;
                break;
            case CriticalLevel.LARGE:
                this.largeCritBonus += bonus;
                break;
            default:
                console.warn('[CriticalHitSystem] 未知的暴击等级:', level);
        }
    }

    /**
     * 设置暴击概率加成（覆盖当前值）
     * @param {string} level - 暴击等级
     * @param {number} bonus - 加成值（百分比）
     */
    setCriticalChanceBonus(level, bonus) {
        if (typeof bonus !== 'number' || bonus < 0) {
            console.warn('[CriticalHitSystem] 无效的暴击加成值:', bonus);
            return;
        }
        
        switch (level) {
            case CriticalLevel.SMALL:
                this.smallCritBonus = bonus;
                break;
            case CriticalLevel.MEDIUM:
                this.mediumCritBonus = bonus;
                break;
            case CriticalLevel.LARGE:
                this.largeCritBonus = bonus;
                break;
            default:
                console.warn('[CriticalHitSystem] 未知的暴击等级:', level);
        }
    }

    /**
     * 重置暴击概率加成
     */
    resetCriticalChanceBonus() {
        this.smallCritBonus = 0;
        this.mediumCritBonus = 0;
        this.largeCritBonus = 0;
    }

    /**
     * 获取暴击统计
     * @returns {Object} 暴击统计
     */
    getCriticalStats() {
        const totalCrits = this.totalSmallCrits + this.totalMediumCrits + this.totalLargeCrits;
        
        return {
            totalSmallCrits: this.totalSmallCrits,
            totalMediumCrits: this.totalMediumCrits,
            totalLargeCrits: this.totalLargeCrits,
            totalCrits: totalCrits,
            smallCritChance: this.getCriticalChance(CriticalLevel.SMALL),
            mediumCritChance: this.getCriticalChance(CriticalLevel.MEDIUM),
            largeCritChance: this.getCriticalChance(CriticalLevel.LARGE)
        };
    }

    /**
     * 重置暴击系统
     */
    reset() {
        this.resetCriticalChanceBonus();
        this.totalSmallCrits = 0;
        this.totalMediumCrits = 0;
        this.totalLargeCrits = 0;
    }

    /**
     * 获取存档数据
     * @returns {Object} 暴击数据
     */
    getSaveData() {
        return {
            smallCritBonus: this.smallCritBonus,
            mediumCritBonus: this.mediumCritBonus,
            largeCritBonus: this.largeCritBonus,
            totalSmallCrits: this.totalSmallCrits,
            totalMediumCrits: this.totalMediumCrits,
            totalLargeCrits: this.totalLargeCrits
        };
    }

    /**
     * 从存档数据恢复
     * @param {Object} data - 存档数据
     */
    loadSaveData(data) {
        if (!data) return;
        
        if (typeof data.smallCritBonus === 'number') {
            this.smallCritBonus = data.smallCritBonus;
        }
        if (typeof data.mediumCritBonus === 'number') {
            this.mediumCritBonus = data.mediumCritBonus;
        }
        if (typeof data.largeCritBonus === 'number') {
            this.largeCritBonus = data.largeCritBonus;
        }
        if (typeof data.totalSmallCrits === 'number') {
            this.totalSmallCrits = data.totalSmallCrits;
        }
        if (typeof data.totalMediumCrits === 'number') {
            this.totalMediumCrits = data.totalMediumCrits;
        }
        if (typeof data.totalLargeCrits === 'number') {
            this.totalLargeCrits = data.totalLargeCrits;
        }
    }
}

// 暴击等级枚举
const CriticalLevel = {
    NONE: 'none',
    SMALL: 'small',    // 2x
    MEDIUM: 'medium',  // 5x
    LARGE: 'large'     // 10x
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CriticalHitSystem, CriticalLevel };
} else {
    window.CriticalHitSystem = CriticalHitSystem;
    window.CriticalLevel = CriticalLevel;
}
