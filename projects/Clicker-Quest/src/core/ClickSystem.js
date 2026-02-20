/**
 * ClickSystem - 点击系统核心模块
 * 负责处理点击事件、计算金币产出
 * 
 * @module ClickSystem
 * @author LP -> CP-1
 * @version 1.1.0
 */

class ClickSystem {
    constructor(gameState, comboSystem, criticalSystem, buffManager = null) {
        this.gameState = gameState;
        this.comboSystem = comboSystem;
        this.criticalSystem = criticalSystem;
        this.buffManager = buffManager;
        
        // 点击配置
        this.config = {
            baseOutput: 1,
            maxClickFrequency: 20,      // 每秒最大点击次数
            clickResponseTime: 50,      // 点击响应时间上限(ms)
            debounceDelay: 0,           // 防抖延迟(0表示不防抖，高频点击游戏不建议防抖)
            throttleInterval: 0         // 节流间隔(0表示不节流)
        };
        
        // 点击统计
        this.clickStats = {
            totalClicks: 0,
            sessionClicks: 0,
            lastClickTime: 0,
            clickCountInSecond: 0,      // 一秒内的点击次数
            lastSecondTimestamp: 0      // 上一秒的时间戳
        };
        
        // 点击事件监听器
        this.clickListeners = [];
        
        // 音效回调
        this.onSoundPlay = null;
    }

    /**
     * 初始化点击系统
     * @param {Object} config - 配置参数
     */
    init(config) {
        this.config = { ...this.config, ...config };
        
        // 初始化统计
        this.clickStats.totalClicks = this.gameState.playerData.totalClicks || 0;
        
        console.log('[ClickSystem] 初始化完成', this.config);
    }
    
    /**
     * 设置BuffManager引用
     * @param {BuffManager} buffManager - Buff管理器
     */
    setBuffManager(buffManager) {
        this.buffManager = buffManager;
    }
    
    /**
     * 设置音效回调
     * @param {Function} callback - 音效回调函数
     */
    setSoundCallback(callback) {
        this.onSoundPlay = callback;
    }
    
    /**
     * 添加点击事件监听器
     * @param {Function} listener - 监听函数
     */
    addClickListener(listener) {
        this.clickListeners.push(listener);
    }
    
    /**
     * 移除点击事件监听器
     * @param {Function} listener - 监听函数
     */
    removeClickListener(listener) {
        const index = this.clickListeners.indexOf(listener);
        if (index > -1) {
            this.clickListeners.splice(index, 1);
        }
    }
    
    /**
     * 触发点击事件
     * @param {Object} result - 点击结果
     */
    emitClickEvent(result) {
        this.clickListeners.forEach(listener => {
            try {
                listener(result);
            } catch (error) {
                console.error('[ClickSystem] 监听器执行错误:', error);
            }
        });
    }

    /**
     * 处理点击事件
     * @returns {Object} 点击结果
     */
    handleClick() {
        const currentTime = Date.now();
        
        // 高频点击检测（用于统计和性能监控）
        this.updateClickFrequency(currentTime);
        
        // 更新点击统计
        this.clickStats.totalClicks++;
        this.clickStats.sessionClicks++;
        this.clickStats.lastClickTime = currentTime;
        
        // 检测连击
        const comboMultiplier = this.comboSystem.checkCombo(currentTime);
        
        // 检测暴击
        const criticalResult = this.criticalSystem.checkCritical();
        
        // 计算点击产出
        const gold = this.calculateClickGold(comboMultiplier, criticalResult.multiplier);
        
        // 更新游戏状态
        this.gameState.addGold(gold, 'click');
        this.gameState.playerData.totalClicks++;
        
        // 构建点击结果
        const result = {
            gold,
            comboMultiplier,
            comboCount: this.comboSystem.getComboCount(),
            criticalType: criticalResult.type,
            criticalMultiplier: criticalResult.multiplier,
            timestamp: currentTime,
            isComboActive: comboMultiplier > 1.0
        };
        
        // 触发音效
        this.playClickSound(criticalResult.type);
        
        // 触发点击事件监听器
        this.emitClickEvent(result);
        
        return result;
    }
    
