/**
 * Clicker Quest - 主界面UI
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理主界面的UI渲染和交互
 */

class MainScreenUI {
    constructor(eventBus, uiManager, gameData) {
        this.eventBus = eventBus;
        this.uiManager = uiManager;
        this.gameData = gameData;
        
        // DOM引用
        this.goldValueEl = null;
        this.dpsValueEl = null;
        this.coinBtn = null;
        this.buffBar = null;
        this.floatingTextContainer = null;
        this.navButtons = null;
        
        // 数字格式化器
        this.numberFormatter = new NumberFormatter();
        
        // 飘字计数器（用于限制同时显示的飘字数量）
        this.floatingTextCount = 0;
        this.maxFloatingTexts = GameConfig.performance.maxFloatingTexts;
        
        // 动画状态
        this.isAnimating = false;
        
        // 事件监听器引用（用于销毁时移除）
        this.eventListeners = [];
        
        // 初始化
        this._init();
    }

    /**
     * 初始化主界面UI
     * @private
     */
    _init() {
        // 获取DOM引用
        this._getDOMReferences();
        
        // 绑定点击事件
        this._bindClickEvents();
        
        // 绑定导航事件
        this._bindNavigationEvents();
        
        // 绑定事件监听
        this._bindEventListeners();
        
        // 初始化显示
        this._initializeDisplay();
    }

    /**
     * 获取DOM引用
     * @private
     */
    _getDOMReferences() {
        this.goldValueEl = document.getElementById('gold-value');
        this.dpsValueEl = document.getElementById('dps-value');
        this.coinBtn = document.getElementById('main-coin');
        this.buffBar = document.getElementById('buff-bar');
        this.floatingTextContainer = document.getElementById('floating-text-container');
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.leaderboardBtn = document.getElementById('leaderboard-btn');
    }

    /**
     * 绑定点击事件
     * @private
     */
    _bindClickEvents() {
        // 点击事件由 ClickManager 处理，MainScreenUI 只负责显示反馈
        // 不再在这里绑定点击事件，避免重复处理
    }

    /**
     * 绑定导航事件
     * @private
     */
    _bindNavigationEvents() {
        if (!this.navButtons) return;
        
        this.navButtons.forEach(btn => {
            const handler = () => {
                const screenName = btn.dataset.screen;
                if (screenName) {
                    this._switchNavigation(btn);
                    this.eventBus.emit(GameEvents.SCREEN_CHANGED, { screen: screenName });
                }
            };
            
            btn.addEventListener('click', handler);
            this.eventListeners.push({ element: btn, event: 'click', handler });
        });
        
        // 设置按钮
        if (this.settingsBtn) {
            const settingsHandler = () => {
                this.eventBus.emit(GameEvents.SCREEN_CHANGED, { screen: 'settings' });
            };
            this.settingsBtn.addEventListener('click', settingsHandler);
            this.eventListeners.push({ element: this.settingsBtn, event: 'click', handler: settingsHandler });
        }
        
        // 排行榜按钮
        if (this.leaderboardBtn) {
            const leaderboardHandler = () => {
                this.eventBus.emit(GameEvents.SCREEN_CHANGED, { screen: 'leaderboard' });
            };
            this.leaderboardBtn.addEventListener('click', leaderboardHandler);
            this.eventListeners.push({ element: this.leaderboardBtn, event: 'click', handler: leaderboardHandler });
        }
    }

