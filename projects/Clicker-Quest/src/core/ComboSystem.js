/**
 * ComboSystem - 连击系统核心模块
 * 负责检测连击、计算连击倍率、连击中断检测
 * 
 * @module ComboSystem
 * @author LP -> CP-1
 * @version 1.1.0
 */

class ComboSystem {
    constructor(gameState) {
        this.gameState = gameState;
        
        // 连击配置
        this.config = {
            timeWindow: 500,            // 连击时间窗口(ms)
            maxMultiplier: 2.0,         // 最大倍率
            multiplierIncrement: 0.1,   // 每次连击增加倍率
            comboBreakDelay: 500        // 连击中断延迟检测(ms)
        };
        
        // 连击状态
        this.comboState = {
            count: 0,
            multiplier: 1.0,
            lastClickTime: 0,
            maxCombo: 0,
            isActive: false
        };
        
        // 连击中断检测定时器
        this.comboBreakTimer = null;
        
        // 事件监听器
        this.listeners = {
            comboStart: [],     // 连击开始
            comboIncrease: [],  // 连击增加
            comboBreak: [],     // 连击中断
            maxComboReached: [] // 达到最大倍率
        };
    }

    /**
     * 初始化连击系统
     * @param {Object} config - 配置参数
     */
    init(config) {
        this.config = { ...this.config, ...config };
        
        // 从存档恢复连击状态
        if (this.gameState.playerData) {
            this.comboState.maxCombo = this.gameState.playerData.maxCombo || 0;
            // 恢复当前连击状态（如果存档中有保存）
            this.comboState.count = this.gameState.playerData.comboCount || 0;
            this.comboState.multiplier = this.gameState.playerData.comboMultiplier || 1.0;
        }
        
        console.log('[ComboSystem] 初始化完成', this.config);
    }
    
    /**
     * 添加事件监听器
     * @param {string} event - 事件名 (comboStart, comboIncrease, comboBreak, maxComboReached)
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
                    console.error(`[ComboSystem] 事件监听器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 检测连击
     * @param {number} clickTime - 点击时间戳
     * @returns {number} 连击倍率
     */
    checkCombo(clickTime) {
        const timeDiff = clickTime - this.comboState.lastClickTime;
        const wasActive = this.comboState.isActive;
        
        // 清除之前的中断检测定时器
        this.clearComboBreakTimer();
        
        if (timeDiff <= this.config.timeWindow) {
            // 连击有效，增加连击数
            this.comboState.count++;
            this.comboState.isActive = true;
            
            // 计算新倍率
            const newMultiplier = Math.min(
                1.0 + this.comboState.count * this.config.multiplierIncrement,
                this.config.maxMultiplier
            );
            
            // 检查是否达到最大倍率
            const reachedMax = newMultiplier >= this.config.maxMultiplier && 
                              this.comboState.multiplier < this.config.maxMultiplier;
            
            this.comboState.multiplier = newMultiplier;
            
            // 更新最高连击
            if (this.comboState.count > this.comboState.maxCombo) {
                this.comboState.maxCombo = this.comboState.count;
                if (this.gameState.playerData) {
                    this.gameState.playerData.maxCombo = this.comboState.maxCombo;
                }
            }
            
            // 持久化当前连击状态到存档
            this.saveComboState();
            
            // 触发事件
            if (!wasActive) {
                // 连击开始
                this.emit('comboStart', {
                    count: this.comboState.count,
                    multiplier: this.comboState.multiplier
                });
            } else {
                // 连击增加
                this.emit('comboIncrease', {
                    count: this.comboState.count,
                    multiplier: this.comboState.multiplier,
                    increment: this.config.multiplierIncrement
                });
            }
            
            // 达到最大倍率
            if (reachedMax) {
                this.emit('maxComboReached', {
                    count: this.comboState.count,
                    multiplier: this.comboState.multiplier
                });
            }
        } else {
            // 连击中断或首次点击
            if (wasActive) {
                // 触发连击中断事件
                this.emit('comboBreak', {
                    lastCount: this.comboState.count,
                    lastMultiplier: this.comboState.multiplier
                });
            }
            
            // 重置连击，开始新的连击
            this.comboState.count = 1;
            this.comboState.multiplier = 1.0;
            this.comboState.isActive = true;
        }
        
        // 更新最后点击时间
        this.comboState.lastClickTime = clickTime;
        
        // 设置新的中断检测定时器
        this.setComboBreakTimer();
        
        return this.comboState.multiplier;
    }
    
