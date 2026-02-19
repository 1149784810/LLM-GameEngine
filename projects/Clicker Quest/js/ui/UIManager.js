/**
 * Clicker Quest - UI管理器
 * 版本: v1.0
 * 创建日期: 2026-02-20
 * 
 * 职责: 管理所有UI界面的创建、更新和交互
 */

class UIManager {
    constructor(eventBus, gameData) {
        this.eventBus = eventBus;
        this.gameData = gameData;
        
        // 当前界面
        this.currentScreen = 'main';
        
        // 子UI管理器
        this.mainScreenUI = null;
        this.shopScreenUI = null;
        this.achievementScreenUI = null;
        this.modalManager = null;
        
        // 模块引用
        this.goldManager = null;
        this.dpsManager = null;
        
        // DOM引用
        this.screens = new Map();
        this.navButtons = null;
        
        // Toast队列
        this.toastQueue = [];
        this.isShowingToast = false;
        
        // 数字格式化器
        this.numberFormatter = new NumberFormatter();
        
        // 初始化
        this._init();
    }

    /**
     * 初始化UI管理器
     * @private
     */
    _init() {
        // 获取所有界面DOM引用
        this._getScreenReferences();
        
        // 绑定导航事件
        this._bindNavigationEvents();
        
        // 绑定事件监听
        this._bindEventListeners();
        
        console.log('[UIManager] 初始化完成');
    }

    /**
     * 获取所有界面DOM引用
     * @private
     */
    _getScreenReferences() {
        // 获取所有界面
        const screenElements = document.querySelectorAll('.screen');
        screenElements.forEach(screen => {
            const screenName = screen.id.replace('-screen', '');
            this.screens.set(screenName, screen);
        });
        
        // 获取导航按钮
        this.navButtons = document.querySelectorAll('.nav-btn');
    }

