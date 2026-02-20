/**
 * UIManager - UI管理模块
 * 负责界面切换、UI元素更新、事件绑定
 * 
 * @module UIManager
 * @author LP -> UIP-1, SP-1
 * @version 1.1.0
 */

class UIManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // UI状态
        this.uiState = {
            currentScreen: 'main',
            isLoading: false,
            shopCategory: 'all',
            itemsCategory: 'all'
        };
        
        // DOM元素缓存
        this.elements = {};
        
        // 引用管理器（由Game.js设置）
        this.shopManager = null;
        this.itemManager = null;
        this.buffManager = null;
        this.toastManager = null;
        this.achievementManager = null;
    }

    /**
     * 初始化UI管理器
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        console.log('UIManager initialized');
    }

    /**
     * 设置管理器引用
     * @param {Object} managers - 管理器对象
     */
    setManagers(managers) {
        this.shopManager = managers.shopManager;
        this.itemManager = managers.itemManager;
        this.buffManager = managers.buffManager;
        this.toastManager = managers.toastManager;
        this.achievementManager = managers.achievementManager;
        
        // 绑定管理器事件
        this.bindManagerEvents();
    }

    /**
     * 绑定管理器事件
     */
    bindManagerEvents() {
        // 商店购买事件
        if (this.shopManager) {
            this.shopManager.on('itemPurchased', (data) => {
                this.refreshShopList();
                if (this.toastManager) {
                    this.toastManager.show('购买成功!', 'success');
                }
            });
        }
        
        // 道具使用事件
        if (this.itemManager) {
            this.itemManager.on('itemUsed', (data) => {
                this.refreshItemsGrid();
                if (this.toastManager) {
                    this.toastManager.show('道具使用成功!', 'success');
                }
            });
            
            this.itemManager.on('itemPurchased', (data) => {
                this.refreshItemsGrid();
                if (this.toastManager) {
                    this.toastManager.show('购买成功!', 'success');
                }
            });
        }
        
        // BUFF事件
        if (this.buffManager) {
            this.buffManager.on('buffAdded', (data) => {
                this.refreshBuffBar();
            });
            
            this.buffManager.on('buffRemoved', (data) => {
                this.refreshBuffBar();
            });
            
            this.buffManager.on('buffWarning', (data) => {
                if (this.toastManager) {
                    this.toastManager.show(`${data.buff.name} 即将结束!`, 'warning');
                }
            });
        }
        
        // 成就事件
        if (this.achievementManager) {
            this.achievementManager.on('achievementUnlocked', (data) => {
                if (this.toastManager && data.achievement) {
                    this.toastManager.show(`成就解锁: ${data.achievement.name}`, 'success');
                }
                this.refreshAchievementList();
            });
            
            this.achievementManager.on('achievementClaimed', (data) => {
                this.refreshAchievementList();
            });
        }
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            // 主界面
            goldAmount: document.getElementById('gold-amount'),
            gpsAmount: document.getElementById('gps-amount'),
            comboMultiplier: document.getElementById('combo-multiplier'),
            maxCombo: document.getElementById('max-combo'),
            critRate: document.getElementById('crit-rate'),
            todayGold: document.getElementById('today-gold'),
            mainClickBtn: document.getElementById('main-click-btn'),
            buffBar: document.getElementById('buff-bar'),
            
            // 商店界面
            shopGoldAmount: document.getElementById('shop-gold-amount'),
            shopList: document.getElementById('shop-list'),
            shopCategoryTabs: document.getElementById('shop-categories'), // 修正：HTML中的ID是shop-categories
            
            // 道具界面
            itemsGrid: document.getElementById('items-grid'),
            // 注意：items-gold-amount在HTML中不存在，移除该引用
            
            // 成就界面
            achievementList: document.getElementById('achievement-list'),
            unlockedCount: document.getElementById('unlocked-count'),
            claimedCount: document.getElementById('claimed-count')
        };
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 导航按钮
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.switchScreen(screen);
            });
        });
        
        // 返回按钮
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen || 'main';
                this.switchScreen(screen);
            });
        });
        
        // 商店分类标签
        if (this.elements.shopCategoryTabs) {
            this.elements.shopCategoryTabs.addEventListener('click', (e) => {
                if (e.target.classList.contains('category-tab')) {
                    const category = e.target.dataset.category;
                    this.setShopCategory(category);
                }
            });
        }
        
        // 金币变化监听
        this.gameState.on('goldChanged', (data) => {
            this.updateGoldDisplay(this.gameState.getGold());
            // 刷新商店列表以更新可购买状态
            if (this.uiState.currentScreen === 'shop') {
                this.refreshShopList();
            }
        });
    }

    /**
     * 切换界面
     * @param {string} screenName - 界面名称
     */
    switchScreen(screenName) {
        // 隐藏所有界面
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 显示目标界面
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // 更新导航按钮状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            }
        });
        
        this.uiState.currentScreen = screenName;
        
        // 根据界面刷新内容
        switch (screenName) {
            case 'shop':
                this.refreshShopList();
                break;
            case 'items':
                this.refreshItemsGrid();
                break;
            case 'achievements':
                this.refreshAchievementList();
                break;
            case 'main':
                this.refreshBuffBar();
                break;
        }
        
        console.log(`[UIManager] Switched to screen: ${screenName}`);
    }

    /**
     * 设置商店分类
     * @param {string} category - 分类
     */
    setShopCategory(category) {
        this.uiState.shopCategory = category;
        
        // 更新标签状态
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            }
        });
        
        // 刷新列表
        this.refreshShopList();
    }

    // ==================== 金币显示 ====================

    /**
     * 更新金币显示
     * @param {number} amount - 金币数量
     */
    updateGoldDisplay(amount) {
        const formatted = this.formatNumber(amount);
        
        if (this.elements.goldAmount) {
            this.elements.goldAmount.textContent = formatted;
        }
        if (this.elements.shopGoldAmount) {
            this.elements.shopGoldAmount.textContent = formatted;
        }
        if (this.elements.itemsGoldAmount) {
            this.elements.itemsGoldAmount.textContent = formatted;
        }
    }

    /**
     * 更新GPS显示
     * @param {number} gps - GPS值
     */
    updateGPSDisplay(gps) {
        const formatted = this.formatNumber(gps);
        if (this.elements.gpsAmount) {
            this.elements.gpsAmount.textContent = formatted + '/s';
        }
    }

    /**
     * 更新连击显示
     * @param {number} multiplier - 连击倍率
     */
    updateComboDisplay(multiplier) {
        if (this.elements.comboMultiplier) {
            this.elements.comboMultiplier.textContent = `x${multiplier.toFixed(1)}`;
        }
    }

    /**
     * 更新暴击率显示
     * @param {number} rate - 暴击率
     */
    updateCritRateDisplay(rate) {
        if (this.elements.critRate) {
            this.elements.critRate.textContent = `${rate.toFixed(0)}%`;
        }
    }

    // ==================== 商店UI ====================

    /**
     * 刷新商店列表
     */
    refreshShopList() {
        if (!this.shopManager || !this.elements.shopList) return;
        
        const items = this.shopManager.getAllItems(this.uiState.shopCategory);
        this.renderShopList(items);
    }

    /**
     * 渲染商店列表
     * @param {Array} items - 商品列表
     */
    renderShopList(items) {
        if (!this.elements.shopList) return;
        
        this.elements.shopList.innerHTML = '';
        
        items.forEach(item => {
            const card = this.createShopItemCard(item);
            this.elements.shopList.appendChild(card);
        });
    }

    /**
     * 创建商品卡片
     * @param {Object} item - 商品信息
     * @returns {HTMLElement} 卡片元素
     */
    createShopItemCard(item) {
        const card = document.createElement('div');
        card.className = `shop-item-card ${this.getShopItemStatusClass(item.status)}`;
        card.dataset.itemId = item.id;
        
        // 根据状态设置样式
        let statusBadge = '';
        let buttonText = '购买';
        let buttonDisabled = false;
        
        switch (item.status) {
            case 'PURCHASABLE':
                // 可购买 - 绿色边框
                break;
            case 'NOT_AFFORDABLE':
                // 金币不足 - 红色边框
                buttonDisabled = true;
                buttonText = '金币不足';
                break;
            case 'MAX_LEVEL':
                // 已达上限 - 金色边框
                statusBadge = '<span class="status-badge max">MAX</span>';
                buttonText = '已满级';
                buttonDisabled = true;
                break;
            case 'LOCKED':
                // 锁定 - 半透明
                statusBadge = '<span class="status-badge locked">🔒</span>';
                buttonDisabled = true;
                buttonText = '未解锁';
                break;
        }
        
        card.innerHTML = `
            <div class="item-icon">${item.icon || '📦'}</div>
            <div class="item-info">
                <div class="item-header">
                    <span class="item-name">${item.name}</span>
                    <span class="item-level">Lv.${item.level}</span>
                    ${statusBadge}
                </div>
                <div class="item-desc">${item.description}</div>
                <div class="item-footer">
                    <span class="item-price">
                        <span class="price-icon">💰</span>
                        <span class="price-value">${this.formatNumber(item.currentPrice)}</span>
                    </span>
                    <button class="buy-btn" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
                </div>
            </div>
        `;
        
        // 绑定购买事件
        const buyBtn = card.querySelector('.buy-btn');
        if (!buttonDisabled && buyBtn) {
            buyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handlePurchase(item.id);
            });
        }
        
        return card;
    }

    /**
     * 获取商品状态样式类
     * @param {string} status - 状态
     * @returns {string} 样式类
     */
    getShopItemStatusClass(status) {
        const statusClasses = {
            'PURCHASABLE': 'can-buy',
            'NOT_AFFORDABLE': 'cannot-afford',
            'MAX_LEVEL': 'max-level',
            'LOCKED': 'locked'
        };
        return statusClasses[status] || '';
    }

    /**
     * 处理购买
     * @param {string} itemId - 商品ID
     */
    handlePurchase(itemId) {
        if (!this.shopManager) return;
        
        const result = this.shopManager.purchaseItem(itemId);
        
        if (!result.success) {
            if (this.toastManager) {
                this.toastManager.show(result.message, 'error');
            } else {
                alert(result.message);
            }
        }
    }

    // ==================== 道具UI ====================

    /**
     * 刷新道具网格
     */
    refreshItemsGrid() {
        if (!this.itemManager || !this.elements.itemsGrid) return;
        
        const items = this.itemManager.getAllItems();
        this.renderItemsGrid(items);
    }

    /**
     * 渲染道具网格
     * @param {Array} items - 道具列表
     */
    renderItemsGrid(items) {
        if (!this.elements.itemsGrid) return;
        
        this.elements.itemsGrid.innerHTML = '';
        
        items.forEach(item => {
            const card = this.createItemCard(item);
            this.elements.itemsGrid.appendChild(card);
        });
    }

    /**
     * 创建道具卡片
     * @param {Object} item - 道具信息
     * @returns {HTMLElement} 卡片元素
     */
    createItemCard(item) {
        const card = document.createElement('div');
        card.className = `item-card ${item.count > 0 ? 'has-item' : 'no-item'}`;
        card.dataset.itemId = item.id;
        
        card.innerHTML = `
            <div class="item-icon">${item.icon || '📦'}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-count">x${item.count}</div>
            ${item.source === 'shop' ? `
                <button class="buy-item-btn" ${!item.canBuy ? 'disabled' : ''}>
                    💰${this.formatNumber(item.price || 0)}
                </button>
            ` : ''}
        `;
        
        // 绑定使用事件
        if (item.count > 0) {
            card.addEventListener('click', () => {
                this.showItemDetail(item);
            });
        }
        
        // 绑定购买事件（商店道具）
        const buyBtn = card.querySelector('.buy-item-btn');
        if (buyBtn && item.canBuy) {
            buyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleItemPurchase(item.id);
            });
        }
        
        return card;
    }

    /**
     * 显示道具详情
     * @param {Object} item - 道具信息
     */
    showItemDetail(item) {
        // 创建弹窗
        const modal = document.createElement('div');
        modal.className = 'modal item-detail-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <span class="item-icon-large">${item.icon || '📦'}</span>
                    <h3 class="item-title">${item.name}</h3>
                </div>
                <div class="modal-body">
                    <p class="item-description">${item.description}</p>
                    <div class="item-effect">
                        <strong>效果:</strong> ${this.getItemEffectText(item)}
                    </div>
                    <div class="item-stock">
                        <strong>库存:</strong> x${item.count}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel">取消</button>
                    <button class="btn btn-use">使用</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.btn-use').addEventListener('click', () => {
            this.handleItemUse(item.id);
            modal.remove();
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * 获取道具效果文本
     * @param {Object} item - 道具信息
     * @returns {string} 效果文本
     */
    getItemEffectText(item) {
        const effect = item.effect;
        switch (effect.type) {
            case 'gold_multiplier':
                return `金币产出 x${effect.value}，持续${item.duration}秒`;
            case 'gps_multiplier':
                return `GPS产出 x${effect.value}，持续${item.duration}秒`;
            case 'crit_rate_add':
                return `暴击率 +${effect.value * 100}%，持续${item.duration}秒`;
            case 'instant_percent':
                return `立即获得当前金币的${effect.value * 100}%`;
            default:
                return '特殊效果';
        }
    }

    /**
     * 处理道具使用
     * @param {string} itemId - 道具ID
     */
    handleItemUse(itemId) {
        if (!this.itemManager) return;
        
        const result = this.itemManager.useItem(itemId);
        
        if (!result.success) {
            if (this.toastManager) {
                this.toastManager.show(result.message, 'error');
            } else {
                alert(result.message);
            }
        }
    }

    /**
     * 处理道具购买
     * @param {string} itemId - 道具ID
     */
    handleItemPurchase(itemId) {
        if (!this.itemManager) return;
        
        const result = this.itemManager.purchaseItem(itemId);
        
        if (!result.success) {
            if (this.toastManager) {
                this.toastManager.show(result.message, 'error');
            } else {
                alert(result.message);
            }
        }
    }

    // ==================== BUFF栏 ====================

    /**
     * 刷新BUFF栏
     */
    refreshBuffBar() {
        if (!this.buffManager || !this.elements.buffBar) return;
        
        const buffs = this.buffManager.getActiveBuffs();
        this.renderBuffBar(buffs);
    }

    /**
     * 渲染BUFF栏
     * @param {Array} buffs - BUFF列表
     */
    renderBuffBar(buffs) {
        if (!this.elements.buffBar) return;
        
        this.elements.buffBar.innerHTML = '';
        
        if (buffs.length === 0) {
            this.elements.buffBar.innerHTML = '<div class="no-buff">暂无激活的BUFF</div>';
            return;
        }
        
        buffs.forEach(buff => {
            const card = document.createElement('div');
            card.className = `buff-card ${buff.isWarning ? 'warning' : ''}`;
            
            card.innerHTML = `
                <span class="buff-icon">${buff.icon || '✨'}</span>
                <div class="buff-info">
                    <span class="buff-name">${buff.name}</span>
                    <span class="buff-time">${Math.ceil(buff.remainingTime)}s</span>
                </div>
                <div class="buff-progress">
                    <div class="buff-progress-bar" style="width: ${buff.progress * 100}%"></div>
                </div>
            `;
            
            this.elements.buffBar.appendChild(card);
        });
    }

    // ==================== 成就UI ====================

    /**
     * 刷新成就列表
     */
    refreshAchievementList() {
        if (!this.achievementManager || !this.elements.achievementList) return;
        
        const achievements = this.achievementManager.getAchievements('all');
        this.renderAchievementList(achievements);
        
        // 更新统计信息
        const stats = this.achievementManager.getStats();
        if (this.elements.unlockedCount) {
            this.elements.unlockedCount.textContent = `${stats.unlockedCount}/${stats.totalCount}`;
        }
        if (this.elements.claimedCount) {
            this.elements.claimedCount.textContent = `${stats.claimedCount}/${stats.totalCount}`;
        }
    }

    /**
     * 渲染成就列表
     * @param {Array} achievements - 成就列表
     */
    renderAchievementList(achievements) {
        if (!this.elements.achievementList) return;
        
        this.elements.achievementList.innerHTML = '';
        
        achievements.forEach(achievement => {
            const card = this.createAchievementCard(achievement);
            this.elements.achievementList.appendChild(card);
        });
    }

    /**
     * 创建成就卡片
     * @param {Object} achievement - 成就信息
     * @returns {HTMLElement} 卡片元素
     */
    createAchievementCard(achievement) {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.status ? achievement.status.toLowerCase() : ''}`;
        card.dataset.achievementId = achievement.id;
        
        // 处理隐藏成就
        if (achievement.hidden && achievement.status === 'LOCKED') {
            card.innerHTML = `
                <div class="achievement-icon">❓</div>
                <div class="achievement-info">
                    <div class="achievement-name">???</div>
                    <div class="achievement-desc">???</div>
                </div>
            `;
            return card;
        }
        
        // 构建进度条
        const progressPercent = achievement.progressPercent || 0;
        const progressHTML = achievement.status !== 'CLAIMED' ? `
            <div class="achievement-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <span class="progress-text">${this.formatNumber(achievement.currentValue || 0)}/${this.formatNumber(achievement.targetValue || 0)}</span>
            </div>
        ` : '';
        
        // 构建状态标签
        let statusHTML = '';
        if (achievement.status === 'UNLOCKED') {
            statusHTML = `<button class="claim-btn" data-achievement-id="${achievement.id}">领取</button>`;
        } else if (achievement.status === 'CLAIMED') {
            statusHTML = '<span class="status-label claimed">已领取</span>';
        }
        
        // 构建奖励显示
        let rewardText = '';
        if (achievement.reward) {
            if (achievement.reward.gold) {
                rewardText = `💰 ${this.formatNumber(achievement.reward.gold)}`;
            } else if (achievement.reward.item) {
                rewardText = `🎁 道具奖励`;
            }
        }
        
        card.innerHTML = `
            <div class="achievement-icon">${achievement.icon || '🏆'}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
                ${progressHTML}
                <div class="achievement-reward">${rewardText}</div>
            </div>
            <div class="achievement-action">${statusHTML}</div>
        `;
        
        // 绑定领取事件
        const claimBtn = card.querySelector('.claim-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleClaimAchievement(achievement.id);
            });
        }
        
        return card;
    }
    
    /**
     * 处理成就领取
     * @param {string} achievementId - 成就ID
     */
    handleClaimAchievement(achievementId) {
        if (!this.achievementManager) return;
        
        const result = this.achievementManager.claimReward(achievementId);
        
        if (result.success) {
            if (this.toastManager) {
                let rewardText = '';
                result.reward.forEach(r => {
                    if (r.type === 'gold') {
                        rewardText += `💰 ${this.formatNumber(r.value)} `;
                    } else if (r.type === 'item') {
                        rewardText += `🎁 ${r.value} `;
                    }
                });
                this.toastManager.show(`领取成功: ${rewardText}`, 'success');
            }
            this.refreshAchievementList();
        } else {
            if (this.toastManager) {
                this.toastManager.show(result.message || '领取失败', 'error');
            }
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 格式化数字
     * @param {number} num - 数字
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toLocaleString();
    }

    /**
     * 显示弹窗
     * @param {string} modalId - 弹窗ID
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    /**
     * 隐藏弹窗
     * @param {string} modalId - 弹窗ID
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

window.UIManager = UIManager;