    /**
     * 更新点击频率统计
     * @param {number} currentTime - 当前时间戳
     */
    updateClickFrequency(currentTime) {
        const secondPassed = currentTime - this.clickStats.lastSecondTimestamp >= 1000;
        
        if (secondPassed) {
            // 新的一秒，重置计数
            this.clickStats.clickCountInSecond = 1;
            this.clickStats.lastSecondTimestamp = currentTime;
        } else {
            this.clickStats.clickCountInSecond++;
        }
    }
    
    /**
     * 获取当前点击频率
     * @returns {number} 每秒点击次数
     */
    getCurrentClickFrequency() {
        return this.clickStats.clickCountInSecond;
    }

    /**
     * 计算点击产出金币
     * 完整公式: (baseClick + clickPowerLevel) × (hasDoubleClick ? 2 : 1) 
     *          × (1 + goldenTouchLevel × 0.10) × comboMultiplier 
     *          × criticalMultiplier × buffMultiplier
     * 
     * @param {number} comboMultiplier - 连击倍率
     * @param {number} criticalMultiplier - 暴击倍率
     * @returns {number} 金币数量
     */
    calculateClickGold(comboMultiplier, criticalMultiplier) {
        // 基础点击产出
        const baseClick = this.config.baseOutput;
        
        // 点击强化等级加成 (+1金币/级)
        const clickPowerLevel = this.gameState.getUpgradeLevel('click_power');
        
        // 双击检测 (购买后所有点击x2)
        const hasDoubleClick = this.gameState.getUpgradeLevel('double_click') > 0;
        
        // 黄金之手等级加成 (+10%金币/级)
        const goldenTouchLevel = this.gameState.getUpgradeLevel('golden_touch');
        
        // 计算基础金币
        let gold = baseClick + clickPowerLevel;
        
        // 应用双击倍率
        if (hasDoubleClick) {
            gold *= 2;
        }
        
        // 应用黄金之手倍率
        gold *= (1 + goldenTouchLevel * 0.10);
        
        // 应用连击倍率
        gold *= comboMultiplier;
        
        // 应用暴击倍率
        gold *= criticalMultiplier;
        
        // 应用BUFF金币倍率
        const buffMultiplier = this.getBuffGoldMultiplier();
        gold *= buffMultiplier;
        
        return Math.floor(gold);
    }
    
    /**
     * 获取BUFF金币倍率
     * @returns {number} 金币倍率
     */
    getBuffGoldMultiplier() {
        if (this.buffManager) {
            return this.buffManager.getGoldMultiplier();
        }
        return 1;
    }
    
    /**
     * 播放点击音效
     * @param {string} criticalType - 暴击类型
     */
    playClickSound(criticalType) {
        if (this.onSoundPlay) {
            try {
                this.onSoundPlay(criticalType);
            } catch (error) {
                console.error('[ClickSystem] 音效播放错误:', error);
            }
        }
    }

    /**
     * 获取总点击次数
     * @returns {number} 总点击次数
     */
    getTotalClicks() {
        return this.clickStats.totalClicks;
    }

    /**
     * 获取本次会话点击次数
     * @returns {number} 会话点击次数
     */
    getSessionClicks() {
        return this.clickStats.sessionClicks;
    }
    
    /**
     * 获取上次点击时间
     * @returns {number} 时间戳
     */
    getLastClickTime() {
        return this.clickStats.lastClickTime;
    }
    
    /**
     * 获取点击统计信息
     * @returns {Object} 统计信息
     */
    getClickStats() {
        return {
            totalClicks: this.clickStats.totalClicks,
            sessionClicks: this.clickStats.sessionClicks,
            currentFrequency: this.clickStats.clickCountInSecond,
            lastClickTime: this.clickStats.lastClickTime
        };
    }

    /**
     * 重置点击统计
     */
    resetStats() {
        this.clickStats.sessionClicks = 0;
        this.clickStats.clickCountInSecond = 0;
        this.clickStats.lastSecondTimestamp = 0;
    }
    
    /**
     * 销毁系统
     */
    destroy() {
        this.clickListeners = [];
        this.onSoundPlay = null;
    }
}

// 导出模块
window.ClickSystem = ClickSystem;