    /**
     * 设置连击中断检测定时器
     */
    setComboBreakTimer() {
        this.comboBreakTimer = setTimeout(() => {
            if (this.comboState.isActive) {
                this.breakCombo();
            }
        }, this.config.comboBreakDelay);
    }
    
    /**
     * 清除连击中断检测定时器
     */
    clearComboBreakTimer() {
        if (this.comboBreakTimer) {
            clearTimeout(this.comboBreakTimer);
            this.comboBreakTimer = null;
        }
    }
    
    /**
     * 强制中断连击
     */
    breakCombo() {
        if (this.comboState.isActive) {
            this.emit('comboBreak', {
                lastCount: this.comboState.count,
                lastMultiplier: this.comboState.multiplier
            });
            
            this.comboState.count = 0;
            this.comboState.multiplier = 1.0;
            this.comboState.isActive = false;
            
            // 持久化连击状态
            this.saveComboState();
        }
        
        this.clearComboBreakTimer();
    }
    
    /**
     * 保存连击状态到GameState
     */
    saveComboState() {
        if (this.gameState.playerData) {
            this.gameState.playerData.comboCount = this.comboState.count;
            this.gameState.playerData.comboMultiplier = this.comboState.multiplier;
        }
    }

    /**
     * 获取当前连击数
     * @returns {number} 连击数
     */
    getComboCount() {
        return this.comboState.count;
    }

    /**
     * 获取当前连击倍率
     * @returns {number} 连击倍率
     */
    getComboMultiplier() {
        return this.comboState.multiplier;
    }

    /**
     * 获取最高连击数
     * @returns {number} 最高连击数
     */
    getMaxCombo() {
        return this.comboState.maxCombo;
    }
    
    /**
     * 获取连击状态
     * @returns {Object} 连击状态
     */
    getComboState() {
        return {
            count: this.comboState.count,
            multiplier: this.comboState.multiplier,
            maxCombo: this.comboState.maxCombo,
            isActive: this.comboState.isActive,
            lastClickTime: this.comboState.lastClickTime
        };
    }
    
    /**
     * 检查连击是否激活
     * @returns {boolean} 是否激活
     */
    isComboActive() {
        return this.comboState.isActive;
    }

    /**
     * 检查连击是否已中断（用于UI显示）
     * @returns {boolean} 是否已中断
     */
    isComboBroken() {
        const timeDiff = Date.now() - this.comboState.lastClickTime;
        return timeDiff > this.config.timeWindow;
    }
    
    /**
     * 获取距离连击中断的剩余时间
     * @returns {number} 剩余毫秒数，负数表示已中断
     */
    getRemainingTime() {
        if (!this.comboState.isActive) return 0;
        const elapsed = Date.now() - this.comboState.lastClickTime;
        return Math.max(0, this.config.timeWindow - elapsed);
    }
    
    /**
     * 获取连击进度百分比 (用于UI显示)
     * @returns {number} 0-100的百分比
     */
    getComboProgress() {
        if (this.comboState.multiplier >= this.config.maxMultiplier) {
            return 100;
        }
        return ((this.comboState.multiplier - 1.0) / (this.config.maxMultiplier - 1.0)) * 100;
    }

    /**
     * 重置连击
     */
    resetCombo() {
        this.clearComboBreakTimer();
        
        if (this.comboState.isActive) {
            this.emit('comboBreak', {
                lastCount: this.comboState.count,
                lastMultiplier: this.comboState.multiplier
            });
        }
        
        this.comboState.count = 0;
        this.comboState.multiplier = 1.0;
        this.comboState.isActive = false;
    }
    
    /**
     * 重置最高连击记录
     */
    resetMaxCombo() {
        this.comboState.maxCombo = 0;
        if (this.gameState.playerData) {
            this.gameState.playerData.maxCombo = 0;
        }
    }
    
    /**
     * 销毁系统
     */
    destroy() {
        this.clearComboBreakTimer();
        Object.keys(this.listeners).forEach(key => {
            this.listeners[key] = [];
        });
    }
}

// 导出模块
window.ComboSystem = ComboSystem;
