/**
 * Clicker Quest - 点击管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 处理点击检测、金币计算、暴击判定、点击冷却和反馈触发
 */

class ClickManager {
    constructor(eventBus, goldManager, criticalHitSystem, gameData) {
        this.eventBus = eventBus;
        this.goldManager = goldManager;
        this.criticalHitSystem = criticalHitSystem;
        this.gameData = gameData;
        
        // 点击配置
        this.baseGoldPerClick = GameConfig.click.baseGoldPerClick;
        this.cooldown = GameConfig.click.cooldown;
        this.toleranceRange = GameConfig.click.toleranceRange;
        
        // 点击状态
        this.lastClickTime = 0;
        this.totalClicks = 0;
        this.totalCrits = 0;
        
        // 点击加成
        this.clickPowerBonus = 0;
        this.clickMultiplier = 1;
        
        // 点击目标元素（金币区域）
        this.clickTargetElement = null;
        
        // 是否启用点击
        this.enabled = true;
        
        // 初始化
        this._init();
    }

    /**
     * 初始化点击管理器
     * @private
     */
    _init() {
        // 从gameData加载点击数据
        if (this.gameData && this.gameData.click) {
            this.loadSaveData(this.gameData.click);
        }
        
        // 绑定DOM事件
        this._bindDOMEvents();
        
        // 绑定自定义事件
        this._bindCustomEvents();
    }

    /**
     * 绑定DOM事件
     * @private
     */
    _bindDOMEvents() {
        // 获取点击目标元素
        this.clickTargetElement = document.getElementById('main-coin') || 
                                   document.getElementById('gold-coin') ||
                                   document.querySelector('.coin-btn') ||
                                   document.querySelector('.click-area');
        
        // 绑定点击事件
        if (this.clickTargetElement) {
            this._boundHandleClick = this.handleClick.bind(this);
            this.clickTargetElement.addEventListener('click', this._boundHandleClick);
            this.clickTargetElement.addEventListener('touchstart', this._handleTouch.bind(this), { passive: false });
        } else {
            // 如果没有特定目标，绑定到整个游戏区域
            const gameArea = document.getElementById('game-area') || document.body;
            this._boundHandleClick = this.handleClick.bind(this);
            gameArea.addEventListener('click', this._boundHandleClick);
            gameArea.addEventListener('touchstart', this._handleTouch.bind(this), { passive: false });
            this.clickTargetElement = gameArea;
        }
    }