    /**
     * 绑定导航事件
     * @private
     */
    _bindNavigationEvents() {
        if (!this.navButtons) return;
        
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const screenName = btn.dataset.screen;
                if (screenName) {
                    this.switchScreen(screenName);
                    this._updateNavState(btn);
                }
            });
        });
    }

    /**
     * 更新导航状态
     * @private
     * @param {HTMLElement} activeBtn - 当前激活的按钮
     */
    _updateNavState(activeBtn) {
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    /**
     * 绑定事件监听
     * @private
     */
    _bindEventListeners() {
        // 金币变化事件
        this.eventBus.on(GameEvents.GOLD_CHANGED, (data) => {
            this.updateGoldDisplay(data.newGold);
        });
        
        // DPS变化事件
        this.eventBus.on(GameEvents.DPS_CHANGED, (data) => {
            this.updateDPSDisplay(data.newDPS);
        });
        
        // BUFF变化事件
        this.eventBus.on(GameEvents.BUFF_ACTIVATED, (data) => {
            this.updateBuffBar(data.activeBuffs);
        });
        
        this.eventBus.on(GameEvents.BUFF_DEACTIVATED, (data) => {
            this.updateBuffBar(data.activeBuffs);
        });
        
        // 成就解锁事件
        this.eventBus.on(GameEvents.ACHIEVEMENT_UNLOCKED, (data) => {
            this.showToast(`成就解锁: ${data.achievement.name}`, 'success');
        });
    }

    /**
     * 切换界面
     * @param {string} screenName - 界面名称
     */
    switchScreen(screenName) {
        if (this.currentScreen === screenName) return;
        
        const currentScreenEl = this.screens.get(this.currentScreen);
        const targetScreenEl = this.screens.get(screenName);
        
        if (!targetScreenEl) {
            console.warn(`[UIManager] 界面不存在: ${screenName}`);
            return;
        }
        
        // 隐藏当前界面
        if (currentScreenEl) {
            currentScreenEl.classList.remove('active');
            currentScreenEl.classList.add('fade-out');
        }
        
        // 显示目标界面
        setTimeout(() => {
            if (currentScreenEl) {
                currentScreenEl.classList.remove('fade-out');
            }
            targetScreenEl.classList.add('active');
            
            // 触发界面特定初始化
            this._onScreenActivated(screenName);
            
        }, 150);
        
        // 更新当前界面
        this.currentScreen = screenName;
        
        // 触发界面切换事件
        this.eventBus.emit(GameEvents.SCREEN_CHANGED, { screen: screenName });
        
        console.log(`[UIManager] 切换到界面: ${screenName}`);
    }

    /**
     * 界面激活时的处理
     * @private
     * @param {string} screenName - 界面名称
     */
    _onScreenActivated(screenName) {
        switch (screenName) {
            case 'shop':
                if (this.shopScreenUI) {
                    this.shopScreenUI.show();
                }
                break;
            case 'achievement':
                if (this.achievementScreenUI) {
                    // 刷新成就列表
                }
                break;
            case 'main':
                // 主界面不需要特殊处理
                break;
        }
    }

    /**
     * 更新金币显示
     * @param {number} gold - 金币数量
     */
    updateGoldDisplay(gold) {
        const goldValueEl = document.getElementById('gold-value');
        if (goldValueEl) {
            const formattedGold = this.numberFormatter.formatGold(gold);
            goldValueEl.textContent = formattedGold;
            
            // 添加更新动画
            goldValueEl.classList.add('updated');
            setTimeout(() => {
                goldValueEl.classList.remove('updated');
            }, 200);
        }
        
        // 更新商店界面的金币显示
        const shopGoldEl = document.getElementById('shop-gold-value');
        if (shopGoldEl) {
            shopGoldEl.textContent = this.numberFormatter.formatGold(gold);
        }
    }

    /**
     * 更新DPS显示
     * @param {number} dps - DPS值
     */
    updateDPSDisplay(dps) {
        const dpsValueEl = document.getElementById('dps-value');
        if (dpsValueEl) {
            const formattedDPS = this.numberFormatter.formatDPS(dps);
            dpsValueEl.textContent = formattedDPS;
        }
    }

    /**
     * 更新BUFF状态栏
     * @param {Array} buffs - BUFF列表
     */
    updateBuffBar(buffs) {
        const buffBar = document.getElementById('buff-bar');
        if (!buffBar) return;
        
        // 清空BUFF栏
        buffBar.innerHTML = '';
        
        if (!buffs || buffs.length === 0) {
            return;
        }
        
        // 只显示指定数量的BUFF
        const visibleBuffs = buffs.slice(0, GameConfig.ui.maxVisibleBuffs);
        
        visibleBuffs.forEach(buff => {
            const buffCard = this._createBuffCard(buff);
            buffBar.appendChild(buffCard);
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
     * 显示提示信息
     * @param {string} message - 提示信息
     * @param {string} type - 提示类型 (info/success/warning/error)
     */
    showToast(message, type = 'info') {
        // 添加到队列
        this.toastQueue.push({ message, type });
        
        // 如果没有正在显示的Toast，开始显示
        if (!this.isShowingToast) {
            this._showNextToast();
        }
    }

    /**
     * 显示下一个Toast
     * @private
     */
    _showNextToast() {
        if (this.toastQueue.length === 0) {
            this.isShowingToast = false;
            return;
        }
        
        this.isShowingToast = true;
        const { message, type } = this.toastQueue.shift();
        
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 获取或创建Toast容器
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        
        // 添加到容器
        container.appendChild(toast);
        
        // 触发动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // 自动移除
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this._showNextToast();
            }, 300);
        }, 2500);
    }

    /**
     * 获取当前界面
     * @returns {string} 当前界面名称
     */
    getCurrentScreen() {
        return this.currentScreen;
    }

    /**
     * 获取界面元素
     * @param {string} screenName - 界面名称
     * @returns {HTMLElement|null} 界面元素
     */
    getScreen(screenName) {
        return this.screens.get(screenName) || null;
    }

    /**
     * 显示加载中状态
     * @param {boolean} show - 是否显示
     * @param {string} message - 加载消息
     */
    showLoading(show, message = '加载中...') {
        let loadingEl = document.getElementById('loading-overlay');
        
        if (show) {
            if (!loadingEl) {
                loadingEl = document.createElement('div');
                loadingEl.id = 'loading-overlay';
                loadingEl.className = 'loading-overlay';
                loadingEl.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div class="loading-message">${message}</div>
                `;
                document.body.appendChild(loadingEl);
            } else {
                loadingEl.querySelector('.loading-message').textContent = message;
            }
        } else {
            if (loadingEl) {
                loadingEl.remove();
            }
        }
    }

    /**
     * 更新游戏数据引用
     * @param {Object} gameData - 游戏数据
     */
    updateGameData(gameData) {
        this.gameData = gameData;
    }

    /**
     * 销毁UI管理器
     */
    destroy() {
        // 清理事件监听
        this.eventBus.clear(GameEvents.GOLD_CHANGED);
        this.eventBus.clear(GameEvents.DPS_CHANGED);
        this.eventBus.clear(GameEvents.BUFF_ACTIVATED);
        this.eventBus.clear(GameEvents.BUFF_DEACTIVATED);
        this.eventBus.clear(GameEvents.ACHIEVEMENT_UNLOCKED);
        
        // 清空DOM引用
        this.screens.clear();
        this.navButtons = null;
        
        console.log('[UIManager] 已销毁');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}
