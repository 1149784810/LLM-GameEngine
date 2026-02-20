/**
 * CriticalSystem - 暴击系统核心模块
 * 负责随机暴击判定、暴击类型确定、暴击伤害计算
 * 
 * @module CriticalSystem
 * @author LP -> CP-1
 * @version 1.1.0
 */

class CriticalSystem {
    constructor(gameState, buffManager = null) {
        this.gameState = gameState;
        this.buffManager = buffManager;
        
        // 暴击配置
        this.config = {
            small: { probability: 10, multiplier: 2, name: '小暴击', color: '#FFD700' },
            medium: { probability: 5, multiplier: 5, name: '中暴击', color: '#FFA500' },
            mega: { probability: 1, multiplier: 10, name: '大暴击', color: '#FFD700' }
        };
        
        // 暴击统计
        this.critStats = {
            total: 0,
            small: 0,
            medium: 0,
            mega: 0,
            totalDamage: 0  // 累计暴击伤害
        };
        
        // 上次暴击结果
        this.lastCritical = {
            type: 'NONE',
            multiplier: 1,
            baseMultiplier: 1
        };
        
        // 事件监听器
        this.listeners = {
            critical: [],       // 暴击触发
            megaCritical: [],   // 大暴击
            mediumCritical: [], // 中暴击
            smallCritical: []   // 小暴击
        };
    }

    /**
     * 初始化暴击系统
     * @param {Object} config - 配置参数
     */
    init(config) {
        this.config = { ...this.config, ...config };
        
        // 从存档恢复暴击统计
        if (this.gameState.playerData) {
            this.critStats.total = this.gameState.playerData.totalCriticals || 0;
            this.critStats.small = this.gameState.playerData.smallCriticals || 0;
            this.critStats.medium = this.gameState.playerData.mediumCriticals || 0;
            this.critStats.mega = this.gameState.playerData.megaCriticals || 0;
        }
        
        console.log('[CriticalSystem] 初始化完成', this.config);
    }
    
    /**
     * 设置BuffManager引用
     * @param {BuffManager} buffManager - Buff管理器
     */
    setBuffManager(buffManager) {
        this.buffManager = buffManager;
    }
    
    /**
     * 添加事件监听器
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    /**
     * 移除事件监听器
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }
    
    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {Object} data - 数据
     */
    emit(event, data = {}) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[CriticalSystem] 事件监听器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 检测暴击
     * @returns {Object} 暴击结果 { type, multiplier, baseMultiplier }
     */
    checkCritical() {
        const random = Math.random() * 100;
        
        // 计算总暴击率加成
        const totalCritRate = this.getTotalCritRate();
        const bonus = this.getBonusCritRate();
        
        // 计算各暴击类型的阈值
        // 额外暴击率按比例分配到各类型暴击
        const baseTotal = this.config.mega.probability + this.config.medium.probability + this.config.small.probability;
        const megaRatio = this.config.mega.probability / baseTotal;
        const mediumRatio = this.config.medium.probability / baseTotal;
        const smallRatio = this.config.small.probability / baseTotal;
        
        // 各类型暴击的阈值（按比例分配额外暴击率）
        const megaThreshold = this.config.mega.probability + bonus * megaRatio;
        const mediumThreshold = megaThreshold + this.config.medium.probability + bonus * mediumRatio;
        const smallThreshold = Math.min(mediumThreshold + this.config.small.probability + bonus * smallRatio, 100);
        
        let result = { type: 'NONE', multiplier: 1, baseMultiplier: 1 };
        
        // 暴击判定（从大到小判断）
        if (random < megaThreshold) {
            // 大暴击
            result = {
                type: 'MEGA',
                multiplier: this.config.mega.multiplier,
                baseMultiplier: this.config.mega.multiplier,
                name: this.config.mega.name,
                color: this.config.mega.color
            };
            this.critStats.mega++;
            if (this.gameState.playerData) {
                this.gameState.playerData.megaCriticals++;
            }
            this.emit('megaCritical', result);
        } else if (random < mediumThreshold) {
            // 中暴击
            result = {
                type: 'MEDIUM',
                multiplier: this.config.medium.multiplier,
                baseMultiplier: this.config.medium.multiplier,
                name: this.config.medium.name,
                color: this.config.medium.color
            };
            this.critStats.medium++;
            if (this.gameState.playerData) {
                this.gameState.playerData.mediumCriticals++;
            }
            this.emit('mediumCritical', result);
        } else if (random < smallThreshold) {
            // 小暴击
            result = {
                type: 'SMALL',
                multiplier: this.config.small.multiplier,
                baseMultiplier: this.config.small.multiplier,
                name: this.config.small.name,
                color: this.config.small.color
            };
            this.critStats.small++;
            if (this.gameState.playerData) {
                this.gameState.playerData.smallCriticals++;
            }
            this.emit('smallCritical', result);
        }
        
        // 更新统计
        if (result.type !== 'NONE') {
            this.critStats.total++;
            if (this.gameState.playerData) {
                this.gameState.playerData.totalCriticals++;
            }
            
            // 应用暴击伤害加成
            result.multiplier = this.applyCritDamageBonus(result.baseMultiplier);
            
            // 触发通用暴击事件
            this.emit('critical', result);
        }
        
        // 保存上次暴击结果
        this.lastCritical = result;
        
        return result;
    }
    