    /**
     * 切换导航状态
     * @private
     */
    _switchNavigation(activeBtn) {
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEventListeners() {
        const goldChangedHandler = (data) => {
            this.updateGold(data.newGold);
        };
        this.eventBus.on(GameEvents.GOLD_CHANGED, goldChangedHandler, this);
        
        const dpsChangedHandler = (data) => {
            this.updateDPS(data.newDPS);
        };
        this.eventBus.on(GameEvents.DPS_CHANGED, dpsChangedHandler, this);
        
        // 点击结果事件
        const clickPerformedHandler = (data) => {
            if (data && data.goldGained) {
                // 显示飘字
                this.showFloatingGold(
                    data.goldGained,
                    data.criticalLevel || 'none',
                    data.position || { x: 0, y: 0 }
                );
                
                // 播放点击动画
                this.playClickAnimation(data.criticalLevel || 'none');
            }
        };
        this.eventBus.on(GameEvents.CLICK_PERFORMED, clickPerformedHandler, this);
        
        // BUFF变化事件
        const buffHandler = (data) => {
            this.updateBuffBar(data.buffs);
        };
        this.eventBus.on(GameEvents.BUFF_ACTIVATED, buffHandler, this);
        this.eventBus.on(GameEvents.BUFF_DEACTIVATED, buffHandler, this);
    }

    /**
     * 初始化显示
     * @private
     */
    _initializeDisplay() {
        // 初始化金币显示
        if (this.goldValueEl) {
            this.goldValueEl.textContent = '0';
        }
        
        // 初始化DPS显示
        if (this.dpsValueEl) {
            this.dpsValueEl.textContent = '+0';
        }
        
        // 初始化BUFF栏
        if (this.buffBar) {
            this.buffBar.innerHTML = '';
        }
    }

    /**
     * 更新金币显示
     * @param {number} gold - 金币数量
     */
    updateGold(gold) {
        if (!this.goldValueEl) return;
        
        const formattedGold = this.numberFormatter.formatGold(gold);
        this.goldValueEl.textContent = formattedGold;
        
        // 添加更新动画
        this.goldValueEl.classList.remove('updated');
        void this.goldValueEl.offsetWidth; // 强制重绘
        this.goldValueEl.classList.add('updated');
        
        // 动画结束后移除类
        setTimeout(() => {
            this.goldValueEl.classList.remove('updated');
        }, 200);
    }

    /**
     * 更新DPS显示
     * @param {number} dps - DPS值
     */
    updateDPS(dps) {
        if (!this.dpsValueEl) return;
        
        const formattedDPS = this.numberFormatter.formatDPS(dps);
        this.dpsValueEl.textContent = formattedDPS;
    }

    /**
     * 显示金币飘字
     * @param {number} amount - 金币数量
     * @param {string} criticalLevel - 暴击等级
     * @param {Object} position - 点击位置
     */
    showFloatingGold(amount, criticalLevel = 'none', position = { x: 0, y: 0 }) {
        // 检查飘字数量限制
        if (this.floatingTextCount >= this.maxFloatingTexts) {
            return;
        }
        
        if (!this.floatingTextContainer) return;
        
        // 创建飘字元素
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-gold';
        
        // 根据暴击等级添加样式
        if (criticalLevel && criticalLevel !== 'none') {
            floatingText.classList.add(`critical-${criticalLevel}`);
        }
        
        // 格式化金币数量
        const formattedAmount = this.numberFormatter.format(amount);
        floatingText.textContent = '+' + formattedAmount;
        
        // 计算位置（点击位置上方随机偏移）
        const offsetX = (Math.random() - 0.5) * 60; // -30px 到 +30px
        const offsetY = Math.random() * 20; // 0 到 20px
        
        // 设置初始位置
        floatingText.style.left = `${position.x + offsetX}px`;
        floatingText.style.top = `${position.y - 50 - offsetY}px`;
        
        // 添加到容器
        this.floatingTextContainer.appendChild(floatingText);
        this.floatingTextCount++;
        
        // 动画结束后移除
        const duration = criticalLevel === 'large' ? 1000 : 800;
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
            this.floatingTextCount--;
        }, duration);
    }

    /**
     * 播放点击动画
     * @param {string} criticalLevel - 暴击等级
     */
    playClickAnimation(criticalLevel = 'none') {
        if (!this.coinBtn || this.isAnimating) return;
        
        this.isAnimating = true;
        
        // 移除之前的暴击类
        this.coinBtn.classList.remove('critical-small', 'critical-medium', 'critical-large');
        
        // 添加对应的暴击类
        if (criticalLevel && criticalLevel !== 'none') {
            this.coinBtn.classList.add(`critical-${criticalLevel}`);
        }
        
        // 缩放动画序列
        const timeline = [
            { scale: 0.95, duration: 50 },
            { scale: 1.05, duration: 50 },
            { scale: 1.0, duration: 50 }
        ];
        
        let currentStep = 0;
        
        const animate = () => {
            if (currentStep >= timeline.length) {
                this.isAnimating = false;
                return;
            }
            
            const step = timeline[currentStep];
            this.coinBtn.style.transform = `scale(${step.scale})`;
            
            currentStep++;
            setTimeout(animate, step.duration);
        };
        
        animate();
        
        // 清除暴击效果
        setTimeout(() => {
            if (this.coinBtn) {
                this.coinBtn.classList.remove('critical-small', 'critical-medium', 'critical-large');
            }
        }, 300);
    }

    /**
     * 更新BUFF栏
     * @param {Array} buffs - BUFF列表
     */
    updateBuffBar(buffs) {
        if (!this.buffBar) return;
        
        // 清空BUFF栏
        this.buffBar.innerHTML = '';
        
        if (!buffs || buffs.length === 0) {
            return;
        }
        
        // 只显示指定数量的BUFF
        const visibleBuffs = buffs.slice(0, GameConfig.ui.maxVisibleBuffs);
        
        visibleBuffs.forEach(buff => {
            const buffCard = this._createBuffCard(buff);
            this.buffBar.appendChild(buffCard);
        });
    }

    /**
     * 创建BUFF卡片
     * @private
     * @param {Object} buff - BUFF数据
     * @returns {HTMLElement} BUFF卡片元素
     */
    _createBuffCard(buff) {
        const card = document.createElement('div');
        card.className = 'buff-card';
        card.dataset.buffId = buff.id;
        
        // BUFF图标
        const icon = document.createElement('div');
        icon.className = 'buff-icon';
        icon.textContent = buff.icon || '⭐';
        
        // BUFF名称
        const name = document.createElement('div');
        name.className = 'buff-name';
        name.textContent = buff.name || 'BUFF';
        
        // 剩余时间
        const time = document.createElement('div');
        time.className = 'buff-time';
        
        if (buff.remainingTime) {
            const timeText = this._formatBuffTime(buff.remainingTime);
            time.textContent = timeText;
            
            // 时间少于10秒时显示警告颜色
            if (buff.remainingTime < 10) {
                time.classList.add('warning');
            }
        } else {
            time.textContent = '∞';
        }
        
        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(time);
        
        return card;
    }

    /**
     * 格式化BUFF时间
     * @private
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间
     */
    _formatBuffTime(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h${minutes}m`;
        }
    }

    /**
     * 重置主界面UI
     */
    reset() {
        this._initializeDisplay();
        this.floatingTextCount = 0;
        
        // 清空飘字容器
        if (this.floatingTextContainer) {
            this.floatingTextContainer.innerHTML = '';
        }
    }

    /**
     * 销毁主界面UI
     */
    destroy() {
        // 移除所有事件监听器
        this.eventListeners.forEach(({ element, event, handler }) => {
            if (element) {
                element.removeEventListener(event, handler);
            }
        });
        
        // 清除事件总线监听
        this.eventBus.clear(GameEvents.GOLD_CHANGED);
        this.eventBus.clear(GameEvents.DPS_CHANGED);
        this.eventBus.clear(GameEvents.CLICK_PERFORMED);
        this.eventBus.clear(GameEvents.BUFF_ACTIVATED);
        this.eventBus.clear(GameEvents.BUFF_DEACTIVATED);
        
        // 清空引用
        this.eventListeners = [];
        this.goldValueEl = null;
        this.dpsValueEl = null;
        this.coinBtn = null;
        this.buffBar = null;
        this.floatingTextContainer = null;
        this.navButtons = null;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainScreenUI;
} else {
    window.MainScreenUI = MainScreenUI;
}