    /**
     * 处理触摸事件
     * @private
     * @param {TouchEvent} event - 触摸事件
     */
    _handleTouch(event) {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const clickEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: event.target,
                preventDefault: () => {},
                isTouch: true
            };
            this.handleClick(clickEvent);
        }
    }

    /**
     * 绑定自定义事件
     * @private
     */
    _bindCustomEvents() {
        if (this.eventBus) {
            // 监听游戏暂停/恢复
            this.eventBus.on(GameEvents.GAME_PAUSED, () => { this.enabled = false; });
            this.eventBus.on(GameEvents.GAME_RESUMED, () => { this.enabled = true; });
            
            // 监听重置事件
            this.eventBus.on('game:reset', this.reset.bind(this));
        }
    }

    /**
     * 处理点击事件
     * @param {Event} event - 点击事件
     * @returns {Object|null} 点击结果，无效点击返回null
     */
    handleClick(event) {
        if (!this.enabled) {
            return null;
        }
        
        if (!this.canClick()) {
            return null;
        }
        
        const clickPosition = {
            x: event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0),
            y: event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : 0)
        };
        
        const targetElement = event.target;
        const isValid = this.isValidClickArea(clickPosition.x, clickPosition.y, targetElement);
        
        if (!isValid) {
            return null;
        }
        
        this.lastClickTime = Date.now();
        
        const critResult = this.criticalHitSystem.calculateCriticalHit();
        const critMultiplier = critResult.multiplier;
        const criticalLevel = critResult.level;
        
        const goldGained = this.calculateClickGold(critMultiplier);
        
        if (this.goldManager) {
            this.goldManager.addGold(goldGained, GoldSource.MANUAL_CLICK);
        }
        
        this.totalClicks++;
        if (criticalLevel !== CriticalLevel.NONE) {
            this.totalCrits++;
        }
        
        const clickResult = new ClickResult();
        clickResult.goldGained = goldGained;
        clickResult.criticalLevel = criticalLevel;
        clickResult.criticalMultiplier = critMultiplier;
        clickResult.isValid = true;
        clickResult.clickPosition = clickPosition;
        clickResult.timestamp = this.lastClickTime;
        
        this._triggerEvents(clickResult);
        this._triggerFeedback(clickResult, event);
        
        return clickResult;
    }

    /**
     * 触发相关事件
     * @private
     * @param {ClickResult} clickResult - 点击结果
     */
    _triggerEvents(clickResult) {
        if (!this.eventBus) return;
        
        this.eventBus.emit(GameEvents.CLICK_PERFORMED, {
            goldGained: clickResult.goldGained,
            criticalLevel: clickResult.criticalLevel,
            criticalMultiplier: clickResult.criticalMultiplier,
            position: clickResult.clickPosition,
            timestamp: clickResult.timestamp
        });
        
        if (clickResult.criticalLevel !== CriticalLevel.NONE) {
            this.eventBus.emit(GameEvents.CRITICAL_HIT, {
                level: clickResult.criticalLevel,
                multiplier: clickResult.criticalMultiplier,
                goldGained: clickResult.goldGained,
                position: clickResult.clickPosition
            });
        }
    }

    /**
     * 触发视觉和听觉反馈
     * @private
     * @param {ClickResult} clickResult - 点击结果
     * @param {Event} event - 原始事件
     */
    _triggerFeedback(clickResult, event) {
        // 触发金币飘字动画
        if (window.animationManager) {
            const floatType = clickResult.criticalLevel === CriticalLevel.NONE ? 'normal' : 'critical';
            window.animationManager.playGoldFloat(
                clickResult.goldGained,
                clickResult.clickPosition,
                floatType
            );
            
            // 暴击特效
            if (clickResult.criticalLevel !== CriticalLevel.NONE) {
                window.animationManager.playCriticalEffect(
                    clickResult.criticalLevel,
                    clickResult.clickPosition
                );
                
                // 大暴击时屏幕震动
                if (clickResult.criticalLevel === CriticalLevel.LARGE) {
                    window.animationManager.playScreenShake(15, 150);
                }
            }
        }
        
        // 播放点击音效
        if (window.audioHelper) {
            const soundType = clickResult.criticalLevel === CriticalLevel.NONE ? 'click' : 
                             `critical_${clickResult.criticalLevel}`;
            window.audioHelper.playSound(soundType);
        }
        
        // 按钮点击动画
        if (event && event.target) {
            this._playClickAnimation(event.target);
        }
    }

    /**
     * 播放点击动画
     * @private
     * @param {HTMLElement} element - 目标元素
     */
    _playClickAnimation(element) {
        if (!element || !element.classList) return;
        
        element.classList.add('click-effect');
        setTimeout(() => {
            element.classList.remove('click-effect');
        }, 100);
    }

    /**
     * 检查是否可以点击
     * @returns {boolean} 是否可以点击
     */
    canClick() {
        const now = Date.now();
        return (now - this.lastClickTime) >= this.cooldown;
    }

    /**
     * 检测点击区域是否有效
     * @param {number} x - 点击X坐标
     * @param {number} y - 点击Y坐标
     * @param {Object} targetElement - 目标元素
     * @returns {boolean} 是否在有效区域内
     */
    isValidClickArea(x, y, targetElement) {
        if (!targetElement && this.clickTargetElement) {
            targetElement = this.clickTargetElement;
        }
        
        if (!targetElement) {
            return true;
        }
        
        let checkElement = targetElement;
        while (checkElement) {
            if (checkElement === this.clickTargetElement || 
                checkElement.id === 'main-coin' ||
                checkElement.classList && checkElement.classList.contains('coin-btn')) {
                return true;
            }
            checkElement = checkElement.parentElement;
        }
        
        const rect = this.clickTargetElement.getBoundingClientRect();
        const expandedRect = {
            left: rect.left - this.toleranceRange,
            right: rect.right + this.toleranceRange,
            top: rect.top - this.toleranceRange,
            bottom: rect.bottom + this.toleranceRange
        };
        
        return x >= expandedRect.left &&
               x <= expandedRect.right &&
               y >= expandedRect.top &&
               y <= expandedRect.bottom;
    }

    /**
     * 计算点击金币数
     * @param {number} critMultiplier - 暴击倍率
     * @returns {number} 金币数量
     */
    calculateClickGold(critMultiplier = 1) {
        // 公式: (baseGold + clickPowerBonus) * clickMultiplier * critMultiplier * globalMultiplier
        const baseGold = this.baseGoldPerClick + this.clickPowerBonus;
        let finalGold = baseGold * this.clickMultiplier * critMultiplier;
        
        // 应用全局倍率
        if (this.goldManager && this.goldManager.globalMultiplier) {
            finalGold *= this.goldManager.globalMultiplier;
        }
        
        // 向下取整，确保至少为1
        return Math.max(1, Math.floor(finalGold));
    }

    /**
     * 获取基础点击金币（不含暴击）
     * @returns {number} 基础点击金币
     */
    getBaseClickGold() {
        return this.baseGoldPerClick + this.clickPowerBonus;
    }

    /**
     * 增加点击威力加成
     * @param {number} bonus - 加成值
     */
    addClickPowerBonus(bonus) {
        if (typeof bonus !== 'number' || bonus < 0) {
            console.warn('[ClickManager] 无效的点击威力加成:', bonus);
            return;
        }
        this.clickPowerBonus += bonus;
    }

    /**
     * 设置点击威力加成（覆盖当前值）
     * @param {number} bonus - 加成值
     */
    setClickPowerBonus(bonus) {
        if (typeof bonus !== 'number' || bonus < 0) {
            console.warn('[ClickManager] 无效的点击威力加成:', bonus);
            return;
        }
        this.clickPowerBonus = bonus;
    }

    /**
     * 设置点击倍率
     * @param {number} multiplier - 倍率值
     */
    setClickMultiplier(multiplier) {
        if (typeof multiplier !== 'number' || multiplier < 0) {
            console.warn('[ClickManager] 无效的点击倍率:', multiplier);
            return;
        }
        this.clickMultiplier = multiplier;
    }

    /**
     * 增加点击倍率
     * @param {number} multiplier - 倍率增加值
     */
    addClickMultiplier(multiplier) {
        if (typeof multiplier !== 'number') {
            console.warn('[ClickManager] 无效的点击倍率:', multiplier);
            return;
        }
        this.clickMultiplier += multiplier;
    }

    /**
     * 设置基础点击金币
     * @param {number} gold - 金币数量
     */
    setBaseGoldPerClick(gold) {
        if (typeof gold !== 'number' || gold < 0) {
            console.warn('[ClickManager] 无效的基础点击金币:', gold);
            return;
        }
        this.baseGoldPerClick = gold;
    }

    /**
     * 获取点击统计
     * @returns {Object} 点击统计
     */
    getClickStats() {
        return {
            totalClicks: this.totalClicks,
            totalCrits: this.totalCrits,
            critRate: this.totalClicks > 0 ? (this.totalCrits / this.totalClicks * 100) : 0,
            baseClickGold: this.getBaseClickGold(),
            clickMultiplier: this.clickMultiplier,
            clickPowerBonus: this.clickPowerBonus
        };
    }

    /**
     * 获取点击冷却剩余时间
     * @returns {number} 剩余冷却时间（毫秒）
     */
    getRemainingCooldown() {
        const elapsed = Date.now() - this.lastClickTime;
        return Math.max(0, this.cooldown - elapsed);
    }

    /**
     * 重置点击数据
     */
    reset() {
        this.lastClickTime = 0;
        this.totalClicks = 0;
        this.totalCrits = 0;
        this.clickPowerBonus = 0;
        this.clickMultiplier = 1;
    }

    /**
     * 获取存档数据
     * @returns {Object} 点击数据
     */
    getSaveData() {
        return {
            totalClicks: this.totalClicks,
            totalCrits: this.totalCrits,
            clickPowerBonus: this.clickPowerBonus,
            clickMultiplier: this.clickMultiplier,
            baseGoldPerClick: this.baseGoldPerClick
        };
    }

    /**
     * 从存档数据恢复
     * @param {Object} data - 存档数据
     */
    loadSaveData(data) {
        if (!data) return;
        
        if (typeof data.totalClicks === 'number') {
            this.totalClicks = data.totalClicks;
        }
        if (typeof data.totalCrits === 'number') {
            this.totalCrits = data.totalCrits;
        }
        if (typeof data.clickPowerBonus === 'number') {
            this.clickPowerBonus = data.clickPowerBonus;
        }
        if (typeof data.clickMultiplier === 'number') {
            this.clickMultiplier = data.clickMultiplier;
        }
        if (typeof data.baseGoldPerClick === 'number') {
            this.baseGoldPerClick = data.baseGoldPerClick;
        }
    }

    /**
     * 启用点击
     */
    enable() {
        this.enabled = true;
    }

    /**
     * 禁用点击
     */
    disable() {
        this.enabled = false;
    }

    /**
     * 销毁点击管理器
     */
    destroy() {
        // 移除DOM事件监听
        if (this.clickTargetElement && this._boundHandleClick) {
            this.clickTargetElement.removeEventListener('click', this._boundHandleClick);
            this.clickTargetElement.removeEventListener('touchstart', this._handleTouch);
        }
        
        // 移除自定义事件监听
        if (this.eventBus) {
            this.eventBus.off(GameEvents.GAME_PAUSED);
            this.eventBus.off(GameEvents.GAME_RESUMED);
            this.eventBus.off('game:reset');
        }
    }
}

class ClickResult {
    constructor() {
        this.goldGained = 0;
        this.criticalLevel = 'none';
        this.criticalMultiplier = 1;
        this.isValid = false;
        this.clickPosition = { x: 0, y: 0 };
        this.timestamp = Date.now();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClickManager, ClickResult };
} else {
    window.ClickManager = ClickManager;
    window.ClickResult = ClickResult;
}