    /**
     * 应用暴击伤害加成
     * @param {number} baseMultiplier - 基础暴击倍率
     * @returns {number} 最终暴击倍率
     */
    applyCritDamageBonus(baseMultiplier) {
        // 暴击大师加成 (+50%暴击伤害/级)
        const critMasterLevel = this.gameState.getUpgradeLevel('critical_master');
        const critDamageBonus = 1 + critMasterLevel * 0.5;
        
        return baseMultiplier * critDamageBonus;
    }
    
    /**
     * 获取额外暴击率加成（幸运手指 + BUFF）
     * @returns {number} 额外暴击率百分比
     */
    getBonusCritRate() {
        let bonus = 0;
        
        // 幸运手指加成 (+5%暴击率/级)
        const luckyFingerLevel = this.gameState.getUpgradeLevel('lucky_finger');
        bonus += luckyFingerLevel * 5;
        
        // BUFF暴击率加成
        if (this.buffManager) {
            bonus += this.buffManager.getCritRateBonus() * 100; // 转换为百分比
        }
        
        return bonus;
    }

    /**
     * 获取总暴击率
     * @returns {number} 暴击率百分比 (0-100)
     */
    getTotalCritRate() {
        // 基础暴击率
        const baseRate = this.config.small.probability + 
                        this.config.medium.probability + 
                        this.config.mega.probability;
        
        // 额外加成
        const bonus = this.getBonusCritRate();
        
        // 总暴击率上限100%
        return Math.min(baseRate + bonus, 100);
    }
    
    /**
     * 获取各类型暴击率详情
     * @returns {Object} 各类型暴击率
     */
    getCritRateDetails() {
        const bonus = this.getBonusCritRate();
        
        // 额外暴击率按比例分配到各类型暴击
        const baseTotal = this.config.mega.probability + this.config.medium.probability + this.config.small.probability;
        const megaRatio = this.config.mega.probability / baseTotal;
        const mediumRatio = this.config.medium.probability / baseTotal;
        const smallRatio = this.config.small.probability / baseTotal;
        
        return {
            mega: this.config.mega.probability + bonus * megaRatio,
            medium: this.config.medium.probability + bonus * mediumRatio,
            small: this.config.small.probability + bonus * smallRatio,
            total: this.getTotalCritRate(),
            bonus: bonus
        };
    }

    /**
     * 获取上次暴击倍率
     * @returns {number} 暴击倍率
     */
    getLastCriticalMultiplier() {
        return this.lastCritical.multiplier;
    }
    
    /**
     * 获取上次暴击结果
     * @returns {Object} 暴击结果
     */
    getLastCritical() {
        return { ...this.lastCritical };
    }

    /**
     * 获取暴击统计
     * @returns {Object} 暴击统计
     */
    getCriticalStats() {
        return { ...this.critStats };
    }
    
    /**
     * 获取暴击率（用于UI显示）
     * @returns {string} 格式化的暴击率
     */
    getCritRateDisplay() {
        return this.getTotalCritRate().toFixed(1) + '%';
    }
    
    /**
     * 获取暴击伤害倍率（用于UI显示）
     * @returns {string} 格式化的暴击伤害倍率
     */
    getCritDamageDisplay() {
        const critMasterLevel = this.gameState.getUpgradeLevel('critical_master');
        const multiplier = 1 + critMasterLevel * 0.5;
        return multiplier.toFixed(1) + 'x';
    }
    
    /**
     * 检查是否暴击
     * @param {string} type - 暴击类型
     * @returns {boolean} 是否是暴击
     */
    isCritical(type) {
        return type !== 'NONE';
    }
    
    /**
     * 检查是否是大暴击
     * @param {string} type - 暴击类型
     * @returns {boolean} 是否是大暴击
     */
    isMegaCritical(type) {
        return type === 'MEGA';
    }

    /**
     * 重置暴击统计
     */
    resetStats() {
        this.critStats = {
            total: 0,
            small: 0,
            medium: 0,
            mega: 0,
            totalDamage: 0
        };
        
        if (this.gameState.playerData) {
            this.gameState.playerData.totalCriticals = 0;
            this.gameState.playerData.smallCriticals = 0;
            this.gameState.playerData.mediumCriticals = 0;
            this.gameState.playerData.megaCriticals = 0;
        }
    }
    
    /**
     * 销毁系统
     */
    destroy() {
        Object.keys(this.listeners).forEach(key => {
            this.listeners[key] = [];
        });
    }
}

// 导出模块
window.CriticalSystem = CriticalSystem;
